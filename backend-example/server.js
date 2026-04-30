// Custom Backend Server Example (Node.js + Express + MongoDB + Socket.io)
// Install: npm install express mongoose socket.io cors dotenv

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nyra', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err));

// ==================== MONGOOSE SCHEMAS ====================

// User Location Schema
const LocationSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    userName: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    status: { type: String, enum: ['safe', 'alert', 'emergency', 'offline'], default: 'safe' },
    lastUpdated: { type: Date, default: Date.now },
});

// Create geospatial index for efficient nearby queries
LocationSchema.index({ location: '2dsphere' });

const UserLocation = mongoose.model('UserLocation', LocationSchema);

// SOS Alert Schema
const SOSSchema = new mongoose.Schema({
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    message: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'resolved', 'cancelled'], default: 'active' },
});

const SOSAlert = mongoose.model('SOSAlert', SOSSchema);

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

// ==================== REST API ENDPOINTS ====================

/**
 * POST /api/location - Update user location
 */
app.post('/api/location', async (req, res) => {
    try {
        const { userId, userName, latitude, longitude, status } = req.body;

        // Update or create location
        const location = await UserLocation.findOneAndUpdate(
            { userId },
            {
                userId,
                userName,
                latitude,
                longitude,
                status: status || 'safe',
                lastUpdated: new Date(),
            },
            { upsert: true, new: true }
        );

        // Broadcast location update to all connected clients
        io.emit('location_update', {
            userId,
            userName,
            latitude,
            longitude,
            status: location.status,
        });

        res.json({ success: true, location });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/users/nearby - Get nearby users within range
 */
app.get('/api/users/nearby', async (req, res) => {
    try {
        const { latitude, longitude, maxDistance, userId } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ success: false, error: 'Latitude and longitude required' });
        }

        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        const distance = parseInt(maxDistance) || 1000;

        // Get all active users
        const allUsers = await UserLocation.find({
            status: { $in: ['safe', 'alert', 'emergency'] },
            userId: { $ne: userId }, // Exclude current user
        });

        // Filter by distance
        const nearbyUsers = allUsers
            .map(user => {
                const dist = calculateDistance(lat, lon, user.latitude, user.longitude);
                return {
                    id: user.userId,
                    name: user.userName,
                    distance: Math.round(dist),
                    latitude: user.latitude,
                    longitude: user.longitude,
                    status: user.status,
                    lastSeen: user.lastUpdated,
                };
            })
            .filter(user => user.distance <= distance)
            .sort((a, b) => a.distance - b.distance);

        res.json({ success: true, users: nearbyUsers, count: nearbyUsers.length });
    } catch (error) {
        console.error('Error fetching nearby users:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/sos - Send SOS alert to nearby users
 */
app.post('/api/sos', async (req, res) => {
    try {
        const { userId, userName, message, latitude, longitude } = req.body;

        // Create SOS alert
        const sosAlert = new SOSAlert({
            senderId: userId,
            senderName: userName,
            message: message || 'Emergency! Need help!',
            latitude,
            longitude,
        });
        await sosAlert.save();

        // Update user status to emergency
        await UserLocation.findOneAndUpdate(
            { userId },
            { status: 'emergency', lastUpdated: new Date() }
        );

        // Get nearby users (within 2km)
        const allUsers = await UserLocation.find({
            status: { $in: ['safe', 'alert'] },
            userId: { $ne: userId },
        });

        const nearbyUsers = allUsers.filter(user => {
            const dist = calculateDistance(latitude, longitude, user.latitude, user.longitude);
            return dist <= 2000; // 2km radius
        });

        // Broadcast SOS to nearby users via Socket.io
        nearbyUsers.forEach(user => {
            io.emit(`sos_alert_${user.userId}`, {
                alertId: sosAlert._id,
                senderId: userId,
                senderName: userName,
                message: message,
                latitude,
                longitude,
                timestamp: sosAlert.timestamp,
            });
        });

        res.json({
            success: true,
            alertId: sosAlert._id,
            notifiedUsers: nearbyUsers.length,
        });
    } catch (error) {
        console.error('Error sending SOS:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/sos/active - Get active SOS alerts
 */
app.get('/api/sos/active', async (req, res) => {
    try {
        const alerts = await SOSAlert.find({ status: 'active' })
            .sort({ timestamp: -1 })
            .limit(20);

        res.json({ success: true, alerts });
    } catch (error) {
        console.error('Error fetching SOS alerts:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== WEBSOCKET EVENTS ====================

io.on('connection', (socket) => {
    console.log('🟢 Client connected:', socket.id);

    // User joins with their userId
    socket.on('join', (userId) => {
        socket.userId = userId;
        socket.join(userId);
        console.log(`User ${userId} joined`);
    });

    // Real-time location updates
    socket.on('update_location', async (data) => {
        const { userId, userName, latitude, longitude, status } = data;

        try {
            // Update in database
            await UserLocation.findOneAndUpdate(
                { userId },
                {
                    userId,
                    userName,
                    latitude,
                    longitude,
                    status: status || 'safe',
                    lastUpdated: new Date(),
                },
                { upsert: true }
            );

            // Broadcast to all clients
            io.emit('location_update', {
                userId,
                userName,
                latitude,
                longitude,
                status,
            });
        } catch (error) {
            console.error('Error updating location:', error);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('🔴 Client disconnected:', socket.id);
        if (socket.userId) {
            // Mark user as offline
            UserLocation.findOneAndUpdate(
                { userId: socket.userId },
                { status: 'offline', lastUpdated: new Date() }
            ).catch(err => console.error('Error updating offline status:', err));
        }
    });
});

// ==================== SERVER START ====================

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 NYRA Community Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
});
