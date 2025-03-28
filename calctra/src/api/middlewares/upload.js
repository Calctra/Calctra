const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('../../utils/logger');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create user-specific directory if it doesn't exist
    const userDir = path.join(uploadDir, req.user ? req.user._id.toString() : 'anonymous');
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const fileHash = crypto.randomBytes(16).toString('hex');
    const extname = path.extname(file.originalname);
    const filename = `${fileHash}${extname}`;
    cb(null, filename);
  }
});

// File filter to control allowed file types
const fileFilter = (req, file, cb) => {
  // For MVP, we'll accept most file types
  // In production, we would restrict based on specific needs
  const allowedTypes = [
    'application/json',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not supported`), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB file size limit for MVP
  }
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.error(`Upload error: ${err.message}`);
    return res.status(400).json({
      status: 'error',
      message: `Upload error: ${err.message}`
    });
  }
  
  if (err) {
    logger.error(`Upload error: ${err.message}`);
    return res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
  
  next();
};

module.exports = upload;
module.exports.handleUploadError = handleUploadError; 