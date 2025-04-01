// server/alter-games-table.js
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
        alterTable();
    }
});

function alterTable() {
    console.log('Checking games table structure...');

    // Get table info
    db.all("PRAGMA table_info(games)", (err, columns) => {
        if (err) {
            console.error('Error getting table info:', err.message);
            db.close();
            process.exit(1);
        }

        console.log('Current columns in games table:');
        columns.forEach(col => {
            console.log(`  ${col.name} (${col.type})`);
        });

        const columnNames = columns.map(col => col.name);
        const needsCreatedAt = !columnNames.includes('created_at');
        const needsUpdatedAt = !columnNames.includes('updated_at');

        if (!needsCreatedAt && !needsUpdatedAt) {
            console.log('Table already has all required columns. No changes needed.');
            showGames();
            return;
        }

        console.log('Adding missing columns to games table...');

        // For SQLite, we need to use simple defaults, not functions like CURRENT_TIMESTAMP
        const now = new Date().toISOString();

        // SQLite doesn't support adding multiple columns in one statement,
        // so we need to execute them one by one
        const alterStatements = [];

        if (needsCreatedAt) {
            alterStatements.push(`ALTER TABLE games ADD COLUMN created_at TEXT DEFAULT '${now}'`);
        }

        if (needsUpdatedAt) {
            alterStatements.push(`ALTER TABLE games ADD COLUMN updated_at TEXT DEFAULT '${now}'`);
        }

        // Execute alter statements sequentially
        executeAlterStatements(alterStatements, 0);
    });
}

function executeAlterStatements(statements, index) {
    if (index >= statements.length) {
        console.log('All alter statements executed successfully.');
        showGames();
        return;
    }

    const statement = statements[index];
    console.log(`Executing: ${statement}`);

    db.run(statement, function (err) {
        if (err) {
            console.error(`Error executing statement: ${statement}`, err.message);
            db.close();
            process.exit(1);
        }

        console.log(`Statement executed successfully.`);
        executeAlterStatements(statements, index + 1);
    });
}

function showGames() {
    console.log('Fetching games from table to verify structure...');

    db.all("SELECT * FROM games LIMIT 5", [], (err, rows) => {
        if (err) {
            console.error('Error fetching games:', err.message);
        } else {
            console.log('Games table structure (sample data):');
            if (rows.length === 0) {
                console.log('  No games found in the table.');
            } else {
                console.log(JSON.stringify(rows[0], null, 2));
            }
        }

        db.close(() => {
            console.log('Database connection closed.');
        });
    });
}

// Add to package.json:
// "scripts": {
//   "alter-games": "node server/alter-games-table.js"
// }