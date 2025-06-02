const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['room_cleaning', 'food_order', 'maintenance', 'other']
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
serviceRequestSchema.index({ user: 1, status: 1 });
serviceRequestSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema); 