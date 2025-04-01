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

    // Games table with enhanced attributes
    db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    age_limit TEXT NOT NULL DEFAULT 'All Ages',
    pre_registration TEXT NOT NULL DEFAULT 'Y',
    game_zone TEXT NOT NULL DEFAULT 'Main Area',
    game_time TEXT NOT NULL DEFAULT 'TBD'
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
            age_limit: 'Between 6-12',
            pre_registration: 'Y',
            game_zone: 'Field A',
            game_time: '10:00 AM'
        },
        {
            name: 'Kana Mutti (Pot Breaking)',
            age_limit: 'Adult (Over 16)',
            pre_registration: 'Y',
            game_zone: 'Field B',
            game_time: '11:30 AM'
        },
        {
            name: 'Banis Kaema (Bun Eating)',
            age_limit: 'All Ages',
            pre_registration: 'Y',
            game_zone: 'Main Stage',
            game_time: '1:00 PM'
        },
        {
            name: 'Lissana Gaha Nageema (Greasy Pole Climbing)',
            age_limit: 'Adult (Over 16)',
            pre_registration: 'Y',
            game_zone: 'Field C',
            game_time: '2:30 PM'
        },
        {
            name: 'Aliyata Aha Thaebeema (Feeding the Elephant)',
            age_limit: 'Under 12',
            pre_registration: 'Y',
            game_zone: 'Field A',
            game_time: '11:00 AM'
        },
        {
            name: 'Kamba Adeema (Tug of War)',
            age_limit: 'All Ages',
            pre_registration: 'N',
            game_zone: 'Field B',
            game_time: '3:00 PM'
        },
        {
            name: 'Coconut Scraping',
            age_limit: 'Adult (Over 16)',
            pre_registration: 'Y',
            game_zone: 'Cooking Area',
            game_time: '12:00 PM'
        },
        {
            name: 'Lime and Spoon Race',
            age_limit: 'Under 12',
            pre_registration: 'Y',
            game_zone: 'Track Area',
            game_time: '10:30 AM'
        }
    ];

    console.log('Populating games table...');

    // Insert games one by one with full details
    const insertGame = db.prepare(`
        INSERT OR IGNORE INTO games 
        (name, age_limit, pre_registration, game_zone, game_time) 
        VALUES (?, ?, ?, ?, ?)
    `);

    games.forEach(game => {
        insertGame.run(
            game.name,
            game.age_limit,
            game.pre_registration,
            game.game_zone,
            game.game_time,
            function (err) {
                if (err) {
                    console.error(`Error inserting game "${game.name}":`, err.message);
                } else if (this.changes > 0) {
                    console.log(`Added game: ${game.name}`);
                }
            }
        );
    });
    insertGame.finalize();

    // Log all games in the database for verification
    db.all('SELECT * FROM games', [], (err, rows) => {
        if (err) {
            console.error('Error querying games:', err.message);
        } else {
            console.log('Games in database:', rows.length);
            rows.forEach(row => {
                console.log(`  ${row.id}: ${row.name} (${row.age_limit}, ${row.game_zone}, ${row.game_time})`);
            });
        }
    });
}

// Function to get all games
function getAllGames(callback) {
    console.log('Fetching all games');
    db.all('SELECT * FROM games ORDER BY name', [], (err, games) => {
        if (err) {
            console.error('Error fetching games:', err.message);
            return callback(err);
        }
        console.log(`Found ${games.length} games`);
        callback(null, games);
    });
}

// Function to get a game by ID
function getGameById(id, callback) {
    console.log(`Fetching game with ID: ${id}`);
    db.get('SELECT * FROM games WHERE id = ?', [id], (err, game) => {
        if (err) {
            console.error(`Error fetching game with ID ${id}:`, err.message);
            return callback(err);
        }
        if (!game) {
            return callback(new Error(`Game with ID ${id} not found`));
        }
        callback(null, game);
    });
}

// Function to create a new game
function createGame(game, callback) {
    console.log('Creating new game:', game);
    db.run(
        `INSERT INTO games (name, age_limit, pre_registration, game_zone, game_time)
         VALUES (?, ?, ?, ?, ?)`,
        [
            game.name,
            game.ageLimit,
            game.preRegistration,
            game.gameZone,
            game.gameTime
        ],
        function (err) {
            if (err) {
                console.error('Error creating game:', err.message);
                return callback(err);
            }
            const gameId = this.lastID;
            console.log(`Game created with ID: ${gameId}`);
            callback(null, {
                id: gameId,
                name: game.name,
                age_limit: game.ageLimit,
                pre_registration: game.preRegistration,
                game_zone: game.gameZone,
                game_time: game.gameTime
            });
        }
    );
}

// Function to update a game
function updateGame(id, game, callback) {
    console.log(`Updating game with ID: ${id}`, game);
    db.run(
        `UPDATE games SET
         name = ?, age_limit = ?, pre_registration = ?, game_zone = ?, game_time = ?
         WHERE id = ?`,
        [
            game.name,
            game.ageLimit,
            game.preRegistration,
            game.gameZone,
            game.gameTime,
            id
        ],
        function (err) {
            if (err) {
                console.error(`Error updating game with ID ${id}:`, err.message);
                return callback(err);
            }
            if (this.changes === 0) {
                return callback(new Error(`Game with ID ${id} not found`));
            }
            console.log(`Game updated with ID: ${id}`);
            callback(null, {
                id: parseInt(id),
                name: game.name,
                age_limit: game.ageLimit,
                pre_registration: game.preRegistration,
                game_zone: game.gameZone,
                game_time: game.gameTime
            });
        }
    );
}

// Function to delete a game
function deleteGame(id, callback) {
    console.log(`Deleting game with ID: ${id}`);
    db.run('DELETE FROM games WHERE id = ?', [id], function (err) {
        if (err) {
            console.error(`Error deleting game with ID ${id}:`, err.message);
            return callback(err);
        }
        if (this.changes === 0) {
            return callback(new Error(`Game with ID ${id} not found`));
        }
        console.log(`Game deleted with ID: ${id}`);
        callback(null, { id });
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
                const selectedGames = participant.selectedGames;

                // Keep track of remaining game insertions
                let pending = selectedGames.length;
                let gameErrors = [];

                // Prepare statement for participant_games insertions
                const stmt = db.prepare('INSERT INTO participant_games (participant_id, game_id) VALUES (?, ?)');

                selectedGames.forEach(gameName => {
                    // Find the game ID by name
                    db.get('SELECT id FROM games WHERE name = ?', [gameName], (err, game) => {
                        if (err) {
                            console.error(`Error finding game "${gameName}":`, err.message);
                            gameErrors.push(err);
                            pending--;

                            if (pending === 0) {
                                // If there were errors, rollback
                                if (gameErrors.length > 0) {
                                    console.error('Rolling back due to game lookup errors');
                                    stmt.finalize();
                                    db.run('ROLLBACK');
                                    return callback(new Error('Error associating games with participant'));
                                }
                            }
                            return;
                        }

                        if (!game) {
                            console.error(`Game not found: ${gameName}`);
                            gameErrors.push(new Error(`Game not found: ${gameName}`));
                            pending--;

                            if (pending === 0) {
                                // If there were errors, rollback
                                if (gameErrors.length > 0) {
                                    console.error('Rolling back due to missing games');
                                    stmt.finalize();
                                    db.run('ROLLBACK');
                                    return callback(new Error('One or more selected games were not found'));
                                }
                            }
                            return;
                        }

                        // Insert the participant-game relationship
                        stmt.run(participantId, game.id, (err) => {
                            if (err) {
                                console.error(`Error inserting game association for "${gameName}":`, err.message);
                                gameErrors.push(err);
                            } else {
                                console.log(`Added game "${gameName}" (ID: ${game.id}) to participant ${participantId}`);
                            }

                            pending--;

                            if (pending === 0) {
                                stmt.finalize();

                                // If there were errors, rollback
                                if (gameErrors.length > 0) {
                                    console.error('Rolling back due to game association errors');
                                    db.run('ROLLBACK');
                                    return callback(new Error('Error associating games with participant'));
                                }

                                // All went well, commit the transaction
                                db.run('COMMIT', (err) => {
                                    if (err) {
                                        console.error('Error committing transaction:', err.message);
                                        db.run('ROLLBACK');
                                        return callback(err);
                                    }

                                    console.log(`Successfully registered participant ${participantId} with ${selectedGames.length} games`);

                                    // Return the newly created participant
                                    callback(null, {
                                        id: participantId,
                                        ...participant
                                    });
                                });
                            }
                        });
                    });
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

// Export functions and database connection
module.exports = {
    db,
    registerParticipant,
    getAllParticipants,
    getAllGames,
    getGameById,
    createGame,
    updateGame,
    deleteGame
};
