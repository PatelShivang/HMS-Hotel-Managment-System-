import React from 'react';
import { useDispatch } from 'react-redux';
import { Button, Typography, Box, CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';
import api from '../../services/api';

const PaymentForm = ({ booking, onSuccess }) => {
    const [loading, setLoading] = React.useState(false);
    const dispatch = useDispatch();

    const handlePayment = async () => {
        try {
            setLoading(true);
            
            // Create order
            const { data } = await api.post('/api/payments/create-order', {
                bookingId: booking._id
            });

            // Initialize Razorpay payment
            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID,
                amount: data.amount,
                currency: data.currency,
                name: 'Hotel Management System',
                description: `Booking for Room ${booking.room.roomNumber}`,
                order_id: data.orderId,
                handler: async (response) => {
                    try {
                        // Verify payment
                        const { data: verifyData } = await api.post('/api/payments/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            bookingId: booking._id
                        });

                        toast.success('Payment successful!');
                        if (onSuccess) {
                            onSuccess(verifyData.booking);
                        }
                    } catch (error) {
                        toast.error('Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    name: booking.user?.name,
                    email: booking.user?.email,
                },
                notes: {
                    bookingId: booking._id,
                    roomNumber: booking.room.roomNumber
                },
                theme: {
                    color: '#1976d2'
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to initiate payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" gutterBottom>
                Total Amount: ₹{booking.totalPrice}
            </Typography>
            <Button
                variant="contained"
                color="primary"
                onClick={handlePayment}
                disabled={loading}
                sx={{ mt: 2 }}
            >
                {loading ? (
                    <CircularProgress size={24} color="inherit" />
                ) : (
                    'Pay Now'
                )}
            </Button>
        </Box>
    );
};

export default PaymentForm; 