// API URL - change this to your production URL when deploying
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Resource types
export const RESOURCE_TYPES = {
  CPU: 'CPU',
  GPU: 'GPU',
  STORAGE: 'STORAGE',
  MEMORY: 'MEMORY',
  HYBRID: 'HYBRID',
};

// Job statuses
export const JOB_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

// Privacy levels
export const PRIVACY_LEVELS = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
  SHARED: 'SHARED',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  RESOURCES: '/resources',
  RESOURCE_DETAIL: '/resources/:id',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  JOBS: '/jobs',
  JOB_DETAIL: '/jobs/:id',
  DATA: '/data',
  DATA_DETAIL: '/data/:id',
}; 