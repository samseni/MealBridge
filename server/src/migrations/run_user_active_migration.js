const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Running migration: add_user_active_column.sql');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../db/migrations/add_user_active_column.sql'),
      'utf8'
    );

    await pool.query(migrationSQL);

    console.log('✓ Migration completed successfully!');
    console.log('- Added "active" column to users table');
    console.log('- Created index on "active" column');
    console.log('- All existing users set to active=true');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();