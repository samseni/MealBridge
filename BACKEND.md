# MealBridge Backend Documentation

## 🚀 Current Status (July 16, 2026)

**Server Status:** ✅ Running
**Port:** 5000
**URLs:**
- Local: http://localhost:5000
- Network: http://192.168.29.84:5000

**Database:** ⚠️ Not Connected (PostgreSQL needs installation)
**Socket.io:** ✅ Initialized and Ready
**API Endpoints:** ✅ All routes configured (waiting for database)

**What's Working:**
- ✅ Express server running
- ✅ Socket.io server initialized
- ✅ CORS configured for network access
- ✅ All routes and middleware loaded
- ⏳ Database connection pending (install PostgreSQL)

---

## Overview
The backend is a RESTful API built with Node.js, Express, PostgreSQL with PostGIS extension, and Socket.io for real-time features.

---

## 📁 Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── db.js                    # Database connection configuration
│   ├── controllers/
│   │   ├── auth.controller.js       # Authentication logic
│   │   ├── listings.controller.js   # Food listings CRUD
│   │   ├── claims.controller.js     # Claim management
│   │   ├── ratings.controller.js    # Rating system
│   │   └── admin.controller.js      # Admin operations
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication
│   │   └── errorHandler.js          # Global error handler
│   ├── routes/
│   │   ├── auth.routes.js           # Auth endpoints
│   │   ├── listings.routes.js       # Listings endpoints
│   │   ├── claims.routes.js         # Claims endpoints
│   │   ├── ratings.routes.js        # Ratings endpoints
│   │   └── admin.routes.js          # Admin endpoints
│   ├── db/
│   │   └── schema.sql               # PostgreSQL schema
│   └── index.js                     # Main server file
├── package.json
├── nodemon.json
└── .env.example
```

---

## 🗄️ Database Schema

### File: `server/src/db/schema.sql`

**Custom Types:**
```sql
CREATE TYPE user_role AS ENUM ('donor', 'ngo', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE food_category AS ENUM ('cooked', 'packaged', 'raw', 'bakery', 'dairy', 'other');
CREATE TYPE listing_status AS ENUM ('available', 'claimed', 'completed', 'expired', 'cancelled');
```

**Tables Created:**

1. **users** - Stores all user types (donors, NGOs, admins)
   - `id` - Primary key
   - `name` - User full name
   - `email` - Unique email (used for login)
   - `password_hash` - Bcrypt hashed password
   - `role` - User type (donor/ngo/admin)
   - `org_name` - Organization name (for NGOs)
   - `verification` - Verification status (for NGOs)
   - `location` - Geography point (PostGIS) for geospatial queries
   - `avg_rating` - Average rating from 0-5
   - Indexes on: location (GIST), role, verification

2. **food_listings** - Food donation posts
   - `id` - Primary key
   - `donor_id` - Foreign key to users
   - `title`, `description` - Listing details
   - `category` - Type of food
   - `is_veg`, `is_halal` - Dietary flags
   - `servings` - Number of servings
   - `expires_at` - Auto-calculated (2h for cooked, 24h for packaged)
   - `pickup_start`, `pickup_end` - Pickup time window
   - `location` - Geography point for proximity matching
   - `address` - Human-readable address
   - `status` - Current state (available/claimed/completed)
   - Indexes on: location (GIST), status, donor_id, expires_at

3. **claims** - Tracks who claimed which listing
   - `id` - Primary key
   - `listing_id` - Foreign key (UNIQUE constraint - one claim per listing)
   - `ngo_id` - Foreign key to users
   - `claimed_at`, `picked_up_at`, `completed_at` - Timestamps for tracking
   - `cancelled_at`, `cancel_reason` - Cancellation tracking

4. **ratings** - Mutual rating system
   - `id` - Primary key
   - `claim_id` - Foreign key to claims
   - `rater_id` - User giving the rating
   - `ratee_id` - User being rated
   - `score` - 1-5 rating
   - `comment` - Optional feedback
   - UNIQUE constraint on (claim_id, rater_id) - one rating per claim per user

5. **notifications** - Notification log
   - Stores all notifications for users
   - Includes type, title, message, and JSON data

**Key Features:**
- PostGIS geography type for accurate distance calculations
- Automatic updated_at triggers
- Comprehensive indexes for performance
- Foreign key constraints for data integrity

---

## 🔧 Configuration Files

### File: `server/src/config/db.js`

**Purpose:** PostgreSQL connection pool management

**Key Features:**
- Uses `pg` library's connection pool
- Reads `DATABASE_URL` from environment variables
- SSL support for production
- Connection event logging
- Auto-exit on connection failure

**Code Explanation:**
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```
- Creates a connection pool (reuses connections for efficiency)
- Enables SSL in production for secure connections

---

## 🚀 Main Server File

### File: `server/src/index.js`

**Purpose:** Express app initialization and Socket.io setup

**What it does:**

1. **Middleware Setup:**
   - `helmet()` - Security headers
   - `cors()` - Cross-origin requests from frontend
   - `express.json()` - Parse JSON request bodies

2. **Socket.io Integration:**
   ```javascript
   io.on('connection', (socket) => {
     socket.on('join', (userId) => {
       socket.join(`user:${userId}`);
     });
   });
   ```
   - Users join room based on their ID
   - Enables targeted notifications (e.g., `io.to('user:5').emit(...)`)

3. **Routes Registration:**
   - `/api/health` - Health check endpoint
   - `/api/auth` - Authentication routes
   - `/api/listings` - Food listings routes
   - `/api/claims` - Claims routes
   - `/api/ratings` - Ratings routes
   - `/api/admin` - Admin routes

4. **Error Handling:**
   - Global error handler middleware
   - 404 handler for unknown routes

---

## 🔐 Middleware

### File: `server/src/middleware/auth.js`

**Two middleware functions:**

1. **authMiddleware** - Verifies JWT token
   ```javascript
   const token = req.headers.authorization?.split(' ')[1];
   const decoded = jwt.verify(token, process.env.JWT_SECRET);
   req.user = decoded; // Attaches user info to request
   ```
   - Extracts token from `Authorization: Bearer <token>`
   - Verifies and decodes JWT
   - Attaches user data to `req.user` for use in controllers

2. **roleMiddleware** - Checks user role
   ```javascript
   roleMiddleware('donor', 'admin') // Only donors and admins allowed
   ```
   - Used in routes to restrict access by role
   - Returns 403 if user doesn't have required role

### File: `server/src/middleware/errorHandler.js`

**Purpose:** Centralized error handling

**Handles:**
- JWT errors (invalid/expired tokens) → 401
- Validation errors → 400
- Database unique violations → 409
- Foreign key violations → 400
- Generic errors → 500 (with stack trace in development)

---

## 🛣️ Routes

### File: `server/src/routes/auth.routes.js`

| Method | Endpoint | Middleware | Description |
|--------|----------|------------|-------------|
| POST | `/api/auth/register` | None | Register new user |
| POST | `/api/auth/login` | None | Login and get JWT |
| GET | `/api/auth/me` | authMiddleware | Get current user profile |
| PATCH | `/api/auth/profile` | authMiddleware | Update profile |

### File: `server/src/routes/listings.routes.js`

| Method | Endpoint | Middleware | Description |
|--------|----------|------------|-------------|
| POST | `/api/listings` | auth + role('donor') | Create listing |
| GET | `/api/listings/nearby` | auth + role('ngo') | Get nearby listings |
| GET | `/api/listings/mine` | auth | Get my listings |
| GET | `/api/listings/:id` | auth | Get listing details |
| PATCH | `/api/listings/:id` | auth + role('donor') | Update listing |
| DELETE | `/api/listings/:id` | auth + role('donor') | Cancel listing |

### File: `server/src/routes/claims.routes.js`

| Method | Endpoint | Middleware | Description |
|--------|----------|------------|-------------|
| POST | `/api/claims/:listingId` | auth + role('ngo') | Claim a listing |
| GET | `/api/claims/mine` | auth | Get my claims |
| PATCH | `/api/claims/:id/pickup` | auth + role('ngo') | Mark as picked up |
| PATCH | `/api/claims/:id/complete` | auth + role('donor') | Mark as completed |
| DELETE | `/api/claims/:id` | auth + role('ngo') | Cancel claim |

### File: `server/src/routes/ratings.routes.js`

| Method | Endpoint | Middleware | Description |
|--------|----------|------------|-------------|
| POST | `/api/ratings` | auth | Create rating |
| GET | `/api/ratings/received` | auth | Get ratings I received |

### File: `server/src/routes/admin.routes.js`

| Method | Endpoint | Middleware | Description |
|--------|----------|------------|-------------|
| GET | `/api/admin/verifications` | auth + role('admin') | Get pending verifications |
| PATCH | `/api/admin/verify/:userId` | auth + role('admin') | Approve/reject NGO |
| GET | `/api/admin/stats` | auth + role('admin') | Get platform statistics |
| GET | `/api/admin/users` | auth + role('admin') | List all users |

---

## 🎮 Controllers (Business Logic)

### File: `server/src/controllers/auth.controller.js`

**1. register()**
- Validates required fields
- Hashes password with bcrypt (10 rounds)
- Stores location as PostGIS geography point if lat/lng provided
- Returns user data + JWT token
- Error handling: 409 if email exists

**2. login()**
- Finds user by email
- Compares password with bcrypt
- Generates JWT token with user id, email, role
- Returns user data + token
- Error handling: 401 if invalid credentials

**3. getProfile()**
- Fetches current user from database
- Uses `req.user.id` from JWT middleware
- Converts PostGIS point to lat/lng for frontend

**4. updateProfile()**
- Dynamically builds UPDATE query based on provided fields
- Only updates fields that are provided
- Supports name, phone, address, location updates

**JWT Token Generation:**
```javascript
jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
)
```

---

### File: `server/src/controllers/listings.controller.js`

**1. createListing()** - Most complex operation

**Flow:**
1. Validate required fields
2. Calculate expiry time (2 hours for cooked, 24 hours for others)
3. **Begin database transaction**
4. Insert listing with PostGIS location
5. **Find nearby NGOs using PostGIS:**
   ```sql
   SELECT id, name, org_name, ST_Distance(location, listing_location) as distance
   FROM users
   WHERE role = 'ngo'
     AND verification = 'approved'
     AND ST_DWithin(location, listing_location, 10000) -- Within 10km
   ORDER BY distance ASC, avg_rating DESC
   ```
6. Create notifications for all nearby NGOs
7. **Emit Socket.io events** to notify NGOs in real-time
8. Commit transaction
9. Return listing + count of notified NGOs

**Why transaction?** Ensures atomicity - if notification fails, listing isn't created.

**2. getNearbyListings()**
- NGOs call this to see available food
- Uses PostGIS `ST_DWithin` for radius search
- Returns distance in meters
- Only shows 'available' listings that haven't expired

**3. getMyListings()**
- Donors see their listings
- Optional status filter

**4. updateListing()**
- Can only update if status is 'available'
- Can't update claimed/completed listings
- Supports updating title, description, pickup_end

**5. deleteListing()**
- Soft delete - sets status to 'cancelled'
- Only works for 'available' listings

---

### File: `server/src/controllers/claims.controller.js`

**1. createClaim()** - Race-condition safe claiming

**Flow:**
1. **Begin transaction**
2. **Lock the listing row:** `SELECT ... FOR UPDATE`
   - Prevents simultaneous claims from multiple NGOs
3. Check if status is 'available'
4. Verify NGO is approved
5. Update listing status to 'claimed'
6. Insert claim record
7. Create notification for donor
8. **Emit Socket.io event** to donor
9. Commit transaction

**Race-condition handling:**
```sql
SELECT * FROM food_listings WHERE id = $1 FOR UPDATE
```
- `FOR UPDATE` locks the row until transaction commits
- If two NGOs try to claim simultaneously, one waits
- Second claim will see status='claimed' and rollback

**Why UNIQUE constraint?**
```sql
UNIQUE (listing_id)  -- in claims table
```
- Database-level guarantee that one listing = one claim
- If race condition bypasses application logic, database rejects it

**2. getMyClaims()**
- NGOs see their claimed listings
- Joins with listings and donor data
- Returns all claim details for pickup

**3. markInTransit()**
- NGO marks when they've picked up food
- Sets `picked_up_at` timestamp

**4. markCompleted()**
- **Only donor can mark as completed** (verification that food was delivered)
- Updates both claim and listing status
- Uses transaction for consistency

**5. cancelClaim()**
- NGO can cancel if they can't pick up
- Makes listing 'available' again for other NGOs
- Stores cancellation reason

---

### File: `server/src/controllers/ratings.controller.js`

**1. createRating()**

**Flow:**
1. Validate score (1-5)
2. Get claim details
3. **Determine ratee** (person being rated):
   - If rater is donor → ratee is NGO
   - If rater is NGO → ratee is donor
4. Insert rating
5. **Recalculate average rating** for ratee:
   ```sql
   UPDATE users
   SET avg_rating = (
     SELECT ROUND(AVG(score), 1)
     FROM ratings
     WHERE ratee_id = $1
   )
   ```
6. Return rating

**Mutual rating system:**
- Donor rates NGO after successful delivery
- NGO rates donor after food quality/experience
- Both ratings count towards user reputation

**2. getReceivedRatings()**
- See ratings you've received
- Includes rater name and comments

---

### File: `server/src/controllers/admin.controller.js`

**1. getPendingVerifications()**
- Lists all NGOs with verification='pending'
- Ordered by registration date (oldest first)

**2. verifyUser()**
- Admin approves or rejects NGO
- Updates verification status
- Creates notification for NGO
- Only works for NGO role users

**3. getStats()**
- Single query with multiple subqueries:
  ```sql
  SELECT
    (SELECT COUNT(*) FROM users WHERE role = 'donor') as total_donors,
    (SELECT COUNT(*) FROM users WHERE role = 'ngo' AND verification = 'approved') as verified_ngos,
    (SELECT COUNT(*) FROM food_listings) as total_listings,
    (SELECT COUNT(*) FROM claims WHERE completed_at IS NOT NULL) as completed_claims,
    (SELECT COALESCE(SUM(servings), 0) FROM food_listings WHERE status = 'completed') as total_meals_saved
  ```
- Efficient - one database query for all metrics

**4. getUsers()**
- Lists users with optional role filter
- Paginated (default 50)

---

## 📦 Dependencies

### File: `server/package.json`

**Production Dependencies:**
- `express` - Web framework
- `pg` - PostgreSQL client
- `dotenv` - Environment variables
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT authentication
- `cors` - Cross-origin resource sharing
- `socket.io` - Real-time communication
- `node-cron` - Scheduled tasks (for expiring listings)
- `express-rate-limit` - API rate limiting
- `helmet` - Security headers
- `joi` - Request validation

**Dev Dependencies:**
- `nodemon` - Auto-restart on file changes
- `jest` - Testing framework
- `supertest` - API testing

---

## 🔒 Security Features

1. **Password Security:**
   - Bcrypt hashing with 10 rounds
   - Never store plain text passwords

2. **Authentication:**
   - JWT tokens with expiration
   - Token verification on protected routes

3. **Authorization:**
   - Role-based access control
   - Resource ownership verification (can only edit your own listings)

4. **Input Validation:**
   - Required field checks
   - Type validation (servings must be positive integer)
   - Unique constraints (one claim per listing)

5. **SQL Injection Prevention:**
   - Parameterized queries: `$1, $2, $3` placeholders
   - Never string concatenation in SQL

6. **Race Condition Prevention:**
   - Database transactions with row locking
   - UNIQUE constraints

7. **CORS:**
   - Only allows requests from configured CLIENT_URL

8. **Error Handling:**
   - Sensitive error details only in development
   - Generic messages in production

---

## 🌐 Real-time Features (Socket.io)

**Events Emitted:**

1. **listing:new** (Server → NGOs)
   - When donor creates listing
   - Sent to all nearby verified NGOs
   - Contains: listingId, title, servings, distance

2. **listing:claimed** (Server → Donor)
   - When NGO claims listing
   - Sent to the donor who created listing
   - Contains: listingId, claimId, NGO info

**How it works:**
```javascript
// User joins their room on connection
socket.join(`user:${userId}`);

// Server sends targeted message
io.to(`user:${donorId}`).emit('listing:claimed', data);
```

---

## 🔑 Environment Variables

### File: `server/.env.example`

**Required Variables:**

1. **Server:**
   - `PORT` - Server port (default 5000)
   - `NODE_ENV` - Environment (development/production)
   - `CLIENT_URL` - Frontend URL for CORS

2. **Database:**
   - `DATABASE_URL` - PostgreSQL connection string
     - Format: `postgresql://user:password@host:port/database`

3. **JWT:**
   - `JWT_SECRET` - Secret key for signing tokens (change in production!)
   - `JWT_EXPIRES_IN` - Token expiration (e.g., '7d')

4. **External APIs:**
   - `GOOGLE_MAPS_API_KEY` - For geocoding (optional)
   - `ANTHROPIC_API_KEY` - For AI categorization (optional)

5. **Configuration:**
   - `MATCH_RADIUS_METERS` - How far to search for NGOs (default 10000)
   - `RATE_LIMIT_MAX_REQUESTS` - Max requests per window

---

## 🚀 Running the Backend

**1. Install Dependencies:**
```bash
cd server
npm install
```

**2. Set Up Database:**
```bash
# Create database
createdb mealbridge

# Enable PostGIS
psql -d mealbridge -c "CREATE EXTENSION postgis;"

# Run schema
psql -d mealbridge -f src/db/schema.sql
```

**3. Configure Environment:**
```bash
cp .env.example .env
# Edit .env with your credentials
```

**4. Start Server:**
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

**5. Verify:**
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"ok","database":"connected","timestamp":"..."}
```

---

## 🧪 Testing Endpoints

**Register Donor:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Palace",
    "email": "pizza@example.com",
    "password": "test123",
    "role": "donor",
    "phone": "1234567890",
    "lat": 28.6139,
    "lng": 77.2090
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pizza@example.com",
    "password": "test123"
  }'
# Copy the token from response
```

**Create Listing:**
```bash
curl -X POST http://localhost:5000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Surplus Pizza",
    "description": "10 large pizzas",
    "category": "cooked",
    "servings": 30,
    "is_veg": true,
    "pickup_start": "2024-01-20T18:00:00Z",
    "pickup_end": "2024-01-20T20:00:00Z",
    "lat": 28.6139,
    "lng": 77.2090,
    "address": "123 Main St"
  }'
```

---

## 🔍 Key Architectural Decisions

**1. Why PostGIS?**
- Accurate distance calculations on spherical earth
- Efficient radius queries with GIST indexes
- Industry standard for geospatial data

**2. Why Socket.io?**
- Real-time notifications are core to user experience
- NGOs need instant alerts when food is available
- Donors need to know when food is claimed

**3. Why Transactions?**
- Claiming must be atomic (update listing + create claim)
- Prevents race conditions
- Ensures data consistency

**4. Why JWT?**
- Stateless authentication (no session storage needed)
- Scales horizontally (any server can verify token)
- Contains user info (role) for authorization

**5. Why Middleware Pattern?**
- Separation of concerns (auth logic separate from business logic)
- Reusable across routes
- Easy to test

---

## 📊 Database Performance

**Indexes Created:**
- `users.location` (GIST) - Fast geospatial queries
- `users.role` - Quick role filtering
- `users.verification` - Efficient verification queries
- `food_listings.location` (GIST) - Nearby search optimization
- `food_listings.status` - Filter available listings
- `food_listings.expires_at` - Expiry checks
- `claims.listing_id` - Quick claim lookups
- `notifications.user_id` - User notification retrieval

**Expected Performance:**
- Nearby NGO search: <50ms (with 100k users)
- Claim operation: <100ms (includes transaction + notifications)
- Login: <50ms (bcrypt compare is intentionally slow for security)

---

## 🐛 Common Issues & Solutions

**1. "Database connection failed"**
- Check PostgreSQL is running: `sudo service postgresql status`
- Verify DATABASE_URL is correct
- Check if database exists: `psql -l`

**2. "PostGIS extension not found"**
- Install PostGIS: `sudo apt install postgresql-14-postgis-3`
- Enable in database: `psql -d mealbridge -c "CREATE EXTENSION postgis;"`

**3. "Port 5000 already in use"**
- Kill existing process: `sudo lsof -ti:5000 | xargs kill -9`
- Or change PORT in .env

**4. "JWT verification failed"**
- Check JWT_SECRET matches between token generation and verification
- Token may have expired (check JWT_EXPIRES_IN)

**5. "CORS error"**
- Verify CLIENT_URL in .env matches frontend URL
- Check frontend is running on expected port

---

This backend provides a secure, scalable, and feature-rich foundation for the MealBridge platform with geospatial capabilities, real-time notifications, and robust error handling.