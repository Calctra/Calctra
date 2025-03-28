const jwt = require('jsonwebtoken');
const User = require('../../models/user.model');
const { hash } = require('../../utils/encryption');
const logger = require('../../utils/logger');

/**
 * Authentication middleware for protecting routes
 */
const authMiddleware = {
  /**
   * Verify JWT token and add user to the request object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  authenticate: async (req, res, next) => {
    try {
      let token;
      
      // Check for token in Authorization header
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }
      // Check for token in cookies (for web app)
      else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
      }
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in.'
        });
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token is expired
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please log in again.'
        });
      }
      
      // Find user
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found.'
        });
      }
      
      if (!user.active) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
      }
      
      // Add user to request
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please log in again.'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Authentication error.'
      });
    }
  },
  
  /**
   * Verify user role has the required permission level
   * @param  {...String} roles - Required roles (one of which must be matched)
   * @returns {Function} Express middleware
   */
  authorize: (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in.'
        });
      }
      
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. ${req.user.role} role is not authorized.`
        });
      }
      
      next();
    };
  },
  
  /**
   * Optional authentication - will add user to req if token is valid, but won't error if no token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  optionalAuth: async (req, res, next) => {
    try {
      let token;
      
      // Check for token in Authorization header
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }
      // Check for token in cookies (for web app)
      else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
      }
      
      if (!token) {
        return next();
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token is expired
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        return next();
      }
      
      // Find user
      const user = await User.findById(decoded.id);
      
      if (user && user.active) {
        // Add user to request
        req.user = user;
      }
      
      next();
    } catch (error) {
      // Don't return error, just continue without authenticated user
      next();
    }
  },
  
  /**
   * Generate a JWT token for a user
   * @param {Object} user - User object
   * @param {boolean} rememberMe - Whether to set a longer expiration
   * @returns {String} JWT token
   */
  generateToken: (user, rememberMe = false) => {
    const expiresIn = rememberMe ? '30d' : '1d';
    
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn }
    );
  },
  
  /**
   * Verify resource ownership or admin rights
   * @param {String} modelName - Name of the model to check
   * @param {String} paramName - Name of the request parameter containing the resource ID
   * @returns {Function} Express middleware
   */
  verifyOwnership: (modelName, paramName = 'id') => {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required. Please log in.'
          });
        }
        
        const resourceId = req.params[paramName];
        
        if (!resourceId) {
          return res.status(400).json({
            success: false,
            message: `No ${paramName} parameter provided.`
          });
        }
        
        // Admin can access everything
        if (req.user.role === 'admin') {
          return next();
        }
        
        // Find the model dynamically
        const Model = require(`../../models/${modelName}.model`);
        const resource = await Model.findById(resourceId);
        
        if (!resource) {
          return res.status(404).json({
            success: false,
            message: 'Resource not found.'
          });
        }
        
        // Check if the user is the owner
        if (resource.owner && resource.owner.toString() === req.user._id.toString()) {
          return next();
        }
        
        // For data resources, check if they have been shared with the user
        if (modelName === 'data' && resource.visibility === 'shared') {
          const hasAccess = resource.accessPermissions.some(
            p => p.user.toString() === req.user._id.toString()
          );
          
          if (hasAccess) {
            return next();
          }
        }
        
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to access this resource.'
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error verifying resource ownership.',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    };
  },
  
  /**
   * Verify wallet signature and authenticate user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  authenticateWallet: async (req, res, next) => {
    try {
      const { walletAddress, signature, message } = req.body;
      
      if (!walletAddress || !signature || !message) {
        return res.status(400).json({
          success: false,
          message: 'Wallet address, signature, and message are required.'
        });
      }
      
      // Verify the signature
      // This would typically be handled by a blockchain-specific library
      const isValidSignature = true; // Placeholder for actual signature verification
      
      if (!isValidSignature) {
        return res.status(401).json({
          success: false,
          message: 'Invalid signature.'
        });
      }
      
      // Find or create user
      let user = await User.findOne({ walletAddress });
      
      if (!user) {
        // Create a new user with wallet authentication
        user = await User.create({
          walletAddress,
          email: `${walletAddress.substring(0, 8)}@wallet.calctra.io`, // Placeholder email
          name: `User_${walletAddress.substring(0, 6)}`,
          password: await hash.random.hex(32), // Random password since login will be via wallet
          emailVerified: true // Skip email verification for wallet users
        });
      }
      
      if (!user.active) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
      }
      
      // Add user to request
      req.user = user;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Wallet authentication error.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = authMiddleware; 