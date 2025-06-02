const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    guests: {
        adults: {
            type: Number,
            required: true,
            min: 1
        },
        children: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
    },
    paymentDetails: {
        method: {
            type: String,
            enum: ['cash', 'card'],
            default: 'cash'
        },
        paidAmount: Number,
        paidAt: Date
    },
    specialRequests: String
}, {
    timestamps: true
});

// Validate checkout date is after checkin date
bookingSchema.pre('save', async function(next) {
    if (this.checkOut <= this.checkIn) {
        next(new Error('Check-out date must be after check-in date'));
    }
    next();
});

// Update room status when booking status changes
bookingSchema.pre('save', async function(next) {
    if (this.isModified('status')) {
        try {
            const Room = mongoose.model('Room');
            const room = await Room.findById(this.room);
            
            if (room) {
                if (this.status === 'cancelled' || this.status === 'completed') {
                    room.status = 'available';
                } else if (this.status === 'confirmed') {
                    room.status = 'occupied';
                }
                await room.save();
            }
        } catch (error) {
            console.error('Error updating room status:', error);
        }
    }
    next();
});

// Clean up room status when booking is deleted
bookingSchema.pre('remove', async function(next) {
    try {
        const Room = mongoose.model('Room');
        const room = await Room.findById(this.room);
        if (room) {
            room.status = 'available';
            await room.save();
        }
    } catch (error) {
        console.error('Error cleaning up room status:', error);
    }
    next();
});

// Index for efficient querying
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });

module.exports = mongoose.model('Booking', bookingSchema); 