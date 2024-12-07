const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const cors = require('cors');
const fs = require('fs').promises;

const app = express();
const port = 3000;

// 启用CORS和JSON解析
app.use(cors());
app.use(express.json());

// 配置文件上传
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb) {
        cb(null, 'original-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

// 处理图片上传和压缩
app.post('/compress', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        const quality = parseInt(req.body.quality) || 80;
        const inputPath = req.file.path;
        const outputPath = path.join(uploadDir, 'compressed-' + Date.now() + path.extname(req.file.originalname));

        // 使用sharp进行压缩
        await sharp(inputPath)
            .jpeg({ quality: quality })
            .toFile(outputPath);

        // 获取文件大小
        const originalSize = (await fs.stat(inputPath)).size;
        const compressedSize = (await fs.stat(outputPath)).size;

        // 读取压缩后的文件并转为base64
        const compressedImage = await fs.readFile(outputPath, { encoding: 'base64' });

        // 清理临时文件
        await fs.unlink(inputPath);
        await fs.unlink(outputPath);

        res.json({
            success: true,
            originalSize,
            compressedSize,
            compressedImage: `data:image/jpeg;base64,${compressedImage}`
        });

    } catch (error) {
        console.error('压缩过程出错:', error);
        res.status(500).json({ error: '图片压缩失败' });
    }
});

app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
}); 