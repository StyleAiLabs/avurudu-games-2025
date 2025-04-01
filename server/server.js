// server/server.js - Updated authentication
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const {
    registerParticipant,
    getAllParticipants,
    getAllGames,
    getGameById,
    createGame,
    updateGame,
    deleteGame
} = require('./db');

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

// Public endpoint to get all games for the registration form
app.get('/api/games', (req, res) => {
    console.log('Request received for all games');

    getAllGames((err, games) => {
        if (err) {
            console.error('Error fetching games:', err.message);
            return res.status(500).json({ error: 'Failed to fetch games: ' + err.message });
        }

        console.log(`Returning ${games.length} games`);
        res.json(games);
    });
});

// Protected admin API endpoint to get all games
app.get('/api/admin/games', basicAuth, (req, res) => {
    console.log('Admin request received for all games');

    getAllGames((err, games) => {
        if (err) {
            console.error('Error fetching games:', err.message);
            return res.status(500).json({ error: 'Failed to fetch games: ' + err.message });
        }

        console.log(`Returning ${games.length} games to admin`);
        res.json(games);
    });
});

// Protected admin API endpoint to get a game by ID
app.get('/api/admin/games/:id', basicAuth, (req, res) => {
    const id = req.params.id;
    console.log(`Admin request received for game with ID: ${id}`);

    getGameById(id, (err, game) => {
        if (err) {
            console.error(`Error fetching game with ID ${id}:`, err.message);
            if (err.message.includes('not found')) {
                return res.status(404).json({ error: `Game with ID ${id} not found` });
            }
            return res.status(500).json({ error: 'Failed to fetch game: ' + err.message });
        }

        console.log(`Returning game with ID ${id} to admin`);
        res.json(game);
    });
});

// Protected admin API endpoint to create a new game
app.post('/api/admin/games', basicAuth, (req, res) => {
    console.log('Admin request received to create a new game:', req.body);

    const game = {
        name: req.body.name,
        ageLimit: req.body.ageLimit,
        preRegistration: req.body.preRegistration || 'Y',
        gameZone: req.body.gameZone,
        gameTime: req.body.gameTime
    };

    // Validate required fields
    if (!game.name || !game.ageLimit || !game.gameZone || !game.gameTime) {
        console.warn('Game creation validation failed: Missing required fields');
        return res.status(400).json({ error: 'Name, age limit, game zone and game time are required' });
    }

    createGame(game, (err, result) => {
        if (err) {
            console.error('Error creating game:', err.message);
            return res.status(500).json({ error: 'Failed to create game: ' + err.message });
        }

        console.log('Game creation successful:', result);
        res.status(201).json(result);
    });
});

// Protected admin API endpoint to update an existing game
app.put('/api/admin/games/:id', basicAuth, (req, res) => {
    const id = req.params.id;
    console.log(`Admin request received to update game with ID: ${id}`, req.body);

    const game = {
        name: req.body.name,
        ageLimit: req.body.ageLimit,
        preRegistration: req.body.preRegistration,
        gameZone: req.body.gameZone,
        gameTime: req.body.gameTime
    };

    // Validate required fields
    if (!game.name || !game.ageLimit || !game.gameZone || !game.gameTime) {
        console.warn('Game update validation failed: Missing required fields');
        return res.status(400).json({ error: 'Name, age limit, game zone and game time are required' });
    }

    updateGame(id, game, (err, result) => {
        if (err) {
            console.error(`Error updating game with ID ${id}:`, err.message);
            if (err.message.includes('not found')) {
                return res.status(404).json({ error: `Game with ID ${id} not found` });
            }
            return res.status(500).json({ error: 'Failed to update game: ' + err.message });
        }

        console.log('Game update successful:', result);
        res.json(result);
    });
});

// Protected admin API endpoint to delete a game
app.delete('/api/admin/games/:id', basicAuth, (req, res) => {
    const id = req.params.id;
    console.log(`Admin request received to delete game with ID: ${id}`);

    deleteGame(id, (err, result) => {
        if (err) {
            console.error(`Error deleting game with ID ${id}:`, err.message);
            if (err.message.includes('not found')) {
                return res.status(404).json({ error: `Game with ID ${id} not found` });
            }
            return res.status(500).json({ error: 'Failed to delete game: ' + err.message });
        }

        console.log(`Game with ID ${id} deleted successfully`);
        res.status(204).send();
    });
});

// New endpoint for creating games with additional logging
app.post('/games', basicAuth, async (req, res) => {
    console.log('Received game data:', req.body);

    const { name, age_limit, pre_registration, game_zone, game_time } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
        console.log('Name validation failed:', { receivedName: name });
        return res.status(400).json({ error: 'Game name is required' });
    }

    // ...rest of the validation and game creation code
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
