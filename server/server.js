const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection with improved error handling
const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('Connection string:', process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management');
        
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_management', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        
        console.log('MongoDB Connected Successfully!');
        console.log(`Host: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);
        
        // Verify connection by trying to get users count
        const usersCount = await mongoose.model('User').countDocuments();
        console.log(`Database check - Total users: ${usersCount}`);
        
        // Check if collections exist
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            code: error.code
        });
        process.exit(1);
    }
};

// Handle MongoDB connection errors
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
    connectDB();
});

// Create initial admin user if none exists
const createInitialAdmin = async () => {
    try {
        const adminCount = await mongoose.model('User').countDocuments({ role: 'admin' });
        if (adminCount === 0) {
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            await mongoose.model('User').create({
                name: 'Admin User',
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'admin'
            });
            console.log('Initial admin user created');
        }
    } catch (error) {
        console.error('Error creating initial admin:', error);
    }
};

// Connect to MongoDB and initialize
connectDB().then(() => {
    createInitialAdmin();
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/service-requests', require('./routes/serviceRequests')); 