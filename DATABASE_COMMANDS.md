# MealBridge Database Commands

Quick reference for checking and managing the PostgreSQL database.

---

## Connection

### Connect to Database
```bash
sudo -u postgres psql -d mealbridge
```

### Exit Database
```sql
\q
```

---

## Viewing Data

### View All Users
```bash
sudo -u postgres psql -d mealbridge -c "SELECT id, name, email, role, verification, created_at FROM users;"
```

### View Users by Role
```bash
# View all donors
sudo -u postgres psql -d mealbridge -c "SELECT id, name, email, phone FROM users WHERE role = 'donor';"

# View all NGOs
sudo -u postgres psql -d mealbridge -c "SELECT id, name, org_name, email, verification FROM users WHERE role = 'ngo';"

# View all admins
sudo -u postgres psql -d mealbridge -c "SELECT id, name, email FROM users WHERE role = 'admin';"
```

### View Food Listings
```bash
# All listings
sudo -u postgres psql -d mealbridge -c "SELECT id, title, category, servings, status, created_at FROM food_listings;"

# Available listings only
sudo -u postgres psql -d mealbridge -c "SELECT id, title, servings, status FROM food_listings WHERE status = 'available';"

# Listings by donor
sudo -u postgres psql -d mealbridge -c "SELECT l.id, l.title, u.name as donor_name, l.status FROM food_listings l JOIN users u ON l.donor_id = u.id;"
```

### View Claims
```bash
# All claims
sudo -u postgres psql -d mealbridge -c "SELECT c.id, l.title, u.name as ngo_name, c.claimed_at FROM claims c JOIN food_listings l ON c.listing_id = l.id JOIN users u ON c.ngo_id = u.id;"

# Active claims
sudo -u postgres psql -d mealbridge -c "SELECT * FROM claims WHERE completed_at IS NULL AND cancelled_at IS NULL;"
```

### View Ratings
```bash
sudo -u postgres psql -d mealbridge -c "SELECT r.id, r.score, r.comment, u1.name as rater, u2.name as ratee FROM ratings r JOIN users u1 ON r.rater_id = u1.id JOIN users u2 ON r.ratee_id = u2.id;"
```

### View Notifications
```bash
sudo -u postgres psql -d mealbridge -c "SELECT id, user_id, type, message, created_at FROM notifications ORDER BY created_at DESC LIMIT 20;"
```

---

## Database Statistics

### Count Records
```bash
# Total users
sudo -u postgres psql -d mealbridge -c "SELECT COUNT(*) as total_users FROM users;"

# Users by role
sudo -u postgres psql -d mealbridge -c "SELECT role, COUNT(*) as count FROM users GROUP BY role;"

# Total listings
sudo -u postgres psql -d mealbridge -c "SELECT COUNT(*) as total_listings FROM food_listings;"

# Listings by status
sudo -u postgres psql -d mealbridge -c "SELECT status, COUNT(*) as count FROM food_listings GROUP BY status;"

# Total claims
sudo -u postgres psql -d mealbridge -c "SELECT COUNT(*) as total_claims FROM claims;"
```

### Platform Impact Metrics
```bash
# Total meals redistributed (completed claims)
sudo -u postgres psql -d mealbridge -c "SELECT SUM(l.servings) as total_meals FROM claims c JOIN food_listings l ON c.listing_id = l.id WHERE c.completed_at IS NOT NULL;"

# Active donors
sudo -u postgres psql -d mealbridge -c "SELECT COUNT(DISTINCT donor_id) as active_donors FROM food_listings;"

# Verified NGOs
sudo -u postgres psql -d mealbridge -c "SELECT COUNT(*) as verified_ngos FROM users WHERE role = 'ngo' AND verification = 'approved';"
```

---

## Schema Information

### List All Tables
```bash
sudo -u postgres psql -d mealbridge -c "\dt"
```

### Describe Table Structure
```bash
# Users table
sudo -u postgres psql -d mealbridge -c "\d users"

# Food listings table
sudo -u postgres psql -d mealbridge -c "\d food_listings"

# Claims table
sudo -u postgres psql -d mealbridge -c "\d claims"

# Ratings table
sudo -u postgres psql -d mealbridge -c "\d ratings"
```

### Check PostGIS Extension
```bash
sudo -u postgres psql -d mealbridge -c "SELECT PostGIS_Version();"
```

---

## User Management

### Find User by Email
```bash
sudo -u postgres psql -d mealbridge -c "SELECT id, name, email, role FROM users WHERE email = 'user@example.com';"
```

### Update User Role
```bash
sudo -u postgres psql -d mealbridge -c "UPDATE users SET role = 'admin' WHERE email = 'user@example.com';"
```

### Verify an NGO
```bash
sudo -u postgres psql -d mealbridge -c "UPDATE users SET verification = 'approved' WHERE id = 1;"
```

### Delete a User
```bash
# WARNING: This will cascade delete all related data (listings, claims, etc.)
sudo -u postgres psql -d mealbridge -c "DELETE FROM users WHERE email = 'user@example.com';"
```

---

## Data Cleanup

### Delete Old Expired Listings
```bash
sudo -u postgres psql -d mealbridge -c "DELETE FROM food_listings WHERE status = 'expired' AND expires_at < NOW() - INTERVAL '7 days';"
```

### Clear All Test Data (DANGEROUS)
```bash
# WARNING: This deletes ALL data from all tables
sudo -u postgres psql -d mealbridge -c "TRUNCATE users, food_listings, claims, ratings, notifications CASCADE;"
```

### Reset Database (Complete Wipe)
```bash
# Drop and recreate database
sudo -u postgres dropdb mealbridge
sudo -u postgres createdb mealbridge
sudo -u postgres psql -d mealbridge -c "CREATE EXTENSION postgis;"
cat /home/dell/IdeaProjects/MealBridge/server/src/db/schema.sql | sudo -u postgres psql -d mealbridge
```

---

## Backup and Restore

### Backup Database
```bash
# Full backup
sudo -u postgres pg_dump mealbridge > ~/mealbridge_backup_$(date +%Y%m%d).sql

# Backup with compression
sudo -u postgres pg_dump mealbridge | gzip > ~/mealbridge_backup_$(date +%Y%m%d).sql.gz
```

### Restore Database
```bash
# From SQL file
sudo -u postgres psql -d mealbridge < ~/mealbridge_backup_20240116.sql

# From compressed file
gunzip -c ~/mealbridge_backup_20240116.sql.gz | sudo -u postgres psql -d mealbridge
```

---

## Geospatial Queries

### Find Users by Location
```bash
# Find all users within 10km of a point (lng, lat)
sudo -u postgres psql -d mealbridge -c "
SELECT id, name, role,
       ST_Distance(location, ST_GeogFromText('SRID=4326;POINT(77.5946 12.9716)')) AS distance_meters
FROM users
WHERE location IS NOT NULL
  AND ST_DWithin(location, ST_GeogFromText('SRID=4326;POINT(77.5946 12.9716)'), 10000)
ORDER BY distance_meters;
"
```

### View User Coordinates
```bash
sudo -u postgres psql -d mealbridge -c "
SELECT id, name,
       ST_Y(location::geometry) as latitude,
       ST_X(location::geometry) as longitude
FROM users
WHERE location IS NOT NULL;
"
```

---

## Debugging

### Check Recent Activity
```bash
# Recent registrations
sudo -u postgres psql -d mealbridge -c "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10;"

# Recent listings
sudo -u postgres psql -d mealbridge -c "SELECT id, title, status, created_at FROM food_listings ORDER BY created_at DESC LIMIT 10;"

# Recent claims
sudo -u postgres psql -d mealbridge -c "SELECT id, listing_id, ngo_id, claimed_at FROM claims ORDER BY claimed_at DESC LIMIT 10;"
```

### Check for Orphaned Records
```bash
# Claims without listings (shouldn't exist due to foreign key)
sudo -u postgres psql -d mealbridge -c "SELECT * FROM claims WHERE listing_id NOT IN (SELECT id FROM food_listings);"

# Ratings without claims
sudo -u postgres psql -d mealbridge -c "SELECT * FROM ratings WHERE claim_id NOT IN (SELECT id FROM claims);"
```

---

## Interactive Mode Commands

When connected via `sudo -u postgres psql -d mealbridge`:

| Command | Description |
|---------|-------------|
| `\dt` | List all tables |
| `\d table_name` | Describe table structure |
| `\du` | List database users |
| `\l` | List all databases |
| `\c database_name` | Connect to different database |
| `\q` | Quit/Exit |
| `\x` | Toggle expanded display (better for wide tables) |
| `\timing` | Show query execution time |
| `\?` | Show all psql commands |
| `\h SQL_COMMAND` | Show SQL command help |

---

## Common Issues

### Permission Denied
If you get permission errors, make sure to use `sudo -u postgres`:
```bash
sudo -u postgres psql -d mealbridge
```

### Database Doesn't Exist
Create it:
```bash
sudo -u postgres createdb mealbridge
```

### PostGIS Not Found
Enable the extension:
```bash
sudo -u postgres psql -d mealbridge -c "CREATE EXTENSION postgis;"
```

### Connection Refused
Start PostgreSQL:
```bash
sudo systemctl start postgresql
# or
sudo service postgresql start
```

---

## Quick Test After Setup

Run this to verify everything is working:

```bash
# 1. Check connection
sudo -u postgres psql -d mealbridge -c "SELECT 1;"

# 2. Check PostGIS
sudo -u postgres psql -d mealbridge -c "SELECT PostGIS_Version();"

# 3. Check tables
sudo -u postgres psql -d mealbridge -c "\dt"

# 4. Check user count
sudo -u postgres psql -d mealbridge -c "SELECT COUNT(*) FROM users;"
```

If all commands succeed, your database is ready! ✓