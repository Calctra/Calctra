import axios from 'axios';
import { API_URL } from '../utils/constants';

// Set up axios with auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'multipart/form-data',
    },
  };
};

const getJsonAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
};

// Get my datasets
const getMyDatasets = async () => {
  const response = await axios.get(`${API_URL}/api/data/mine`, getJsonAuthHeader());
  return response.data;
};

// Get public datasets
const getPublicDatasets = async () => {
  const response = await axios.get(`${API_URL}/api/data/public`, getJsonAuthHeader());
  return response.data;
};

// Get dataset by ID
const getDatasetById = async (datasetId) => {
  const response = await axios.get(`${API_URL}/api/data/${datasetId}`, getJsonAuthHeader());
  return response.data;
};

// Upload dataset with metadata and file
const uploadDataset = async (datasetData) => {
  const formData = new FormData();
  formData.append('file', datasetData.file);
  formData.append('name', datasetData.name);
  formData.append('description', datasetData.description);
  formData.append('isPublic', datasetData.isPublic);
  
  if (datasetData.tags && datasetData.tags.length > 0) {
    formData.append('tags', JSON.stringify(datasetData.tags));
  }
  
  if (datasetData.encryptionKey) {
    formData.append('encryptionKey', datasetData.encryptionKey);
  }
  
  const response = await axios.post(`${API_URL}/api/data/upload`, formData, getAuthHeader());
  return response.data;
};

// Update dataset permissions
const updateDatasetPermissions = async (datasetId, permissions) => {
  const response = await axios.put(
    `${API_URL}/api/data/${datasetId}/permissions`, 
    permissions,
    getJsonAuthHeader()
  );
  return response.data;
};

// Delete dataset
const deleteDataset = async (datasetId) => {
  const response = await axios.delete(`${API_URL}/api/data/${datasetId}`, getJsonAuthHeader());
  return response.data;
};

// Request compute access to a dataset
const requestDatasetAccess = async (datasetId, jobDetails) => {
  const response = await axios.post(
    `${API_URL}/api/data/${datasetId}/request-access`,
    jobDetails,
    getJsonAuthHeader()
  );
  return response.data;
};

// Grant access to dataset for a specific user/job
const grantDatasetAccess = async (datasetId, accessDetails) => {
  const response = await axios.post(
    `${API_URL}/api/data/${datasetId}/grant-access`,
    accessDetails,
    getJsonAuthHeader()
  );
  return response.data;
};

// Encrypt dataset with homomorphic encryption
const encryptDataset = async (datasetId, encryptionParams) => {
  const response = await axios.post(
    `${API_URL}/api/data/${datasetId}/encrypt`,
    encryptionParams,
    getJsonAuthHeader()
  );
  return response.data;
};

const dataService = {
  getMyDatasets,
  getPublicDatasets,
  getDatasetById,
  uploadDataset,
  updateDatasetPermissions,
  deleteDataset,
  requestDatasetAccess,
  grantDatasetAccess,
  encryptDataset,
};

export default dataService; 