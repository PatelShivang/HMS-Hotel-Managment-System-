import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import roomReducer from './slices/roomSlice';
import bookingReducer from './slices/bookingSlice';
import userReducer from './slices/userSlice';
import serviceRequestReducer from './slices/serviceRequestSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    rooms: roomReducer,
    bookings: bookingReducer,
    users: userReducer,
    serviceRequests: serviceRequestReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/setUser'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.createdAt', 'payload.lastLogin'],
        // Ignore these paths in the state
        ignoredPaths: ['auth.user.createdAt', 'auth.user.lastLogin'],
      },
    }),
});

export default store; 