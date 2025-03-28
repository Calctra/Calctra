const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('../../utils/errors');
const User = require('../../models/user.model');
const logger = require('../../utils/logger');

/**
 * Protect routes - verify JWT token and set req.user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // Make sure token exists
    if (!token) {
      throw new UnauthorizedError('Authentication required to access this resource');
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Set user in request
      req.user = await User.findById(decoded.id);
      
      if (!req.user) {
        throw new UnauthorizedError('User not found');
      }
      
      next();
    } catch (err) {
      logger.error('JWT verification failed', { error: err.message });
      throw new UnauthorizedError('Invalid authentication token');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize by role
 * @param  {...String} roles - Allowed roles
 * @returns {Function} Express middleware
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Role ${req.user.role} is not authorized to access this resource`));
    }
    
    next();
  };
};

/**
 * Check wallet owner
 * Validates that the user making the request owns the wallet address
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.checkWalletOwner = async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Check if user owns the wallet
    if (req.user.walletAddress !== walletAddress) {
      throw new ForbiddenError('You are not authorized to access this wallet');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};