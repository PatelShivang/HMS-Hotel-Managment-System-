const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Room = require('../models/Room');

// @route   GET api/bookings
// @desc    Get all bookings (admin/staff) or user's bookings (guest)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        let bookings;
        if (['admin', 'staff'].includes(req.user.role)) {
            bookings = await Booking.find()
                .populate('user', ['name', 'email'])
                .populate('room', ['roomNumber', 'type']);
        } else {
            bookings = await Booking.find({ user: req.user.id })
                .populate('room', ['roomNumber', 'type']);
        }
        res.json(bookings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('user', ['name', 'email'])
            .populate('room', ['roomNumber', 'type', 'price']);

        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        // Check if user is authorized to view this booking
        if (req.user.role === 'guest' && booking.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        res.json(booking);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Booking not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/',
    [
        auth,
        [
            check('room', 'Room is required').not().isEmpty(),
            check('checkIn', 'Check-in date is required').not().isEmpty(),
            check('checkOut', 'Check-out date is required').not().isEmpty(),
            check('guests.adults', 'Number of adults is required').isInt({ min: 1 }),
            check('guests.children', 'Number of children must be non-negative').isInt({ min: 0 })
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const room = await Room.findById(req.body.room);
            if (!room) {
                return res.status(404).json({ msg: 'Room not found' });
            }

            // Check if room is available
            if (room.status !== 'available') {
                return res.status(400).json({ msg: 'Room is not available for booking' });
            }

            // Validate dates
            const now = new Date();
            const checkIn = new Date(req.body.checkIn);
            const checkOut = new Date(req.body.checkOut);

            // Set time to midnight for consistent comparison
            now.setHours(0, 0, 0, 0);
            checkIn.setHours(0, 0, 0, 0);
            checkOut.setHours(0, 0, 0, 0);

            if (checkIn < now) {
                return res.status(400).json({ msg: 'Check-in date cannot be in the past' });
            }

            if (checkOut <= checkIn) {
                return res.status(400).json({ msg: 'Check-out date must be after check-in date' });
            }

            // Check if room is available for the requested dates
            const conflictingBooking = await Booking.findOne({
                room: req.body.room,
                status: { $nin: ['cancelled'] },
                $or: [
                    {
                        checkIn: { $lt: checkOut },
                        checkOut: { $gt: checkIn }
                    }
                ]
            });

            if (conflictingBooking) {
                return res.status(400).json({ msg: 'Room is not available for the selected dates' });
            }

            // Calculate total price
            const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
            const totalPrice = room.price * nights;

            const newBooking = new Booking({
                user: req.user.id,
                room: req.body.room,
                checkIn,
                checkOut,
                guests: req.body.guests,
                totalPrice,
                paymentDetails: {
                    method: req.body.paymentMethod || 'credit_card'
                },
                specialRequests: req.body.specialRequests
            });

            const booking = await newBooking.save();

            // Update room status
            room.status = 'occupied';
            await room.save();

            // Return populated booking
            const populatedBooking = await Booking.findById(booking._id)
                .populate('user', ['name', 'email'])
                .populate('room', ['roomNumber', 'type', 'price']);

            res.json(populatedBooking);
        } catch (err) {
            console.error('Booking creation error:', err);
            res.status(500).json({ msg: 'Server Error', error: err.message });
        }
    }
);

// @route   PUT api/bookings/:id
// @desc    Update booking status
// @access  Private (Admin/Staff only)
router.put('/:id',
    [
        auth,
        authorize(['admin', 'staff']),
        [
            check('status', 'Status is required').isIn(['pending', 'confirmed', 'cancelled', 'completed'])
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const booking = await Booking.findById(req.params.id);
            if (!booking) {
                return res.status(404).json({ msg: 'Booking not found' });
            }

            booking.status = req.body.status;
            
            if (req.body.status === 'cancelled') {
                booking.cancellation = {
                    cancelledAt: Date.now(),
                    reason: req.body.reason || 'Cancelled by staff',
                    refundStatus: 'pending'
                };

                // Update room status
                const room = await Room.findById(booking.room);
                if (room) {
                    room.status = 'available';
                    await room.save();
                }
            }

            await booking.save();
            res.json(booking);
        } catch (err) {
            console.error(err.message);
            if (err.kind === 'ObjectId') {
                return res.status(404).json({ msg: 'Booking not found' });
            }
            res.status(500).send('Server Error');
        }
    }
);

// @route   DELETE api/bookings/:id
// @desc    Cancel booking (for guests) or delete booking (for admin)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        // Check if user is authorized
        if (req.user.role === 'guest') {
            if (booking.user.toString() !== req.user.id) {
                return res.status(401).json({ msg: 'Not authorized' });
            }
            // For guests, mark as cancelled instead of deleting
            booking.status = 'cancelled';
            booking.cancellation = {
                cancelledAt: Date.now(),
                reason: req.body.reason || 'Cancelled by guest',
                refundStatus: 'pending'
            };
            await booking.save();
        } else if (['admin', 'staff'].includes(req.user.role)) {
            // Admins and staff can delete the booking
            await booking.remove();
        }

        // Update room status
        const room = await Room.findById(booking.room);
        if (room) {
            room.status = 'available';
            await room.save();
        }

        res.json({ msg: 'Booking cancelled successfully' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Booking not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router; 