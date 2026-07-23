# MealBridge - Complete Development Guide

> **Detailed guide on how the Backend, Frontend, and Database were created**
> **Every command is explained with inline comments**
> Last Updated: 2026-07-23

---

## Table of Contents

1. [Project Initialization](#project-initialization)
2. [Database Setup (PostgreSQL + PostGIS)](#database-setup-postgresql--postgis)
3. [Backend Development (Node.js + Express)](#backend-development-nodejs--express)
4. [Frontend Development (React + Vite)](#frontend-development-react--vite)
5. [Integration & Testing](#integration--testing)
6. [File Structure](#file-structure)

---

## Project Initialization

### Step 1: Create Project Root Directory

```bash
# Create a new directory called MealBridge
# mkdir = "make directory" command
mkdir MealBridge

# Change directory to MealBridge
# cd = "change directory" command
# This makes MealBridge our current working directory
cd MealBridge
```

### Step 2: Initialize Git Repository

```bash
# Initialize a new Git repository in current directory
# git init creates a hidden .git folder to track version history
git init

# Create .gitignore file to tell Git which files to ignore
# > operator creates new file (overwrites if exists)
# This prevents committing node dependencies
echo "node_modules/" > .gitignore

# Append more entries to .gitignore
# >> operator appends to file (doesn't overwrite)
# .env contains sensitive data (passwords, API keys)
echo ".env" >> .gitignore

# Ignore uploads folder (contains user-uploaded images)
# We don't want to commit large binary files to Git
echo "uploads/" >> .gitignore

# Stage the .gitignore file for commit
# git add prepares files for commit
git add .gitignore

# Create first commit with a message
# -m flag allows inline commit message
# Commits save a snapshot of your code at this point in time
git commit -m "Initial commit"
```

---

## Database Setup (PostgreSQL + PostGIS)

### Step 1: Install PostgreSQL and PostGIS

```bash
# ===== Ubuntu/Debian Linux =====
# Update package list to get latest version info
# sudo = run command as administrator/root
# apt = package manager for Debian-based Linux
sudo apt update

# Install PostgreSQL database server
# postgresql = main database engine
# postgresql-contrib = additional utilities and extensions
# postgis = geographic/spatial extension for location-based queries
sudo apt install postgresql postgresql-contrib postgis

# ===== macOS with Homebrew =====
# brew = package manager for macOS
# install command downloads and installs packages
brew install postgresql postgis

# ===== Windows =====
# For Windows, download installer from postgresql.org
# PostGIS is included in the installer options
# Manual installation via GUI installer
```

### Step 2: Start PostgreSQL Service

```bash
# ===== Linux (systemd-based systems) =====
# systemctl = system control command for managing services
# start = starts the service immediately
# postgresql = name of the PostgreSQL service
sudo systemctl start postgresql

# enable = configure service to start automatically on boot
# This ensures PostgreSQL runs every time server restarts
sudo systemctl enable postgresql

# ===== macOS =====
# brew services = Homebrew's service management tool
# Starts PostgreSQL and keeps it running in background
brew services start postgresql
```

### Step 3: Create Database User (Optional)

```bash
# Login to PostgreSQL as the 'postgres' superuser
# -u postgres = run command as postgres user (created during install)
# psql = PostgreSQL interactive terminal/shell
sudo -u postgres psql

# ===== Now you're inside psql shell =====

# Create a new database user/role
# WITH PASSWORD = set password for this user
# Replace 'your_password' with actual secure password
CREATE USER mealbridge_user WITH PASSWORD 'your_password';

# Grant user permission to create databases
# ALTER USER = modify user properties
# CREATEDB = permission to create new databases
ALTER USER mealbridge_user CREATEDB;

# Exit psql shell
# \q = quit command in PostgreSQL
\q
```

### Step 4: Create Database

```bash
# ===== Method 1: Using createdb command =====
# createdb = command-line utility to create database
# -U = specify which user to connect as
# Creates database named 'mealbridge'
createdb -U postgres mealbridge

# ===== Method 2: From psql shell =====
# Login to PostgreSQL shell
psql -U postgres

# Create database using SQL command
# Database names are case-insensitive
CREATE DATABASE mealbridge;

# Connect to the newly created database
# \c = connect command in psql
# All subsequent commands will run against this database
\c mealbridge
```

### Step 5: Enable PostGIS Extension

```sql
-- Connect to the mealbridge database
-- \c is a psql meta-command (not SQL)
\c mealbridge

-- Enable PostGIS extension for geographic/spatial features
-- IF NOT EXISTS = only create if not already enabled
-- PostGIS adds functions for storing lat/lng coordinates
-- and calculating distances between points
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify PostGIS installation and check version
-- This should return version number like "3.1 USE_GEOS=1..."
SELECT PostGIS_version();

-- Exit psql shell
\q
```

### Step 6: Create Database Schema

Create file: `server/src/db/schema.sql`

```sql
-- ============================================
-- MealBridge Database Schema
-- This file defines all tables, types, and indexes
-- ============================================

-- Enable PostGIS extension
-- Provides geographic functionality for location-based features
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- CUSTOM DATA TYPES (ENUMS)
-- ============================================
-- Enums restrict values to predefined options
-- This ensures data integrity at database level

-- User Role Type
-- Defines the three types of users in the system
CREATE TYPE user_role AS ENUM ('donor', 'ngo', 'admin');

-- Verification Status for NGOs
-- Tracks approval workflow for NGO accounts
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Food Category Type
-- Categorizes food donations
CREATE TYPE food_category AS ENUM ('cooked', 'raw', 'packaged', 'bakery');

-- Listing Status Type
-- Tracks lifecycle of food listings
CREATE TYPE listing_status AS ENUM ('available', 'claimed', 'completed', 'cancelled');

-- Notification Type
-- Different types of notifications users can receive
CREATE TYPE notification_type AS ENUM (
  'claim_received',      -- Donor: NGO claimed your listing
  'claim_approved',      -- NGO: Your claim was approved
  'claim_cancelled',     -- Donor: NGO cancelled claim
  'listing_nearby',      -- NGO: New listing near you
  'verification_update', -- NGO: Your verification status changed
  'verification_approved', -- NGO: You're approved
  'verification_rejected', -- NGO: Application rejected
  'rating_received',     -- User: Someone rated you
  'new_listing'          -- NGO: New listing available
);

-- ============================================
-- TABLES
-- ============================================

-- Users Table
-- Stores all users (Donors, NGOs, Admins)
CREATE TABLE users (
    -- Auto-incrementing primary key
    -- SERIAL = auto-increment integer
    id SERIAL PRIMARY KEY,

    -- User's full name (required)
    -- VARCHAR(120) = variable-length string, max 120 chars
    name VARCHAR(120) NOT NULL,

    -- Email address (required, must be unique)
    -- UNIQUE ensures no duplicate emails
    email VARCHAR(255) UNIQUE NOT NULL,

    -- Hashed password (never store plain text!)
    -- bcrypt produces 60-character hash
    password_hash VARCHAR(255) NOT NULL,

    -- Phone number (optional)
    phone VARCHAR(20),

    -- User role: donor, ngo, or admin
    -- References user_role enum defined above
    -- DEFAULT 'donor' = new users are donors by default
    role user_role NOT NULL DEFAULT 'donor',

    -- Organization name (for NGOs only)
    -- NULL for donors and admins
    org_name VARCHAR(200),

    -- NGO verification status
    -- Only applicable for role='ngo'
    -- Admins must approve before NGO can claim food
    verification verification_status DEFAULT 'pending',

    -- Account active status (for suspension feature)
    -- FALSE = account suspended, cannot login
    -- DEFAULT TRUE = new accounts are active
    active BOOLEAN DEFAULT TRUE,

    -- Geographic location stored as PostGIS point
    -- GEOGRAPHY type handles real-world coordinates
    -- POINT = single location (lat, lng)
    -- 4326 = SRID (Spatial Reference ID) for GPS coordinates
    location GEOGRAPHY(POINT, 4326),

    -- Human-readable address
    address TEXT,

    -- Average rating from other users
    -- NUMERIC(2,1) = 2 total digits, 1 after decimal (e.g., 4.5)
    -- CHECK constraint ensures rating between 0 and 5
    avg_rating NUMERIC(2,1) DEFAULT 0 CHECK (avg_rating >= 0 AND avg_rating <= 5),

    -- Timestamp when account was created
    -- TIMESTAMPTZ = timestamp with timezone
    -- NOW() = current date and time
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Timestamp when account was last updated
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food Listings Table
-- Stores food donations created by donors
CREATE TABLE listings (
    -- Auto-incrementing primary key
    id SERIAL PRIMARY KEY,

    -- Foreign key to users table
    -- REFERENCES creates relationship to users.id
    -- ON DELETE CASCADE = delete listing if donor is deleted
    donor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Title/name of food donation
    title VARCHAR(200) NOT NULL,

    -- Detailed description of the food
    -- TEXT = unlimited length string
    description TEXT,

    -- Category of food (uses enum defined above)
    category food_category NOT NULL,

    -- Number of servings/meals available
    -- CHECK ensures positive number
    servings INTEGER NOT NULL CHECK (servings > 0),

    -- Dietary flags
    -- BOOLEAN = true/false
    is_veg BOOLEAN DEFAULT TRUE,     -- Vegetarian
    is_halal BOOLEAN DEFAULT FALSE,  -- Halal-certified

    -- Geographic location (required for distance calculations)
    location GEOGRAPHY(POINT, 4326) NOT NULL,

    -- Pickup address
    address TEXT NOT NULL,

    -- Pickup time window
    -- NGO must pick up between these times
    pickup_start TIMESTAMPTZ NOT NULL,
    pickup_end TIMESTAMPTZ NOT NULL,

    -- Listing lifecycle status
    status listing_status DEFAULT 'available',

    -- Array of image URLs
    -- TEXT[] = array of strings
    -- Stores multiple image paths like {'/uploads/img1.jpg', '/uploads/img2.jpg'}
    image_urls TEXT[],

    -- When listing expires and becomes unavailable
    expires_at TIMESTAMPTZ NOT NULL,

    -- When listing was created
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claims Table
-- Tracks which NGO claimed which listing
CREATE TABLE claims (
    id SERIAL PRIMARY KEY,

    -- Which listing was claimed
    -- CASCADE = delete claim if listing deleted
    listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,

    -- Which NGO claimed it
    ngo_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Timestamps tracking claim lifecycle
    claimed_at TIMESTAMPTZ DEFAULT NOW(),     -- When NGO claimed
    picked_up_at TIMESTAMPTZ,                 -- When NGO picked up food
    completed_at TIMESTAMPTZ,                 -- When delivery completed

    -- If claim cancelled, store reason
    cancellation_reason TEXT,

    -- Prevent duplicate claims
    -- UNIQUE(listing_id, ngo_id) = same NGO can't claim same listing twice
    UNIQUE(listing_id, ngo_id)
);

-- Ratings Table
-- Users rate each other after successful food exchange
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,

    -- Which claim this rating is for
    claim_id INTEGER REFERENCES claims(id) ON DELETE CASCADE,

    -- Who gave the rating
    rater_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Who received the rating
    rated_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Star rating (1-5 stars)
    -- CHECK constraint enforces valid range
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),

    -- Optional written review
    review TEXT,

    -- When rating was given
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate ratings
    -- Each user can only rate once per claim
    UNIQUE(claim_id, rater_id)
);

-- Notifications Table
-- Stores in-app notifications for users
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,

    -- Which user receives this notification
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Type of notification (from enum)
    type notification_type NOT NULL,

    -- Short title for notification
    title VARCHAR(200) NOT NULL,

    -- Full notification message
    message TEXT NOT NULL,

    -- Additional data as JSON
    -- JSONB = binary JSON format (faster than JSON)
    -- Can store listing_id, claim_id, etc.
    data JSONB,

    -- Has user read this notification?
    -- FALSE = unread (shows badge on bell icon)
    is_read BOOLEAN DEFAULT FALSE,

    -- When notification was created
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Password Reset Tokens Table
-- Stores temporary tokens for password reset
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,

    -- Which user requested reset
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Random token sent via email
    -- UNIQUE = each token can only be used once
    token VARCHAR(255) UNIQUE NOT NULL,

    -- Token expiration time
    -- Tokens expire after 1 hour for security
    expires_at TIMESTAMPTZ NOT NULL,

    -- When token was created
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
-- Indexes speed up queries by creating lookup tables
-- Trade-off: faster reads, slower writes, more disk space

-- Users Table Indexes
-- GIST index for geographic queries (required for PostGIS)
-- Speeds up "find users near location" queries
CREATE INDEX idx_users_location ON users USING GIST (location);

-- B-tree indexes for equality and range queries
-- Speed up WHERE role = 'donor'
CREATE INDEX idx_users_role ON users (role);

-- Speed up WHERE verification = 'pending'
CREATE INDEX idx_users_verification ON users (verification);

-- Speed up WHERE active = true
CREATE INDEX idx_users_active ON users (active);

-- Speed up WHERE email = 'user@example.com'
-- Also used by UNIQUE constraint
CREATE INDEX idx_users_email ON users (email);

-- Listings Table Indexes
-- Speed up JOIN queries with users table
CREATE INDEX idx_listings_donor ON listings(donor_id);

-- Filter by status (available, claimed, etc.)
CREATE INDEX idx_listings_status ON listings(status);

-- Geographic queries: find listings near location
CREATE INDEX idx_listings_location ON listings USING GIST (location);

-- Order by most recent first
-- DESC = descending order (newest first)
CREATE INDEX idx_listings_created ON listings(created_at DESC);

-- Filter by food category
CREATE INDEX idx_listings_category ON listings(category);

-- Claims Table Indexes
-- Join with listings table
CREATE INDEX idx_claims_listing ON claims(listing_id);

-- Join with users table (NGOs)
CREATE INDEX idx_claims_ngo ON claims(ngo_id);

-- Filter completed claims
CREATE INDEX idx_claims_completed ON claims(completed_at);

-- Ratings Table Indexes
-- Find all ratings for a user
CREATE INDEX idx_ratings_rated ON ratings(rated_id);

-- Find all ratings given by a user
CREATE INDEX idx_ratings_rater ON ratings(rater_id);

-- Find rating for specific claim
CREATE INDEX idx_ratings_claim ON ratings(claim_id);

-- Notifications Table Indexes
-- Get all notifications for user
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Filter unread notifications
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Sort by newest first
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Password Reset Tokens Indexes
-- Find tokens for user
CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);

-- Verify token quickly
CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);

-- ============================================
-- TRIGGERS
-- ============================================
-- Triggers automatically execute functions on certain events

-- Function to update updated_at timestamp
-- Called automatically before any UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Set updated_at to current timestamp
    NEW.updated_at = NOW();
    RETURN NEW;  -- Return modified row
END;
$$ language 'plpgsql';  -- PL/pgSQL = PostgreSQL procedural language

-- Apply trigger to users table
-- BEFORE UPDATE = run before row is updated
-- FOR EACH ROW = run for every row being updated
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Insert a default admin user for testing
-- In production, create admin manually with secure password
INSERT INTO users (name, email, password_hash, role, verification, active)
VALUES (
  'Admin',                          -- Admin name
  'admin@mealbridge.com',          -- Admin email
  '$2a$10$dummyhash',              -- Replace with real bcrypt hash
  'admin',                          -- Role
  'approved',                       -- Admins are pre-approved
  true                              -- Active account
);
```

### Step 7: Run Schema File

```bash
# Execute SQL file to create all tables and indexes
# psql = PostgreSQL command-line client
# -U postgres = connect as postgres user
# -d mealbridge = connect to mealbridge database
# -f = read SQL commands from file
# schema.sql = path to SQL file
psql -U postgres -d mealbridge -f server/src/db/schema.sql

# Alternative: if you don't have postgres user
psql -d mealbridge -f server/src/db/schema.sql
```

### Step 8: Verify Tables Created

```bash
# Connect to database
psql -U postgres -d mealbridge

# ===== Now in psql shell =====

# List all tables in current database
# \dt = describe tables (psql command, not SQL)
# Should show: users, listings, claims, ratings, notifications, password_reset_tokens
\dt

# Describe users table structure
# \d = describe (psql command)
# Shows columns, types, constraints, indexes
\d users

# Describe listings table
\d listings

# Check PostGIS version
# Verifies PostGIS extension is working
SELECT PostGIS_version();

# List all custom types (enums)
# \dT = describe types
\dT

# View indexes on users table
# \di = describe indexes
\di

# Count users (should be 1 if you inserted admin)
-- This is actual SQL (ends with semicolon)
SELECT COUNT(*) FROM users;

# Exit psql shell
\q
```

---

## Backend Development (Node.js + Express)

### Step 1: Initialize Backend Project

```bash
# Create server directory for backend code
mkdir server

# Change to server directory
cd server

# Initialize new Node.js project
# npm = Node Package Manager
# init = create package.json file
# -y = yes to all defaults (skip questions)
# package.json tracks dependencies and scripts
npm init -y
```

### Step 2: Install Dependencies

```bash
# ===== Core Dependencies =====
# npm install = download and install packages
# Packages are saved to node_modules/ folder
# Dependencies are listed in package.json

# Install multiple packages at once (space-separated)
npm install express pg dotenv cors bcryptjs jsonwebtoken

# Breakdown:
# express = web framework for building REST APIs
# pg = PostgreSQL client for Node.js (node-postgres)
# dotenv = loads environment variables from .env file
# cors = Cross-Origin Resource Sharing (allows frontend to call API)
# bcryptjs = hash passwords securely
# jsonwebtoken = create and verify JWT tokens for authentication

# ===== Real-time Communication =====
# socket.io = WebSocket library for real-time features
# Enables push notifications, live updates
npm install socket.io

# ===== Email Sending =====
# nodemailer = send emails (password reset, notifications)
# Supports Gmail, SMTP, SendGrid, etc.
npm install nodemailer

# ===== File Upload =====
# multer = middleware for handling multipart/form-data
# Used for uploading images
npm install multer

# ===== Security & Utilities =====
# express-rate-limit = prevent brute force attacks
# Limits number of requests per IP
npm install express-rate-limit

# ===== Development Dependencies =====
# --save-dev = only needed during development, not production
# nodemon = auto-restart server when code changes
# Watches files and restarts on save
npm install --save-dev nodemon

# After installation, package.json will list all dependencies
# node_modules/ folder contains all downloaded code
```

### Step 3: Create Backend Directory Structure

```bash
# Create nested directory structure
# -p flag = create parent directories if they don't exist
# {a,b,c} = bash expansion creates multiple directories

# Create all subdirectories in one command
mkdir -p src/{config,controllers,middleware,routes,utils,db}

# Breakdown:
# src/config = database connection, email config
# src/controllers = business logic (handle requests)
# src/middleware = authentication, validation
# src/routes = URL routing (map URLs to controllers)
# src/utils = helper functions
# src/db = database schema and migrations

# Create uploads directory for storing user images
# This directory will store uploaded food images
mkdir uploads
```

**Resulting structure:**
```
server/
├── src/
│   ├── config/       # Configuration files
│   ├── controllers/  # Request handlers (business logic)
│   ├── middleware/   # Auth, validation, error handling
│   ├── routes/       # API route definitions
│   ├── utils/        # Helper functions
│   └── db/           # Database files
├── uploads/          # Uploaded images (ignored by Git)
├── node_modules/     # Installed packages (ignored by Git)
├── package.json      # Project metadata and dependencies
└── .env              # Environment variables (ignored by Git)
```

### Step 4: Create Environment Configuration

Create file: `server/.env`

```env
# ===== Server Configuration =====
# Port number for Express server to listen on
# 5000 is common for development APIs
PORT=5000

# Environment: development, production, or test
# Affects error messages, logging, etc.
NODE_ENV=development

# ===== Database Configuration =====
# PostgreSQL connection details
# These are used by pg module to connect to database
DB_HOST=localhost         # Database server address (localhost = same machine)
DB_PORT=5432             # PostgreSQL default port
DB_NAME=mealbridge       # Database name we created earlier
DB_USER=postgres         # Database user (or mealbridge_user)
DB_PASSWORD=password     # CHANGE THIS to actual password!

# ===== JWT (JSON Web Token) Configuration =====
# Secret key for signing JWTs
# IMPORTANT: Use long random string in production
# Anyone with this key can create valid tokens!
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# How long tokens are valid before expiring
# 7d = 7 days, also accepts: 1h, 30m, 60s, etc.
JWT_EXPIRES_IN=7d

# ===== Email Configuration (Nodemailer) =====
# SMTP server details for sending emails
EMAIL_HOST=smtp.gmail.com      # Gmail SMTP server
EMAIL_PORT=587                  # SMTP port (587 for TLS)
EMAIL_USER=your-email@gmail.com # Your Gmail address
EMAIL_PASSWORD=your-app-password # Gmail App Password (NOT regular password!)
                                # Generate at: https://myaccount.google.com/apppasswords
EMAIL_FROM="MealBridge <noreply@mealbridge.com>" # Sender name and email

# ===== Frontend URL =====
# URL where React app runs
# Used in CORS settings and email links
FRONTEND_URL=http://localhost:5173

# ===== File Upload Configuration =====
# Directory to store uploaded files
UPLOAD_DIR=./uploads

# Maximum file size in bytes
# 5242880 bytes = 5 MB
# Prevents users from uploading huge files
MAX_FILE_SIZE=5242880
```

### Step 5: Create Database Connection

Create file: `server/src/config/db.js`

```javascript
// Import pg (node-postgres) library
// Pool = manages multiple database connections efficiently
const { Pool } = require('pg');

// Load environment variables from .env file
// Must call before accessing process.env variables
require('dotenv').config();

// Create connection pool
// Pool maintains multiple connections and reuses them
// More efficient than creating new connection per query
const pool = new Pool({
  host: process.env.DB_HOST,       // Database server address
  port: process.env.DB_PORT,       // Database port (5432)
  database: process.env.DB_NAME,   // Database name (mealbridge)
  user: process.env.DB_USER,       // Database user
  password: process.env.DB_PASSWORD, // User password
});

// Event listener: fires when connection established
// 'connect' event occurs when pool creates new connection
pool.on('connect', () => {
  // Log success message to console
  // ✅ emoji helps spot important logs
  console.log('✅ Database connected successfully');
});

// Event listener: fires on connection errors
// Handles network issues, wrong credentials, etc.
pool.on('error', (err) => {
  // Log error details
  console.error('❌ Database connection error:', err);

  // Exit process with error code
  // -1 = error exit code (0 would mean success)
  // Forces server to stop if database unavailable
  process.exit(-1);
});

// Export pool for use in other files
// Other files will do: const pool = require('./config/db');
module.exports = pool;
```

### Step 6: Create Authentication Middleware

Create file: `server/src/middleware/auth.js`

```javascript
// Import jsonwebtoken library for JWT verification
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token in requests
// Middleware = function that runs before route handler
// Has access to req, res, and next
exports.authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    // Header format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    // ?. = optional chaining (prevents error if undefined)
    const token = req.headers.authorization?.split(' ')[1];
    // Split by space: ['Bearer', 'token'] → take index [1]

    // Check if token exists
    if (!token) {
      // 401 = Unauthorized (no valid credentials)
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token signature and expiration
    // jwt.verify() throws error if invalid or expired
    // Returns decoded payload if valid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { id: 1, email: 'user@example.com', role: 'donor', ... }

    // Attach user data to request object
    // Now all subsequent middleware/routes can access req.user
    req.user = decoded;

    // Call next() to pass control to next middleware/route
    // If we don't call next(), request hangs
    next();
  } catch (error) {
    // Token invalid, expired, or malformed
    // 401 = Unauthorized
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware factory: creates role-checking middleware
// Usage: requireRole(['admin', 'donor'])
exports.requireRole = (roles) => {
  // Return a middleware function
  // This is a closure - inner function has access to 'roles'
  return (req, res, next) => {
    // Check if user is authenticated
    // authMiddleware should run before this
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user's role is in allowed roles array
    // roles.includes() returns true if role is in array
    if (!roles.includes(req.user.role)) {
      // 403 = Forbidden (authenticated but not authorized)
      return res.status(403).json({ message: 'Forbidden' });
    }

    // User has required role, continue
    next();
  };
};

// Usage example in routes:
// router.get('/admin', authMiddleware, requireRole(['admin']), controller);
// This ensures only authenticated admins can access route
```

### Step 7: Create Auth Controller

Create file: `server/src/controllers/auth.controller.js`

```javascript
// Import bcrypt for password hashing
const bcrypt = require('bcryptjs');

// Import jsonwebtoken for creating JWTs
const jwt = require('jsonwebtoken');

// Import database connection pool
const pool = require('../config/db');

// Helper function to generate JWT token
// Not exported - only used internally in this file
const generateToken = (user) => {
  // jwt.sign() creates and signs a token
  // First parameter: payload (data to encode)
  return jwt.sign(
    {
      id: user.id,           // User ID
      email: user.email,     // Email address
      role: user.role        // User role (donor/ngo/admin)
    },
    process.env.JWT_SECRET,  // Secret key for signing
    {
      expiresIn: process.env.JWT_EXPIRES_IN  // Token expiration (7d)
    }
  );
  // Returns string: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
};

// Register new user
// exports.register makes function available to other files
exports.register = async (req, res) => {
  // async allows us to use await for async operations
  try {
    // Destructure request body to get form data
    // req.body contains JSON data sent by client
    const { name, email, password, phone, role, org_name, address, lat, lng } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      // 400 = Bad Request (client error)
      return res.status(400).json({
        message: 'Name, email, and password are required'
      });
    }

    // Check if email already registered
    // pool.query() executes SQL query
    // $1 = placeholder for parameter (prevents SQL injection)
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]  // Array of parameters (replaces $1, $2, etc.)
    );

    // Check if query returned any rows
    if (existingUser.rows.length > 0) {
      // 409 = Conflict (resource already exists)
      return res.status(409).json({
        message: 'Email already registered'
      });
    }

    // Hash password using bcrypt
    // Never store plain text passwords!
    // 10 = salt rounds (higher = more secure but slower)
    const passwordHash = await bcrypt.hash(password, 10);
    // Result: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

    // Build dynamic SQL for location
    // Only add location if coordinates provided
    let locationQuery = 'NULL';  // Default: no location
    let queryParams = [name, email, passwordHash, phone, role || 'donor'];

    if (lat && lng) {
      // ST_SetSRID = Set Spatial Reference ID
      // ST_MakePoint = Create PostGIS point from lng, lat
      // Note: PostGIS uses (longitude, latitude) order!
      // ::geography = cast to geography type
      locationQuery = `ST_SetSRID(ST_MakePoint($${queryParams.length + 1}, $${queryParams.length + 2}), 4326)::geography`;
      queryParams.push(lng, lat);  // Add to parameters array
    }

    // Handle optional org_name (for NGOs)
    const orgNameParam = org_name ? `$${queryParams.length + 1}` : 'NULL';
    if (org_name) queryParams.push(org_name);

    // Handle optional address
    const addressParam = address ? `$${queryParams.length + 1}` : 'NULL';
    if (address) queryParams.push(address);

    // Insert new user into database
    // RETURNING clause returns inserted row
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone, role, location, org_name, address)
       VALUES ($1, $2, $3, $4, $5, ${locationQuery}, ${orgNameParam}, ${addressParam})
       RETURNING id, name, email, role, verification`,
      queryParams
    );

    // Get inserted user from result
    const user = result.rows[0];

    // Generate JWT token for immediate login
    const token = generateToken(user);

    // Send success response
    // 201 = Created (new resource created successfully)
    res.status(201).json({
      message: 'Registration successful!',
      token,    // JWT token for authentication
      user      // User data (without password!)
    });
  } catch (error) {
    // Log error for debugging
    console.error('Registration error:', error);

    // 500 = Internal Server Error
    res.status(500).json({ message: 'Server error' });
  }
};

// Login existing user
exports.login = async (req, res) => {
  try {
    // Get email and password from request
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    // Find user by email
    // SELECT * gets all columns (including password_hash)
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    // Check if user exists
    if (result.rows.length === 0) {
      // 401 = Unauthorized (wrong credentials)
      // Don't specify whether email or password is wrong (security)
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Compare provided password with hashed password
    // bcrypt.compare() hashes input and compares with stored hash
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is active (not suspended)
    // user.active === false means admin suspended account
    if (user.active === false) {
      // 403 = Forbidden (valid credentials but access denied)
      return res.status(403).json({
        message: 'Your account has been suspended. Please contact support.'
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Remove password from response
    // delete operator removes property from object
    delete user.password_hash;

    // Send success response
    // 200 = OK (default status, can omit)
    res.json({
      token,  // JWT for subsequent requests
      user    // User data (without password)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
```

### Step 8: Create Routes

Create file: `server/src/routes/auth.routes.js`

```javascript
// Import Express framework
const express = require('express');

// Create a new router instance
// Router handles a subset of routes (auth-related in this case)
const router = express.Router();

// Import auth controller functions
const authController = require('../controllers/auth.controller');

// Define routes
// router.METHOD(path, handler)
// METHOD = HTTP verb (get, post, put, delete, etc.)
// path = URL pattern
// handler = function to call when route matches

// POST /api/auth/register
// Public route (no authentication required)
router.post('/register', authController.register);

// POST /api/auth/login
// Public route
router.post('/login', authController.login);

// Export router to use in main app
// Other files will do: const authRoutes = require('./routes/auth.routes');
module.exports = router;

// Final URL structure:
// Main app mounts this at /api/auth
// So routes become:
// POST http://localhost:5000/api/auth/register
// POST http://localhost:5000/api/auth/login
```

### Step 9: Create Main Server File

Create file: `server/src/index.js`

```javascript
// ===== Import Dependencies =====

// Express = web framework for building REST APIs
const express = require('express');

// http = Node.js built-in module for HTTP server
// Needed for Socket.io (needs HTTP server, not just Express)
const http = require('http');

// Socket.io = real-time bidirectional communication
// Server class creates Socket.io server
const { Server } = require('socket.io');

// CORS = Cross-Origin Resource Sharing
// Allows frontend (localhost:5173) to call API (localhost:5000)
const cors = require('cors');

// path = Node.js module for file path operations
const path = require('path');

// Load environment variables from .env file
// Must call before accessing process.env
require('dotenv').config();

// ===== Import Database Connection =====
// This immediately tests connection when server starts
const pool = require('./config/db');

// ===== Import Routes =====
const authRoutes = require('./routes/auth.routes');

// ===== Initialize Express App =====
// app = Express application instance
const app = express();

// Create HTTP server from Express app
// http.createServer() wraps Express app
const server = http.createServer(app);

// ===== Initialize Socket.io =====
// Create Socket.io server attached to HTTP server
const io = new Server(server, {
  // CORS configuration for Socket.io
  cors: {
    // Allow requests from frontend URL
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    // Allow cookies and authentication headers
    credentials: true
  }
});

// ===== Middleware =====
// Middleware = functions that process requests before routes

// Enable CORS for Express routes
// Allows frontend to make API calls
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true  // Allow cookies
}));

// Parse JSON request bodies
// Converts JSON string to JavaScript object
// Makes data available in req.body
app.use(express.json());

// Parse URL-encoded request bodies
// For form submissions (application/x-www-form-urlencoded)
// extended: true allows nested objects
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
// Makes uploaded images accessible via URL
// Example: http://localhost:5000/uploads/image.jpg
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ===== API Routes =====
// Mount auth routes at /api/auth
// All routes in authRoutes get /api/auth prefix
app.use('/api/auth', authRoutes);

// ===== Health Check Endpoint =====
// Simple endpoint to verify server is running
// GET http://localhost:5000/health
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',           // Server is running
    timestamp: new Date()   // Current server time
  });
});

// ===== Socket.io Authentication Middleware =====
// Runs before socket connection is established
// io.use() = Socket.io middleware
io.use((socket, next) => {
  // Get JWT token from connection handshake
  // Client sends: socket = io(url, { auth: { token: '...' } })
  const token = socket.handshake.auth.token;

  // Reject connection if no token
  if (!token) {
    // Return error, prevents connection
    return next(new Error('Authentication error'));
  }

  try {
    // Verify JWT token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user data to socket
    // Now socket.user is available in all socket handlers
    socket.user = decoded;

    // Allow connection to proceed
    next();
  } catch (err) {
    // Invalid token, reject connection
    next(new Error('Authentication error'));
  }
});

// ===== Socket.io Connection Handling =====
// Event fires when client connects via Socket.io
io.on('connection', (socket) => {
  // Log connection (socket.user set by auth middleware above)
  console.log(`✅ User connected: ${socket.user.email}`);

  // Join user-specific room for targeted notifications
  // Room = private channel only this user listens to
  // Later we can do: io.to(`user_${userId}`).emit('notification', data)
  socket.join(`user_${socket.user.id}`);

  // Event fires when client disconnects
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.user.email}`);
  });
});

// ===== Make Socket.io Available to Routes =====
// Store io instance in Express app
// Routes can access via: const io = req.app.get('io');
app.set('io', io);

// ===== Error Handling Middleware =====
// Catches any errors not handled by routes
// Must have 4 parameters (err, req, res, next) to be error handler
app.use((err, req, res, next) => {
  // Log error stack trace for debugging
  console.error(err.stack);

  // Send generic error response
  // 500 = Internal Server Error
  res.status(500).json({ message: 'Something went wrong!' });
});

// ===== Start Server =====
// Get port from environment or default to 5000
const PORT = process.env.PORT || 5000;

// Start HTTP server (not just Express app!)
// server.listen() needed for Socket.io to work
server.listen(PORT, () => {
  // Log startup messages
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

// Export for testing
module.exports = { app, io };
```

### Step 10: Update package.json Scripts

Edit `server/package.json`:

```json
{
  "name": "server",
  "version": "1.0.0",
  "scripts": {
    // "start" script for production
    // Runs server with Node.js (no auto-restart)
    "start": "node src/index.js",

    // "dev" script for development
    // Runs server with nodemon (auto-restarts on file changes)
    // Watches for changes in .js files and restarts server
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    // ... dependencies installed earlier
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
```

### Step 11: Test Backend

```bash
# ===== Start Server =====
# npm run = execute script from package.json
# dev = script name (runs nodemon)
npm run dev

# Server should show:
# ✅ Database connected successfully
# 🚀 Server running on port 5000
# 📡 Socket.io server ready

# ===== Test Health Endpoint =====
# curl = command-line HTTP client
# Makes GET request to health endpoint
curl http://localhost:5000/health

# Expected response:
# {"status":"OK","timestamp":"2026-07-23T12:00:00.000Z"}

# ===== Test Registration =====
# -X POST = use POST method
# -H = add header
# -d = request data (JSON)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "donor"
  }'

# Expected response:
# {
#   "message": "Registration successful!",
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": {
#     "id": 1,
#     "name": "Test User",
#     "email": "test@example.com",
#     "role": "donor"
#   }
# }

# ===== Test Login =====
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Expected response: token and user data

# ===== Verify in Database =====
# Connect to database
psql -U postgres -d mealbridge

# Check if user was created
SELECT id, name, email, role FROM users;

# Exit
\q
```

---

## Frontend Development (React + Vite)

### Step 1: Create React App with Vite

```bash
# ===== Go to Project Root =====
# cd .. = go up one directory
# From server/ to MealBridge/
cd ..

# ===== Create Vite React App =====
# npm create = use create package (npm 7+)
# vite@latest = use latest version of Vite
# client = project name (creates client/ folder)
# -- = separate npm args from vite args
# --template react = use React template
npm create vite@latest client -- --template react

# This command:
# 1. Creates client/ directory
# 2. Generates React project with Vite
# 3. Creates package.json, vite.config.js
# 4. Sets up basic React app structure

# ===== Navigate to Client Folder =====
cd client
```

### Step 2: Install Dependencies

```bash
# ===== Install Core Dependencies =====
# npm install = download packages

# react-router-dom = client-side routing
# Handles navigation between pages without page reload
npm install react-router-dom

# axios = HTTP client (better than fetch)
# Makes API calls, handles requests/responses
npm install axios

# ===== Install UI Libraries =====

# leaflet = JavaScript library for interactive maps
# Displays maps, markers, popups
npm install leaflet

# react-leaflet = React components for Leaflet
# Provides React-friendly API for Leaflet
npm install react-leaflet

# ===== Install Real-time Library =====

# socket.io-client = Socket.io client for browser
# Connects to Socket.io server for real-time updates
npm install socket.io-client

# ===== Install Tailwind CSS =====
# -D = --save-dev (development dependency)

# tailwindcss = utility-first CSS framework
# postcss = CSS transformer (required by Tailwind)
# autoprefixer = adds vendor prefixes to CSS
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind configuration
# Creates tailwind.config.js and postcss.config.js
npx tailwindcss init -p
# npx = execute package without installing globally
# -p = also create postcss.config.js

# ===== Final Dependencies in package.json =====
# "dependencies": {
#   "react": "^18.2.0",
#   "react-dom": "^18.2.0",
#   "react-router-dom": "^6.x",
#   "axios": "^1.x",
#   "leaflet": "^1.9.x",
#   "react-leaflet": "^4.x",
#   "socket.io-client": "^4.x"
# },
# "devDependencies": {
#   "tailwindcss": "^3.x",
#   "postcss": "^8.x",
#   "autoprefixer": "^10.x",
#   "vite": "^4.x"
# }
```

### Step 3: Configure Tailwind CSS

Edit `client/tailwind.config.js`:

```javascript
// Tailwind configuration file
// Tailwind scans these files for class names to include in CSS

/** @type {import('tailwindcss').Config} */
export default {
  // Content: tell Tailwind which files to scan for classes
  content: [
    "./index.html",                // Scan HTML file
    "./src/**/*.{js,ts,jsx,tsx}",  // Scan all JS/JSX files in src/
    // **/ = any subdirectory (recursive)
    // {js,ts,jsx,tsx} = any of these extensions
  ],

  // Theme customization
  theme: {
    extend: {
      // Add custom colors
      // Can use like: bg-primary-500, text-primary-600
      colors: {
        primary: {
          // Orange color palette
          // 50 = lightest, 900 = darkest
          50: '#fff7ed',   // Very light orange
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',  // Main brand color
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12', // Darkest orange
        },
      },
    },
  },

  // Plugins extend Tailwind functionality
  // Empty array = no plugins (can add later)
  plugins: [],
}
```

Edit `client/src/index.css`:

```css
/* Import Tailwind base styles */
/* base = CSS reset + basic element styles */
@tailwind base;

/* Import Tailwind component classes */
/* components = reusable component styles */
@tailwind components;

/* Import Tailwind utility classes */
/* utilities = all utility classes (bg-blue-500, etc.) */
@tailwind utilities;

/* ===== Custom Component Classes ===== */
/* @layer components = add to components layer */
/* These can be used like built-in Tailwind classes */
@layer components {

  /* Base button style */
  /* @apply = use Tailwind utilities in custom classes */
  .btn {
    /* px-4 = padding left/right 1rem */
    /* py-2 = padding top/bottom 0.5rem */
    /* rounded-lg = border-radius 0.5rem */
    /* font-medium = font-weight 500 */
    /* transition-all = animate all property changes */
    /* duration-200 = 200ms transition */
    @apply px-4 py-2 rounded-lg font-medium transition-all duration-200;
  }

  /* Primary button variant */
  .btn-primary {
    /* bg-primary-600 = use custom orange color */
    /* hover:bg-primary-700 = darker on hover */
    @apply bg-primary-600 text-white hover:bg-primary-700;
  }

  /* Outline button variant */
  .btn-outline {
    /* border = 1px border */
    /* border-gray-300 = light gray border */
    /* hover:bg-gray-50 = light background on hover */
    @apply border border-gray-300 text-gray-700 hover:bg-gray-50;
  }

  /* Input field style */
  .input {
    /* w-full = width 100% */
    /* focus:ring-2 = 2px ring on focus */
    /* focus:ring-primary-500 = orange ring */
    /* focus:border-transparent = remove default border on focus */
    @apply w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  }

  /* Card component */
  .card {
    /* shadow-md = medium box shadow */
    /* p-6 = padding 1.5rem all sides */
    @apply bg-white rounded-lg shadow-md p-6;
  }
}

/* Now you can use these classes in components:
<button className="btn btn-primary">Click me</button>
<input className="input" type="text" />
<div className="card">Content</div>
*/
```

### Step 4: Create Frontend Directory Structure

```bash
# Change to src directory
cd src

# Create directory structure
# -p = create parent directories if needed
mkdir -p {api,components/{common,donor,ngo},context,pages,utils}

# Result:
# src/
# ├── api/              - API client functions
# ├── components/       - React components
# │   ├── common/       - Shared components
# │   ├── donor/        - Donor-specific
# │   └── ngo/          - NGO-specific
# ├── context/          - React Context (global state)
# ├── pages/            - Page-level components
# └── utils/            - Utility functions
```

### Step 5: Create Environment Configuration

Create `client/.env`:

```env
# ===== Vite Environment Variables =====
# IMPORTANT: Vite requires VITE_ prefix!
# Variables without VITE_ prefix are not exposed to client

# Backend API base URL
# Used by axios for API calls
# Default: http://localhost:5000
VITE_API_URL=http://localhost:5000

# Socket.io server URL
# Used for real-time WebSocket connection
# Same as API URL in our setup
VITE_SOCKET_URL=http://localhost:5000

# Access in code:
# import.meta.env.VITE_API_URL
# (Note: process.env won't work in Vite!)
```

### Step 6: Create Axios Configuration

Create `client/src/api/axios.js`:

```javascript
// ===== Import Axios Library =====
// axios = HTTP client for making API requests
import axios from 'axios';

// ===== Create Axios Instance =====
// createInstance() creates a configured axios instance
// This instance has predefined settings that apply to all requests
const axiosInstance = axios.create({
  // baseURL = prepended to all request URLs
  // Example: axios.get('/users') becomes http://localhost:5000/api/users
  baseURL: `${import.meta.env.VITE_API_URL}/api`,

  // Default headers sent with every request
  headers: {
    'Content-Type': 'application/json'  //告诉 server 我们发送 JSON data
  }
});

// ===== REQUEST INTERCEPTOR =====
// Runs BEFORE every request is sent
// Use case: Automatically add authentication token
axiosInstance.interceptors.request.use(
  (config) => {
    // config = request configuration object
    // Contains: url, method, headers, data, etc.

    // Get JWT token from localStorage
    // localStorage.getItem() retrieves stored data
    const token = localStorage.getItem('token');

    if (token) {
      // Add Authorization header if token exists
      // Format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6..."
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Return modified config
    // Request will be sent with this config
    return config;
  },
  (error) => {
    // Handle request errors
    // This rarely happens (usually network issues)
    return Promise.reject(error);
  }
);

// ===== RESPONSE INTERCEPTOR =====
// Runs AFTER every response is received
// Use case: Handle common errors globally (like expired token)
axiosInstance.interceptors.response.use(
  (response) => {
    // response = successful response from server
    // Contains: data, status, headers, config, etc.

    // For successful responses (2xx status codes), just return as-is
    return response;
  },
  (error) => {
    // error.response = response from server with error status (4xx, 5xx)

    // Check if error is 401 Unauthorized (token expired/invalid)
    if (error.response?.status === 401) {
      // Token is invalid or expired

      // Clear authentication data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login page
      // wi[Tuesday 11:28 AM] Praneeth
import { invalidateModule } from '../../lib/cache/invalidateModule';

 ndow.location.href = force page reload and navigation
      window.location.href = '/login';
    }

    // Reject promise with error
    // This will be caught in try-catch blocks
    return Promise.reject(error);
  }
);

// ===== Export Configured Instance =====
// Other files will import this instead of axios directly
export default axiosInstance;

// Usage in other files:
// import axios from './axios';
// axios.get('/users');  // Automatically includes token and base URL
```

### Step 7: Create Auth Context

Create `client/src/context/AuthContext.jsx`:

```javascript
// ===== Import React Hooks & Router =====
// createContext = creates context for sharing state
// useContext = hook to consume context
// useState = hook for component state
// useEffect = hook for side effects
import { createContext, useContext, useState, useEffect } from 'react';

// useNavigate = hook for programmatic navigation
import { useNavigate } from 'react-router-dom';

// Import configured axios instance
import axios from '../api/axios';

// ===== CREATE CONTEXT =====
// Context allows sharing state without passing props
// undefined = initial value (will be replaced by Provider)
const AuthContext = createContext();

// ===== CUSTOM HOOK TO USE AUTH CONTEXT =====
// This hook makes it easier to use AuthContext
export const useAuth = () => {
  // useContext() gets the current context value
  const context = useContext(AuthContext);

  // Throw error if used outside AuthProvider
  // Prevents bugs from forgetting to wrap components in Provider
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

// ===== AUTH PROVIDER COMPONENT =====
// Wraps app and provides authentication state & functions
export const AuthProvider = ({ children }) => {
  // children = all child components that will have access to auth state

  // ─────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────

  // user = current logged-in user (null if not logged in)
  const [user, setUser] = useState(null);

  // loading = true while checking if user is logged in (on page load)
  const [loading, setLoading] = useState(true);

  // useNavigate hook for redirecting user
  const navigate = useNavigate();

  // ─────────────────────────────────────────
  // LOAD USER FROM LOCALSTORAGE ON MOUNT
  // ─────────────────────────────────────────

  // useEffect with empty array [] runs once when component mounts
  useEffect(() => {
    // Check if user data exists in localStorage
    // localStorage persists data between page refreshes
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      // Parse JSON string back to object
      // localStorage stores everything as strings
      setUser(JSON.parse(storedUser));
    }

    // Set loading to false
    // App can now render (no longer showing loading screen)
    setLoading(false);
  }, []); // Empty array = run only once on mount

  // ─────────────────────────────────────────
  // LOGIN FUNCTION
  // ─────────────────────────────────────────

  const login = async (email, password) => {
    // async = function returns a Promise
    // Can be awaited in components

    // Make POST request to login endpoint
    const response = await axios.post('/auth/login', {
      email,
      password
    });

    // Destructure response data
    const { token, user } = response.data;

    // ─────────────────────────────────────────
    // SAVE TO LOCALSTORAGE
    // ─────────────────────────────────────────

    // Save token for future API requests
    localStorage.setItem('token', token);

    // Save user data
    // JSON.stringify() converts object to string
    localStorage.setItem('user', JSON.stringify(user));

    // Update state
    // This triggers re-render of all components using useAuth()
    setUser(user);

    // ─────────────────────────────────────────
    // REDIRECT BASED ON USER ROLE
    // ─────────────────────────────────────────

    if (user.role === 'admin') {
      // Admin → Admin Dashboard
      navigate('/admin-dashboard');
    } else if (user.role === 'ngo') {
      // NGO → NGO Dashboard
      navigate('/ngo-dashboard');
    } else {
      // Donor → Donor Dashboard
      navigate('/donor-dashboard');
    }
  };

  // ─────────────────────────────────────────
  // LOGOUT FUNCTION
  // ─────────────────────────────────────────

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear user state
    setUser(null);

    // Redirect to login page
    navigate('/login');
  };

  // ─────────────────────────────────────────
  // PROVIDE CONTEXT VALUE
  // ─────────────────────────────────────────

  // value = object containing all auth-related state & functions
  // This will be available to all child components via useAuth()
  const value = {
    user,      // Current user object or null
    login,     // Function to login
    logout,    // Function to logout
    loading    // Loading state
  };

  // ─────────────────────────────────────────
  // RENDER PROVIDER
  // ─────────────────────────────────────────

  return (
    // AuthContext.Provider makes value available to children
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Usage in components:
// const { user, login, logout } = useAuth();
```

### Step 8: Create Socket Context

Create `client/src/context/SocketContext.jsx`:

```javascript
// ===== Import Dependencies =====
import { createContext, useContext, useEffect, useState } from 'react';

// Import Socket.io client library
import io from 'socket.io-client';

// Import AuthContext to get current user
import { useAuth } from './AuthContext';

// ===== CREATE SOCKET CONTEXT =====
const SocketContext = createContext();

// ===== CUSTOM HOOK =====
export const useSocket = () => {
  return useContext(SocketContext);
};

// ===== SOCKET PROVIDER =====
export const SocketProvider = ({ children }) => {
  // socket = Socket.io connection instance
  const [socket, setSocket] = useState(null);

  // Get current user from AuthContext
  const { user } = useAuth();

  // ─────────────────────────────────────────
  // CREATE SOCKET CONNECTION WHEN USER LOGS IN
  // ─────────────────────────────────────────

  useEffect(() => {
    if (user) {
      // User is logged in, create socket connection

      // Get JWT token from localStorage
      const token = localStorage.getItem('token');

      // ─────────────────────────────────────────
      // CONNECT TO SOCKET.IO SERVER
      // ─────────────────────────────────────────

      const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
        // auth = authentication data sent during handshake
        // Server will verify this token before allowing connection
        auth: { token }
      });

      // ─────────────────────────────────────────
      // EVENT LISTENERS
      // ─────────────────────────────────────────

      // 'connect' event fires when connection established
      newSocket.on('connect', () => {
        console.log('✅ Socket connected');
        console.log('Socket ID:', newSocket.id);
      });

      // 'disconnect' event fires when connection lost
      newSocket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });

      // Save socket instance to state
      // Now components can access socket via useSocket()
      setSocket(newSocket);

      // ─────────────────────────────────────────
      // CLEANUP ON UNMOUNT
      // ─────────────────────────────────────────

      // Return cleanup function
      // Runs when component unmounts or user changes
      return () => {
        // Close socket connection
        newSocket.close();
      };
    } else {
      // User logged out

      if (socket) {
        // Close existing socket connection
        socket.close();
        setSocket(null);
      }
    }
  }, [user]); // Re-run when user changes (login/logout)

  // ─────────────────────────────────────────
  // PROVIDE SOCKET TO CHILDREN
  // ─────────────────────────────────────────

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

// Usage in components:
// const socket = useSocket();
//
// useEffect(() => {
//   if (socket) {
//     socket.on('notification', (data) => {
//       console.log('New notification:', data);
//     });
//   }
// }, [socket]);
```

### Step 9: Create Login Page

Create `client/src/pages/Login.jsx`:

```javascript
// ===== Import Dependencies =====
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  // ─────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────

  // formData = stores form input values
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // error = stores error message (if login fails)
  const [error, setError] = useState('');

  // loading = true while waiting for API response
  const [loading, setLoading] = useState(false);

  // Get login function from AuthContext
  const { login } = useAuth();

  // ─────────────────────────────────────────
  // HANDLE FORM SUBMISSION
  // ─────────────────────────────────────────

  const handleSubmit = async (e) => {
    // Prevent default form submission (page reload)
    e.preventDefault();

    // Clear previous error
    setError('');

    // Set loading state
    setLoading(true);

    try {
      // Call login function from AuthContext
      // This makes API request and saves token
      await login(formData.email, formData.password);

      // If successful, user will be redirected (handled in AuthContext)

    } catch (err) {
      // Login failed

      // Get error message from response
      // err.response?.data?.message = server error message
      // || 'Login failed' = fallback if no message
      setError(err.response?.data?.message || 'Login failed');

    } finally {
      // Always runs (success or failure)
      // Set loading back to false
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // RENDER LOGIN FORM
  // ─────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-orange-100 flex items-center justify-center p-4">
      {/* Card Container */}
      <div className="card max-w-md w-full">

        {/* Header */}
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          🍛 MealBridge
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Login to your account
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({
                ...formData,           // Keep other fields
                email: e.target.value  // Update email
              })}
              className="input"
              required
              placeholder="you@example.com"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({
                ...formData,
                password: e.target.value
              })}
              className="input"
              required
              placeholder="••••••••"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}  // Disable while loading
            className="btn btn-primary w-full"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Register Link */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
```

### Step 10: Create Register Page

Create `client/src/pages/Register.jsx`:

```javascript
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'donor',  // Default role
    org_name: ''    // For NGOs only
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Make registration API call
      const response = await axios.post('/auth/register', formData);

      // Save token and user to localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect based on role
      if (response.data.user.role === 'ngo') {
        navigate('/ngo-dashboard');
      } else {
        navigate('/donor-dashboard');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-orange-100 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          🍛 MealBridge
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Create your account
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="input"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="input"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="input"
              required
              minLength={6}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone (Optional)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="input"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              I am a
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="input"
            >
              <option value="donor">Donor (Restaurant/Individual)</option>
              <option value="ngo">NGO (Food Bank)</option>
            </select>
          </div>

          {/* Organization Name (show only for NGOs) */}
          {formData.role === 'ngo' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                value={formData.org_name}
                onChange={(e) => setFormData({...formData, org_name: e.target.value})}
                className="input"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
```

### Step 11: Create App Component with Routes

Create `client/src/App.jsx`:

```javascript
// ===== Import Dependencies =====
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Context Providers
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Import Pages
import Login from './pages/Login';
import Register from './pages/Register';
import DonorDashboard from './pages/DonorDashboard';
import NgoDashboard from './pages/NgoDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    // ─────────────────────────────────────────
    // ROUTER - Enables client-side routing
    // ─────────────────────────────────────────
    <BrowserRouter>

      {/* ─────────────────────────────────────────
          AUTH PROVIDER - Wraps entire app
          Provides: user, login, logout to all components
          ───────────────────────────────────────── */}
      <AuthProvider>

        {/* ─────────────────────────────────────────
            SOCKET PROVIDER - Provides Socket.io connection
            ───────────────────────────────────────── */}
        <SocketProvider>

          {/* ─────────────────────────────────────────
              ROUTES - Define URL → Component mapping
              ───────────────────────────────────────── */}
          <Routes>
            {/* Public Routes (no authentication required) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes (require authentication) */}
            <Route path="/donor-dashboard" element={<DonorDashboard />} />
            <Route path="/ngo-dashboard" element={<NgoDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />

            {/* Default Route - redirect to login */}
            <Route path="/" element={<Navigate to="/login" />} />

            {/* 404 - Not Found (catch-all route) */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>

        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

### Step 12: Update Entry Point

Edit `client/src/main.jsx`:

```javascript
// ===== Import React =====
import React from 'react'
import ReactDOM from 'react-dom/client'

// ===== Import App Component =====
import App from './App.jsx'

// ===== Import Global Styles =====
// This includes Tailwind CSS
import './index.css'

// ===== Render App =====
// createRoot() creates a root for rendering
// document.getElementById('root') = <div id="root"> in index.html
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode = development mode checks
  // Helps find bugs and deprecated features
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Step 13: Test Frontend

```bash
# ===== Start Development Server =====
# npm run dev = execute dev script from package.json
# Vite will start dev server with hot reload
npm run dev

# Expected output:
#   VITE v4.x.x  ready in xxx ms
#
#   ➜  Local:   http://localhost:5173/
#   ➜  Network: use --host to expose
#   ➜  press h to show help

# ===== Open in Browser =====
# Navigate to: http://localhost:5173

# You should see the login page
# Try creating an account and logging in
```

---

## Integration & Testing

### Step 1: Test Complete Flow

```bash
# ===== Terminal 1: Start Backend =====
cd server
npm run dev

# Expected output:
# ✅ Database connected successfully
# 🚀 Server running on port 5000

# ===== Terminal 2: Start Frontend =====
cd client
npm run dev

# Expected output:
# ➜  Local:   http://localhost:5173/
```

### Step 2: Test Registration

1. **Open Browser:** `http://localhost:5173`
2. **Click Register**
3. **Fill Form:**
   ```
   Name: Test User
   Email: test@example.com
   Password: password123
   Role: Donor
   ```
4. **Submit Form**
5. **Check:**
   - Browser console: No errors
   - Network tab: 201 response from `/api/auth/register`
   - Should redirect to dashboard

### Step 3: Test Login

1. **Logout** (if logged in)
2. **Navigate to Login**
3. **Enter credentials:**
   ```
   Email: test@example.com
   Password: password123
   ```
4. **Submit**
5. **Check:**
   - localStorage has `token` and `user`
   - Redirected to appropriate dashboard
   - Socket.io connection established (check browser console)

### Step 4: Verify Database

```bash
# Connect to database
psql -U postgres -d mealbridge

# Check if user was created
SELECT id, name, email, role FROM users;

# Expected output:
#  id |   name    |      email       | role
# ----+-----------+------------------+-------
#   1 | Test User | test@example.com | donor

# Exit
\q
```

### Step 5: Test Socket.io Connection

Open browser DevTools → Console:

```
✅ Socket connected
Socket ID: abc123xyz
```

---

## File Structure

### Complete Frontend Structure

```
client/
├── public/              # Static assets
├── src/
│   ├── api/            # API client functions
│   │   ├── axios.js           # Configured axios instance
│   │   ├── admin.api.js       # Admin API calls
│   │   ├── listings.api.js    # Listings API calls
│   │   └── notifications.api.js # Notifications API
│   │
│   ├── components/     # React components
│   │   ├── common/            # Shared components
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── MapView.jsx
│   │   │   └── ...
│   │   ├── donor/             # Donor components
│   │   │   ├── StatsCard.jsx
│   │   │   └── DonorHistory.jsx
│   │   └── ngo/               # NGO components
│   │       └── NgoHistory.jsx
│   │
│   ├── context/        # React Context providers
│   │   ├── AuthContext.jsx    # Authentication state
│   │   └── SocketContext.jsx  # Socket.io connection
│   │
│   ├── pages/          # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── DonorDashboard.jsx
│   │   ├── NgoDashboard.jsx
│   │   └── AdminDashboard.jsx
│   │
│   ├── utils/          # Utility functions
│   │
│   ├── App.jsx         # Main app component
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
│
├── .env                # Environment variables
├── index.html          # HTML template
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
└── tailwind.config.js  # Tailwind configuration
```

### Complete Backend Structure

```
server/
├── src/
│   ├── config/         # Configuration
│   │   └── db.js             # Database connection
│   │
│   ├── controllers/    # Business logic
│   │   ├── auth.controller.js
│   │   ├── listings.controller.js
│   │   ├── claims.controller.js
│   │   ├── ratings.controller.js
│   │   ├── admin.controller.js
│   │   ├── users.controller.js
│   │   └── notifications.controller.js
│   │
│   ├── middleware/     # Middleware functions
│   │   └── auth.js           # JWT authentication
│   │
│   ├── routes/         # API routes
│   │   ├── auth.routes.js
│   │   ├── listings.routes.js
│   │   ├── claims.routes.js
│   │   ├── ratings.routes.js
│   │   ├── admin.routes.js
│   │   ├── users.routes.js
│   │   └── notifications.routes.js
│   │
│   ├── db/             # Database files
│   │   ├── schema.sql        # Database schema
│   │   └── migrations/       # Migration files
│   │
│   └── index.js        # Main server file
│
├── uploads/            # Uploaded images
├── .env                # Environment variables
├── package.json        # Dependencies
└── README.md
```

---

## Common Development Commands

### Backend Commands

```bash
# Install dependencies
npm install

# Start development server (with auto-restart)
npm run dev

# Start production server
npm start

# Run database migration
psql -U postgres -d mealbridge -f src/db/schema.sql
```

### Frontend Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Database Commands

```bash
# Connect to database
psql -U postgres -d mealbridge

# View all tables
\dt

# View table structure
\d users

# View data
SELECT * FROM users;

# Exit psql
\q
```

---

## Troubleshooting

### Issue: Cannot connect to database

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check connection
psql -U postgres -c "SELECT version();"
```

### Issue: CORS errors

Check that backend `.env` has:
```env
FRONTEND_URL=http://localhost:5173
```

Check that `server/src/index.js` has:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### Issue: Socket.io not connecting

1. Check backend is running
2. Check browser console for errors
3. Verify token is in localStorage: `localStorage.getItem('token')`
4. Check Socket.io URL in `client/.env`

### Issue: 401 Unauthorized errors

Token expired or invalid:
1. Logout and login again
2. Check token in localStorage
3. Verify JWT_SECRET is same in backend `.env`

---

**END OF DEVELOPMENT GUIDE**

This guide covers the complete development process from scratch!