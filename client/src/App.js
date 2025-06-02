import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout Components
import Layout from './components/layout/Layout';
import PrivateRoute from './components/routing/PrivateRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Guest Pages
import Home from './pages/guest/Home';
import RoomList from './pages/guest/RoomList';
import RoomDetails from './pages/guest/RoomDetails';
import MyBookings from './pages/guest/MyBookings';
import ServiceRequests from './pages/guest/ServiceRequests';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import BookingManagement from './pages/staff/BookingManagement';
import ServiceRequestManagement from './pages/staff/ServiceRequestManagement';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import RoomManagement from './pages/admin/RoomManagement';
import UserManagement from './pages/admin/UserManagement';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Guest Routes */}
          <Route path="/rooms" element={<RoomList />} />
          <Route path="/rooms/:id" element={<RoomDetails />} />
          <Route
            path="/my-bookings"
            element={
              <PrivateRoute roles={['guest', 'staff', 'admin']}>
                <MyBookings />
              </PrivateRoute>
            }
          />
          <Route
            path="/service-requests"
            element={
              <PrivateRoute roles={['guest', 'staff', 'admin']}>
                <ServiceRequests />
              </PrivateRoute>
            }
          />

          {/* Staff Routes */}
          <Route
            path="/staff/dashboard"
            element={
              <PrivateRoute roles={['staff', 'admin']}>
                <StaffDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/staff/bookings"
            element={
              <PrivateRoute roles={['staff', 'admin']}>
                <BookingManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/staff/service-requests"
            element={
              <PrivateRoute roles={['staff', 'admin']}>
                <ServiceRequestManagement />
              </PrivateRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute roles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/rooms"
            element={
              <PrivateRoute roles={['admin']}>
                <RoomManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute roles={['admin']}>
                <UserManagement />
              </PrivateRoute>
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <ToastContainer />
    </Router>
  );
}

export default App;
