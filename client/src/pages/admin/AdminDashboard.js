import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  LinearProgress,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Hotel,
  Person,
  AttachMoney,
  TrendingUp,
  Group,
  EventAvailable,
  Warning,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../services/api';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    occupancyRate: 0,
    totalRooms: 0,
    availableRooms: 0,
    totalUsers: 0,
    totalBookings: 0,
  });
  const [recentActivities, setRecentActivities] = useState({
    bookings: [],
    users: []
  });
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Check token and user role
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }

        // Get current user data first
        const userResponse = await api.get('/auth/user');
        
        if (userResponse.data.role !== 'admin') {
          toast.error('You do not have permission to access the admin dashboard');
          navigate('/');
          return;
        }

        // If we get here, user is an admin
        const { data } = await api.get('/admin/dashboard');
        console.log('Dashboard data:', data);
        setStats(data.stats || {});
        setRecentActivities(data.recentActivities || { bookings: [], users: [] });
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
        
        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again');
          navigate('/login');
        } else if (error.response?.status === 403) {
          toast.error('You do not have permission to access the admin dashboard');
          navigate('/');
        } else {
          toast.error('Failed to load dashboard data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ mb: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography color="text.secondary">
          Overview of your hotel's performance and management
        </Typography>
      </Box>

      {/* Revenue Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={<AttachMoney sx={{ color: 'success.main' }} />}
            color="success"
            subtitle="Lifetime earnings"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <StatCard
            title="Monthly Revenue"
            value={`$${stats.monthlyRevenue.toLocaleString()}`}
            icon={<TrendingUp sx={{ color: 'primary.main' }} />}
            color="primary"
            subtitle="Current month"
          />
        </Grid>
      </Grid>

      {/* Hotel Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Rooms"
            value={stats.totalRooms}
            icon={<Hotel sx={{ color: 'info.main' }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Available Rooms"
            value={stats.availableRooms}
            icon={<EventAvailable sx={{ color: 'success.main' }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<Group sx={{ color: 'secondary.main' }} />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={<Person sx={{ color: 'warning.main' }} />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Occupancy Rate */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Current Occupancy Rate
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <Box sx={{ flexGrow: 1, mr: 2 }}>
            <LinearProgress
              variant="determinate"
              value={stats.occupancyRate}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {stats.occupancyRate}%
          </Typography>
        </Box>
      </Paper>

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Hotel />}
            onClick={() => navigate('/admin/rooms')}
          >
            Manage Rooms
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Group />}
            onClick={() => navigate('/admin/users')}
          >
            Manage Users
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Person />}
            onClick={() => navigate('/admin/bookings')}
          >
            Manage Bookings
          </Button>
        </Grid>
      </Grid>

      {/* Recent Activities */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activities
        </Typography>
        
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Recent Bookings" />
          <Tab label="New Users" />
        </Tabs>
        
        {activeTab === 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Guest</TableCell>
                  <TableCell>Room</TableCell>
                  <TableCell>Check-in</TableCell>
                  <TableCell>Check-out</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentActivities.bookings && recentActivities.bookings.length > 0 ? (
                  recentActivities.bookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>
                        <Typography variant="body2">{booking.user?.name || 'N/A'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {booking.user?.email || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {booking.room?.type || 'N/A'} - Room {booking.room?.roomNumber || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {booking.checkIn ? format(new Date(booking.checkIn), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {booking.checkOut ? format(new Date(booking.checkOut), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>{booking.status || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No recent bookings found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Joined</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentActivities.users && recentActivities.users.length > 0 ? (
                  recentActivities.users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No recent users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default AdminDashboard; 