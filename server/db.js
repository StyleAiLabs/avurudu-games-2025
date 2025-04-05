// server/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure the database directory exists
const dbDir = path.resolve(__dirname);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Create a new database or connect to existing one
const dbPath = path.resolve(__dirname, 'avurudu_games_2025.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database at:', dbPath);
        createTables();
    }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Create necessary tables if they don't exist
function createTables() {
    console.log('Creating tables...');

    // Participants table
    db.run(`CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    age_group TEXT NOT NULL,
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, function (err) {
        if (err) {
            console.error('Error creating participants table:', err.message);
        } else {
            console.log('Participants table ready');
        }
    });

    // Games table with metadata
    db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    age_limit TEXT,
    pre_registration TEXT,
    game_zone TEXT,
    game_time TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, function (err) {
        if (err) {
            console.error('Error creating games table:', err.message);
        } else {
            console.log('Games table ready');
            // Populate games after table is created
            populateGames();
        }
    });

    // Participant_games junction table (for many-to-many relationship)
    db.run(`CREATE TABLE IF NOT EXISTS participant_games (
    participant_id INTEGER,
    game_id INTEGER,
    PRIMARY KEY (participant_id, game_id),
    FOREIGN KEY (participant_id) REFERENCES participants (id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
  )`, function (err) {
        if (err) {
            console.error('Error creating participant_games table:', err.message);
        } else {
            console.log('Participant_games table ready');
        }
    });
}

// Populate games table with predefined games
function populateGames() {
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
        {
            name: 'Banis Kaema (Bun Eating)',
            age_limit: 'All Ages',
            pre_registration: 'Y',
            game_zone: 'Zone C',
            game_time: '12:00 PM'
        },
        {
            name: 'Lissana Gaha Nageema (Greasy Pole Climbing)',
            age_limit: 'Adult (Over 16)',
            pre_registration: 'N',
            game_zone: 'Zone D',
            game_time: '1:00 PM'
        },
        {
            name: 'Aliyata Aha Thaebeema (Feeding the Elephant)',
            age_limit: 'Under 12',
            pre_registration: 'Y',
            game_zone: 'Zone A',
            game_time: '2:00 PM'
        },
        {
            name: 'Kamba Adeema (Tug of War)',
            age_limit: 'All Ages',
            pre_registration: 'Y',
            game_zone: 'Zone E',
            game_time: '3:00 PM'
        },
        {
            name: 'Coconut Scraping',
            age_limit: 'Adult (Over 16)',
            pre_registration: 'N',
            game_zone: 'Zone B',
            game_time: '4:00 PM'
        },
        {
            name: 'Lime and Spoon Race',
            age_limit: 'All Ages',
            pre_registration: 'Y',
            game_zone: 'Zone C',
            game_time: '5:00 PM'
        }
    ];

    console.log('Populating games table with metadata...');

    // Create a Promise-based function to insert games sequentially
    const insertGamesSequentially = () => {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                // Begin transaction for batch inserts
                db.run('BEGIN TRANSACTION');

                // Prepare statement once
                const stmt = db.prepare(`
                    INSERT OR IGNORE INTO games 
                    (name, age_limit, pre_registration, game_zone, game_time) 
                    VALUES (?, ?, ?, ?, ?)
                `);

                // Insert each game with metadata
                games.forEach(game => {
                    stmt.run(
                        game.name,
                        game.age_limit,
                        game.pre_registration,
                        game.game_zone,
                        game.game_time
                    );
                });

                // Finalize the statement
                stmt.finalize();

                // Commit the transaction
                db.run('COMMIT', (err) => {
                    if (err) {
                        console.error('Error committing games transaction:', err);
                        db.run('ROLLBACK');
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });
    };

    // Execute the inserts and then verify
    insertGamesSequentially()
        .then(() => {
            // Log all games in the database for verification
            db.all('SELECT * FROM games', [], (err, rows) => {
                if (err) {
                    console.error('Error querying games:', err.message);
                } else {
                    console.log('Games in database:', rows.length);
                    rows.forEach(row => {
                        console.log(`  ${row.id}: ${row.name} (${row.age_limit}, ${row.game_time})`);
                    });
                }
            });
        })
        .catch(err => {
            console.error('Failed to populate games:', err);
        });
}

// Function to ensure all games exist in the database
function ensureGamesExist(gameNames) {
    return new Promise((resolve, reject) => {
        // Get all games from the database
        db.all('SELECT name FROM games', [], (err, rows) => {
            if (err) {
                return reject(new Error('Failed to check games: ' + err.message));
            }

            // Extract game names to an array
            const existingGames = rows.map(row => row.name);

            // Check if all selected games exist in the database
            const missingGames = gameNames.filter(game => !existingGames.includes(game));

            if (missingGames.length > 0) {
                // Log the issue clearly
                console.error('Missing games detected:', missingGames);
                console.error('Games in database:', existingGames);

                return reject(new Error(`One or more selected games were not found: ${missingGames.join(', ')}`));
            }

            // All games exist
            resolve();
        });
    });
}

// Function to register a participant
function registerParticipant(participant, callback) {
    console.log('Registering participant:', participant);

    // Validate input
    if (!participant.firstName || !participant.lastName || !participant.contactNumber || !participant.ageGroup) {
        return callback(new Error('Missing required fields'));
    }

    if (!Array.isArray(participant.selectedGames) || participant.selectedGames.length === 0) {
        return callback(new Error('At least one game must be selected'));
    }

    // First, ensure all games exist in the database
    ensureGamesExist(participant.selectedGames)
        .then(() => {
            // Continue with participant registration
            registerParticipantWithGames(participant, callback);
        })
        .catch(err => {
            console.error('Error ensuring games exist:', err.message);
            callback(err);
        });
}

// Function to register participant after games are validated
function registerParticipantWithGames(participant, callback) {
    db.serialize(() => {
        // Begin transaction
        db.run('BEGIN TRANSACTION');

        // Insert participant
        db.run(
            `INSERT INTO participants (first_name, last_name, contact_number, age_group)
            VALUES (?, ?, ?, ?)`,
            [
                participant.firstName,
                participant.lastName,
                participant.contactNumber,
                participant.ageGroup
            ],
            function (err) {
                if (err) {
                    console.error('Error inserting participant:', err.message);
                    db.run('ROLLBACK');
                    return callback(err);
                }

                const participantId = this.lastID;
                console.log(`Participant inserted with ID: ${participantId}`);

                // Get game IDs for selected games
                const promises = participant.selectedGames.map(gameName => {
                    return new Promise((resolve, reject) => {
                        db.get('SELECT id FROM games WHERE name = ?', [gameName], (err, game) => {
                            if (err) {
                                return reject(err);
                            }
                            if (!game) {
                                return reject(new Error(`Game not found: ${gameName}`));
                            }
                            resolve({ name: gameName, id: game.id });
                        });
                    });
                });

                // Process all game lookups
                Promise.all(promises)
                    .then(games => {
                        // Prepare statement for participant_games insertions
                        const stmt = db.prepare('INSERT INTO participant_games (participant_id, game_id) VALUES (?, ?)');

                        // Insert all game associations
                        games.forEach(game => {
                            stmt.run(participantId, game.id, err => {
                                if (err) {
                                    console.error(`Error associating game ${game.name}:`, err.message);
                                } else {
                                    console.log(`Added game "${game.name}" (ID: ${game.id}) to participant ${participantId}`);
                                }
                            });
                        });

                        // Finalize statement
                        stmt.finalize();

                        // Commit transaction
                        db.run('COMMIT', err => {
                            if (err) {
                                console.error('Error committing transaction:', err.message);
                                db.run('ROLLBACK');
                                return callback(err);
                            }

                            console.log(`Successfully registered participant ${participantId} with ${games.length} games`);

                            // Return the newly created participant
                            callback(null, {
                                id: participantId,
                                ...participant
                            });
                        });
                    })
                    .catch(err => {
                        console.error('Error processing games:', err.message);
                        db.run('ROLLBACK');
                        callback(err);
                    });
            }
        );
    });
}

// Function to get all participants with their games
function getAllParticipants(callback) {
    console.log('Fetching all participants');

    // Get all participants from the database
    db.all(`
    SELECT 
      p.id, 
      p.first_name, 
      p.last_name, 
      p.contact_number, 
      p.age_group, 
      p.registration_date
    FROM participants p
    ORDER BY p.registration_date DESC
  `, [], (err, participants) => {
        if (err) {
            console.error('Error fetching participants:', err.message);
            return callback(err);
        }

        console.log(`Found ${participants.length} participants`);

        if (participants.length === 0) {
            return callback(null, []);
        }

        // For each participant, get their games
        const participantsWithGames = [];
        let pending = participants.length;

        participants.forEach(participant => {
            // Get games for this participant
            db.all(`
        SELECT g.name
        FROM games g
        JOIN participant_games pg ON g.id = pg.game_id
        WHERE pg.participant_id = ?
      `, [participant.id], (err, games) => {
                if (err) {
                    console.error(`Error fetching games for participant ${participant.id}:`, err.message);
                    // Even if there's an error, continue with other participants
                    games = [];
                }

                console.log(`Found ${games.length} games for participant ${participant.id}`);

                // Add participant with their games to the array
                participantsWithGames.push({
                    ...participant,
                    games: games.map(g => g.name)
                });

                pending--;
                if (pending === 0) {
                    // All participants processed, return the results
                    callback(null, participantsWithGames);
                }
            });
        });
    });
}

function deleteParticipant(participantId, callback) {
    const query = 'DELETE FROM participants WHERE id = ?';

    db.run(query, [participantId], function (err) {
        if (err) {
            return callback(err);
        }

        if (this.changes === 0) {
            return callback(new Error('Participant not found'));
        }

        callback(null, { id: participantId });
    });
}

// Add to exports
module.exports = {
    // ...existing exports...
    deleteParticipant
};

// Function to get all games with metadata
function getAllGames(callback) {
    console.log('Fetching all games from database');

    // Check if table exists
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='games'", (err, table) => {
        if (err) {
            console.error('Error checking if games table exists:', err.message);
            return callback(err);
        }

        if (!table) {
            console.error('Games table does not exist in the database');
            return callback(new Error('Games table does not exist'));
        }

        // Get table info to check which columns exist
        db.all("PRAGMA table_info(games)", (err, columns) => {
            if (err) {
                console.error('Error getting table info:', err.message);
                return callback(err);
            }

            console.log('Available columns in games table:', columns.map(col => col.name));

            // Build the query based on existing columns
            const hasCreatedAt = columns.some(col => col.name === 'created_at');
            const hasUpdatedAt = columns.some(col => col.name === 'updated_at');

            let query = 'SELECT id, name';

            // Add other columns that should exist
            if (columns.some(col => col.name === 'age_limit')) query += ', age_limit';
            if (columns.some(col => col.name === 'pre_registration')) query += ', pre_registration';
            if (columns.some(col => col.name === 'game_zone')) query += ', game_zone';
            if (columns.some(col => col.name === 'game_time')) query += ', game_time';

            // Add timestamp columns if they exist
            if (hasCreatedAt) query += ', created_at';
            if (hasUpdatedAt) query += ', updated_at';

            query += ' FROM games ORDER BY name ASC';

            console.log('Executing query:', query);

            // Execute the query with only existing columns
            db.all(query, [], (err, games) => {
                if (err) {
                    console.error('Error executing query to fetch games:', err.message);
                    return callback(err);
                }

                console.log(`Found ${games ? games.length : 0} games in database`);

                // If timestamp columns don't exist, add placeholder values
                if (!hasCreatedAt || !hasUpdatedAt) {
                    const now = new Date().toISOString();
                    games = games.map(game => ({
                        ...game,
                        created_at: hasCreatedAt ? game.created_at : now,
                        updated_at: hasUpdatedAt ? game.updated_at : now
                    }));
                }

                // Return empty array instead of null/undefined
                callback(null, games || []);
            });
        });
    });
}

// Function to create a new game with metadata
function createGame(gameData, callback) {
    console.log('Creating new game:', gameData);

    // Validate required fields
    if (!gameData.name) {
        return callback(new Error('Game name is required'));
    }

    // First check if the table has the right columns
    db.all("PRAGMA table_info(games)", (err, columns) => {
        if (err) {
            console.error('Error getting table info:', err.message);
            return callback(err);
        }

        console.log('Available columns in games table:', columns.map(col => col.name));

        // Build the insert query based on available columns
        const columnNames = columns.map(col => col.name);
        let fields = ['name'];
        let placeholders = ['?'];
        let values = [gameData.name];

        // Add other fields if the columns exist
        if (columnNames.includes('age_limit')) {
            fields.push('age_limit');
            placeholders.push('?');
            values.push(gameData.age_limit || 'All Ages');
        }

        if (columnNames.includes('pre_registration')) {
            fields.push('pre_registration');
            placeholders.push('?');
            values.push(gameData.pre_registration || 'N');
        }

        if (columnNames.includes('game_zone')) {
            fields.push('game_zone');
            placeholders.push('?');
            values.push(gameData.game_zone || '');
        }

        if (columnNames.includes('game_time')) {
            fields.push('game_time');
            placeholders.push('?');
            values.push(gameData.game_time || '');
        }

        // Build and execute the dynamic insert query
        const insertQuery = `
            INSERT INTO games (${fields.join(', ')}) 
            VALUES (${placeholders.join(', ')})
        `;

        console.log('Executing insert query:', insertQuery);
        console.log('With values:', values);

        db.run(insertQuery, values, function (err) {
            if (err) {
                console.error('Error creating game:', err.message);

                // Check for UNIQUE constraint violation
                if (err.message.includes('UNIQUE constraint failed')) {
                    return callback(new Error('A game with this name already exists'));
                }

                return callback(err);
            }

            const gameId = this.lastID;
            console.log(`Game created with ID: ${gameId}`);

            // Build the select query to match our insert fields
            let selectQuery = 'SELECT id, name';
            for (const field of ['age_limit', 'pre_registration', 'game_zone', 'game_time']) {
                if (columnNames.includes(field)) {
                    selectQuery += `, ${field}`;
                }
            }
            if (columnNames.includes('created_at')) selectQuery += ', created_at';
            if (columnNames.includes('updated_at')) selectQuery += ', updated_at';
            selectQuery += ' FROM games WHERE id = ?';

            console.log('Executing select query:', selectQuery);

            // Get the newly created game with available columns
            db.get(selectQuery, [gameId], (err, game) => {
                if (err) {
                    console.error(`Error fetching created game with ID ${gameId}:`, err.message);

                    // Instead of returning an error, return the basic game data we already have
                    const now = new Date().toISOString();
                    return callback(null, {
                        id: gameId,
                        name: gameData.name,
                        age_limit: gameData.age_limit || 'All Ages',
                        pre_registration: gameData.pre_registration || 'N',
                        game_zone: gameData.game_zone || '',
                        game_time: gameData.game_time || '',
                        created_at: now,
                        updated_at: now
                    });
                }

                if (!game) {
                    console.error(`Game with ID ${gameId} not found after creation`);

                    // Instead of returning an error, return the basic game data we already have
                    const now = new Date().toISOString();
                    return callback(null, {
                        id: gameId,
                        name: gameData.name,
                        age_limit: gameData.age_limit || 'All Ages',
                        pre_registration: gameData.pre_registration || 'N',
                        game_zone: gameData.game_zone || '',
                        game_time: gameData.game_time || '',
                        created_at: now,
                        updated_at: now
                    });
                }

                // Add any missing fields with default values
                if (!columnNames.includes('created_at')) game.created_at = new Date().toISOString();
                if (!columnNames.includes('updated_at')) game.updated_at = new Date().toISOString();
                if (!columnNames.includes('age_limit')) game.age_limit = gameData.age_limit || 'All Ages';
                if (!columnNames.includes('pre_registration')) game.pre_registration = gameData.pre_registration || 'N';
                if (!columnNames.includes('game_zone')) game.game_zone = gameData.game_zone || '';
                if (!columnNames.includes('game_time')) game.game_time = gameData.game_time || '';

                console.log('Game created successfully:', game);
                callback(null, game);
            });
        });
    });
}

// Function to update an existing game
function updateGame(gameId, gameData, callback) {
    console.log(`Updating game ${gameId}:`, gameData);

    // Validate game ID
    if (!gameId) {
        return callback(new Error('Game ID is required'));
    }

    // Validate at least one field to update
    if (!gameData.name && !gameData.age_limit &&
        !gameData.pre_registration && !gameData.game_zone &&
        !gameData.game_time) {
        return callback(new Error('At least one field to update is required'));
    }

    // Check if the game exists
    db.get('SELECT id FROM games WHERE id = ?', [gameId], (err, game) => {
        if (err) {
            console.error('Error checking game existence:', err.message);
            return callback(err);
        }

        if (!game) {
            return callback(new Error('Game not found'));
        }

        // Build the update query dynamically based on provided fields
        const updates = [];
        const values = [];

        if (gameData.name) {
            updates.push('name = ?');
            values.push(gameData.name);
        }

        if (gameData.age_limit) {
            updates.push('age_limit = ?');
            values.push(gameData.age_limit);
        }

        if (gameData.pre_registration) {
            updates.push('pre_registration = ?');
            values.push(gameData.pre_registration);
        }

        if (gameData.game_zone) {
            updates.push('game_zone = ?');
            values.push(gameData.game_zone);
        }

        if (gameData.game_time) {
            updates.push('game_time = ?');
            values.push(gameData.game_time);
        }

        // Add updated_at timestamp
        updates.push('updated_at = CURRENT_TIMESTAMP');

        // Add the game ID to values array
        values.push(gameId);

        // Execute the update
        db.run(`
            UPDATE games 
            SET ${updates.join(', ')} 
            WHERE id = ?
        `, values, function (err) {
            if (err) {
                console.error('Error updating game:', err.message);

                // Check for UNIQUE constraint violation
                if (err.message.includes('UNIQUE constraint failed')) {
                    return callback(new Error('A game with this name already exists'));
                }

                return callback(err);
            }

            if (this.changes === 0) {
                return callback(new Error('Game not found or no changes made'));
            }

            // Get the updated game
            db.get(`
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
                WHERE id = ?
            `, [gameId], (err, game) => {
                if (err) {
                    console.error('Error fetching updated game:', err.message);
                    return callback(new Error('Game updated but failed to retrieve details'));
                }

                console.log('Game updated successfully:', game);
                callback(null, game);
            });
        });
    });
}

// Function to delete a game
function deleteGame(gameId, callback) {
    console.log(`Deleting game ${gameId}`);

    // Validate game ID
    if (!gameId) {
        return callback(new Error('Game ID is required'));
    }

    // Check if the game exists
    db.get('SELECT id FROM games WHERE id = ?', [gameId], (err, game) => {
        if (err) {
            console.error('Error checking game existence:', err.message);
            return callback(err);
        }

        if (!game) {
            return callback(new Error('Game not found'));
        }

        // First check if game is associated with any participants
        db.get('SELECT COUNT(*) as count FROM participant_games WHERE game_id = ?', [gameId], (err, result) => {
            if (err) {
                console.error('Error checking game associations:', err.message);
                return callback(err);
            }

            if (result.count > 0) {
                return callback(new Error(`Cannot delete game as it is associated with ${result.count} participants`));
            }

            // Delete the game
            db.run('DELETE FROM games WHERE id = ?', [gameId], function (err) {
                if (err) {
                    console.error('Error deleting game:', err.message);
                    return callback(err);
                }

                if (this.changes === 0) {
                    return callback(new Error('Game not found or no changes made'));
                }

                console.log(`Game ${gameId} deleted successfully`);
                callback(null, { id: gameId, message: 'Game deleted successfully' });
            });
        });
    });
}

// Export functions and database connection
module.exports = {
    db,
    registerParticipant,
    getAllParticipants,
    getAllGames,
    createGame,
    updateGame,
    deleteGame,
    deleteParticipant
};