document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const previewImages = document.getElementById('preview-images');
    const compressBtn = document.getElementById('compress-btn');
    const resultsContainer = document.getElementById('results-container');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('quality-value');
    
    // 更新质量值显示
    qualitySlider.addEventListener('input', function() {
        qualityValue.textContent = this.value;
    });
    
    // 点击拖放区域触发文件选择
    dropZone.addEventListener('click', function() {
        fileInput.click();
    });
    
    // 处理拖放事件
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('active');
    });
    
    dropZone.addEventListener('dragleave', function() {
        this.classList.remove('active');
    });
    
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('active');
        
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            handleFiles(e.dataTransfer.files);
        }
    });
    
    // 处理文件选择
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });
    
    // 处理文件预览
    function handleFiles(files) {
        if (files.length === 0) return;
        
        previewImages.innerHTML = '';
        previewContainer.classList.remove('d-none');
        compressBtn.disabled = false;
        
        // 显示最多6张预览图
        const maxPreviews = Math.min(files.length, 6);
        
        for (let i = 0; i < maxPreviews; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) continue;
            
            const col = document.createElement('div');
            col.className = 'col-6 col-md-4 mb-2';
            
            const card = document.createElement('div');
            card.className = 'card h-100';
            
            const cardBody = document.createElement('div');
            cardBody.className = 'card-body text-center p-2';
            
            const img = document.createElement('img');
            img.className = 'preview-image mb-2';
            img.file = file;
            
            const reader = new FileReader();
            reader.onload = (function(aImg) { 
                return function(e) { 
                    aImg.src = e.target.result; 
                }; 
            })(img);
            reader.readAsDataURL(file);
            
            const name = document.createElement('p');
            name.className = 'small text-truncate mb-0';
            name.title = file.name;
            name.textContent = file.name;
            
            const size = document.createElement('small');
            size.className = 'text-muted';
            size.textContent = formatFileSize(file.size);
            
            cardBody.appendChild(img);
            cardBody.appendChild(name);
            cardBody.appendChild(size);
            card.appendChild(cardBody);
            col.appendChild(card);
            previewImages.appendChild(col);
        }
        
        if (files.length > maxPreviews) {
            const moreCol = document.createElement('div');
            moreCol.className = 'col-12 text-center mt-2';
            
            const moreText = document.createElement('p');
            moreText.className = 'text-muted mb-0';
            moreText.innerHTML = `<i class="fas fa-plus-circle me-1"></i>还有 ${files.length - maxPreviews} 个文件未显示`;
            
            moreCol.appendChild(moreText);
            previewImages.appendChild(moreCol);
        }
    }
    
    // 压缩按钮点击事件
    compressBtn.addEventListener('click', function() {
        if (fileInput.files.length === 0) return;
        
        // 获取选项
        const maxWidth = document.getElementById('max-width').value;
        const maxHeight = document.getElementById('max-height').value;
        const quality = document.getElementById('quality').value;
        const format = document.getElementById('format').value;
        
        // 显示加载状态
        compressBtn.disabled = true;
        compressBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 处理中...';
        
        // 清空结果容器
        resultsContainer.innerHTML = '';
        
        // 创建进度条
        const progressDiv = document.createElement('div');
        progressDiv.className = 'progress mb-3';
        progressDiv.style.height = '20px';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar progress-bar-striped progress-animated';
        progressBar.style.width = '100%';
        progressBar.setAttribute('aria-valuenow', '100');
        progressBar.setAttribute('aria-valuemin', '0');
        progressBar.setAttribute('aria-valuemax', '100');
        progressBar.textContent = '处理中...';
        
        progressDiv.appendChild(progressBar);
        resultsContainer.appendChild(progressDiv);
        
        // 根据文件数量决定使用单文件或批量API
        if (fileInput.files.length === 1) {
            // 单文件处理
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            formData.append('max_width', maxWidth);
            formData.append('max_height', maxHeight);
            formData.append('quality', quality);
            formData.append('format', format);
            
            fetch('/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayResult(data);
                } else {
                    showError(data.error || '压缩失败');
                }
            })
            .catch(error => {
                showError('请求失败: ' + error);
            })
            .finally(() => {
                compressBtn.disabled = false;
                compressBtn.innerHTML = '<i class="fas fa-compress-alt me-2"></i>压缩图片';
            });
        } else {
            // 批量处理
            const formData = new FormData();
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append('files[]', fileInput.files[i]);
            }
            formData.append('max_width', maxWidth);
            formData.append('max_height', maxHeight);
            formData.append('quality', quality);
            formData.append('format', format);
            
            fetch('/batch', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 显示批量处理结果
                    resultsContainer.removeChild(progressDiv);
                    
                    const summaryCard = document.createElement('div');
                    summaryCard.className = 'alert alert-success';
                    summaryCard.innerHTML = `<i class="fas fa-check-circle me-2"></i>${data.message}`;
                    resultsContainer.appendChild(summaryCard);
                    
                    // 创建结果表格
                    const table = document.createElement('table');
                    table.className = 'table table-striped table-hover';
                    
                    const thead = document.createElement('thead');
                    thead.innerHTML = `
                        <tr>
                            <th>文件名</th>
                            <th>原始大小</th>
                            <th>压缩后</th>
                            <th>减少</th>
                            <th>操作</th>
                        </tr>
                    `;
                    
                    const tbody = document.createElement('tbody');
                    
                    data.results.forEach(result => {
                        const tr = document.createElement('tr');
                        
                        if (result.error) {
                            tr.innerHTML = `
                                <td>${result.original_name}</td>
                                <td colspan="4" class="text-danger">${result.error}</td>
                            `;
                        } else {
                            tr.innerHTML = `
                                <td title="${result.original_name}">${truncateText(result.original_name, 20)}</td>
                                <td>${formatFileSize(result.original_size)}</td>
                                <td>${formatFileSize(result.compressed_size)}</td>
                                <td><span class="badge bg-success">${result.reduction_percent}%</span></td>
                                <td>
                                    <a href="${result.download_url}" class="btn btn-sm btn-primary">
                                        <i class="fas fa-download"></i>
                                    </a>
                                </td>
                            `;
                        }
                        
                        tbody.appendChild(tr);
                    });
                    
                    table.appendChild(thead);
                    table.appendChild(tbody);
                    resultsContainer.appendChild(table);
                    
                    // 添加下载全部按钮
                    if (data.results.filter(r => !r.error).length > 1) {
                        const downloadAllDiv = document.createElement('div');
                        downloadAllDiv.className = 'text-center mt-3';
                        downloadAllDiv.innerHTML = `
                            <p class="text-muted small">提示：点击每行的下载按钮可以单独下载文件</p>
                        `;
                        resultsContainer.appendChild(downloadAllDiv);
                    }
                } else {
                    showError(data.error || '批量处理失败');
                }
            })
            .catch(error => {
                showError('请求失败: ' + error);
            })
            .finally(() => {
                compressBtn.disabled = false;
                compressBtn.innerHTML = '<i class="fas fa-compress-alt me-2"></i>压缩图片';
            });
        }
    });
    
    // 显示单个结果
    function displayResult(data) {
        resultsContainer.innerHTML = '';
        
        const card = document.createElement('div');
        card.className = 'card result-card';
        
        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-header bg-success text-white';
        cardHeader.innerHTML = '<i class="fas fa-check-circle me-2"></i>压缩成功';
        
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        
        // 创建结果表格
        const table = document.createElement('table');
        table.className = 'table table-borderless';
        table.innerHTML = `
            <tr>
                <th>原文件名:</th>
                <td>${data.original_name}</td>
            </tr>
            <tr>
                <th>原始大小:</th>
                <td>${formatFileSize(data.original_size)}</td>
            </tr>
            <tr>
                <th>压缩后大小:</th>
                <td>${formatFileSize(data.compressed_size)}</td>
            </tr>
            <tr>
                <th>减少比例:</th>
                <td><span class="badge bg-success">${data.reduction_percent}%</span></td>
            </tr>
            <tr>
                <th>原始尺寸:</th>
                <td>${data.original_dimensions}</td>
            </tr>
            <tr>
                <th>新尺寸:</th>
                <td>${data.new_dimensions}</td>
            </tr>
        `;
        
        const downloadBtn = document.createElement('a');
        downloadBtn.className = 'btn btn-primary w-100 mt-3';
        downloadBtn.href = data.download_url;
        downloadBtn.innerHTML = '<i class="fas fa-download me-2"></i>下载压缩后的图片';
        
        cardBody.appendChild(table);
        cardBody.appendChild(downloadBtn);
        card.appendChild(cardHeader);
        card.appendChild(cardBody);
        
        resultsContainer.appendChild(card);
    }
    
    // 显示错误
    function showError(message) {
        resultsContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-circle me-2"></i>${message}
            </div>
        `;
    }
    
    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // 截断文本
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength - 3) + '...';
    }
});