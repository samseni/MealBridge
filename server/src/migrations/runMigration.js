const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Running migration: add_password_reset_tokens.sql');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'add_password_reset_tokens.sql'),
      'utf8'
    );

    await pool.query(migrationSQL);

    console.log('✓ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();