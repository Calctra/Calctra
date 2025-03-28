const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('./errors');

/**
 * Middleware to check validation results and throw error if validation fails
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().reduce((acc, error) => {
      acc[error.param] = error.msg;
      return acc;
    }, {});
    
    throw new ValidationError('Validation failed', formattedErrors);
  }
  next();
};

/**
 * Common validation rules
 */
const validations = {
  // User validations
  user: {
    create: [
      body('email').isEmail().withMessage('Must be a valid email address'),
      body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
      body('name').notEmpty().withMessage('Name is required'),
    ],
    login: [
      body('email').isEmail().withMessage('Must be a valid email address'),
      body('password').exists().withMessage('Password is required'),
    ],
    update: [
      body('name').optional(),
      body('email').optional().isEmail().withMessage('Must be a valid email address'),
      body('walletAddress').optional(),
    ],
    changePassword: [
      body('currentPassword').exists().withMessage('Current password is required'),
      body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
    ],
    getById: [
      param('userId').isMongoId().withMessage('Invalid user ID format'),
    ],
  },
  
  // Resource validations
  resource: {
    create: [
      body('name').notEmpty().withMessage('Name is required'),
      body('description').notEmpty().withMessage('Description is required'),
      body('specs').isObject().withMessage('Specs must be an object'),
      body('specs.cpuCores').isInt({ min: 1 }).withMessage('CPU cores must be at least 1'),
      body('specs.memoryGb').isFloat({ min: 1 }).withMessage('Memory must be at least 1GB'),
      body('specs.storageGb').isFloat({ min: 1 }).withMessage('Storage must be at least 1GB'),
      body('specs.gpuModel').optional(),
      body('specs.gpuMemoryGb').optional().isFloat({ min: 1 }).withMessage('GPU memory must be at least 1GB'),
      body('pricePerUnit').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
      body('availability').isObject().withMessage('Availability must be an object'),
    ],
    update: [
      param('resourceId').isMongoId().withMessage('Invalid resource ID format'),
      body('name').optional(),
      body('description').optional(),
      body('specs').optional().isObject().withMessage('Specs must be an object'),
      body('pricePerUnit').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
      body('availability').optional().isObject().withMessage('Availability must be an object'),
      body('active').optional().isBoolean().withMessage('Active must be a boolean'),
    ],
    getById: [
      param('resourceId').isMongoId().withMessage('Invalid resource ID format'),
    ],
    list: [
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
      query('minCpu').optional().isInt({ min: 1 }).withMessage('Min CPU must be at least 1'),
      query('minMemory').optional().isFloat({ min: 1 }).withMessage('Min memory must be at least 1GB'),
      query('minStorage').optional().isFloat({ min: 1 }).withMessage('Min storage must be at least 1GB'),
      query('hasGpu').optional().isBoolean().withMessage('hasGpu must be a boolean'),
      query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
    ],
  },
  
  // Job validations
  job: {
    create: [
      body('name').notEmpty().withMessage('Name is required'),
      body('description').notEmpty().withMessage('Description is required'),
      body('type').isIn(['custom_code', 'data_processing']).withMessage('Invalid job type'),
      body('code').optional(),
      body('datasets').optional().isArray().withMessage('Datasets must be an array'),
      body('requirements').isObject().withMessage('Requirements must be an object'),
      body('requirements.minCpuCores').isInt({ min: 1 }).withMessage('Min CPU cores must be at least 1'),
      body('requirements.minMemoryGb').isFloat({ min: 1 }).withMessage('Min memory must be at least 1GB'),
      body('requirements.minStorageGb').isFloat({ min: 1 }).withMessage('Min storage must be at least 1GB'),
      body('requirements.needsGpu').isBoolean().withMessage('needsGpu must be a boolean'),
      body('requirements.minGpuMemoryGb').optional().isFloat({ min: 1 }).withMessage('Min GPU memory must be at least 1GB'),
      body('requirements.estimatedDurationHours').isFloat({ min: 0.1 }).withMessage('Estimated duration must be positive'),
      body('budget').isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
      body('deadline').optional().isISO8601().withMessage('Deadline must be a valid date'),
    ],
    update: [
      param('jobId').isMongoId().withMessage('Invalid job ID format'),
      body('name').optional(),
      body('description').optional(),
      body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
      body('deadline').optional().isISO8601().withMessage('Deadline must be a valid date'),
    ],
    getById: [
      param('jobId').isMongoId().withMessage('Invalid job ID format'),
    ],
    cancel: [
      param('jobId').isMongoId().withMessage('Invalid job ID format'),
    ],
    rate: [
      param('jobId').isMongoId().withMessage('Invalid job ID format'),
      body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
      body('feedback').optional().isString().withMessage('Feedback must be a string'),
    ],
    list: [
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
      query('status').optional().isIn(['CREATED', 'MATCHED', 'ACCEPTED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']).withMessage('Invalid status'),
    ],
  },
  
  // Dataset validations
  dataset: {
    create: [
      body('name').notEmpty().withMessage('Name is required'),
      body('description').notEmpty().withMessage('Description is required'),
      body('type').notEmpty().withMessage('Type is required'),
      body('format').notEmpty().withMessage('Format is required'),
      body('isEncrypted').isBoolean().withMessage('isEncrypted must be a boolean'),
      body('isPublic').isBoolean().withMessage('isPublic must be a boolean'),
    ],
    update: [
      param('datasetId').isMongoId().withMessage('Invalid dataset ID format'),
      body('name').optional(),
      body('description').optional(),
      body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
    ],
    getById: [
      param('datasetId').isMongoId().withMessage('Invalid dataset ID format'),
    ],
    list: [
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
      query('type').optional(),
    ],
  },
  
  // Token transaction validations
  token: {
    getBalance: [],
    getTransactions: [
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
      query('type').optional().isIn(['DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'REWARD']).withMessage('Invalid transaction type'),
      query('status').optional().isIn(['PENDING', 'COMPLETED', 'FAILED']).withMessage('Invalid status'),
    ],
  },
};

module.exports = {
  validate,
  validations
}; 