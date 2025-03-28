const express = require('express');
const router = express.Router();
const userRoutes = require('./routes/user.routes');
const resourceRoutes = require('./routes/resource.routes');
const jobRoutes = require('./routes/job.routes');
const dataRoutes = require('./routes/data.routes');
const tokenRoutes = require('./routes/token.routes');
const notificationRoutes = require('./routes/notification.routes');
const errorHandler = require('../utils/errors').errorHandler;
const logger = require('../utils/logger');

// API Health Check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Calctra API is running',
    timestamp: new Date(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Mount routes
router.use('/users', userRoutes);
router.use('/resources', resourceRoutes);
router.use('/jobs', jobRoutes);
router.use('/data', dataRoutes);
router.use('/tokens', tokenRoutes);
router.use('/notifications', notificationRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested API route does not exist',
      details: {
        path: req.originalUrl,
        method: req.method
      }
    }
  });
});

// Error handler
router.use(errorHandler);

module.exports = router; 