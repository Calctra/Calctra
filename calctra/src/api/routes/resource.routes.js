const express = require('express');
const router = express.Router();
const Resource = require('../../models/resource.model');
const authMiddleware = require('../middlewares/auth');
const { validations, validate } = require('../../utils/validators');
const { BadRequestError, NotFoundError } = require('../../utils/errors');
const solanaClient = require('../../blockchain/solana');
const logger = require('../../utils/logger');

/**
 * @route POST /api/resources
 * @desc Register a new computing resource
 * @access Private
 */
router.post('/', authMiddleware.authenticate, validations.resource.create, validate, async (req, res, next) => {
  try {
    const { name, description, specs, pricePerUnit, pricingModel, availability, location } = req.body;
    
    // Create resource with current user as owner
    const resource = await Resource.create({
      owner: req.user._id,
      name,
      description,
      specs,
      pricePerUnit,
      pricingModel: pricingModel || 'hourly',
      location,
      availability,
      active: true,
    });
    
    // Register resource on blockchain if wallet address exists
    if (req.user.walletAddress) {
      try {
        const blockchainResult = await solanaClient.registerResource(resource, req.user.walletAddress);
        
        // Update resource with blockchain ID
        resource.blockchainResourceId = blockchainResult.blockchainResourceId;
        await resource.save();
      } catch (blockchainError) {
        logger.error('Error registering resource on blockchain:', blockchainError);
        // Continue without blockchain registration
      }
    }
    
    // Update user stats
    const User = require('../../models/user.model');
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalResourcesRegistered': 1 }
    });
    
    res.status(201).json({
      success: true,
      message: 'Resource registered successfully',
      data: {
        resource
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/resources
 * @desc Get all resources with filters
 * @access Public
 */
router.get('/', validations.resource.list, validate, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      minCpu,
      minMemory,
      minStorage,
      hasGpu,
      maxPrice,
      location,
      maxDistance,
      tags,
      sort = 'createdAt',
      order = 'desc',
      active
    } = req.query;
    
    // Build query
    const query = {};
    
    // Add filters
    if (minCpu) query['specs.cpuCores'] = { $gte: Number(minCpu) };
    if (minMemory) query['specs.memoryGb'] = { $gte: Number(minMemory) };
    if (minStorage) query['specs.storageGb'] = { $gte: Number(minStorage) };
    if (hasGpu === 'true') query['specs.gpuCount'] = { $gt: 0 };
    if (maxPrice) query.pricePerUnit = { $lte: Number(maxPrice) };
    if (tags) query.tags = { $in: tags.split(',') };
    if (active !== undefined) query.active = active === 'true';
    
    // Location-based search
    if (location && maxDistance) {
      const [lng, lat] = location.split(',').map(Number);
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: Number(maxDistance) * 1000 // Convert to meters
        }
      };
    }
    
    // Parse sort options
    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;
    
    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Execute query
    const resources = await Resource.find(query)
      .populate('owner', 'name walletAddress')
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));
    
    // Get total count
    const total = await Resource.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        resources,
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
});

/**
 * @route GET /api/resources/my
 * @desc Get current user's resources
 * @access Private
 */
router.get('/my', authMiddleware.authenticate, async (req, res, next) => {
  try {
    const resources = await Resource.find({ owner: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: {
        resources
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/resources/:resourceId
 * @desc Get resource by ID
 * @access Public
 */
router.get('/:resourceId', validations.resource.getById, validate, async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    
    const resource = await Resource.findById(resourceId)
      .populate('owner', 'name walletAddress')
      .populate('reviews');
    
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }
    
    res.json({
      success: true,
      data: {
        resource
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/resources/:resourceId
 * @desc Update a resource
 * @access Private
 */
router.put('/:resourceId', 
  authMiddleware.authenticate, 
  authMiddleware.verifyOwnership('resource', 'resourceId'),
  validations.resource.update, 
  validate, 
  async (req, res, next) => {
    try {
      const { resourceId } = req.params;
      const { 
        name, 
        description, 
        specs, 
        pricePerUnit, 
        pricingModel, 
        availability, 
        location,
        active,
        tags
      } = req.body;
      
      const resource = await Resource.findById(resourceId);
      
      // Update fields
      if (name !== undefined) resource.name = name;
      if (description !== undefined) resource.description = description;
      if (specs) {
        // Update individual spec fields to maintain existing ones
        if (specs.cpuCores !== undefined) resource.specs.cpuCores = specs.cpuCores;
        if (specs.memoryGb !== undefined) resource.specs.memoryGb = specs.memoryGb;
        if (specs.storageGb !== undefined) resource.specs.storageGb = specs.storageGb;
        if (specs.gpuModel !== undefined) resource.specs.gpuModel = specs.gpuModel;
        if (specs.gpuCount !== undefined) resource.specs.gpuCount = specs.gpuCount;
        if (specs.gpuMemoryGb !== undefined) resource.specs.gpuMemoryGb = specs.gpuMemoryGb;
        if (specs.hasSpecializedHardware !== undefined) resource.specs.hasSpecializedHardware = specs.hasSpecializedHardware;
        if (specs.specializedHardwareDesc !== undefined) resource.specs.specializedHardwareDesc = specs.specializedHardwareDesc;
        if (specs.performanceScore !== undefined) resource.specs.performanceScore = specs.performanceScore;
      }
      
      if (pricePerUnit !== undefined) resource.pricePerUnit = pricePerUnit;
      if (pricingModel !== undefined) resource.pricingModel = pricingModel;
      
      if (availability) {
        // Update availability fields
        if (availability.schedule !== undefined) resource.availability.schedule = availability.schedule;
        if (availability.timezone !== undefined) resource.availability.timezone = availability.timezone;
        if (availability.availabilityStart !== undefined) resource.availability.availabilityStart = availability.availabilityStart;
        if (availability.availabilityEnd !== undefined) resource.availability.availabilityEnd = availability.availabilityEnd;
        if (availability.isAlwaysAvailable !== undefined) resource.availability.isAlwaysAvailable = availability.isAlwaysAvailable;
      }
      
      if (location !== undefined) resource.location = location;
      if (active !== undefined) resource.active = active;
      if (tags !== undefined) resource.tags = tags;
      
      // Save changes
      await resource.save();
      
      res.json({
        success: true,
        message: 'Resource updated successfully',
        data: {
          resource
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/resources/:resourceId
 * @desc Deactivate a resource
 * @access Private
 */
router.delete('/:resourceId', 
  authMiddleware.authenticate, 
  authMiddleware.verifyOwnership('resource', 'resourceId'),
  async (req, res, next) => {
    try {
      const { resourceId } = req.params;
      
      const resource = await Resource.findById(resourceId);
      
      if (!resource) {
        throw new NotFoundError('Resource not found');
      }
      
      // Deactivate resource instead of deleting it
      resource.active = false;
      await resource.save();
      
      res.json({
        success: true,
        message: 'Resource deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/resources/:resourceId/availability
 * @desc Check resource availability at a specific time
 * @access Public
 */
router.get('/:resourceId/availability', async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const { date } = req.query;
    
    const resource = await Resource.findById(resourceId);
    
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }
    
    // Check if resource is active
    if (!resource.active) {
      return res.json({
        success: true,
        data: {
          available: false,
          reason: 'Resource is inactive'
        }
      });
    }
    
    // Check specific date if provided, otherwise check current availability
    const checkDate = date ? new Date(date) : new Date();
    const available = resource.isAvailableAt(checkDate);
    
    res.json({
      success: true,
      data: {
        available,
        checkedDate: checkDate,
        resource: {
          id: resource._id,
          name: resource.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/resources/:resourceId/status
 * @desc Get blockchain status of a resource
 * @access Private
 */
router.get('/:resourceId/status', 
  authMiddleware.authenticate, 
  authMiddleware.verifyOwnership('resource', 'resourceId'),
  async (req, res, next) => {
    try {
      const { resourceId } = req.params;
      
      const resource = await Resource.findById(resourceId);
      
      if (!resource) {
        throw new NotFoundError('Resource not found');
      }
      
      if (!resource.blockchainResourceId) {
        return res.json({
          success: true,
          data: {
            registered: false,
            message: 'Resource not registered on blockchain'
          }
        });
      }
      
      // Get blockchain status
      const blockchainStatus = await solanaClient.getResourceStatus(resource.blockchainResourceId);
      
      res.json({
        success: true,
        data: {
          registered: true,
          blockchainResourceId: resource.blockchainResourceId,
          status: blockchainStatus
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/resources/:resourceId/review
 * @desc Add a review for a resource
 * @access Private
 */
router.post('/:resourceId/review', 
  authMiddleware.authenticate,
  async (req, res, next) => {
    try {
      const { resourceId } = req.params;
      const { rating, comment, jobId } = req.body;
      
      // Validate input
      if (!rating || rating < 1 || rating > 5) {
        throw new BadRequestError('Rating must be between 1 and 5', 'INVALID_RATING');
      }
      
      const resource = await Resource.findById(resourceId);
      
      if (!resource) {
        throw new NotFoundError('Resource not found');
      }
      
      // Check if job exists and is completed
      if (jobId) {
        const Job = require('../../models/job.model');
        const job = await Job.findById(jobId);
        
        if (!job) {
          throw new NotFoundError('Job not found');
        }
        
        if (job.user.toString() !== req.user._id.toString()) {
          throw new BadRequestError('You can only review resources for your own jobs', 'UNAUTHORIZED_REVIEW');
        }
        
        if (job.status !== 'completed') {
          throw new BadRequestError('You can only review resources for completed jobs', 'JOB_NOT_COMPLETED');
        }
        
        if (!job.assignedResources.includes(resource._id)) {
          throw new BadRequestError('This resource was not assigned to the specified job', 'RESOURCE_NOT_ASSIGNED');
        }
      }
      
      // Create review
      const Review = require('../../models/review.model');
      const review = await Review.create({
        resource: resourceId,
        user: req.user._id,
        rating,
        comment,
        job: jobId
      });
      
      // Update resource rating
      const allReviews = await Review.find({ resource: resourceId });
      const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / allReviews.length;
      
      resource.rating.average = averageRating;
      resource.rating.count = allReviews.length;
      await resource.save();
      
      res.status(201).json({
        success: true,
        message: 'Review added successfully',
        data: {
          review
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router; 