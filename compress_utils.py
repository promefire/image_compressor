# compress_utils.py
import cv2
from PIL import Image
import os
import numpy as np
import time
import uuid

# 检查文件是否为图像文件
def is_image_file(file_path):
    image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    return os.path.isfile(file_path) and any(file_path.lower().endswith(ext) for ext in image_extensions)

# 压缩单个图像
def compress_image(input_path, output_path, max_width=1280, max_height=1280, quality=85, format=None):
    try:
        # 使用OpenCV读取图像（支持中文路径）
        img = cv2.imdecode(np.fromfile(input_path, dtype=np.uint8), -1)
        if img is None:
            print(f"无法读取图像: {input_path}")
            return False, "无法读取图像"

        # 检查图像大小是否为空
        if img.size == 0:
            print(f"图像大小为空: {input_path}")
            return False, "图像大小为空"

        # 获取原始尺寸
        original_width, original_height = img.shape[1], img.shape[0]
        original_size = os.path.getsize(input_path)

        # 计算新尺寸（保持纵横比）
        width, height = original_width, original_height
        if width > max_width or height > max_height:
            # 计算缩放比例
            ratio = min(max_width / width, max_height / height)
            new_size = (int(width * ratio), int(height * ratio))
            # 调整大小
            img = cv2.resize(img, new_size)

        # 转换为PIL图像以便保存
        if len(img.shape) == 3:
            pil_img = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        else:
            pil_img = Image.fromarray(img)

        # 确定输出格式
        out_format = format
        if not out_format:
            # 保持原始格式
            ext = os.path.splitext(input_path)[1].lower()
            if ext in ['.jpg', '.jpeg']:
                out_format = 'jpeg'
            elif ext == '.png':
                out_format = 'png'
            elif ext == '.webp':
                out_format = 'webp'
            elif ext == '.gif':
                out_format = 'gif'
            elif ext == '.bmp':
                out_format = 'bmp'
            else:
                out_format = 'jpeg'  # 默认格式

        # 保存图像
        if out_format in ['jpeg', 'jpg']:
            pil_img.save(output_path, format=out_format, quality=quality, optimize=True)
        elif out_format == 'png':
            pil_img.save(output_path, format=out_format, optimize=True)
        elif out_format == 'webp':
            pil_img.save(output_path, format=out_format, quality=quality)
        else:
            pil_img.save(output_path, format=out_format)

        # 获取压缩后的大小
        compressed_size = os.path.getsize(output_path)
        reduction = (1 - compressed_size / original_size) * 100 if original_size > 0 else 0

        result = {
            "original_size": original_size,
            "compressed_size": compressed_size,
            "original_dimensions": f"{original_width}x{original_height}",
            "new_dimensions": f"{pil_img.width}x{pil_img.height}",
            "reduction_percent": round(reduction, 2)
        }

        print(f"已压缩: {input_path} -> {output_path} (减少 {result['reduction_percent']}%)")
        return True, result
    except Exception as e:
        print(f"压缩图像时出错 {input_path}: {str(e)}")
        return False, str(e)

# 生成唯一的文件名
def generate_unique_filename(original_filename, format=None):
    base, ext = os.path.splitext(original_filename)
    if format:
        ext = f".{format.lower()}"
    unique_id = str(uuid.uuid4())[:8]  # 使用UUID的前8个字符
    return f"{base}_{unique_id}{ext}"

# 清理旧文件
def cleanup_old_files(directory, max_age_minutes=5):
    try:
        current_time = time.time()
        count = 0
        
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            if os.path.isfile(file_path):
                # 检查文件修改时间
                if current_time - os.path.getmtime(file_path) > max_age_minutes * 60:
                    os.remove(file_path)
                    count += 1
        
        return count
    except Exception as e:
        print(f"清理文件时出错: {str(e)}")
        return 0