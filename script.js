document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const controlPanel = document.getElementById('controlPanel');
    const originalImage = document.getElementById('originalImage');
    const compressedImage = document.getElementById('compressedImage');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const downloadBtn = document.getElementById('downloadBtn');

    let currentFile = null;

    // 点击上传
    dropZone.addEventListener('click', () => fileInput.click());

    // 文件选择处理
    fileInput.addEventListener('change', handleFileSelect);

    // 拖拽上传
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#007AFF';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#DEDEDE';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#DEDEDE';
        const files = e.dataTransfer.files;
        if (files.length) {
            handleFile(files[0]);
        }
    });

    // 质量滑块变化处理
    qualitySlider.addEventListener('input', function() {
        qualityValue.textContent = this.value + '%';
        if (currentFile) {
            compressImage(currentFile, this.value / 100);
        }
    });

    // 文件选择处理函数
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    }

    // 文件处理函数
    function handleFile(file) {
        if (!file.type.match('image.*')) {
            alert('请选择图片文件！');
            return;
        }

        currentFile = file;
        previewContainer.style.display = 'flex';
        controlPanel.style.display = 'flex';
        
        // 显示原图大小
        originalSize.textContent = formatFileSize(file.size);

        // 预览原图
        const reader = new FileReader();
        reader.onload = (e) => {
            originalImage.src = e.target.result;
            compressImage(file, qualitySlider.value / 100);
        };
        reader.readAsDataURL(file);
    }

    // 图片压缩函数
    function compressImage(file, quality) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('quality', quality * 100);

        // 显示加载状态
        compressedImage.src = ''; // 清空之前的图片
        compressedSize.textContent = '压缩中...';
        downloadBtn.disabled = true;

        fetch('http://localhost:3000/compress', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                compressedImage.src = data.compressedImage;
                compressedSize.textContent = formatFileSize(data.compressedSize);
                
                // 更新下载按钮
                downloadBtn.disabled = false;
                downloadBtn.onclick = () => {
                    const link = document.createElement('a');
                    link.href = data.compressedImage;
                    link.download = 'compressed_' + file.name;
                    link.click();
                };
            } else {
                throw new Error(data.error || '压缩失败');
            }
        })
        .catch(error => {
            console.error('压缩出错:', error);
            compressedSize.textContent = '压缩失败';
            alert('图片压缩失败，请重试');
        });
    }

    // 文件大小格式化函数
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 