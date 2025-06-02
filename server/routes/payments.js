const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Booking = require('../models/Booking');

// @route   POST api/payments/process
// @desc    Process payment for a booking
// @access  Private (Staff/Admin only)
router.post('/process', [auth, authorize(['staff', 'admin'])], async (req, res) => {
    try {
        const { bookingId, amount, method } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        // Update booking payment details
        booking.paymentStatus = 'paid';
        booking.status = 'confirmed';
        booking.paymentDetails = {
            method: method || 'cash',
            paidAmount: amount,
            paidAt: new Date()
        };

        await booking.save();

        res.json({
            success: true,
            booking
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   POST api/payments/refund
// @desc    Process refund for a booking
// @access  Private (Staff/Admin only)
router.post('/refund', [auth, authorize(['staff', 'admin'])], async (req, res) => {
    try {
        const { bookingId, amount } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        if (booking.paymentStatus !== 'paid') {
            return res.status(400).json({ msg: 'Payment not found or already refunded' });
        }

        booking.paymentStatus = 'refunded';
        booking.cancellation = {
            cancelledAt: new Date(),
            refundAmount: amount,
            refundStatus: 'processed'
        };

        await booking.save();

        res.json({
            success: true,
            booking
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

module.exports = router; 