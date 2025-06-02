const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomNumber: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
        enum: ['Standard', 'Deluxe', 'Suite']
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true
    },
    amenities: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['available', 'occupied', 'maintenance'],
        default: 'available'
    },
    floor: {
        type: Number,
        required: true
    }
});

// Index for efficient querying
roomSchema.index({ roomNumber: 1 });
roomSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('Room', roomSchema); 