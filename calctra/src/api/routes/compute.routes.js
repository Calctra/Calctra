const express = require('express');
const router = express.Router();
const computeController = require('../controllers/compute.controller');
const { authenticate } = require('../middlewares/auth');
const { validateComputeJob } = require('../middlewares/validation');

/**
 * @route POST /api/compute/jobs
 * @desc Create a new compute job
 * @access Private
 */
router.post('/jobs', authenticate, validateComputeJob, computeController.createJob);

/**
 * @route GET /api/compute/jobs
 * @desc Get all compute jobs
 * @access Private
 */
router.get('/jobs', authenticate, computeController.getAllJobs);

/**
 * @route GET /api/compute/jobs/:id
 * @desc Get job by ID
 * @access Private
 */
router.get('/jobs/:id', authenticate, computeController.getJobById);

/**
 * @route PUT /api/compute/jobs/:id
 * @desc Update job status
 * @access Private
 */
router.put('/jobs/:id', authenticate, computeController.updateJobStatus);

/**
 * @route POST /api/compute/match
 * @desc Match compute job with resources
 * @access Private
 */
router.post('/match', authenticate, computeController.matchResources);

/**
 * @route GET /api/compute/jobs/:id/results
 * @desc Get job results
 * @access Private
 */
router.get('/jobs/:id/results', authenticate, computeController.getJobResults);

/**
 * @route GET /api/compute/jobs/:id/logs
 * @desc Get job logs
 * @access Private
 */
router.get('/jobs/:id/logs', authenticate, computeController.getJobLogs);

/**
 * @route POST /api/compute/estimate
 * @desc Estimate compute cost and time
 * @access Private
 */
router.post('/estimate', authenticate, computeController.estimateCompute);

module.exports = router; 