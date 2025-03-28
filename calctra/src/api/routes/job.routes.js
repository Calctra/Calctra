const express = require('express');
const router = express.Router();
const Job = require('../../models/job.model');
const Resource = require('../../models/resource.model');
const authMiddleware = require('../middlewares/auth');
const { validations, validate } = require('../../utils/validators');
const { BadRequestError, NotFoundError, ForbiddenError, InsufficientFundsError } = require('../../utils/errors');
const ResourceMatcher = require('../../core/resource-matcher');
const solanaClient = require('../../blockchain/solana');
const logger = require('../../utils/logger');

// Initialize resource matcher
const resourceMatcher = new ResourceMatcher();

/**
 * @route POST /api/jobs
 * @desc Create a new job
 * @access Private
 */
router.post('/', 
  authMiddleware.authenticate, 
  validations.job.create, 
  validate, 
  async (req, res, next) => {
    try {
      const {
        title,
        description,
        type,
        requirements,
        inputFiles,
        code,
        privacy,
        schedule,
        priority = 5,
        tags
      } = req.body;
      
      // Create job
      const job = await Job.create({
        user: req.user._id,
        title,
        description,
        type,
        requirements,
        inputFiles: inputFiles || [],
        code: code || {},
        privacy: privacy || { isPrivate: true },
        schedule: schedule || {},
        priority,
        status: 'draft',
        tags: tags || []
      });
      
      // Update user stats
      const User = require('../../models/user.model');
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'stats.totalJobsCreated': 1 }
      });
      
      res.status(201).json({
        success: true,
        message: 'Job created successfully',
        data: {
          job
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/jobs
 * @desc Get all jobs with filters
 * @access Private
 */
router.get('/', 
  authMiddleware.authenticate, 
  validations.job.list, 
  validate, 
  async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        sort = 'createdAt',
        order = 'desc',
        type,
        startDate,
        endDate
      } = req.query;
      
      // Build query
      const query = { user: req.user._id };
      
      // Add filters
      if (status) query.status = status;
      if (type) query.type = type;
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }
      
      // Parse sort options
      const sortOptions = {};
      sortOptions[sort] = order === 'desc' ? -1 : 1;
      
      // Calculate pagination
      const skip = (Number(page) - 1) * Number(limit);
      
      // Execute query
      const jobs = await Job.find(query)
        .populate('assignedResources', 'name specs pricePerUnit')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit));
      
      // Get total count
      const total = await Job.countDocuments(query);
      
      res.json({
        success: true,
        data: {
          jobs,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/jobs/:jobId
 * @desc Get job by ID
 * @access Private
 */
router.get('/:jobId', 
  authMiddleware.authenticate, 
  validations.job.getById, 
  validate, 
  async (req, res, next) => {
    try {
      const { jobId } = req.params;
      
      const job = await Job.findById(jobId)
        .populate('user', 'name email')
        .populate('assignedResources', 'name specs pricePerUnit');
      
      if (!job) {
        throw new NotFoundError('Job not found');
      }
      
      // Check if user is authorized to view this job
      if (job.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        // Check if the job is shared with this user
        const isShared = job.privacy.accessibleBy.some(
          access => access.user.toString() === req.user._id.toString()
        );
        
        if (!isShared && job.privacy.isPrivate) {
          throw new ForbiddenError('You do not have permission to view this job');
        }
      }
      
      res.json({
        success: true,
        data: {
          job
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/jobs/:jobId
 * @desc Update job details
 * @access Private
 */
router.put('/:jobId', 
  authMiddleware.authenticate, 
  validations.job.update, 
  validate, 
  async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const { title, description, priority, tags, schedule } = req.body;
      
      // Find job
      const job = await Job.findById(jobId);
      
      if (!job) {
        throw new NotFoundError('Job not found');
      }
      
      // Check ownership
      if (job.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ForbiddenError('You do not have permission to update this job');
      }
      
      // Check if job can be updated
      if (['completed', 'failed', 'cancelled'].includes(job.status)) {
        throw new BadRequestError(`Cannot update job in ${job.status} status`, 'JOB_COMPLETED');
      }
      
      // Update fields
      if (title !== undefined) job.title = title;
      if (description !== undefined) job.description = description;
      if (priority !== undefined) job.priority = priority;
      if (tags !== undefined) job.tags = tags;
      
      // Update schedule
      if (schedule) {
        if (schedule.deadline !== undefined) job.schedule.deadline = new Date(schedule.deadline);
        if (schedule.isRecurring !== undefined) job.schedule.isRecurring = schedule.isRecurring;
        if (schedule.recurringPattern) job.schedule.recurringPattern = schedule.recurringPattern;
      }
      
      // Save changes
      await job.save();
      
      res.json({
        success: true,
        message: 'Job updated successfully',
        data: {
          job
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/jobs/:jobId/submit
 * @desc Submit a draft job for processing
 * @access Private
 */
router.post('/:jobId/submit', 
  authMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const { paymentMethod = 'wallet' } = req.body;
      
      // Find job
      const job = await Job.findById(jobId);
      
      if (!job) {
        throw new NotFoundError('Job not found');
      }
      
      // Check ownership
      if (job.user.toString() !== req.user._id.toString()) {
        throw new ForbiddenError('You do not have permission to submit this job');
      }
      
      // Check if job is in draft status
      if (job.status !== 'draft') {
        throw new BadRequestError('Only draft jobs can be submitted', 'INVALID_JOB_STATUS');
      }
      
      // If payment is via wallet, check balance
      if (paymentMethod === 'wallet') {
        // Check if user has wallet address
        if (!req.user.walletAddress) {
          throw new BadRequestError('Wallet address required for payment', 'NO_WALLET_ADDRESS');
        }
        
        // Calculate estimated job cost
        const estimatedCost = calculateJobCost(job);
        
        // Check user's token balance
        const balance = await solanaClient.getTokenBalance(req.user.walletAddress);
        
        if (balance < estimatedCost) {
          throw new InsufficientFundsError(
            `Insufficient CAL tokens. Required: ${estimatedCost}, Available: ${balance}`
          );
        }
        
        // Set payment details
        job.payment = {
          status: 'pending',
          amount: estimatedCost,
          currency: 'CAL'
        };
      }
      
      // Submit job to blockchain if wallet address exists
      if (req.user.walletAddress) {
        try {
          const blockchainResult = await solanaClient.submitJobMatching(job, req.user.walletAddress);
          
          // Update job with blockchain ID
          job.blockchainJobId = blockchainResult.blockchainJobId;
        } catch (blockchainError) {
          logger.error('Error submitting job to blockchain:', blockchainError);
          // Continue without blockchain submission
        }
      }
      
      // Update job status
      await job.updateStatus('pending');
      
      // Trigger resource matching (async process)
      resourceMatcher.matchJobToResources(job)
        .then(matchResult => {
          logger.info(`Job ${job._id} matching completed:`, matchResult);
        })
        .catch(error => {
          logger.error(`Job ${job._id} matching error:`, error);
        });
      
      res.json({
        success: true,
        message: 'Job submitted successfully',
        data: {
          job,
          estimatedCost: job.payment?.amount
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/jobs/:jobId/cancel
 * @desc Cancel a job
 * @access Private
 */
router.post('/:jobId/cancel', 
  authMiddleware.authenticate, 
  validations.job.cancel, 
  validate, 
  async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const { reason } = req.body;
      
      // Find job
      const job = await Job.findById(jobId);
      
      if (!job) {
        throw new NotFoundError('Job not found');
      }
      
      // Check ownership
      if (job.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ForbiddenError('You do not have permission to cancel this job');
      }
      
      // Check if job can be cancelled
      if (['completed', 'failed', 'cancelled'].includes(job.status)) {
        throw new BadRequestError(`Job is already in ${job.status} status`, 'INVALID_JOB_STATUS');
      }
      
      // Update job status
      try {
        await job.updateStatus('cancelled');
        
        // Add reason to job
        job.cancellationReason = reason;
        await job.save();
        
        // Refund payment if job was paid and not yet running
        if (job.payment && job.payment.status === 'paid' && !['running', 'completed'].includes(job.status)) {
          if (req.user.walletAddress) {
            try {
              // Process refund
              // In a real implementation, this would handle the actual refund logic
              job.payment.status = 'refunded';
              job.payment.transactionId = `refund_${Date.now()}`;
              job.payment.transactionTime = new Date();
              await job.save();
            } catch (paymentError) {
              logger.error('Error processing refund:', paymentError);
            }
          }
        }
        
        res.json({
          success: true,
          message: 'Job cancelled successfully',
          data: {
            job
          }
        });
      } catch (statusError) {
        throw new BadRequestError(statusError.message, 'STATUS_TRANSITION_ERROR');
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/jobs/:jobId/logs
 * @desc Get job execution logs
 * @access Private
 */
router.get('/:jobId/logs', 
  authMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const { jobId } = req.params;
      
      // Find job
      const job = await Job.findById(jobId);
      
      if (!job) {
        throw new NotFoundError('Job not found');
      }
      
      // Check ownership
      if (job.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ForbiddenError('You do not have permission to view this job');
      }
      
      // Get logs
      const logs = job.results?.logs || [];
      
      res.json({
        success: true,
        data: {
          logs,
          job: {
            id: job._id,
            status: job.status
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/jobs/:jobId/results
 * @desc Get job results
 * @access Private
 */
router.get('/:jobId/results', 
  authMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const { jobId } = req.params;
      
      // Find job
      const job = await Job.findById(jobId);
      
      if (!job) {
        throw new NotFoundError('Job not found');
      }
      
      // Check ownership or access permissions
      const isOwner = job.user.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      const hasAccess = job.privacy.accessibleBy.some(
        access => access.user.toString() === req.user._id.toString()
      );
      
      if (!isOwner && !isAdmin && !hasAccess && job.privacy.isPrivate) {
        throw new ForbiddenError('You do not have permission to view this job results');
      }
      
      // Check if job is completed
      if (job.status !== 'completed') {
        return res.json({
          success: false,
          message: `Job is not completed. Current status: ${job.status}`,
          data: {
            job: {
              id: job._id,
              status: job.status
            }
          }
        });
      }
      
      // Get results
      const results = job.results || {};
      
      res.json({
        success: true,
        data: {
          results,
          job: {
            id: job._id,
            title: job.title,
            status: job.status,
            completedAt: job.updatedAt
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/jobs/:jobId/share
 * @desc Share job with another user
 * @access Private
 */
router.post('/:jobId/share', 
  authMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const { email, accessLevel = 'read' } = req.body;
      
      if (!email) {
        throw new BadRequestError('Email is required', 'EMAIL_REQUIRED');
      }
      
      // Find job
      const job = await Job.findById(jobId);
      
      if (!job) {
        throw new NotFoundError('Job not found');
      }
      
      // Check ownership
      if (job.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ForbiddenError('You do not have permission to share this job');
      }
      
      // Find user to share with
      const User = require('../../models/user.model');
      const targetUser = await User.findByEmail(email);
      
      if (!targetUser) {
        throw new NotFoundError('User not found');
      }
      
      // Check if user is already in the access list
      const accessIndex = job.privacy.accessibleBy.findIndex(
        access => access.user.toString() === targetUser._id.toString()
      );
      
      if (accessIndex !== -1) {
        // Update existing access
        job.privacy.accessibleBy[accessIndex].accessLevel = accessLevel;
      } else {
        // Add new access
        job.privacy.accessibleBy.push({
          user: targetUser._id,
          accessLevel
        });
      }
      
      // Set job as shared
      job.privacy.isPrivate = true; // Still private, but shared with specific users
      
      await job.save();
      
      res.json({
        success: true,
        message: 'Job shared successfully',
        data: {
          shared: {
            user: {
              id: targetUser._id,
              email: targetUser.email,
              name: targetUser.name
            },
            accessLevel
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/jobs/:jobId/share/:userId
 * @desc Remove job sharing for a user
 * @access Private
 */
router.delete('/:jobId/share/:userId', 
  authMiddleware.authenticate, 
  async (req, res, next) => {
    try {
      const { jobId, userId } = req.params;
      
      // Find job
      const job = await Job.findById(jobId);
      
      if (!job) {
        throw new NotFoundError('Job not found');
      }
      
      // Check ownership
      if (job.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ForbiddenError('You do not have permission to modify job sharing');
      }
      
      // Remove user from access list
      job.privacy.accessibleBy = job.privacy.accessibleBy.filter(
        access => access.user.toString() !== userId
      );
      
      await job.save();
      
      res.json({
        success: true,
        message: 'Job sharing removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/jobs/:jobId/rate
 * @desc Rate resources used for a job
 * @access Private
 */
router.post('/:jobId/rate', 
  authMiddleware.authenticate, 
  validations.job.rate, 
  validate, 
  async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const { rating, feedback } = req.body;
      
      // Find job
      const job = await Job.findById(jobId);
      
      if (!job) {
        throw new NotFoundError('Job not found');
      }
      
      // Check ownership
      if (job.user.toString() !== req.user._id.toString()) {
        throw new ForbiddenError('You can only rate your own jobs');
      }
      
      // Check if job is completed
      if (job.status !== 'completed') {
        throw new BadRequestError('Only completed jobs can be rated', 'JOB_NOT_COMPLETED');
      }
      
      // Check if job has assigned resources
      if (!job.assignedResources || job.assignedResources.length === 0) {
        throw new BadRequestError('Job has no assigned resources to rate', 'NO_RESOURCES');
      }
      
      // Create reviews for each resource
      const Review = require('../../models/review.model');
      const reviews = [];
      
      for (const resourceId of job.assignedResources) {
        // Create review
        const review = await Review.create({
          resource: resourceId,
          user: req.user._id,
          rating,
          comment: feedback,
          job: jobId
        });
        
        reviews.push(review);
        
        // Update resource rating
        const resource = await Resource.findById(resourceId);
        const allReviews = await Review.find({ resource: resourceId });
        const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / allReviews.length;
        
        resource.rating.average = averageRating;
        resource.rating.count = allReviews.length;
        await resource.save();
      }
      
      res.json({
        success: true,
        message: 'Resources rated successfully',
        data: {
          rating,
          reviewCount: reviews.length,
          jobId
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Helper function to calculate estimated job cost
 */
function calculateJobCost(job) {
  // In a real implementation, this would calculate based on:
  // - Resource requirements
  // - Estimated duration
  // - Current market rates
  // - Any discounts/premiums
  
  const cpuFactor = job.requirements.cpuCores * 0.1;
  const memoryFactor = job.requirements.memoryGb * 0.05;
  const storageFactor = job.requirements.storageGb * 0.02;
  const gpuFactor = job.requirements.needsGpu ? (job.requirements.gpuMemoryGb || 1) * 0.5 : 0;
  const durationFactor = job.requirements.estimatedDuration || 1;
  
  // Calculate base cost
  let baseCost = (cpuFactor + memoryFactor + storageFactor + gpuFactor) * durationFactor;
  
  // Add premium for higher priority
  baseCost *= (1 + (job.priority - 5) / 10);
  
  // Round to 2 decimal places
  return Math.max(Math.round(baseCost * 100) / 100, 1);
}

module.exports = router; 