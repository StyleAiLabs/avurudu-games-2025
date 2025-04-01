// server/server.js - Updated authentication
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { registerParticipant, getAllParticipants } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Admin credentials - made constants at the top for easy access
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'pass@123';

// Basic authentication middleware
const basicAuth = (req, res, next) => {
    // Check if Authorization header exists
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Extract credentials from Authorization header
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    // Log for debugging
    console.log(`Login attempt - Username: ${username}, Password: ${password}`);
    console.log(`Expected - Username: ${ADMIN_USERNAME}, Password: ${ADMIN_PASSWORD}`);

    // Check if credentials match exactly
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        console.log('Authentication successful');
        next();
    } else {
        console.log('Authentication failed');
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
        return res.status(401).json({ error: 'Invalid credentials' });
    }
};

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../build')));
}

// Log incoming requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// API endpoint to register a participant
app.post('/api/register', (req, res) => {
    console.log('Registration request received:', req.body);

    const participant = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        contactNumber: req.body.contactNumber,
        ageGroup: req.body.ageGroup,
        selectedGames: req.body.selectedGames || []
    };

    // Validate required fields
    if (!participant.firstName || !participant.lastName || !participant.contactNumber || !participant.ageGroup) {
        console.warn('Registration validation failed: Missing required fields');
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate contact number format
    if (!/^\d{10}$/.test(participant.contactNumber)) {
        console.warn('Registration validation failed: Invalid contact number format');
        return res.status(400).json({ error: 'Contact number must be 10 digits' });
    }

    // Ensure at least one game is selected
    if (!Array.isArray(participant.selectedGames) || participant.selectedGames.length === 0) {
        console.warn('Registration validation failed: No games selected');
        return res.status(400).json({ error: 'Please select at least one game' });
    }

    registerParticipant(participant, (err, result) => {
        if (err) {
            console.error('Error registering participant:', err.message);
            return res.status(500).json({ error: 'Failed to register participant: ' + err.message });
        }

        console.log('Registration successful:', result);
        res.status(201).json(result);
    });
});

// Simple admin authentication test endpoint
app.get('/api/admin/auth-test', basicAuth, (req, res) => {
    res.json({ success: true, message: 'Authentication successful' });
});

// Protected admin API endpoint to get all participants
app.get('/api/admin/participants', basicAuth, (req, res) => {
    console.log('Admin request received for all participants');

    getAllParticipants((err, participants) => {
        if (err) {
            console.error('Error fetching participants:', err.message);
            return res.status(500).json({ error: 'Failed to fetch participants: ' + err.message });
        }

        console.log(`Returning ${participants.length} participants to admin`);
        res.json(participants);
    });
});

// API health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../build/index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'An unexpected error occurred' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/`);
    console.log(`Admin endpoint available at http://localhost:${PORT}/api/admin/participants (protected)`);
    console.log(`Admin credentials: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
});