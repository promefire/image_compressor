# Image Compressor 图片压缩工具

一个基于Flask和OpenCV的在线图片压缩工具，帮助用户轻松压缩图片，减小文件大小，提高网站加载速度。

## 功能特点

- 支持多种图片格式：JPG, PNG, GIF, BMP, WebP
- 单文件和批量压缩模式
- 自定义压缩参数：最大宽度、最大高度、质量
- 支持转换图片格式
- 拖放上传功能
- 实时预览压缩效果
- 显示压缩前后的文件大小和尺寸对比
- 自动清理临时文件

## 安装说明

### 前提条件

- Python 3.8+
- pip 包管理器

### 安装步骤

1. 克隆或下载本项目到本地

2. 进入项目目录
   ```
   cd image_compressor
   ```

3. 安装依赖包
   ```
   pip install -r requirements.txt
   ```

## 使用方法

1. 启动应用
   ```
   python app.py
   ```

2. 在浏览器中访问 http://localhost:5000

3. 上传图片：
   - 点击上传区域选择文件或直接拖放图片
   - 设置压缩参数（最大宽度、最大高度、质量、输出格式）
   - 点击压缩按钮

4. 下载压缩后的图片

## 技术栈

- **后端**：Flask (Python)
- **图像处理**：OpenCV, Pillow
- **前端**：HTML, CSS, JavaScript
- **UI框架**：Bootstrap

## 项目结构

```
├── app.py              # 主应用程序
├── compress_utils.py   # 图像压缩工具函数
├── requirements.txt    # 项目依赖
├── static/            # 静态文件
│   ├── css/           # 样式表
│   ├── js/            # JavaScript文件
│   └── img/           # 图像资源
├── templates/         # HTML模板
│   ├── index.html     # 主页
│   ├── about.html     # 关于页面
│   └── layout.html    # 布局模板
├── uploads/           # 上传的原始图片
└── compressed/        # 压缩后的图片
```

## 许可证

MIT
