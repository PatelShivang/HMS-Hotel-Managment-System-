const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const bcrypt = require('bcryptjs');

// @route   GET api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/users', [auth, authorize(['admin'])], async (req, res) => {
    try {
        console.log('Fetching users from MongoDB...');
        const users = await User.find().select('-password');
        console.log('Users fetched:', users);
        
        if (!users) {
            console.log('No users found');
            return res.status(404).json({ msg: 'No users found' });
        }
        
        res.json(users);
    } catch (err) {
        console.error('Error in GET /api/admin/users:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   POST api/admin/users
// @desc    Create a new user
// @access  Private (Admin only)
router.post('/users', [
    auth,
    authorize(['admin']),
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
        check('role', 'Invalid role').isIn(['guest', 'staff', 'admin'])
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, phone } = req.body;
    console.log('Creating new user:', { name, email, role, phone });

    try {
        let user = await User.findOne({ email });
        if (user) {
            console.log('User already exists:', email);
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({
            name,
            email,
            password,
            role,
            phone
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();
        console.log('New user created:', user._id);
        
        const userResponse = await User.findById(user._id).select('-password');
        res.json(userResponse);
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   PUT api/admin/users/:id
// @desc    Update a user
// @access  Private (Admin only)
router.put('/users/:id', [
    auth,
    authorize(['admin']),
    [
        check('name', 'Name is required').optional().not().isEmpty(),
        check('email', 'Please include a valid email').optional().isEmail(),
        check('role', 'Invalid role').optional().isIn(['guest', 'staff', 'admin'])
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, email, role, phone, password } = req.body;
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (phone) updateData.phone = phone;
        
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        let user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/admin/users/:id
// @desc    Delete a user
// @access  Private (Admin only)
router.delete('/users/:id', [auth, authorize(['admin'])], async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Prevent deleting the last admin
        if (user.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({ msg: 'Cannot delete the last admin user' });
            }
        }

        await user.remove();
        res.json({ msg: 'User removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin only)
router.get('/dashboard', [auth, authorize(['admin'])], async (req, res) => {
    try {
        console.log('Fetching dashboard data...');
        
        // Get counts
        const totalUsers = await User.countDocuments();
        console.log('Total users:', totalUsers);
        
        const totalRooms = await Room.countDocuments();
        console.log('Total rooms:', totalRooms);
        
        const availableRooms = await Room.countDocuments({ status: 'available' });
        console.log('Available rooms:', availableRooms);
        
        const totalBookings = await Booking.countDocuments();
        console.log('Total bookings:', totalBookings);

        // Get recent activities (bookings, user registrations, etc.)
        const recentBookings = await Booking.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name email')
            .populate('room', 'roomNumber type');
        console.log('Recent bookings:', recentBookings);

        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('-password');
        console.log('Recent users:', recentUsers);

        // Calculate revenue
        const completedBookings = await Booking.find({ status: 'completed' });
        const totalRevenue = completedBookings.reduce((acc, booking) => acc + booking.totalPrice, 0);
        console.log('Total revenue:', totalRevenue);

        // Get monthly revenue
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyBookings = await Booking.find({
            status: 'completed',
            createdAt: { $gte: firstDayOfMonth }
        });
        const monthlyRevenue = monthlyBookings.reduce((acc, booking) => acc + booking.totalPrice, 0);
        console.log('Monthly revenue:', monthlyRevenue);

        const response = {
            stats: {
                totalUsers,
                totalRooms,
                availableRooms,
                totalBookings,
                totalRevenue,
                monthlyRevenue,
                occupancyRate: ((totalRooms - availableRooms) / totalRooms) * 100
            },
            recentActivities: {
                bookings: recentBookings,
                users: recentUsers
            }
        };
        
        console.log('Dashboard response:', response);
        res.json(response);
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   GET api/admin/rooms
// @desc    Get all rooms
// @access  Private (Admin only)
router.get('/rooms', [auth, authorize(['admin'])], async (req, res) => {
    try {
        console.log('Fetching rooms from MongoDB...');
        const rooms = await Room.find();
        console.log('Rooms fetched:', rooms);
        res.json(rooms);
    } catch (err) {
        console.error('Error fetching rooms:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   POST api/admin/rooms
// @desc    Create a new room
// @access  Private (Admin only)
router.post('/rooms', [
    auth,
    authorize(['admin']),
    [
        check('roomNumber', 'Room number is required').not().isEmpty(),
        check('type', 'Room type is required').isIn(['Standard', 'Deluxe', 'Suite', 'Presidential Suite']),
        check('capacity', 'Capacity must be a positive number').isInt({ min: 1 }),
        check('price', 'Price must be a positive number').isFloat({ min: 0 }),
        check('floor', 'Floor number is required').isInt({ min: 1 }),
        check('description', 'Description is required').not().isEmpty()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        console.log('Creating new room:', req.body);
        
        // Check if room number already exists
        const existingRoom = await Room.findOne({ roomNumber: req.body.roomNumber });
        if (existingRoom) {
            return res.status(400).json({ msg: 'Room number already exists' });
        }

        const room = new Room({
            roomNumber: req.body.roomNumber,
            type: req.body.type,
            capacity: req.body.capacity,
            price: req.body.price,
            floor: req.body.floor,
            description: req.body.description,
            amenities: req.body.amenities || [],
            images: req.body.images || [],
            status: req.body.status || 'available'
        });

        await room.save();
        console.log('Room created:', room);
        res.json(room);
    } catch (err) {
        console.error('Error creating room:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   PUT api/admin/rooms/:id
// @desc    Update a room
// @access  Private (Admin only)
router.put('/rooms/:id', [
    auth,
    authorize(['admin']),
    [
        check('roomNumber', 'Room number is required').optional().not().isEmpty(),
        check('type', 'Invalid room type').optional().isIn(['Standard', 'Deluxe', 'Suite', 'Presidential Suite']),
        check('capacity', 'Capacity must be a positive number').optional().isInt({ min: 1 }),
        check('price', 'Price must be a positive number').optional().isFloat({ min: 0 }),
        check('floor', 'Floor number must be positive').optional().isInt({ min: 1 })
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        console.log('Updating room:', req.params.id, req.body);
        
        let room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ msg: 'Room not found' });
        }

        // Check if new room number conflicts with existing room
        if (req.body.roomNumber && req.body.roomNumber !== room.roomNumber) {
            const existingRoom = await Room.findOne({ roomNumber: req.body.roomNumber });
            if (existingRoom) {
                return res.status(400).json({ msg: 'Room number already exists' });
            }
        }

        room = await Room.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        console.log('Room updated:', room);
        res.json(room);
    } catch (err) {
        console.error('Error updating room:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   DELETE api/admin/rooms/:id
// @desc    Delete a room
// @access  Private (Admin only)
router.delete('/rooms/:id', [auth, authorize(['admin'])], async (req, res) => {
    try {
        console.log('Deleting room:', req.params.id);
        
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ msg: 'Room not found' });
        }

        // Check if room has any active bookings
        const activeBookings = await Booking.findOne({
            room: req.params.id,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (activeBookings) {
            return res.status(400).json({ msg: 'Cannot delete room with active bookings' });
        }

        await room.remove();
        console.log('Room deleted successfully');
        res.json({ msg: 'Room removed' });
    } catch (err) {
        console.error('Error deleting room:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   PATCH api/admin/rooms/:id/status
// @desc    Update room status
// @access  Private (Admin only)
router.patch('/rooms/:id/status', [
    auth,
    authorize(['admin']),
    check('status', 'Invalid status').isIn(['available', 'occupied', 'maintenance'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        console.log('Updating room status:', req.params.id, req.body.status);
        
        const room = await Room.findByIdAndUpdate(
            req.params.id,
            { $set: { status: req.body.status } },
            { new: true }
        );

        if (!room) {
            return res.status(404).json({ msg: 'Room not found' });
        }

        console.log('Room status updated:', room);
        res.json(room);
    } catch (err) {
        console.error('Error updating room status:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

module.exports = router; 