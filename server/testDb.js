const mongoose = require('mongoose');
const Room = require('./models/Room');
require('dotenv').config();

async function testConnection() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Successfully connected to MongoDB');

        // Test creating a room
        const testRoom = new Room({
            roomNumber: "TEST101",
            type: "Standard",
            capacity: 2,
            price: 1000,
            description: "Test room",
            amenities: ["TV", "WiFi"],
            images: ["https://example.com/image.jpg"],
            floor: 1,
            status: "available"
        });

        const savedRoom = await testRoom.save();
        console.log('Successfully created test room:', savedRoom);

        // Clean up - delete the test room
        await Room.deleteOne({ roomNumber: "TEST101" });
        console.log('Test room deleted');

    } catch (error) {
        console.error('Database test failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

testConnection(); 