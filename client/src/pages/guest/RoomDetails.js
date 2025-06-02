import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  Typography,
  Box,
  Button,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Wifi,
  Tv,
  AcUnit,
  LocalBar,
  RoomService,
  Pool,
  Spa,
  Coffee,
  Hotel,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { addDays, differenceInDays, format, parse } from 'date-fns';
import api from '../../services/api';

const amenityIcons = {
  'WiFi': <Wifi />,
  'TV': <Tv />,
  'Air Conditioning': <AcUnit />,
  'Mini Bar': <LocalBar />,
  'Room Service': <RoomService />,
  'Swimming Pool': <Pool />,
  'Jacuzzi': <Spa />,
  'Coffee Maker': <Coffee />,
};

const defaultImage = 'https://source.unsplash.com/800x600/?hotel,room';

const RoomDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingData, setBookingData] = useState({
    checkIn: format(new Date(), 'yyyy-MM-dd'),
    checkOut: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    guestCount: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRoomDetails();
  }, [id]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      // The /api prefix is already included in the baseURL in api.js
      const { data } = await api.get(`/rooms/${id}`);
      console.log('Room details:', data); // Debug log
      setRoom(data);
    } catch (error) {
      console.error('Failed to fetch room details:', error);
      const errorMessage = error.response?.data?.msg || 'Failed to fetch room details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingChange = (field, value) => {
    setBookingData({
      ...bookingData,
      [field]: value,
    });
  };

  const calculateTotalPrice = () => {
    if (!room || !bookingData.checkIn || !bookingData.checkOut) return 0;
    
    const checkInDate = parse(bookingData.checkIn, 'yyyy-MM-dd', new Date());
    const checkOutDate = parse(bookingData.checkOut, 'yyyy-MM-dd', new Date());
    
    const nights = differenceInDays(checkOutDate, checkInDate);
    return nights > 0 ? nights * room.price : 0;
  };

  const validateBooking = () => {
    if (!bookingData.checkIn) {
      toast.error('Please select a check-in date');
      return false;
    }
    if (!bookingData.checkOut) {
      toast.error('Please select a check-out date');
      return false;
    }
    
    const checkInDate = parse(bookingData.checkIn, 'yyyy-MM-dd', new Date());
    const checkOutDate = parse(bookingData.checkOut, 'yyyy-MM-dd', new Date());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkInDate < today) {
      toast.error('Check-in date cannot be in the past');
      return false;
    }
    
    if (checkInDate >= checkOutDate) {
      toast.error('Check-out date must be after check-in date');
      return false;
    }
    
    if (bookingData.guestCount < 1) {
      toast.error('Guest count must be at least 1');
      return false;
    }
    if (room && bookingData.guestCount > room.capacity) {
      toast.error(`Maximum capacity for this room is ${room.capacity} guests`);
      return false;
    }
    return true;
  };

  const handleBooking = async () => {
    if (!validateBooking()) return;
    
    try {
      setSubmitting(true);
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to book a room');
        navigate('/login');
        return;
      }
      
      // Format dates as ISO strings for the server
      const checkInDate = parse(bookingData.checkIn, 'yyyy-MM-dd', new Date());
      const checkOutDate = parse(bookingData.checkOut, 'yyyy-MM-dd', new Date());
      
      // Calculate total price
      const nights = differenceInDays(checkOutDate, checkInDate);
      const totalAmount = nights * room.price;
      
      const bookingPayload = {
        room: id,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        guests: {
          adults: parseInt(bookingData.guestCount),
          children: 0
        },
        totalPrice: totalAmount,
        paymentMethod: 'cash', // Default payment method
        specialRequests: bookingData.specialRequests || ''
      };
      
      console.log('Booking payload:', bookingPayload); // Debug log
      
      // Make the API call with the correct endpoint
      const response = await api.post('/bookings', bookingPayload);
      console.log('Booking response:', response.data); // Debug log
      
      toast.success('Room booked successfully!');
      navigate('/my-bookings');
    } catch (error) {
      console.error('Failed to book room:', error);
      
      if (error.response) {
        console.error('Server error details:', error.response.data);
        
        // Handle validation errors
        if (error.response.data.errors && error.response.data.errors.length > 0) {
          error.response.data.errors.forEach(err => {
            toast.error(err.msg);
          });
        } else {
          const errorMessage = error.response.data.msg || 'Failed to book room';
          toast.error(errorMessage);
        }
      } else if (error.request) {
        // The request was made but no response was received
        toast.error('No response from server. Please check your connection and try again.');
      } else {
        // Something happened in setting up the request
        toast.error('Failed to book room. Please try again later.');
      }
    } finally {
      setSubmitting(false);
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

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button variant="contained" onClick={() => navigate('/rooms')}>
            Back to Rooms
          </Button>
        </Box>
      </Container>
    );
  }

  if (!room) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 3 }}>
          Room not found
        </Alert>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button variant="contained" onClick={() => navigate('/rooms')}>
            Back to Rooms
          </Button>
        </Box>
      </Container>
    );
  }

  // Calculate minimum check-out date (day after check-in)
  const minCheckOutDate = bookingData.checkIn 
    ? format(addDays(parse(bookingData.checkIn, 'yyyy-MM-dd', new Date()), 1), 'yyyy-MM-dd')
    : format(addDays(new Date(), 1), 'yyyy-MM-dd');

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {room.type} Room {room.roomNumber}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {room.description || 'Comfortable room with modern amenities'}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Room Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardMedia
              component="img"
              height="400"
              image={defaultImage}
              alt={`Room ${room.roomNumber}`}
            />
            <Box sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Room Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Room Number:</strong> {room.roomNumber}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Type:</strong> {room.type}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Price:</strong> ${room.price} per night
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Capacity:</strong> {room.capacity} {room.capacity > 1 ? 'persons' : 'person'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Floor:</strong> {room.floor || 'Ground floor'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Status:</strong> {room.status}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Amenities
              </Typography>
              <List>
                {room.amenities && room.amenities.length > 0 ? (
                  <Grid container>
                    {room.amenities.map((amenity) => (
                      <Grid item xs={12} sm={6} key={amenity}>
                        <ListItem>
                          <ListItemIcon>
                            {amenityIcons[amenity] || <Hotel />}
                          </ListItemIcon>
                          <ListItemText primary={amenity} />
                        </ListItem>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2">Basic amenities included</Typography>
                )}
              </List>
            </Box>
          </Card>
        </Grid>

        {/* Booking Form */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Book This Room
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Check-in Date"
                type="date"
                value={bookingData.checkIn}
                onChange={(e) => handleBookingChange('checkIn', e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: format(new Date(), 'yyyy-MM-dd') }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Check-out Date"
                type="date"
                value={bookingData.checkOut}
                onChange={(e) => handleBookingChange('checkOut', e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: minCheckOutDate }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Number of Guests"
                type="number"
                value={bookingData.guestCount}
                onChange={(e) => handleBookingChange('guestCount', parseInt(e.target.value))}
                inputProps={{ min: 1, max: room.capacity }}
              />
              {bookingData.guestCount > room.capacity && (
                <Typography color="error" variant="caption">
                  Maximum capacity is {room.capacity} guests
                </Typography>
              )}
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Price Summary
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Price per night:</Typography>
                <Typography>${room.price}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Number of nights:</Typography>
                <Typography>
                  {bookingData.checkIn && bookingData.checkOut
                    ? differenceInDays(
                        parse(bookingData.checkOut, 'yyyy-MM-dd', new Date()),
                        parse(bookingData.checkIn, 'yyyy-MM-dd', new Date())
                      )
                    : 0}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6">${calculateTotalPrice()}</Typography>
              </Box>
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleBooking}
              disabled={submitting}
            >
              {submitting ? 'Processing...' : 'Book Now'}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default RoomDetails; 