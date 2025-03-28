import axios from 'axios';
import { API_URL } from '../utils/constants';

const API_ENDPOINT = `${API_URL}/api/resources`;

const resourceService = {
  getResources: async (filters = {}) => {
    const response = await axios.get(API_ENDPOINT, { params: filters });
    return response.data;
  },

  getResourceById: async (id) => {
    const response = await axios.get(`${API_ENDPOINT}/${id}`);
    return response.data;
  },

  getMyResources: async () => {
    const response = await axios.get(`${API_ENDPOINT}/mine`);
    return response.data;
  },

  addResource: async (resourceData) => {
    const response = await axios.post(API_ENDPOINT, resourceData);
    return response.data;
  },

  updateResource: async (id, data) => {
    const response = await axios.put(`${API_ENDPOINT}/${id}`, data);
    return response.data;
  },

  deleteResource: async (id) => {
    const response = await axios.delete(`${API_ENDPOINT}/${id}`);
    return response.data;
  }
};

export default resourceService; 