const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth');
const User = require('../../models/user.model');
const authMiddleware = require('../middlewares/auth');
const { validations, validate } = require('../../utils/validators');
const { BadRequestError, NotFoundError, UnauthorizedError } = require('../../utils/errors');
const { random } = require('../../utils/encryption');
const logger = require('../../utils/logger');

/**
 * @route GET /api/users/profile
 * @desc Get user profile
 * @access Private
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * @route PUT /api/users/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', authenticate, userController.updateProfile);

/**
 * @route GET /api/users/resources
 * @desc Get user's compute resources
 * @access Private
 */
router.get('/resources', authenticate, userController.getUserResources);

/**
 * @route GET /api/users/jobs
 * @desc Get user's compute jobs
 * @access Private
 */
router.get('/jobs', authenticate, userController.getUserJobs);

/**
 * @route GET /api/users/balance
 * @desc Get user's token balance
 * @access Private
 */
router.get('/balance', authenticate, userController.getTokenBalance);

/**
 * @route POST /api/users/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validations.user.create, validate, async (req, res, next) => {
  try {
    const { name, email, password, walletAddress } = req.body;
    
    // Check if user with same email exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new BadRequestError('User with this email already exists', 'EMAIL_IN_USE');
    }
    
    // Check if wallet address is provided and already in use
    if (walletAddress) {
      const existingWallet = await User.findByWallet(walletAddress);
      if (existingWallet) {
        throw new BadRequestError('Wallet address already associated with an account', 'WALLET_IN_USE');
      }
    }
    
    // Create verification token
    const emailVerificationToken = random.token();
    
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      walletAddress,
      emailVerificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
    
    // Generate authentication token
    const token = authMiddleware.generateToken(user);
    
    // TODO: Send verification email
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          walletAddress: user.walletAddress,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/users/login
 * @desc Login user
 * @access Public
 */
router.post('/login', validations.user.login, validate, async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;
    
    // Find user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      throw new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');
    }
    
    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil - new Date()) / (60 * 1000));
      throw new UnauthorizedError(
        `Account is locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`,
        'ACCOUNT_LOCKED'
      );
    }
    
    // Verify password
    const isMatch = await user.verifyPassword(password);
    
    // Update login stats
    await user.updateLoginStats(isMatch);
    
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');
    }
    
    // Check if user is active
    if (!user.active) {
      throw new UnauthorizedError('Your account has been deactivated', 'ACCOUNT_INACTIVE');
    }
    
    // Generate token
    const token = authMiddleware.generateToken(user, rememberMe);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          walletAddress: user.walletAddress,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/users/wallet-auth
 * @desc Authenticate with wallet signature
 * @access Public
 */
router.post('/wallet-auth', async (req, res, next) => {
  try {
    // Handle wallet authentication through middleware
    authMiddleware.authenticateWallet(req, res, () => {
      // Generate token
      const token = authMiddleware.generateToken(req.user, true);
      
      res.json({
        success: true,
        message: 'Wallet authentication successful',
        data: {
          user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            walletAddress: req.user.walletAddress,
          },
          token,
        },
      });
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/users/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authMiddleware.authenticate, async (req, res, next) => {
  try {
    // Get user with updated information
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
          stats: user.stats,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/users/me
 * @desc Update current user profile
 * @access Private
 */
router.put('/me', authMiddleware.authenticate, validations.user.update, validate, async (req, res, next) => {
  try {
    const { name, bio, walletAddress, preferences } = req.body;
    
    // Find user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Update user fields
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    
    // Handle wallet address separately to check for uniqueness
    if (walletAddress !== undefined && walletAddress !== user.walletAddress) {
      const existingWallet = await User.findByWallet(walletAddress);
      if (existingWallet) {
        throw new BadRequestError('Wallet address already associated with an account', 'WALLET_IN_USE');
      }
      user.walletAddress = walletAddress;
    }
    
    // Update preferences
    if (preferences) {
      if (preferences.language !== undefined) user.preferences.language = preferences.language;
      if (preferences.notificationEmail !== undefined) user.preferences.notificationEmail = preferences.notificationEmail;
      if (preferences.notificationSite !== undefined) user.preferences.notificationSite = preferences.notificationSite;
      if (preferences.theme !== undefined) user.preferences.theme = preferences.theme;
    }
    
    // Save updated user
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
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/users/password
 * @desc Change user password
 * @access Private
 */
router.put('/password', authMiddleware.authenticate, validations.user.changePassword, validate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Find user with password
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Verify current password
    const isMatch = await user.verifyPassword(currentPassword);
    
    if (!isMatch) {
      throw new BadRequestError('Current password is incorrect', 'INVALID_PASSWORD');
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/users/verify-email
 * @desc Verify user email with token
 * @access Public
 */
router.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      throw new BadRequestError('Verification token is required', 'TOKEN_REQUIRED');
    }
    
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });
    
    if (!user) {
      throw new BadRequestError('Invalid or expired verification token', 'INVALID_TOKEN');
    }
    
    // Update user
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/users/forgot-password
 * @desc Send password reset token to user email
 * @access Public
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      throw new BadRequestError('Email is required', 'EMAIL_REQUIRED');
    }
    
    // Find user
    const user = await User.findByEmail(email);
    
    if (!user) {
      // Return success even if no user found to prevent email enumeration
      return res.json({
        success: true,
        message: 'If a user with that email exists, a password reset link has been sent',
      });
    }
    
    // Generate token
    const resetToken = random.token();
    
    // Set token and expiry
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
    await user.save();
    
    // TODO: Send password reset email
    
    res.json({
      success: true,
      message: 'If a user with that email exists, a password reset link has been sent',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/users/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      throw new BadRequestError('Token and new password are required', 'MISSING_FIELDS');
    }
    
    // Check password length
    if (password.length < 8) {
      throw new BadRequestError('Password must be at least 8 characters long', 'INVALID_PASSWORD');
    }
    
    // Find user
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });
    
    if (!user) {
      throw new BadRequestError('Invalid or expired reset token', 'INVALID_TOKEN');
    }
    
    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/users/stats
 * @desc Get user statistics
 * @access Private
 */
router.get('/stats', authMiddleware.authenticate, async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Get user
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Get job stats
    const Job = require('../../models/job.model');
    const jobStats = await Job.getJobStats(userId);
    
    // Format job stats
    const formattedJobStats = {
      total: 0,
      completed: 0,
      failed: 0,
      running: 0,
      pending: 0,
      cancelled: 0,
      averageDuration: 0,
    };
    
    jobStats.forEach(stat => {
      if (stat._id) {
        formattedJobStats[stat._id.toLowerCase()] = stat.count;
        formattedJobStats.total += stat.count;
        if (stat.avgDuration) {
          formattedJobStats.averageDuration = stat.avgDuration;
        }
      }
    });
    
    // Get resource stats
    const Resource = require('../../models/resource.model');
    const resourceCount = await Resource.countDocuments({ owner: userId });
    
    // Get data stats
    const Data = require('../../models/data.model');
    const dataCount = await Data.countDocuments({ owner: userId });
    
    res.json({
      success: true,
      data: {
        jobs: formattedJobStats,
        resources: {
          total: resourceCount,
        },
        data: {
          total: dataCount,
        },
        user: user.stats,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 