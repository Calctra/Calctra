import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
const setAuthHeader = (token) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

// Get notifications with pagination and filters
const getNotifications = async (params = {}) => {
  const response = await axiosInstance.get('/notifications', { params });
  return response.data;
};

// Get unread notification count
const getUnreadCount = async () => {
  const response = await axiosInstance.get('/notifications/unread-count');
  return response.data;
};

// Get single notification by ID
const getNotificationById = async (id) => {
  const response = await axiosInstance.get(`/notifications/${id}`);
  return response.data;
};

// Mark notification as read
const markAsRead = async (id) => {
  const response = await axiosInstance.put(`/notifications/${id}/read`);
  return response.data;
};

// Mark notification as unread
const markAsUnread = async (id) => {
  const response = await axiosInstance.put(`/notifications/${id}/unread`);
  return response.data;
};

// Remove a notification
const removeNotification = async (id) => {
  const response = await axiosInstance.delete(`/notifications/${id}`);
  return response.data;
};

// Mark all notifications as read
const markAllAsRead = async () => {
  const response = await axiosInstance.put('/notifications/read-all');
  return response.data;
};

// Remove all notifications
const removeAllNotifications = async () => {
  const response = await axiosInstance.delete('/notifications/remove-all');
  return response.data;
};

// Create a new notification (admin/system only)
const createNotification = async (notificationData) => {
  const response = await axiosInstance.post('/notifications', notificationData);
  return response.data;
};

// Handle interceptor for unauthorized responses (token expired)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized error (e.g., redirect to login)
      console.log('Unauthorized request - token may be expired');
      // Call your redux action to logout or refresh token
    }
    return Promise.reject(error);
  }
);

const notificationService = {
  setAuthHeader,
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAsUnread,
  removeNotification,
  markAllAsRead,
  removeAllNotifications,
  createNotification
};

export default notificationService; 