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
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Hotel,
  Person,
  EventAvailable,
  Warning,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';

const StatCard = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4">{value}</Typography>
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

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    maintenanceRooms: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    pendingBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please login to access the dashboard');
          navigate('/login');
          return;
        }

        // Fetch dashboard data
        const { data } = await api.get('/staff/dashboard');
        console.log('Dashboard data:', data);
        setStats(data.stats || {});
        setRecentBookings(data.recentBookings || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        if (error.response?.status === 403) {
          toast.error('You do not have permission to access this dashboard');
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
      <Typography variant="h4" gutterBottom>
        Staff Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Rooms"
            value={stats.totalRooms}
            icon={<Hotel sx={{ color: 'primary.main' }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Occupied Rooms"
            value={stats.occupiedRooms}
            icon={<Person sx={{ color: 'success.main' }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Available Rooms"
            value={stats.availableRooms}
            icon={<EventAvailable sx={{ color: 'info.main' }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Maintenance"
            value={stats.maintenanceRooms}
            icon={<Warning sx={{ color: 'warning.main' }} />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Today's Activity */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Today's Check-ins
            </Typography>
            <Typography variant="h3" color="primary">
              {stats.todayCheckIns}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Today's Check-outs
            </Typography>
            <Typography variant="h3" color="secondary">
              {stats.todayCheckOuts}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Pending Bookings
            </Typography>
            <Typography variant="h3" color="warning.main">
              {stats.pendingBookings}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Bookings */}
      <Paper sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Recent Bookings</Typography>
          <Button variant="outlined" onClick={() => navigate('/staff/bookings')}>
            View All Bookings
          </Button>
        </Box>
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
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
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
                    <TableCell>
                      <Chip
                        size="small"
                        label={booking.status || 'N/A'}
                        color={
                          booking.status === 'confirmed'
                            ? 'success'
                            : booking.status === 'pending'
                            ? 'warning'
                            : 'error'
                        }
                        icon={
                          booking.status === 'confirmed' ? (
                            <CheckCircle />
                          ) : booking.status === 'pending' ? (
                            <Warning />
                          ) : (
                            <Cancel />
                          )
                        }
                      />
                    </TableCell>
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
      </Paper>
    </Container>
  );
};

export default StaffDashboard; 