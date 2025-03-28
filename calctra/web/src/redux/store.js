import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import resourceReducer from './slices/resourceSlice';
import dataReducer from './slices/dataSlice';
import jobReducer from './slices/jobSlice';
import notificationReducer from './slices/notificationSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    resources: resourceReducer,
    data: dataReducer,
    jobs: jobReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store; 