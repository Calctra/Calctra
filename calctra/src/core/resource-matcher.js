/**
 * Resource Matching Engine
 * Implements the core algorithm for matching compute jobs with resources.
 */

const Job = require('../models/job.model');
const Resource = require('../models/resource.model');
const logger = require('../utils/logger');

/**
 * ResourceMatcher class - core engine for matching jobs to computing resources
 */
class ResourceMatcher {
  constructor(options = {}) {
    this.options = {
      prioritizePrice: true,        // Whether to prioritize price over performance
      matchTimeout: 60000,          // Default timeout for matching in ms (1 minute)
      preemptEnabled: true,         // Whether to allow job preemption
      locationWeighting: 0.2,       // Weight of location in scoring (0-1)
      reliabilityWeighting: 0.3,    // Weight of reliability in scoring (0-1)
      priceWeighting: 0.3,          // Weight of price in scoring (0-1)
      performanceWeighting: 0.2,    // Weight of performance in scoring (0-1)
      ...options,
    };
    
    logger.info('ResourceMatcher initialized with options:', this.options);
  }
  
  /**
   * Find the best matching resources for a job
   * @param {Object} job - Job document or job requirements
   * @param {Object} options - Additional matching options
   * @returns {Promise<Array>} Sorted array of matching resources
   */
  async findMatchingResources(job, options = {}) {
    const startTime = Date.now();
    
    // Get requirements from job object or use directly if provided
    const requirements = job.requirements || job;
    
    // Build base query for resource search
    const searchOptions = {
      maxPrice: requirements.maxPrice,
      ...options,
    };
    
    try {
      // Find all resources that meet the basic requirements
      const resources = await Resource.findAvailable(requirements, searchOptions);
      
      if (!resources || resources.length === 0) {
        logger.warn(`No matching resources found for job requirements: ${JSON.stringify(requirements)}`);
        return [];
      }
      
      // Score and sort resources
      const scoredResources = this._scoreResources(resources, requirements, options);
      
      logger.info(`Found ${scoredResources.length} matching resources in ${Date.now() - startTime}ms`);
      return scoredResources;
    } catch (error) {
      logger.error('Error finding matching resources:', error);
      throw error;
    }
  }
  
  /**
   * Match a job to the best available resources
   * @param {Object} job - Job document
   * @param {Object} options - Matching options
   * @returns {Promise<Object>} Match result with selected resources
   */
  async matchJobToResources(job, options = {}) {
    const startTime = Date.now();
    logger.info(`Starting matching process for job ${job._id}`);
    
    try {
      // Find matching resources
      const matchingResources = await this.findMatchingResources(job, options);
      
      if (!matchingResources || matchingResources.length === 0) {
        return {
          success: false,
          message: 'No matching resources found',
          job: job._id,
        };
      }
      
      // Select the best resources based on job requirements
      const selectedResources = await this._selectResources(job, matchingResources, options);
      
      // Calculate total cost estimate
      const estimatedCost = this._calculateEstimatedCost(selectedResources, job);
      
      logger.info(`Matched job ${job._id} to ${selectedResources.length} resources in ${Date.now() - startTime}ms`);
      
      return {
        success: true,
        message: 'Successfully matched job to resources',
        job: job._id,
        selectedResources,
        estimatedCost,
        matchTime: Date.now() - startTime,
      };
    } catch (error) {
      logger.error(`Error matching job ${job._id} to resources:`, error);
      return {
        success: false,
        message: 'Error matching job to resources',
        job: job._id,
        error: error.message,
      };
    }
  }
  
  /**
   * Automatically schedule pending jobs
   * @param {number} batchSize - Number of jobs to process in one batch
   * @returns {Promise<Object>} Scheduling results
   */
  async schedulePendingJobs(batchSize = 10) {
    const startTime = Date.now();
    
    try {
      // Find pending jobs sorted by priority and creation time
      const pendingJobs = await Job.findPendingJobs(batchSize);
      
      if (!pendingJobs || pendingJobs.length === 0) {
        logger.info('No pending jobs to schedule');
        return {
          success: true,
          message: 'No pending jobs to schedule',
          jobsScheduled: 0,
        };
      }
      
      const schedulingResults = {
        success: true,
        totalJobs: pendingJobs.length,
        jobsScheduled: 0,
        failedJobs: 0,
        details: [],
      };
      
      // Process each job
      for (const job of pendingJobs) {
        const matchResult = await this.matchJobToResources(job);
        
        if (matchResult.success && matchResult.selectedResources.length > 0) {
          // Calculate start time (could be now or scheduled for later based on resource availability)
          const startTime = this._calculateStartTime(job, matchResult.selectedResources);
          
          // Schedule the job with selected resources
          await job.scheduleJob(startTime, matchResult.selectedResources.map(r => r._id));
          
          schedulingResults.jobsScheduled++;
          schedulingResults.details.push({
            jobId: job._id,
            status: 'scheduled',
            startTime,
            resourceCount: matchResult.selectedResources.length,
          });
        } else {
          // Update job status to waiting_resources if no matches found
          await job.updateStatus('waiting_resources');
          
          schedulingResults.failedJobs++;
          schedulingResults.details.push({
            jobId: job._id,
            status: 'waiting_resources',
            reason: matchResult.message,
          });
        }
      }
      
      logger.info(`Scheduled ${schedulingResults.jobsScheduled} out of ${schedulingResults.totalJobs} jobs in ${Date.now() - startTime}ms`);
      return schedulingResults;
    } catch (error) {
      logger.error('Error scheduling pending jobs:', error);
      return {
        success: false,
        message: 'Error scheduling pending jobs',
        error: error.message,
      };
    }
  }
  
  /**
   * Optimize resource allocation for multiple jobs
   * @param {Array} jobs - Array of job documents
   * @returns {Promise<Object>} Allocation optimization results
   */
  async optimizeResourceAllocation(jobs) {
    // Implementation of global resource allocation optimization
    // This would use more advanced algorithms to optimize resource usage across all jobs
    // For MVP, we'll implement a simpler version that just prioritizes by job priority
    logger.info(`Optimizing resource allocation for ${jobs.length} jobs`);
    
    try {
      // Sort jobs by priority
      const sortedJobs = [...jobs].sort((a, b) => b.priority - a.priority);
      
      const results = {
        success: true,
        optimizedJobs: 0,
        details: [],
      };
      
      for (const job of sortedJobs) {
        const match = await this.matchJobToResources(job);
        if (match.success) {
          results.optimizedJobs++;
          results.details.push({
            jobId: job._id,
            status: 'optimized',
            resourceCount: match.selectedResources.length,
          });
        }
      }
      
      return results;
    } catch (error) {
      logger.error('Error optimizing resource allocation:', error);
      return {
        success: false,
        message: 'Error optimizing resource allocation',
        error: error.message,
      };
    }
  }
  
  /**
   * Calculate job execution start time based on resource availability
   * @param {Object} job - Job document
   * @param {Array} resources - Selected resources
   * @returns {Date} Calculated start time
   * @private
   */
  _calculateStartTime(job, resources) {
    // For simplicity, we'll start immediately if at least one resource is available now
    // In a more advanced implementation, this would consider resource schedules and job deadlines
    const now = new Date();
    
    // If job has a specific start time requirement, respect it
    if (job.schedule && job.schedule.startTime && job.schedule.startTime > now) {
      return job.schedule.startTime;
    }
    
    // Check if any resources are available now
    const anyAvailableNow = resources.some(resource => resource.isAvailableAt(now));
    
    if (anyAvailableNow) {
      return now;
    }
    
    // Find the earliest time when any resource becomes available
    const availabilityTimes = resources
      .map(resource => {
        // For demo purposes, just add a random offset (0-6 hours)
        const availableIn = Math.floor(Math.random() * 6 * 60 * 60 * 1000);
        return new Date(now.getTime() + availableIn);
      })
      .sort((a, b) => a.getTime() - b.getTime());
    
    return availabilityTimes[0] || now;
  }
  
  /**
   * Select appropriate resources for a job
   * @param {Object} job - Job document
   * @param {Array} matchingResources - Pre-filtered matching resources
   * @param {Object} options - Selection options
   * @returns {Promise<Array>} Selected resources
   * @private
   */
  async _selectResources(job, matchingResources, options = {}) {
    // For simple jobs, select the top scoring resource
    if (job.type === 'batch' || job.type === 'interactive') {
      // Take the top resource (they're already sorted by score)
      return [matchingResources[0]];
    }
    
    // For distributed jobs, select multiple resources based on requirements
    else if (job.type === 'distributed') {
      // Determine how many resources we need based on job size
      const cpuCores = job.requirements.cpuCores;
      const resourceCount = Math.min(
        // Cap at 10 resources for demo purposes
        10,
        // Calculate based on required CPU cores (at least 2 for distributed jobs)
        Math.max(2, Math.ceil(cpuCores / matchingResources[0].specs.cpuCores))
      );
      
      // Take the top N resources
      return matchingResources.slice(0, resourceCount);
    }
    
    // For streaming jobs, select resources optimized for network performance
    else if (job.type === 'streaming') {
      // Find resources with good network capabilities
      const streamingResources = matchingResources
        .filter((resource) => {
          // In a real implementation, we would check for specific network capabilities
          return resource.metrics.reliability > 95;
        })
        .slice(0, 3); // Take up to 3 resources for redundancy
      
      return streamingResources.length > 0 ? streamingResources : [matchingResources[0]];
    }
    
    // Default fallback
    return [matchingResources[0]];
  }
  
  /**
   * Score resources based on job requirements and weighting factors
   * @param {Array} resources - Resources to score
   * @param {Object} requirements - Job requirements
   * @param {Object} options - Scoring options
   * @returns {Array} Scored and sorted resources
   * @private
   */
  _scoreResources(resources, requirements, options = {}) {
    const { 
      locationWeighting, 
      reliabilityWeighting, 
      priceWeighting, 
      performanceWeighting 
    } = this.options;
    
    // Apply any option overrides
    const finalOptions = { ...this.options, ...options };
    
    // Map resources with scores
    const scoredResources = resources.map(resource => {
      // Calculate various component scores (0-1)
      
      // Price score (lower is better)
      let priceScore = 1;
      if (requirements.maxPrice && requirements.maxPrice > 0) {
        priceScore = Math.max(0, 1 - (resource.pricePerUnit / requirements.maxPrice));
      } else {
        // If no max price specified, use relative scoring
        // Assume average price is 10 (arbitrary baseline for demo)
        const basePrice = 10;
        priceScore = Math.max(0, 1 - (resource.pricePerUnit / basePrice));
      }
      
      // Performance score (higher is better)
      const performanceScore = resource.specs.performanceScore 
        ? resource.specs.performanceScore / 100 
        : 0.5; // Default if not specified
      
      // Reliability score (higher is better)
      const reliabilityScore = resource.metrics.reliability / 100;
      
      // Location score (closer is better)
      let locationScore = 0.5; // Default medium score
      if (options.userLocation && resource.location?.coordinates) {
        // Calculate distance
        const distance = this._calculateDistance(
          options.userLocation.coordinates, 
          resource.location.coordinates
        );
        
        // Convert to score (0-1), higher for closer resources
        // Assume 5000km is max relevant distance
        locationScore = Math.max(0, 1 - (distance / 5000));
      }
      
      // Combined weighted score
      const totalScore = 
        (priceScore * priceWeighting) +
        (performanceScore * performanceWeighting) +
        (reliabilityScore * reliabilityWeighting) +
        (locationScore * locationWeighting);
      
      return {
        ...resource.toObject(),
        _score: {
          total: totalScore,
          price: priceScore,
          performance: performanceScore,
          reliability: reliabilityScore,
          location: locationScore,
        },
      };
    });
    
    // Sort resources by score (highest first)
    return scoredResources.sort((a, b) => b._score.total - a._score.total);
  }
  
  /**
   * Calculate estimated cost for job execution
   * @param {Array} resources - Selected resources
   * @param {Object} job - Job document
   * @returns {Object} Cost estimate details
   * @private
   */
  _calculateEstimatedCost(resources, job) {
    const estimatedDurationHours = job.requirements.estimatedDuration || 1;
    
    // Calculate cost based on each resource's pricing
    const resourceCosts = resources.map(resource => {
      let cost = resource.pricePerUnit;
      
      // Adjust based on pricing model
      switch (resource.pricingModel) {
        case 'hourly':
          cost *= estimatedDurationHours;
          break;
        case 'daily':
          cost *= Math.ceil(estimatedDurationHours / 24);
          break;
        case 'weekly':
          cost *= Math.ceil(estimatedDurationHours / (24 * 7));
          break;
        case 'monthly':
          cost *= Math.ceil(estimatedDurationHours / (24 * 30));
          break;
        case 'per-job':
          // Price is fixed
          break;
      }
      
      return {
        resourceId: resource._id,
        resourceName: resource.name,
        price: resource.pricePerUnit,
        pricingModel: resource.pricingModel,
        cost,
      };
    });
    
    // Sum up total cost
    const totalCost = resourceCosts.reduce((sum, item) => sum + item.cost, 0);
    
    return {
      totalCost,
      currency: 'CAL',
      estimatedDurationHours,
      resourceCosts,
    };
  }
  
  /**
   * Calculate rough distance between two coordinate points
   * @param {Array} point1 - First point [longitude, latitude]
   * @param {Array} point2 - Second point [longitude, latitude]
   * @returns {number} Approximate distance in kilometers
   * @private
   */
  _calculateDistance(point1, point2) {
    // Simple haversine formula
    const toRad = value => (value * Math.PI) / 180;
    
    const [lon1, lat1] = point1;
    const [lon2, lat2] = point2;
    
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

module.exports = ResourceMatcher; 