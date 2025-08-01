const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Handle file uploads (mock OCR etc.)
router.post('/upload', upload.array('bills'), (req, res) => {
  const files = req.files.map(file => ({
    name: file.originalname,
    url: `/uploads/${file.filename}`,
    type: file.mimetype
  }));
  console.log('Files uploaded:', files);
  res.json({ success: true, files });
});

module.exports = router;
