import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const statusColors = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'error',
  completed: 'default',
};

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState(false);

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
        toast.error('Please login to view your bookings');
        navigate('/login');
        return;
      }

      console.log('Fetching bookings...'); // Debug log
      
      // The /api prefix is already included in the baseURL in api.js
      const { data } = await api.get('/bookings');
      console.log('Bookings data:', data); // Debug log
      
      // Ensure we're handling the response correctly
      if (Array.isArray(data)) {
        setBookings(data);
      } else if (data && typeof data === 'object') {
        // If the API returns an object instead of an array, check if it has a bookings property
        if (Array.isArray(data.bookings)) {
          setBookings(data.bookings);
        } else {
          // If no bookings array is found, set an empty array
          setBookings([]);
          console.warn('Unexpected response format:', data);
        }
      } else {
        setBookings([]);
        console.warn('Unexpected response format:', data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.msg || 'Failed to fetch bookings';
        setError(errorMessage);
        
        if (error.response.status === 401) {
          toast.error('Session expired. Please login again');
          navigate('/login');
        } else {
          toast.error(errorMessage);
        }
      } else if (error.request) {
        // The request was made but no response was received
        setError('No response from server. Please check your connection.');
        toast.error('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request
        setError('Failed to fetch bookings. Please try again later.');
        toast.error('Failed to fetch bookings. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (booking) => {
    try {
      setCancellingBooking(true);
      // The /api prefix is already included in the baseURL in api.js
      await api.delete(`/bookings/${booking._id}`);
      toast.success('Booking cancelled successfully');
      
      // Refresh bookings after cancellation
      await fetchBookings();
      
      setOpenDialog(false);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      const errorMessage = error.response?.data?.msg || 'Failed to cancel booking';
      toast.error(errorMessage);
    } finally {
      setCancellingBooking(false);
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setOpenDialog(true);
  };

  // Helper function to safely format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
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
      <Typography variant="h4" gutterBottom>
        My Bookings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {bookings.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>You have no bookings yet.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Booking ID</TableCell>
                <TableCell>Room</TableCell>
                <TableCell>Check In</TableCell>
                <TableCell>Check Out</TableCell>
                <TableCell>Total Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking._id}>
                  <TableCell>{booking._id.substring(0, 8)}...</TableCell>
                  <TableCell>
                    {booking.room?.type || 'N/A'} - Room {booking.room?.roomNumber || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {formatDate(booking.checkIn)}
                  </TableCell>
                  <TableCell>
                    {formatDate(booking.checkOut)}
                  </TableCell>
                  <TableCell>${booking.totalPrice || 0}</TableCell>
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
                      onClick={() => handleViewDetails(booking)}
                    >
                      View Details
                    </Button>
                    {booking.status === 'pending' && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setOpenDialog(true);
                        }}
                        sx={{ ml: 1 }}
                      >
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Booking Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        {selectedBooking && (
          <>
            <DialogTitle>
              {selectedBooking.status === 'pending'
                ? 'Cancel Booking'
                : 'Booking Details'}
            </DialogTitle>
            <DialogContent>
              {selectedBooking.status === 'pending' ? (
                <Box sx={{ py: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    Are you sure you want to cancel this booking?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This action cannot be undone.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ py: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Room Information
                  </Typography>
                  <Typography variant="body1">
                    {selectedBooking.room?.type || 'N/A'} - Room {selectedBooking.room?.roomNumber || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    ${selectedBooking.totalPrice || 0} total
                  </Typography>

                  <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>
                    Booking Dates
                  </Typography>
                  <Typography variant="body1">
                    Check In: {formatDate(selectedBooking.checkIn)}
                  </Typography>
                  <Typography variant="body1">
                    Check Out: {formatDate(selectedBooking.checkOut)}
                  </Typography>

                  <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    label={selectedBooking.status}
                    color={statusColors[selectedBooking.status] || 'default'}
                  />

                  <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>
                    Payment
                  </Typography>
                  <Chip
                    label={selectedBooking.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    color={selectedBooking.paymentStatus === 'paid' ? 'success' : 'warning'}
                  />
                  {selectedBooking.paymentStatus === 'paid' && selectedBooking.paymentDetails && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        Method: {selectedBooking.paymentDetails.method || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        Date: {selectedBooking.paymentDetails.paidAt
                          ? formatDate(selectedBooking.paymentDetails.paidAt)
                          : 'N/A'}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              {selectedBooking.status === 'pending' ? (
                <>
                  <Button onClick={() => setOpenDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleCancelBooking(selectedBooking)}
                    color="error"
                    disabled={cancellingBooking}
                  >
                    {cancellingBooking ? 'Processing...' : 'Confirm Cancellation'}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setOpenDialog(false)}>
                  Close
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default MyBookings; 