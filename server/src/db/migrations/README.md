# Database Migrations

This directory contains database migration scripts for MealBridge.

## How to Run Migrations

### Using psql command line:

```bash
# Connect to your database and run the migration
psql -U postgres -d mealbridge -f add_user_active_column.sql

# Or if using password authentication:
PGPASSWORD=your_password psql -U postgres -d mealbridge -f add_user_active_column.sql
```

### Using Node.js:

```javascript
const pool = require('../config/db');
const fs = require('fs');

async function runMigration() {
  const sql = fs.readFileSync('./add_user_active_column.sql', 'utf8');
  await pool.query(sql);
  console.log('Migration completed successfully');
}

runMigration();
```

## Available Migrations

### 1. add_user_active_column.sql
- **Date**: 2026-07-23
- **Purpose**: Adds `active` column to users table
- **Description**: Allows admins to suspend/activate user accounts
- **Backward Compatible**: Yes (defaults to TRUE for existing users)

## Migration History

| Date | File | Description | Status |
|------|------|-------------|--------|
| 2026-07-23 | add_user_active_column.sql | Add user active/suspend feature | Pending |