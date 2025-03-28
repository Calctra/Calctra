/**
 * Custom error classes for the Calctra application
 */

class AppError extends Error {
  constructor(message, statusCode, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request', errorCode = 'BAD_REQUEST') {
    super(message, 400, errorCode);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', errorCode = 'AUTHENTICATION_REQUIRED') {
    super(message, 401, errorCode);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access denied', errorCode = 'PERMISSION_DENIED') {
    super(message, 403, errorCode);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', errorCode = 'RESOURCE_NOT_FOUND') {
    super(message, 404, errorCode);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = {}, errorCode = 'VALIDATION_ERROR') {
    super(message, 422, errorCode);
    this.details = details;
  }
}

class InsufficientFundsError extends AppError {
  constructor(message = 'Insufficient funds for this operation', errorCode = 'INSUFFICIENT_FUNDS') {
    super(message, 402, errorCode);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', errorCode = 'RATE_LIMIT_EXCEEDED') {
    super(message, 429, errorCode);
  }
}

class BlockchainError extends AppError {
  constructor(message = 'Blockchain operation failed', errorCode = 'BLOCKCHAIN_ERROR') {
    super(message, 500, errorCode);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', errorCode = 'DATABASE_ERROR') {
    super(message, 500, errorCode);
  }
}

// Error handling middleware for Express
const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_ERROR';
  let message = err.message || 'Something went wrong';
  let details = err.details || {};
  
  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 422;
    errorCode = 'VALIDATION_ERROR';
    
    // Format validation error details
    details = Object.keys(err.errors).reduce((acc, key) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});
  }
  
  // Handle Mongoose cast errors (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = `Invalid ${err.path}: ${err.value}`;
  }
  
  // Handle duplicate key errors
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_KEY';
    
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for ${field}`;
    details = { field, value: err.keyValue[field] };
  }
  
  // Send error response
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message,
      details: Object.keys(details).length > 0 ? details : undefined,
    }
  });
};

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  InsufficientFundsError,
  RateLimitError,
  BlockchainError,
  DatabaseError,
  errorHandler
}; 