const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const path = require('path');
const dotenv = require('dotenv');
const apiRoutes = require('./api/routes');
const logger = require('./utils/logger');
const solanaClient = require('./blockchain/solana');
const ResourceMatcher = require('./core/resource-matcher');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/calctra';

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(compression()); // Compress responses

// Logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev', { stream: logger.stream }));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Static files (for web app frontend)
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api', apiRoutes);

// Serve frontend for SPA routes (for production)
if (NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public', 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });
  
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message
    }
  });
});

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  logger.info(`Connected to MongoDB at ${MONGODB_URI}`);
  
  // Initialize blockchain client
  return solanaClient.initialize();
})
.then(() => {
  logger.info('Solana client initialized');
  
  // Initialize resource matcher
  const resourceMatcher = new ResourceMatcher();
  return resourceMatcher.initialize();
})
.then(() => {
  // Start server
  app.listen(PORT, () => {
    logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
  });
  
  // Start processing pending jobs (in the background)
  const startJobScheduler = async () => {
    const resourceMatcher = new ResourceMatcher();
    try {
      await resourceMatcher.schedulePendingJobs();
      logger.info('Job scheduler completed successfully');
    } catch (error) {
      logger.error('Error in job scheduler:', error);
    } finally {
      // Schedule the next run
      setTimeout(startJobScheduler, 60000); // Run every minute
    }
  };
  
  // Start the job scheduler after a short delay
  setTimeout(startJobScheduler, 5000);
})
.catch(err => {
  logger.error('Failed to start server:', err);
  process.exit(1);
}); 