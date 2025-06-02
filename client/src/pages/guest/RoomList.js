import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import api from '../../services/api';
import { toast } from 'react-toastify';

const roomTypes = ['All', 'Standard', 'Deluxe', 'Suite'];
const defaultImage = 'https://source.unsplash.com/800x600/?hotel,room';

const RoomList = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: 'All',
    priceRange: '',
    capacity: '',
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data } = await api.get('/rooms', {
        params: {
          status: 'available'
        }
      });
      
      console.log('Rooms data:', data); // Debug log
      setRooms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      const errorMessage = error.response?.data?.msg || 'Failed to fetch rooms';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value,
    });
  };

  const filteredRooms = rooms.filter((room) => {
    if (filters.type !== 'All' && room.type !== filters.type) return false;
    if (filters.capacity && room.capacity < parseInt(filters.capacity)) return false;
    if (
      filters.priceRange &&
      room.price > parseInt(filters.priceRange)
    )
      return false;
    return true;
  });

  const handleViewDetails = (roomId) => {
    navigate(`/rooms/${roomId}`);
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
        Available Rooms
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="room-type-label">Room Type</InputLabel>
            <Select
              labelId="room-type-label"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              label="Room Type"
            >
              {roomTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Max Price"
            name="priceRange"
            type="number"
            value={filters.priceRange}
            onChange={handleFilterChange}
            sx={{ minWidth: 200 }}
          />

          <TextField
            label="Min Capacity"
            name="capacity"
            type="number"
            value={filters.capacity}
            onChange={handleFilterChange}
            sx={{ minWidth: 200 }}
          />
        </Box>
      </Paper>

      {/* Room Cards */}
      {filteredRooms.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No rooms found matching your criteria.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredRooms.map((room) => (
            <Grid item xs={12} sm={6} md={4} key={room._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={defaultImage}
                  alt={`Room ${room.roomNumber}`}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {room.type} Room {room.roomNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {room.description || 'Comfortable room with modern amenities'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">
                      <strong>${room.price}</strong> / night
                    </Typography>
                    <Typography variant="body1">
                      Capacity: {room.capacity} {room.capacity > 1 ? 'persons' : 'person'}
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    Amenities: {room.amenities?.join(', ') || 'Basic amenities'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => handleViewDetails(room._id)}
                  >
                    View Details
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={() => navigate(`/rooms/${room._id}`)}
                  >
                    Book Now
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default RoomList; 