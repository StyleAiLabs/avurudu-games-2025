// Create a new file called server/setup-games.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.resolve(__dirname, 'avurudu_games_2025.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    } else {
        console.log('Connected to the SQLite database at:', dbPath);
        setupGames();
    }
});

function setupGames() {
    // First, check if the games table exists
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='games'", (err, table) => {
        if (err) {
            console.error('Error checking games table:', err.message);
            process.exit(1);
        }

        if (!table) {
            console.log('Games table does not exist. Creating it...');

            // Create the games table
            db.run(`CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                age_limit TEXT,
                pre_registration TEXT,
                game_zone TEXT,
                game_time TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) {
                    console.error('Error creating games table:', err.message);
                    process.exit(1);
                }

                insertGames();
            });
        } else {
            console.log('Games table exists. Checking if it has data...');

            // Check if there are any games in the table
            db.get('SELECT COUNT(*) as count FROM games', (err, result) => {
                if (err) {
                    console.error('Error counting games:', err.message);
                    process.exit(1);
                }

                if (result.count === 0) {
                    console.log('No games found. Inserting sample games...');
                    insertGames();
                } else {
                    console.log(`Found ${result.count} existing games. No need to insert.`);
                    listGames();
                }
            });
        }
    });
}

function insertGames() {
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
        }
    ];

    // Begin transaction
    db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
            console.error('Error beginning transaction:', err.message);
            process.exit(1);
        }

        // Prepare statement
        const stmt = db.prepare(`
            INSERT OR IGNORE INTO games 
            (name, age_limit, pre_registration, game_zone, game_time) 
            VALUES (?, ?, ?, ?, ?)
        `);

        // Insert each game
        games.forEach(game => {
            stmt.run(
                game.name,
                game.age_limit,
                game.pre_registration,
                game.game_zone,
                game.game_time,
                (err) => {
                    if (err) {
                        console.error(`Error inserting game "${game.name}":`, err.message);
                    }
                }
            );
        });

        // Finalize statement
        stmt.finalize();

        // Commit transaction
        db.run('COMMIT', (err) => {
            if (err) {
                console.error('Error committing transaction:', err.message);
                db.run('ROLLBACK');
                process.exit(1);
            }

            console.log('Games inserted successfully.');
            listGames();
        });
    });
}

function listGames() {
    db.all('SELECT * FROM games', [], (err, rows) => {
        if (err) {
            console.error('Error listing games:', err.message);
            process.exit(1);
        }

        console.log('Games in database:');
        rows.forEach(row => {
            console.log(`  ${row.id}: ${row.name} (${row.age_limit}, ${row.game_time})`);
        });

        db.close(() => {
            console.log('Database connection closed.');
            console.log('Setup complete!');
        });
    });
}

// Add to package.json:
// "scripts": {
//   "setup-games": "node server/setup-games.js"
// }