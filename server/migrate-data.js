// server/migrate-data.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const pgModule = require('./db-pg');
const dotenv = require('dotenv');

dotenv.config();

// SQLite DB connection
const dbPath = path.resolve(__dirname, 'avurudu_games_2025.db');
const sqliteDb = new sqlite3.Database(dbPath);

async function migrateData() {
    console.log('Starting data migration: SQLite to PostgreSQL');

    // First initialize PostgreSQL database
    await pgModule.initDatabase();

    // 1. Migrate games first (already done by the initialization)
    console.log('Games already initialized in PostgreSQL');

    // 2. Migrate participants
    console.log('Migrating participants...');
    const participants = await getParticipantsFromSqlite();

    for (const participant of participants) {
        try {
            await pgModule.registerParticipant({
                firstName: participant.first_name,
                lastName: participant.last_name,
                contactNumber: participant.contact_number,
                ageGroup: participant.age_group,
                selectedGames: participant.games
            });
            console.log(`Migrated participant: ${participant.first_name} ${participant.last_name}`);
        } catch (err) {
            console.error(`Failed to migrate participant ${participant.id}:`, err.message);
        }
    }

    console.log('Migration completed!');
    process.exit(0);
}

// Helper function to get participants from SQLite
function getParticipantsFromSqlite() {
    return new Promise((resolve, reject) => {
        // Get all participants from SQLite
        sqliteDb.all(`
      SELECT 
        p.id, 
        p.first_name, 
        p.last_name, 
        p.contact_number, 
        p.age_group, 
        p.registration_date
      FROM participants p
      ORDER BY p.id ASC
    `, [], (err, participants) => {
            if (err) {
                return reject(err);
            }

            if (participants.length === 0) {
                return resolve([]);
            }

            // For each participant, get their games
            const participantsWithGames = [];
            let pending = participants.length;

            participants.forEach(participant => {
                // Get games for this participant
                sqliteDb.all(`
          SELECT g.name
          FROM games g
          JOIN participant_games pg ON g.id = pg.game_id
          WHERE pg.participant_id = ?
        `, [participant.id], (err, games) => {
                    if (err) {
                        games = [];
                    }

                    // Add participant with their games to the array
                    participantsWithGames.push({
                        ...participant,
                        games: games.map(g => g.name)
                    });

                    pending--;
                    if (pending === 0) {
                        // All participants processed, return the results
                        resolve(participantsWithGames);
                    }
                });
            });
        });
    });
}

// Run migration
migrateData().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
