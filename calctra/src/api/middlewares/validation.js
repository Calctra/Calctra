const logger = require('../../utils/logger');

/**
 * Validates user registration input
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.validateRegister = (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required: name, email, password'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid email address'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters long'
      });
    }

    next();
  } catch (error) {
    logger.error(`Validation error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Error validating registration data'
    });
  }
};

/**
 * Validates user login input
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.validateLogin = (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }

    next();
  } catch (error) {
    logger.error(`Validation error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Error validating login data'
    });
  }
};

/**
 * Validates compute job input
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.validateComputeJob = (req, res, next) => {
  try {
    const { name, description, requirements, dataIds, budget } = req.body;

    if (!name || !description || !requirements) {
      return res.status(400).json({
        status: 'error',
        message: 'Job name, description and resource requirements are required'
      });
    }

    // Validate requirements object
    if (!requirements.cpu || !requirements.memory || !requirements.duration) {
      return res.status(400).json({
        status: 'error',
        message: 'Resource requirements must include CPU, memory and duration'
      });
    }

    // Validate data IDs format if provided
    if (dataIds && !Array.isArray(dataIds)) {
      return res.status(400).json({
        status: 'error',
        message: 'Data IDs must be an array'
      });
    }

    // Validate budget if provided
    if (budget && typeof budget !== 'number') {
      return res.status(400).json({
        status: 'error',
        message: 'Budget must be a number'
      });
    }

    next();
  } catch (error) {
    logger.error(`Validation error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Error validating compute job data'
    });
  }
};

/**
 * Validates resource registration input
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.validateResource = (req, res, next) => {
  try {
    const { name, description, specifications, availability, pricePerUnit } = req.body;

    if (!name || !description || !specifications || !availability || !pricePerUnit) {
      return res.status(400).json({
        status: 'error',
        message: 'All resource details are required'
      });
    }

    // Validate specifications object
    if (!specifications.cpu || !specifications.memory || !specifications.storage) {
      return res.status(400).json({
        status: 'error',
        message: 'Resource specifications must include CPU, memory and storage details'
      });
    }

    // Validate availability object
    if (!availability.schedule || !availability.timezone) {
      return res.status(400).json({
        status: 'error',
        message: 'Resource availability must include schedule and timezone'
      });
    }

    next();
  } catch (error) {
    logger.error(`Validation error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Error validating resource data'
    });
  }
}; 