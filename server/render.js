// server/render.js - Special entry point for Render deployment
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const {
    initDatabase,
    registerParticipant,
    getAllParticipants,
    getAllGames,
    createGame,
    updateGame,
    deleteGame,
    deleteParticipant
} = require('./db-pg');

const app = express();
const PORT = process.env.PORT || 3001;

// Admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'pass@123';

// Initialize database
initDatabase().catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

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

// Updated CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = ['https://avurudu-kreeda.netlify.app', 'http://localhost:3000'];
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS blocked for origin:', origin);
            callback(null, false);
        }
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Origin,X-Requested-With,Content-Type,Accept,Authorization"
};

app.use(cors(corsOptions));

// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions));

app.use(bodyParser.json());

// Log critical environment information for debugging
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current directory:', __dirname);
console.log('Parent directory:', path.resolve(__dirname, '..'));
console.log('Possible build paths:');
[
    path.join(__dirname, '../build'),
    path.join(process.cwd(), 'build'),
    '/opt/render/project/src/build'
].forEach(p => {
    console.log(`- ${p} (exists: ${fs.existsSync(p)})`);
    if (fs.existsSync(p)) {
        try {
            console.log(`  Contents: ${fs.readdirSync(p).join(', ')}`);
        } catch (e) {
            console.log(`  Error reading directory: ${e.message}`);
        }
    }
});

// Determine the correct build path for Render
let buildPath = path.join(__dirname, '../build'); // Default path
if (process.env.NODE_ENV === 'production') {
    // Check Render's specific path
    if (fs.existsSync('/opt/render/project/src/build')) {
        buildPath = '/opt/render/project/src/build';
        console.log('Using Render-specific build path');
    } else {
        console.log('Using default build path (not found in Render location)');
    }
}

// Serve static files with error handling
console.log(`Attempting to serve static files from: ${buildPath}`);
try {
    app.use(express.static(buildPath));
} catch (error) {
    console.error('Error serving static files:', error);
}

// Log incoming requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// API endpoint to register a participant
app.post('/api/register', async (req, res) => {
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

    try {
        const result = await registerParticipant(participant);
        console.log('Registration successful:', result);
        res.status(201).json(result);
    } catch (err) {
        console.error('Error registering participant:', err.message);
        return res.status(500).json({ error: 'Failed to register participant: ' + err.message });
    }
});

// API endpoint to get all games
app.get('/api/games', async (req, res) => {
    console.log('Request received for all games');

    try {
        const games = await getAllGames();
        console.log(`Returning ${games.length} games`);
        res.json(games);
    } catch (err) {
        console.error('Error fetching games:', err.message);
        return res.status(500).json({ error: 'Failed to fetch games: ' + err.message });
    }
});

// Simple admin authentication test endpoint
app.get('/api/admin/auth-test', basicAuth, (req, res) => {
    res.json({ success: true, message: 'Authentication successful' });
});

// Protected admin API endpoint to get all participants
app.get('/api/admin/participants', basicAuth, async (req, res) => {
    console.log('Admin request received for all participants');

    try {
        const participants = await getAllParticipants();
        console.log(`Returning ${participants.length} participants to admin`);
        res.json(participants);
    } catch (err) {
        console.error('Error fetching participants:', err.message);
        return res.status(500).json({ error: 'Failed to fetch participants: ' + err.message });
    }
});

app.delete('/api/admin/participants/:id', basicAuth, async (req, res) => {
    const participantId = parseInt(req.params.id);
    console.log(`Admin request received to delete participant ${participantId}`);

    if (isNaN(participantId)) {
        return res.status(400).json({ error: 'Invalid participant ID' });
    }

    try {
        const result = await deleteParticipant(participantId);
        console.log('Participant deleted successfully:', result);
        res.json({ message: 'Participant deleted successfully' });
    } catch (err) {
        console.error('Error deleting participant:', err.message);

        if (err.message.includes('not found')) {
            return res.status(404).json({ error: err.message });
        }

        return res.status(500).json({ error: 'Failed to delete participant: ' + err.message });
    }
});

// Protected admin API endpoint to get all games
app.get('/api/admin/games', basicAuth, async (req, res) => {
    console.log('Admin request received for all games');

    // Get the credentials from the request
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');
        console.log(`Request from user: ${username}`);
    }

    try {
        const games = await getAllGames();
        // If no games were found, return an empty array instead of null
        const safeGames = games || [];
        console.log(`Returning ${safeGames.length} games to admin`);
        res.json(safeGames);
    } catch (err) {
        console.error('Error fetching games:', err.message);
        return res.status(500).json({ error: 'Failed to fetch games: ' + err.message });
    }
});

// Protected admin API endpoint to create a new game
app.post('/api/admin/games', basicAuth, async (req, res) => {
    console.log('Admin request received to create a new game:', req.body);

    // Extract game data from request
    const gameData = {
        name: req.body.name,
        age_limit: req.body.age_limit,
        pre_registration: req.body.pre_registration,
        game_zone: req.body.game_zone,
        game_time: req.body.game_time
    };

    // Validate required fields
    if (!gameData.name) {
        console.warn('Game creation validation failed: Game name is required');
        return res.status(400).json({ error: 'Game name is required' });
    }

    try {
        const game = await createGame(gameData);
        console.log('Game created successfully:', game);
        res.status(201).json(game);
    } catch (err) {
        console.error('Error creating game:', err.message);

        // Check for name uniqueness error
        if (err.message.includes('already exists')) {
            return res.status(409).json({ error: err.message });
        }

        return res.status(500).json({ error: 'Failed to create game: ' + err.message });
    }
});

// Protected admin API endpoint to update an existing game
app.put('/api/admin/games/:id', basicAuth, async (req, res) => {
    const gameId = parseInt(req.params.id);
    console.log(`Admin request received to update game ${gameId}:`, req.body);

    if (isNaN(gameId)) {
        return res.status(400).json({ error: 'Invalid game ID' });
    }

    // Extract game data from request
    const gameData = {
        name: req.body.name,
        age_limit: req.body.age_limit,
        pre_registration: req.body.pre_registration,
        game_zone: req.body.game_zone,
        game_time: req.body.game_time
    };

    try {
        const game = await updateGame(gameId, gameData);
        console.log('Game updated successfully:', game);
        res.json(game);
    } catch (err) {
        console.error('Error updating game:', err.message);

        if (err.message.includes('not found')) {
            return res.status(404).json({ error: err.message });
        }

        if (err.message.includes('already exists')) {
            return res.status(409).json({ error: err.message });
        }

        return res.status(500).json({ error: 'Failed to update game: ' + err.message });
    }
});

// Protected admin API endpoint to delete a game
app.delete('/api/admin/games/:id', basicAuth, async (req, res) => {
    const gameId = parseInt(req.params.id);
    console.log(`Admin request received to delete game ${gameId}`);

    if (isNaN(gameId)) {
        return res.status(400).json({ error: 'Invalid game ID' });
    }

    try {
        const result = await deleteGame(gameId);
        console.log('Game deleted successfully:', result);
        res.json(result);
    } catch (err) {
        console.error('Error deleting game:', err.message);

        if (err.message.includes('not found')) {
            return res.status(404).json({ error: err.message });
        }

        if (err.message.includes('associated with')) {
            return res.status(409).json({ error: err.message });
        }

        return res.status(500).json({ error: 'Failed to delete game: ' + err.message });
    }
});

// API health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA catchall handler with error handling
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        try {
            const indexPath = path.join(buildPath, 'index.html');
            console.log(`Attempting to serve SPA from: ${indexPath} (exists: ${fs.existsSync(indexPath)})`);

            if (fs.existsSync(indexPath)) {
                res.sendFile(indexPath);
            } else {
                // Fallback response if index.html doesn't exist
                res.status(200).send(`
                    <html>
                        <head><title>Avurudu API Server</title></head>
                        <body>
                            <h1>Avurudu Games API Server</h1>
                            <p>This is the API server for the Avurudu Games application.</p>
                            <p>The frontend is hosted at: <a href="https://avurudu-kreeda.netlify.app">https://avurudu-kreeda.netlify.app</a></p>
                            <p>Health check: <a href="/api/health">/api/health</a></p>
                        </body>
                    </html>
                `);
            }
        } catch (err) {
            console.error('Error serving index.html:', err);
            res.status(500).send('Server error');
        }
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
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});