const { ValidationError } = require('../../utils/errors');
const logger = require('../../utils/logger');

/**
 * Validate request body against a Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {String} source - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware
 */
exports.validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      if (!schema) {
        return next();
      }
      
      const { error, value } = schema.validate(req[source], {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: true
      });
      
      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message.replace(/"/g, '')
        }));
        
        const errorMessages = details.map(d => `${d.field}: ${d.message}`).join(', ');
        
        throw new ValidationError(`Validation error: ${errorMessages}`);
      }
      
      // Replace request data with validated data
      req[source] = value;
      next();
    } catch (error) {
      logger.error('Validation error', { error: error.message });
      next(error);
    }
  };
};

/**
 * Sanitize request data to prevent common security issues
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.sanitize = (req, res, next) => {
  try {
    // Function to sanitize strings in an object
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        
        if (typeof value === 'string') {
          // Basic XSS protection
          obj[key] = value
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
        } else if (typeof value === 'object') {
          obj[key] = sanitizeObject(value);
        }
      });
      
      return obj;
    };
    
    // Sanitize body, query and params
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    logger.error('Sanitization error', { error: error.message });
    next(error);
  }
};