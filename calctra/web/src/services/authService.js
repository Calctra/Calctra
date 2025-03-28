import axios from 'axios';
import { API_URL } from '../utils/constants';

const API_ENDPOINT = `${API_URL}/api/auth`;

const authService = {
  login: async (email, password) => {
    const response = await axios.post(`${API_ENDPOINT}/login`, { email, password });
    return response.data;
  },

  register: async (name, email, password) => {
    const response = await axios.post(`${API_ENDPOINT}/register`, { name, email, password });
    return response.data;
  },

  logout: async () => {
    // No backend call needed for now
    return true;
  },

  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  },

  // Add token to all requests
  setupAuthInterceptor: () => {
    axios.interceptors.request.use(
      (config) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }
};

export default authService; 