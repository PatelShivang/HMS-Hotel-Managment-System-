import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid2,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const roomTypes = ['Standard', 'Deluxe', 'Suite'];
const roomStatuses = ['available', 'occupied', 'maintenance'];

const RoomManagement = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    roomNumber: '',
    type: 'Standard',
    capacity: 2,
    price: 0,
    description: '',
    amenities: '',
    status: 'available',
    floor: 1
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchRooms();
  }, [navigate]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }

      const userResponse = await api.get('/auth/user');
      
      if (userResponse.data.role !== 'admin') {
        toast.error('You do not have permission to view rooms');
        navigate('/');
        return;
      }

      const response = await api.get('/admin/rooms');
      
      if (Array.isArray(response.data)) {
        setRooms(response.data);
      } else {
        toast.error('Invalid data received from server');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again');
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to view rooms');
        navigate('/');
      } else {
        toast.error('Failed to fetch rooms. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (room = null) => {
    if (room) {
      setFormData({
        roomNumber: room.roomNumber,
        type: room.type,
        capacity: room.capacity,
        price: room.price,
        description: room.description,
        amenities: room.amenities.join(', '),
        status: room.status,
        floor: room.floor
      });
      setSelectedRoom(room);
    } else {
      setFormData({
        roomNumber: '',
        type: 'Standard',
        capacity: 2,
        price: 0,
        description: '',
        amenities: '',
        status: 'available',
        floor: 1
      });
      setSelectedRoom(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRoom(null);
    setFormData({
      roomNumber: '',
      type: 'Standard',
      capacity: 2,
      price: 0,
      description: '',
      amenities: '',
      status: 'available',
      floor: 1
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.roomNumber.trim()) {
      toast.error('Room number is required');
      return false;
    }
    if (!formData.type) {
      toast.error('Room type is required');
      return false;
    }
    if (!formData.capacity || formData.capacity < 1) {
      toast.error('Capacity must be at least 1');
      return false;
    }
    if (!formData.price || formData.price < 0) {
      toast.error('Price must be a positive number');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return false;
    }
    if (!formData.floor || formData.floor < 1) {
      toast.error('Floor must be at least 1');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const roomData = {
        ...formData,
        capacity: parseInt(formData.capacity),
        price: parseFloat(formData.price),
        floor: parseInt(formData.floor),
        amenities: formData.amenities.split(',').map((item) => item.trim()).filter(Boolean)
      };

      let response;
      if (selectedRoom) {
        response = await api.put(`/admin/rooms/${selectedRoom._id}`, roomData);
        setRooms(rooms.map((room) =>
          room._id === selectedRoom._id ? response.data : room
        ));
        toast.success('Room updated successfully');
      } else {
        response = await api.post('/admin/rooms', roomData);
        setRooms([...rooms, response.data]);
        toast.success('Room created successfully');
      }
      handleCloseDialog();
    } catch (error) {
      const errorMessage = error.response?.data?.msg || 
                          error.response?.data?.errors?.[0]?.msg ||
                          'Failed to save room';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) {
      return;
    }

    try {
      await api.delete(`/admin/rooms/${roomId}`);
      setRooms(rooms.filter((room) => room._id !== roomId));
      toast.success('Room deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to delete room');
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Room Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Room
        </Button>
      </Box>

      <Grid container spacing={3}>
        {rooms.map((room) => (
          <Grid item xs={12} sm={6} md={4} key={room._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Room {room.roomNumber}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {room.type}
                </Typography>
                <Typography variant="body2">
                  Capacity: {room.capacity} persons
                </Typography>
                <Typography variant="body2">
                  Price: ₹{room.price} per night
                </Typography>
                <Typography variant="body2">
                  Floor: {room.floor}
                </Typography>
                <Box mt={1}>
                  <Chip
                    label={room.status}
                    color={
                      room.status === 'available'
                        ? 'success'
                        : room.status === 'occupied'
                        ? 'primary'
                        : 'error'
                    }
                    size="small"
                  />
                </Box>
              </CardContent>
              <CardActions>
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog(room)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteRoom(room._id)}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedRoom ? 'Edit Room' : 'Add New Room'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid2 container spacing={2}>
              <Grid2 item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Room Number"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleInputChange}
                  required
                />
              </Grid2>
              <Grid2 item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Room Type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                >
                  {roomTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid2>
              <Grid2 item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid2>
              <Grid2 item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  inputProps={{ min: 0 }}
                />
              </Grid2>
              <Grid2 item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </Grid2>
              <Grid2 item xs={12}>
                <TextField
                  fullWidth
                  label="Amenities (comma-separated)"
                  name="amenities"
                  value={formData.amenities}
                  onChange={handleInputChange}
                  helperText="Enter amenities separated by commas"
                />
              </Grid2>
              <Grid2 item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  {roomStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid2>
              <Grid2 item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Floor"
                  name="floor"
                  value={formData.floor}
                  onChange={handleInputChange}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid2>
            </Grid2>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default RoomManagement; 