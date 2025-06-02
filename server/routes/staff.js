const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

// @route   GET api/staff/dashboard
// @desc    Get staff dashboard statistics
// @access  Private (Staff and Admin only)
router.get('/dashboard', [auth, authorize(['staff', 'admin'])], async (req, res) => {
    try {
        // Get room statistics
        const [totalRooms, occupiedRooms, availableRooms, maintenanceRooms] = await Promise.all([
            Room.countDocuments(),
            Room.countDocuments({ status: 'occupied' }),
            Room.countDocuments({ status: 'available' }),
            Room.countDocuments({ status: 'maintenance' })
        ]);

        // Get today's check-ins and check-outs
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [todayCheckIns, todayCheckOuts, pendingBookings] = await Promise.all([
            Booking.countDocuments({
                checkIn: { $gte: today, $lt: tomorrow }
            }),
            Booking.countDocuments({
                checkOut: { $gte: today, $lt: tomorrow }
            }),
            Booking.countDocuments({ status: 'pending' })
        ]);

        // Get recent bookings
        const recentBookings = await Booking.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name email')
            .populate('room', 'roomNumber type');

        res.json({
            stats: {
                totalRooms,
                occupiedRooms,
                availableRooms,
                maintenanceRooms,
                todayCheckIns,
                todayCheckOuts,
                pendingBookings
            },
            recentBookings
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router; 