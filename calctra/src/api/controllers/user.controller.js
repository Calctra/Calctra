const User = require('../../models/user.model');
const Resource = require('../../models/resource.model');
const Job = require('../../models/job.model');
const { NotFoundError, UnauthorizedError, BadRequestError } = require('../../utils/errors');
const logger = require('../../utils/logger');

/**
 * Get user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          walletAddress: user.walletAddress,
          avatar: user.avatar,
          bio: user.bio,
          preferences: user.preferences,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatar, preferences } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Update fields if provided
    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (avatar) user.avatar = avatar;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          walletAddress: user.walletAddress,
          avatar: user.avatar,
          bio: user.bio,
          preferences: user.preferences,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's compute resources
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUserResources = async (req, res, next) => {
  try {
    const resources = await Resource.find({ owner: req.user._id });
    
    res.json({
      success: true,
      data: {
        resources
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's compute jobs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUserJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ userId: req.user._id });
    
    res.json({
      success: true,
      data: {
        jobs
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's token balance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getTokenBalance = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // In a real implementation, this would connect to the blockchain
    // to get the current token balance from the user's wallet
    // For now, we'll return a mock value
    
    res.json({
      success: true,
      data: {
        balance: user.tokenBalance || 0,
        walletAddress: user.walletAddress
      }
    });
  } catch (error) {
    next(error);
  }
}; 