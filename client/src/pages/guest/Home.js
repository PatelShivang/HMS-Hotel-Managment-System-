import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid2,
  Card,
  CardMedia,
  CardContent,
  CardActions,
} from '@mui/material';

const featuredRooms = [
  {
    id: 1,
    type: 'Deluxe Room',
    image: 'https://source.unsplash.com/800x600/?hotel,room',
    price: 199,
    description: 'Spacious room with modern amenities and city view.',
  },
  {
    id: 2,
    type: 'Suite',
    image: 'https://source.unsplash.com/800x600/?hotel,suite',
    price: 299,
    description: 'Luxury suite with separate living area and premium services.',
  },
  {
    id: 3,
    type: 'Presidential Suite',
    image: 'https://source.unsplash.com/800x600/?hotel,luxury',
    price: 499,
    description: 'Ultimate luxury experience with panoramic views and butler service.',
  },
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            component="h1"
            variant="h2"
            sx={{
              mb: 4,
              fontWeight: 'bold',
            }}
          >
            Welcome to Luxury Hotel
          </Typography>
          <Typography variant="h5" sx={{ mb: 4 }}>
            Experience the perfect blend of comfort and luxury
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => navigate('/rooms')}
          >
            View Our Rooms
          </Button>
        </Container>
      </Box>

      {/* Featured Rooms Section */}
      <Container maxWidth="lg">
        <Typography
          component="h2"
          variant="h3"
          sx={{
            mb: 4,
            textAlign: 'center',
          }}
        >
          Featured Rooms
        </Typography>
        <Grid2 container spacing={4}>
          {featuredRooms.map((room) => (
            <Grid2 item key={room.id} xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={room.image}
                  alt={room.type}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {room.type}
                  </Typography>
                  <Typography variant="h6" color="primary" gutterBottom>
                    ${room.price} / night
                  </Typography>
                  <Typography>{room.description}</Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`/rooms/${room.id}`)}
                  >
                    Learn More
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => navigate(`/rooms/${room.id}`)}
                  >
                    Book Now
                  </Button>
                </CardActions>
              </Card>
            </Grid2>
          ))}
        </Grid2>

        {/* Features Section */}
        <Box sx={{ mt: 8, mb: 6 }}>
          <Typography
            component="h2"
            variant="h3"
            sx={{
              mb: 4,
              textAlign: 'center',
            }}
          >
            Why Choose Us
          </Typography>
          <Grid2 container spacing={4}>
            <Grid2 item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h5" gutterBottom>
                  Luxury Comfort
                </Typography>
                <Typography>
                  Experience premium comfort with our high-quality amenities and
                  services.
                </Typography>
              </Box>
            </Grid2>
            <Grid2 item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h5" gutterBottom>
                  Prime Location
                </Typography>
                <Typography>
                  Situated in the heart of the city with easy access to major
                  attractions.
                </Typography>
              </Box>
            </Grid2>
            <Grid2 item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h5" gutterBottom>
                  24/7 Service
                </Typography>
                <Typography>
                  Our dedicated staff is available round the clock to assist you.
                </Typography>
              </Box>
            </Grid2>
          </Grid2>
        </Box>
      </Container>
    </Box>
  );
};

export default Home; 