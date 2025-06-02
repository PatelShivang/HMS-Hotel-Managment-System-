import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const statusColors = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'error',
  completed: 'default',
};

const BookingManagement = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: {
      start: '',
      end: '',
    },
    searchQuery: '',
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to access bookings');
        navigate('/login');
        return;
      }

      console.log('Fetching bookings...'); // Debug log
      
      const { data } = await api.get('/bookings');
      console.log('Bookings data:', data); // Debug log
      
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      const errorMessage = error.response?.data?.msg || 'Failed to fetch bookings';
      setError(errorMessage);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again');
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to access bookings');
        navigate('/');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value,
      },
    }));
  };

  const handleStatusChange = async (booking, newStatus) => {
    try {
      setProcessingAction(true);
      console.log(`Updating booking ${booking._id} status to ${newStatus}`); // Debug log
      
      const response = await api.put(`/bookings/${booking._id}`, { status: newStatus });
      console.log('Status update response:', response.data); // Debug log
      
      setBookings(
        bookings.map((b) =>
          b._id === booking._id ? { ...b, status: newStatus } : b
        )
      );
      toast.success('Booking status updated successfully');
      setOpenDialog(false);
    } catch (error) {
      console.error('Failed to update booking status:', error);
      const errorMessage = error.response?.data?.msg || 'Failed to update booking status';
      toast.error(errorMessage);
    } finally {
      setProcessingAction(false);
    }
  };

  const handlePaymentUpdate = async (booking) => {
    try {
      setProcessingAction(true);
      console.log(`Recording payment for booking ${booking._id}`); // Debug log
      
      // Since there's no specific payment endpoint in the bookings route,
      // we'll update the booking status to indicate payment is complete
      const paymentData = {
        status: booking.status,
        paymentStatus: 'paid',
        paymentDetails: {
          method: booking.paymentDetails?.method || 'cash',
          paidAmount: booking.totalPrice,
          paidAt: new Date().toISOString()
        }
      };
      
      console.log('Payment data:', paymentData); // Debug log
      
      const response = await api.put(`/bookings/${booking._id}`, paymentData);
      console.log('Payment update response:', response.data); // Debug log
      
      await fetchBookings(); // Refresh bookings after payment update
      toast.success('Payment recorded successfully');
      setOpenDialog(false);
    } catch (error) {
      console.error('Failed to record payment:', error);
      const errorMessage = error.response?.data?.msg || 'Failed to record payment';
      toast.error(errorMessage);
    } finally {
      setProcessingAction(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filters.status !== 'all' && booking.status !== filters.status)
      return false;

    if (filters.dateRange.start && new Date(booking.checkIn) < new Date(filters.dateRange.start))
      return false;

    if (filters.dateRange.end && new Date(booking.checkOut) > new Date(filters.dateRange.end))
      return false;

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return (
        booking.user?.name?.toLowerCase().includes(query) ||
        booking.user?.email?.toLowerCase().includes(query) ||
        booking.room?.roomNumber?.toString().includes(query)
      );
    }

    return true;
  });

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
        Booking Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              select
              label="Status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="date"
              label="From Date"
              value={filters.dateRange.start}
              onChange={(e) => handleDateChange('start', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="date"
              label="To Date"
              value={filters.dateRange.end}
              onChange={(e) => handleDateChange('end', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Search"
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              placeholder="Search by guest, email, or room"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Bookings Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Booking ID</TableCell>
              <TableCell>Guest</TableCell>
              <TableCell>Room</TableCell>
              <TableCell>Check In</TableCell>
              <TableCell>Check Out</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No bookings found
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => (
                <TableRow key={booking._id}>
                  <TableCell>{booking._id.substring(0, 8)}...</TableCell>
                  <TableCell>
                    {booking.user?.name || 'N/A'}
                    <br />
                    <Typography variant="caption" color="textSecondary">
                      {booking.user?.email || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {booking.room?.roomNumber || 'N/A'}
                    <br />
                    <Typography variant="caption" color="textSecondary">
                      {booking.room?.type || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {booking.checkIn
                      ? format(new Date(booking.checkIn), 'MMM dd, yyyy')
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {booking.checkOut
                      ? format(new Date(booking.checkOut), 'MMM dd, yyyy')
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={booking.status}
                      color={statusColors[booking.status] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {booking.paymentStatus === 'paid' ? (
                      <Chip label="Paid" color="success" size="small" />
                    ) : (
                      <Chip label="Pending" color="warning" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setOpenDialog(true);
                      }}
                    >
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Booking Management Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        {selectedBooking && (
          <>
            <DialogTitle>Manage Booking</DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Booking Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Guest:</strong> {selectedBooking.user?.name || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedBooking.user?.email || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Phone:</strong> {selectedBooking.user?.phone || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Room:</strong> {selectedBooking.room?.roomNumber || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Room Type:</strong> {selectedBooking.room?.type || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Price:</strong> ${selectedBooking.totalPrice || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Dates</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Check In:</strong>{' '}
                      {selectedBooking.checkIn
                        ? format(new Date(selectedBooking.checkIn), 'MMM dd, yyyy')
                        : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Check Out:</strong>{' '}
                      {selectedBooking.checkOut
                        ? format(new Date(selectedBooking.checkOut), 'MMM dd, yyyy')
                        : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Status</Typography>
                <TextField
                  select
                  fullWidth
                  value={selectedBooking.status}
                  onChange={(e) => {
                    setSelectedBooking({
                      ...selectedBooking,
                      status: e.target.value,
                    });
                  }}
                  margin="normal"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </TextField>
              </Box>

              <Box>
                <Typography variant="subtitle1">Payment</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Status:</strong>{' '}
                      {selectedBooking.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Method:</strong>{' '}
                      {selectedBooking.paymentDetails?.method || 'Not specified'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)} color="inherit">
                Cancel
              </Button>
              {selectedBooking.paymentStatus !== 'paid' && (
                <Button
                  onClick={() => handlePaymentUpdate(selectedBooking)}
                  color="primary"
                  disabled={processingAction}
                >
                  {processingAction ? <CircularProgress size={24} /> : 'Record Payment'}
                </Button>
              )}
              <Button
                onClick={() => handleStatusChange(selectedBooking, selectedBooking.status)}
                color="primary"
                disabled={processingAction}
              >
                {processingAction ? <CircularProgress size={24} /> : 'Update Status'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default BookingManagement; 