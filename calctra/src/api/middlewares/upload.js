const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { BadRequestError } = require('../../utils/errors');
const logger = require('../../utils/logger');

// Create upload directory if it doesn't exist
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info(`Created upload directory: ${uploadDir}`);
}

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create user directory if it doesn't exist
    const userDir = path.join(uploadDir, req.user._id.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueId = uuidv4();
    const fileExt = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueId}${fileExt}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedFileTypes = /jpeg|jpg|png|gif|csv|json|txt|pdf|doc|docx|xls|xlsx|zip|tar|gz/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    return cb(new BadRequestError('Unsupported file type'), false);
  }
};

// Initialize multer upload
const upload = multer({
  storage,
  limits: {
    fileSize: (process.env.MAX_FILE_SIZE || 50) * 1024 * 1024, // Default 50MB
    files: 10
  },
  fileFilter
});

/**
 * Handle file upload errors
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new BadRequestError(`File too large. Maximum size is ${process.env.MAX_FILE_SIZE || 50}MB`));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new BadRequestError('Too many files. Maximum is 10 files per upload'));
    }
    return next(new BadRequestError(`Upload error: ${err.message}`));
  }
  
  if (err) {
    return next(err);
  }
  
  next();
};

/**
 * Clean up uploaded files on request error
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const cleanupOnError = (err, req, res, next) => {
  if (err && req.files) {
    // Delete all uploaded files
    req.files.forEach(file => {
      fs.unlink(file.path, unlinkErr => {
        if (unlinkErr) {
          logger.error(`Error deleting file ${file.path}:`, unlinkErr);
        }
      });
    });
  }
  
  next(err);
};

module.exports = {
  uploadSingle: (fieldName) => [
    upload.single(fieldName),
    handleUploadError,
    cleanupOnError
  ],
  
  uploadMultiple: (fieldName, maxCount = 10) => [
    upload.array(fieldName, maxCount),
    handleUploadError,
    cleanupOnError
  ],
  
  uploadFields: (fields) => [
    upload.fields(fields),
    handleUploadError,
    cleanupOnError
  ]
}; 