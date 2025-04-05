// server/db-pg.js
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

// Create a new pool using the connection string from environment variables
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Log connection
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

// Error handling
pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    process.exit(-1);
});

// Initialize database schema
async function createTables() {
    const client = await pool.connect();
    try {
        console.log('Creating tables...');

        // Start transaction
        await client.query('BEGIN');

        // Create participants table
        await client.query(`
      CREATE TABLE IF NOT EXISTS participants (
        id SERIAL PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        contact_number TEXT NOT NULL,
        age_group TEXT NOT NULL,
        registration_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('Participants table ready');

        // Create games table
        await client.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        age_limit TEXT,
        pre_registration TEXT,
        game_zone TEXT,
        game_time TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (name,age_limit)
      )
    `);
        console.log('Games table ready');

        // Create junction table
        await client.query(`
      CREATE TABLE IF NOT EXISTS participant_games (
        participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
        game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
        PRIMARY KEY (participant_id, game_id)
      )
    `);
        console.log('Participant_games table ready');

        // Commit transaction
        await client.query('COMMIT');

        // Populate games table
        await populateGames();

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating tables:', err);
        throw err;
    } finally {
        client.release();
    }
}

// Populate games (example games from your SQLite implementation)
async function populateGames() {
    const games = [
        {
            name: 'Kotta Pora (Pillow Fighting)',
            age_limit: 'Under 12',
            pre_registration: 'Y',
            game_zone: 'Zone A',
            game_time: '10:00 AM'
        },
        {
            name: 'Kana Mutti (Pot Breaking)',
            age_limit: 'All Ages',
            pre_registration: 'Y',
            game_zone: 'Zone B',
            game_time: '11:00 AM'
        },
        // Add all other games...
        {
            name: 'Lime and Spoon Race',
            age_limit: 'All Ages',
            pre_registration: 'Y',
            game_zone: 'Zone C',
            game_time: '5:00 PM'
        }
    ];

    console.log('Populating games table with metadata...');

    const client = await pool.connect();
    try {
        // Begin transaction
        await client.query('BEGIN');

        // Insert each game
        for (const game of games) {
            await client.query(
                `INSERT INTO games (name, age_limit, pre_registration, game_zone, game_time)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (name) DO NOTHING`,
                [game.name, game.age_limit, game.pre_registration, game.game_zone, game.game_time]
            );
        }

        // Commit transaction
        await client.query('COMMIT');

        // Log success
        const { rows } = await client.query('SELECT COUNT(*) FROM games');
        console.log(`Games in database: ${rows[0].count}`);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error populating games:', err);
        throw err;
    } finally {
        client.release();
    }
}

// Function to register a participant
async function registerParticipant(participant) {
    if (!participant.firstName || !participant.lastName || !participant.contactNumber || !participant.ageGroup) {
        throw new Error('Missing required fields');
    }

    if (!Array.isArray(participant.selectedGames) || participant.selectedGames.length === 0) {
        throw new Error('At least one game must be selected');
    }

    const client = await pool.connect();
    try {
        // Begin transaction
        await client.query('BEGIN');

        // Insert participant
        const participantResult = await client.query(
            `INSERT INTO participants (first_name, last_name, contact_number, age_group)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
            [participant.firstName, participant.lastName, participant.contactNumber, participant.ageGroup]
        );

        const participantId = participantResult.rows[0].id;

        // Get game IDs for selected games
        for (const gameName of participant.selectedGames) {
            // Get game ID
            const gameResult = await client.query(
                'SELECT id FROM games WHERE name = $1',
                [gameName]
            );

            if (gameResult.rows.length === 0) {
                throw new Error(`Game not found: ${gameName}`);
            }

            const gameId = gameResult.rows[0].id;

            // Insert into junction table
            await client.query(
                'INSERT INTO participant_games (participant_id, game_id) VALUES ($1, $2)',
                [participantId, gameId]
            );
        }

        // Commit transaction
        await client.query('COMMIT');

        return {
            id: participantId,
            ...participant
        };

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error registering participant:', err);
        throw err;
    } finally {
        client.release();
    }
}

// Function to get all participants
async function getAllParticipants() {
    const client = await pool.connect();
    try {
        // Get all participants
        const participantsResult = await client.query(`
      SELECT 
        id, 
        first_name, 
        last_name, 
        contact_number, 
        age_group, 
        registration_date
      FROM participants
      ORDER BY registration_date DESC
    `);

        const participants = participantsResult.rows;

        // For each participant, get their games
        const participantsWithGames = [];

        for (const participant of participants) {
            // Get games for this participant
            const gamesResult = await client.query(`
        SELECT g.name
        FROM games g
        JOIN participant_games pg ON g.id = pg.game_id
        WHERE pg.participant_id = $1
      `, [participant.id]);

            // Add participant with their games to the array
            participantsWithGames.push({
                id: participant.id,
                firstName: participant.first_name,
                lastName: participant.last_name,
                contactNumber: participant.contact_number,
                ageGroup: participant.age_group,
                registrationDate: participant.registration_date,
                games: gamesResult.rows.map(g => g.name)
            });
        }

        return participantsWithGames;

    } catch (err) {
        console.error('Error fetching participants:', err);
        throw err;
    } finally {
        client.release();
    }
}

async function deleteParticipant(participantId) {
    if (!participantId) {
        throw new Error('Participant ID is required');
    }

    const client = await pool.connect();
    try {
        // Begin transaction
        await client.query('BEGIN');

        // Check if the participant exists
        const checkResult = await client.query('SELECT id FROM participants WHERE id = $1', [participantId]);
        if (checkResult.rows.length === 0) {
            throw new Error('Participant not found');
        }

        // First delete from the junction table
        await client.query('DELETE FROM participant_games WHERE participant_id = $1', [participantId]);

        // Then delete the participant
        await client.query('DELETE FROM participants WHERE id = $1', [participantId]);

        // Commit transaction
        await client.query('COMMIT');

        return { id: participantId, message: 'Participant deleted successfully' };

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting participant:', err);
        throw err;
    } finally {
        client.release();
    }
}
// Function to get all games
async function getAllGames() {
    const client = await pool.connect();
    try {
        const result = await client.query(`
      SELECT 
        id, 
        name, 
        age_limit, 
        pre_registration, 
        game_zone, 
        game_time,
        created_at,
        updated_at
      FROM games
      ORDER BY name ASC
    `);

        return result.rows;

    } catch (err) {
        console.error('Error fetching games:', err);
        throw err;
    } finally {
        client.release();
    }
}

// Function to create a new game
async function createGame(gameData) {
    if (!gameData.name) {
        throw new Error('Game name is required');
    }

    const client = await pool.connect();
    try {
        const result = await client.query(`
      INSERT INTO games (name, age_limit, pre_registration, game_zone, game_time)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, age_limit, pre_registration, game_zone, game_time, created_at, updated_at
    `, [
            gameData.name,
            gameData.age_limit || 'All Ages',
            gameData.pre_registration || 'N',
            gameData.game_zone || '',
            gameData.game_time || ''
        ]);

        return result.rows[0];

    } catch (err) {
        if (err.code === '23505') { // Unique constraint violation
            throw new Error('A game with this name already exists');
        }
        console.error('Error creating game:', err);
        throw err;
    } finally {
        client.release();
    }
}

// Function to update a game
async function updateGame(gameId, gameData) {
    if (!gameId) {
        throw new Error('Game ID is required');
    }

    // Build the update query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (gameData.name) {
        updates.push(`name = $${paramCount}`);
        values.push(gameData.name);
        paramCount++;
    }

    if (gameData.age_limit) {
        updates.push(`age_limit = $${paramCount}`);
        values.push(gameData.age_limit);
        paramCount++;
    }

    if (gameData.pre_registration) {
        updates.push(`pre_registration = $${paramCount}`);
        values.push(gameData.pre_registration);
        paramCount++;
    }

    if (gameData.game_zone) {
        updates.push(`game_zone = $${paramCount}`);
        values.push(gameData.game_zone);
        paramCount++;
    }

    if (gameData.game_time) {
        updates.push(`game_time = $${paramCount}`);
        values.push(gameData.game_time);
        paramCount++;
    }

    if (updates.length === 0) {
        throw new Error('At least one field to update is required');
    }

    // Add updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add the game ID to values array
    values.push(gameId);

    const client = await pool.connect();
    try {
        // Check if the game exists
        const checkResult = await client.query('SELECT id FROM games WHERE id = $1', [gameId]);
        if (checkResult.rows.length === 0) {
            throw new Error('Game not found');
        }

        // Execute the update
        const result = await client.query(`
      UPDATE games 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, name, age_limit, pre_registration, game_zone, game_time, created_at, updated_at
    `, values);

        return result.rows[0];

    } catch (err) {
        if (err.code === '23505') { // Unique constraint violation
            throw new Error('A game with this name already exists');
        }
        console.error('Error updating game:', err);
        throw err;
    } finally {
        client.release();
    }
}

// Function to delete a game
async function deleteGame(gameId) {
    if (!gameId) {
        throw new Error('Game ID is required');
    }

    const client = await pool.connect();
    try {
        // Check if the game exists
        const checkResult = await client.query('SELECT id FROM games WHERE id = $1', [gameId]);
        if (checkResult.rows.length === 0) {
            throw new Error('Game not found');
        }

        // Check if game is associated with any participants
        const associationResult = await client.query(
            'SELECT COUNT(*) as count FROM participant_games WHERE game_id = $1',
            [gameId]
        );

        if (parseInt(associationResult.rows[0].count) > 0) {
            throw new Error(`Cannot delete game as it is associated with ${associationResult.rows[0].count} participants`);
        }

        // Delete the game
        await client.query('DELETE FROM games WHERE id = $1', [gameId]);

        return { id: gameId, message: 'Game deleted successfully' };

    } catch (err) {
        console.error('Error deleting game:', err);
        throw err;
    } finally {
        client.release();
    }
}

// Initialize database
async function initDatabase() {
    try {
        await createTables();
        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Database initialization failed:', err);
        throw err;
    }
}

// Export functions and pool
module.exports = {
    pool,
    initDatabase,
    registerParticipant,
    getAllParticipants,
    getAllGames,
    createGame,
    updateGame,
    deleteGame,
    deleteParticipant
};