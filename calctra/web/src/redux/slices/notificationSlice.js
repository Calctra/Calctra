import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationService from '../../services/notificationService';

// Get notifications
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (params, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      notificationService.setAuthHeader(auth.token);
      const response = await notificationService.getNotifications(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch notifications');
    }
  }
);

// Get unread count
export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      notificationService.setAuthHeader(auth.token);
      const response = await notificationService.getUnreadCount();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch unread count');
    }
  }
);

// Mark notification as read
export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      notificationService.setAuthHeader(auth.token);
      const response = await notificationService.markAsRead(id);
      return { id, response: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to mark notification as read');
    }
  }
);

// Mark notification as unread
export const markNotificationAsUnread = createAsyncThunk(
  'notifications/markAsUnread',
  async (id, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      notificationService.setAuthHeader(auth.token);
      const response = await notificationService.markAsUnread(id);
      return { id, response: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to mark notification as unread');
    }
  }
);

// Remove notification
export const removeNotification = createAsyncThunk(
  'notifications/remove',
  async (id, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      notificationService.setAuthHeader(auth.token);
      const response = await notificationService.removeNotification(id);
      return { id, response: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to remove notification');
    }
  }
);

// Mark all notifications as read
export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      notificationService.setAuthHeader(auth.token);
      const response = await notificationService.markAllAsRead();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to mark all notifications as read');
    }
  }
);

// Remove all notifications
export const removeAllNotifications = createAsyncThunk(
  'notifications/removeAll',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      notificationService.setAuthHeader(auth.token);
      const response = await notificationService.removeAllNotifications();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to remove all notifications');
    }
  }
);

// Define initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  },
  loading: false,
  error: null,
  success: false
};

// Create slice
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    resetNotificationState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.pagination = {
        total: 0,
        page: 1,
        limit: 10,
        pages: 1
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
        state.pagination = action.payload.pagination;
        state.success = true;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch unread count
      .addCase(fetchUnreadCount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.loading = false;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Mark as read
      .addCase(markNotificationAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update notification in list
        const index = state.notifications.findIndex(
          (notification) => notification._id === action.payload.id
        );
        
        if (index !== -1) {
          state.notifications[index].isRead = true;
        }
        
        // Update unread count
        if (state.unreadCount > 0) {
          state.unreadCount -= 1;
        }
        
        state.success = true;
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Mark as unread
      .addCase(markNotificationAsUnread.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markNotificationAsUnread.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update notification in list
        const index = state.notifications.findIndex(
          (notification) => notification._id === action.payload.id
        );
        
        if (index !== -1) {
          state.notifications[index].isRead = false;
        }
        
        // Update unread count
        state.unreadCount += 1;
        
        state.success = true;
      })
      .addCase(markNotificationAsUnread.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Remove notification
      .addCase(removeNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeNotification.fulfilled, (state, action) => {
        state.loading = false;
        
        // Find notification that was removed
        const notification = state.notifications.find(
          (notification) => notification._id === action.payload.id
        );
        
        // Update unread count if removing an unread notification
        if (notification && !notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        
        // Remove from list
        state.notifications = state.notifications.filter(
          (notification) => notification._id !== action.payload.id
        );
        
        // Update total count in pagination
        if (state.pagination.total > 0) {
          state.pagination.total -= 1;
          state.pagination.pages = Math.ceil(state.pagination.total / state.pagination.limit);
        }
        
        state.success = true;
      })
      .addCase(removeNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Mark all as read
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.loading = false;
        
        // Update all notifications in list
        state.notifications = state.notifications.map(notification => ({
          ...notification,
          isRead: true
        }));
        
        // Reset unread count
        state.unreadCount = 0;
        
        state.success = true;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Remove all notifications
      .addCase(removeAllNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeAllNotifications.fulfilled, (state) => {
        state.loading = false;
        state.notifications = [];
        state.unreadCount = 0;
        state.pagination = {
          total: 0,
          page: 1,
          limit: 10,
          pages: 1
        };
        state.success = true;
      })
      .addCase(removeAllNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { resetNotificationState, clearNotifications } = notificationSlice.actions;

export default notificationSlice.reducer; 