const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const Room = require('../models/Room');

// @route   GET api/rooms
// @desc    Get all rooms with optional filters
// @access  Public
router.get('/', async (req, res) => {
    try {
        const {
            type,
            minPrice,
            maxPrice,
            capacity,
            status,
            sortBy = 'price',
            order = 'asc'
        } = req.query;

        // Build filter object
        const filter = {};
        if (type) filter.type = type;
        if (status) filter.status = status;
        if (capacity) filter.capacity = { $gte: parseInt(capacity) };
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseInt(minPrice);
            if (maxPrice) filter.price.$lte = parseInt(maxPrice);
        }

        const rooms = await Room.find(filter)
            .sort({ [sortBy]: order === 'asc' ? 1 : -1 });

        res.json(rooms);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/rooms/:id
// @desc    Get room by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ msg: 'Room not found' });
        }
        res.json(room);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Room not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST api/rooms
// @desc    Create a new room
// @access  Private (Admin only)
router.post('/', [
    auth,
    authorize(['admin']),
    [
        check('roomNumber', 'Room number is required').not().isEmpty(),
        check('type', 'Room type is required').isIn(['Standard', 'Deluxe', 'Suite', 'Presidential Suite']),
        check('capacity', 'Capacity must be a positive number').isInt({ min: 1 }),
        check('price', 'Price must be a positive number').isFloat({ min: 0 }),
        check('description', 'Description is required').not().isEmpty(),
        check('amenities', 'Amenities must be an array').isArray(),
        check('images', 'Images must be an array').isArray()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const roomExists = await Room.findOne({ roomNumber: req.body.roomNumber });
        if (roomExists) {
            return res.status(400).json({ msg: 'Room number already exists' });
        }

        const room = new Room(req.body);
        await room.save();
        res.json(room);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/rooms/:id
// @desc    Update a room
// @access  Private (Admin only)
router.put('/:id', [
    auth,
    authorize(['admin']),
    [
        check('type', 'Invalid room type').optional().isIn(['Standard', 'Deluxe', 'Suite', 'Presidential Suite']),
        check('capacity', 'Capacity must be a positive number').optional().isInt({ min: 1 }),
        check('price', 'Price must be a positive number').optional().isFloat({ min: 0 }),
        check('amenities', 'Amenities must be an array').optional().isArray(),
        check('images', 'Images must be an array').optional().isArray(),
        check('status', 'Invalid status').optional().isIn(['available', 'occupied', 'maintenance'])
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        let room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ msg: 'Room not found' });
        }

        // If room number is being updated, check if new number already exists
        if (req.body.roomNumber && req.body.roomNumber !== room.roomNumber) {
            const roomExists = await Room.findOne({ roomNumber: req.body.roomNumber });
            if (roomExists) {
                return res.status(400).json({ msg: 'Room number already exists' });
            }
        }

        room = await Room.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        res.json(room);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/rooms/:id
// @desc    Delete a room
// @access  Private (Admin only)
router.delete('/:id', [auth, authorize(['admin'])], async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ msg: 'Room not found' });
        }

        await room.remove();
        res.json({ msg: 'Room removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH api/rooms/:id/status
// @desc    Update room status
// @access  Private (Staff and Admin)
router.patch('/:id/status', [
    auth,
    authorize(['staff', 'admin']),
    check('status', 'Invalid status').isIn(['available', 'occupied', 'maintenance'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const room = await Room.findByIdAndUpdate(
            req.params.id,
            { $set: { status: req.body.status } },
            { new: true }
        );

        if (!room) {
            return res.status(404).json({ msg: 'Room not found' });
        }

        res.json(room);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/rooms/:id/reviews
// @desc    Add a review to a room
// @access  Private (Authenticated users only)
router.post('/:id/reviews',
    [
        auth,
        [
            check('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 }),
            check('comment', 'Comment is required').not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const room = await Room.findById(req.params.id);
            if (!room) {
                return res.status(404).json({ msg: 'Room not found' });
            }

            const newReview = {
                user: req.user.id,
                rating: req.body.rating,
                comment: req.body.comment
            };

            room.reviews.unshift(newReview);
            await room.save();

            res.json(room.reviews);
        } catch (err) {
            console.error(err.message);
            if (err.kind === 'ObjectId') {
                return res.status(404).json({ msg: 'Room not found' });
            }
            res.status(500).send('Server Error');
        }
    }
);

module.exports = router; 