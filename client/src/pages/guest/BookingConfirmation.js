import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid2,
    Divider
} from '@mui/material';
import { toast } from 'react-toastify';
import PaymentForm from '../../components/payment/PaymentForm';
import api from '../../services/api';

const BookingConfirmation = () => {
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const { bookingId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const { data } = await api.get(`/api/bookings/${bookingId}`);
                setBooking(data);
            } catch (error) {
                toast.error('Failed to fetch booking details');
                navigate('/my-bookings');
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [bookingId, navigate]);

    const handlePaymentSuccess = (updatedBooking) => {
        setBooking(updatedBooking);
        toast.success('Booking confirmed successfully!');
        navigate('/my-bookings');
    };

    if (loading) {
        return (
            <Container>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography>Loading booking details...</Typography>
                </Box>
            </Container>
        );
    }

    if (!booking) {
        return (
            <Container>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography>Booking not found</Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Booking Confirmation
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid2 container spacing={3}>
                    <Grid2 item xs={12} md={6}>
                        <Typography variant="h6">Room Details</Typography>
                        <Box sx={{ mt: 2 }}>
                            <Typography>Room Number: {booking.room.roomNumber}</Typography>
                            <Typography>Type: {booking.room.type}</Typography>
                            <Typography>Price per night: ₹{booking.room.price}</Typography>
                        </Box>
                    </Grid2>

                    <Grid2 item xs={12} md={6}>
                        <Typography variant="h6">Booking Details</Typography>
                        <Box sx={{ mt: 2 }}>
                            <Typography>
                                Check-in: {new Date(booking.checkIn).toLocaleDateString()}
                            </Typography>
                            <Typography>
                                Check-out: {new Date(booking.checkOut).toLocaleDateString()}
                            </Typography>
                            <Typography>
                                Guests: {booking.guests.adults} Adults, {booking.guests.children} Children
                            </Typography>
                        </Box>
                    </Grid2>
                </Grid2>

                <Divider sx={{ my: 3 }} />

                {booking.paymentStatus === 'pending' ? (
                    <PaymentForm booking={booking} onSuccess={handlePaymentSuccess} />
                ) : (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h6" color="primary">
                            Payment Status: {booking.paymentStatus.toUpperCase()}
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default BookingConfirmation; 