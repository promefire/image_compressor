# app.py
from flask import Flask, render_template, request, jsonify, send_from_directory, url_for, redirect
import os
import time
import threading
from werkzeug.utils import secure_filename
from compress_utils import compress_image, generate_unique_filename, cleanup_old_files

app = Flask(__name__)

# 配置
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['COMPRESSED_FOLDER'] = 'compressed'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB限制
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}

# 确保上传和压缩文件夹存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['COMPRESSED_FOLDER'], exist_ok=True)

# 检查允许的文件扩展名
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# 主页路由
@app.route('/')
def index():
    return render_template('index.html')

# 关于页面路由
@app.route('/about')
def about():
    return render_template('about.html')

# 单文件上传和压缩
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': '没有文件部分'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': '不支持的文件类型'}), 400
    
    # 获取压缩参数
    max_width = int(request.form.get('max_width', 1280))
    max_height = int(request.form.get('max_height', 1280))
    quality = int(request.form.get('quality', 85))
    format = request.form.get('format', None)
    if format == 'original':
        format = None
    
    # 生成安全的文件名
    filename = secure_filename(file.filename)
    upload_filename = generate_unique_filename(filename)
    upload_path = os.path.join(app.config['UPLOAD_FOLDER'], upload_filename)
    
    # 保存上传的文件
    file.save(upload_path)
    
    # 确定输出文件名和路径
    if format:
        output_filename = generate_unique_filename(filename, format)
    else:
        output_filename = upload_filename
    output_path = os.path.join(app.config['COMPRESSED_FOLDER'], output_filename)
    
    # 压缩图像
    success, result = compress_image(upload_path, output_path, max_width, max_height, quality, format)
    
    if success:
        result['filename'] = output_filename
        result['original_name'] = file.filename
        result['download_url'] = url_for('download_file', filename=output_filename)
        return jsonify({
            'success': True,
            'message': '图像压缩成功',
            **result
        })
    else:
        return jsonify({'error': f'压缩失败: {result}'}), 500

# 批量处理
@app.route('/batch', methods=['POST'])
def batch_process():
    if 'files[]' not in request.files:
        return jsonify({'error': '没有文件部分'}), 400
    
    files = request.files.getlist('files[]')
    if len(files) == 0:
        return jsonify({'error': '没有选择文件'}), 400
    
    # 获取压缩参数
    max_width = int(request.form.get('max_width', 1280))
    max_height = int(request.form.get('max_height', 1280))
    quality = int(request.form.get('quality', 85))
    format = request.form.get('format', None)
    if format == 'original':
        format = None
    
    results = []
    for file in files:
        if file.filename == '':
            continue
        
        if not allowed_file(file.filename):
            results.append({
                'original_name': file.filename,
                'error': '不支持的文件类型'
            })
            continue
        
        # 生成安全的文件名
        filename = secure_filename(file.filename)
        upload_filename = generate_unique_filename(filename)
        upload_path = os.path.join(app.config['UPLOAD_FOLDER'], upload_filename)
        
        # 保存上传的文件
        file.save(upload_path)
        
        # 确定输出文件名和路径
        if format:
            output_filename = generate_unique_filename(filename, format)
        else:
            output_filename = upload_filename
        output_path = os.path.join(app.config['COMPRESSED_FOLDER'], output_filename)
        
        # 压缩图像
        success, result = compress_image(upload_path, output_path, max_width, max_height, quality, format)
        
        if success:
            result['original_name'] = file.filename
            result['compressed_name'] = output_filename
            result['download_url'] = url_for('download_file', filename=output_filename)
            results.append(result)
        else:
            results.append({
                'original_name': file.filename,
                'error': f'压缩失败: {result}'
            })
    
    return jsonify({
        'success': True,
        'message': f'成功处理 {len(results)} 个文件',
        'results': results
    })

# 下载压缩后的文件
@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(app.config['COMPRESSED_FOLDER'], filename, as_attachment=True)

# 清理旧文件
@app.route('/cleanup', methods=['POST'])
def cleanup():
    try:
        upload_count = cleanup_old_files(app.config['UPLOAD_FOLDER'])
        compressed_count = cleanup_old_files(app.config['COMPRESSED_FOLDER'])
        total_count = upload_count + compressed_count
        
        return jsonify({'success': True, 'message': f'已清理 {total_count} 个文件'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 定期清理任务
def scheduled_cleanup():
    while True:
        time.sleep(3600)  # 每小时运行一次
        upload_count = cleanup_old_files(app.config['UPLOAD_FOLDER'])
        compressed_count = cleanup_old_files(app.config['COMPRESSED_FOLDER'])
        print(f"定时清理: 已删除 {upload_count + compressed_count} 个文件")

# 启动清理线程
cleanup_thread = threading.Thread(target=scheduled_cleanup, daemon=True)

if __name__ == '__main__':
    # 启动清理线程
    cleanup_thread.start()
    # 启动Flask应用
    app.run(debug=True, host='0.0.0.0', port=5000)