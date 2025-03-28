import axios from 'axios';
import { API_URL } from '../utils/constants';

// Setup axios instance with base URL
const api = axios.create({
  baseURL: API_URL
});

// Helper function to get auth token from storage
const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  return {};
};

// Get all jobs for the current user
const getUserJobs = async () => {
  const response = await api.get('/jobs', {
    headers: getAuthHeader()
  });
  return response.data;
};

// Get a specific job by ID
const getJobById = async (jobId) => {
  const response = await api.get(`/jobs/${jobId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Create a new job
const createJob = async (jobData) => {
  const response = await api.post('/jobs', jobData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

// Update an existing job
const updateJob = async (jobId, jobData) => {
  const response = await api.put(`/jobs/${jobId}`, jobData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

// Delete a job
const deleteJob = async (jobId) => {
  const response = await api.delete(`/jobs/${jobId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Cancel a running job
const cancelJob = async (jobId) => {
  const response = await api.post(`/jobs/${jobId}/cancel`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Get job results
const getJobResults = async (jobId) => {
  const response = await api.get(`/jobs/${jobId}/results`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Get job logs
const getJobLogs = async (jobId) => {
  const response = await api.get(`/jobs/${jobId}/logs`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Get public jobs (for marketplace or discovery)
const getPublicJobs = async (filters = {}) => {
  const response = await api.get('/public/jobs', {
    params: filters,
    headers: getAuthHeader()
  });
  return response.data;
};

const jobService = {
  getUserJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  cancelJob,
  getJobResults,
  getJobLogs,
  getPublicJobs
};

export default jobService; 