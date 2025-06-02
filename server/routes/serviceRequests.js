const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const ServiceRequest = require('../models/ServiceRequest');

// @route   GET api/service-requests
// @desc    Get all service requests (staff) or user's requests (guest)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        let requests;
        if (req.user.role === 'guest') {
            requests = await ServiceRequest.find({ user: req.user.id })
                .sort({ createdAt: -1 });
        } else {
            requests = await ServiceRequest.find()
                .populate('user', ['name', 'email'])
                .sort({ createdAt: -1 });
        }
        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/service-requests
// @desc    Create a new service request
// @access  Private
router.post('/', [
    auth,
    [
        check('type', 'Request type is required').isIn(['room_cleaning', 'food_order', 'maintenance', 'other']),
        check('title', 'Title is required').not().isEmpty(),
        check('description', 'Description is required').not().isEmpty(),
        check('priority', 'Priority must be low, medium, or high').isIn(['low', 'medium', 'high'])
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const newRequest = new ServiceRequest({
            user: req.user.id,
            type: req.body.type,
            title: req.body.title,
            description: req.body.description,
            priority: req.body.priority
        });

        const request = await newRequest.save();
        res.json(request);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/service-requests/:id
// @desc    Update service request status (staff only)
// @access  Private
router.put('/:id', [
    auth,
    authorize(['staff', 'admin']),
    [
        check('status', 'Status is required').isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const request = await ServiceRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ msg: 'Service request not found' });
        }

        request.status = req.body.status;
        if (req.body.assignedTo) {
            request.assignedTo = req.body.assignedTo;
        }
        if (req.body.notes) {
            request.notes = req.body.notes;
        }
        if (req.body.status === 'completed') {
            request.completedAt = new Date();
        }

        await request.save();
        res.json(request);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Service request not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/service-requests/:id
// @desc    Delete service request (staff only)
// @access  Private
router.delete('/:id', [auth, authorize(['staff', 'admin'])], async (req, res) => {
    try {
        const request = await ServiceRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ msg: 'Service request not found' });
        }

        await request.remove();
        res.json({ msg: 'Service request removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Service request not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router; 