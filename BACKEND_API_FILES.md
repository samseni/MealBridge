# Backend API Files Reference

Complete list and overview of all backend API files in MealBridge.

---

## File Structure

```
server/src/
├── index.js                          # Main server entry point
├── config/
│   └── db.js                         # Database connection
├── routes/                           # API route definitions
│   ├── auth.routes.js                # Authentication routes
│   ├── listings.routes.js            # Food listings routes
│   ├── claims.routes.js              # Claims routes
│   ├── ratings.routes.js             # Ratings routes
│   └── admin.routes.js               # Admin routes
├── controllers/                      # Business logic
│   ├── auth.controller.js            # Auth operations
│   ├── listings.controller.js        # Listings operations
│   ├── claims.controller.js          # Claims operations
│   ├── ratings.controller.js         # Ratings operations
│   └── admin.controller.js           # Admin operations
├── middleware/                       # Request middleware
│   ├── auth.js                       # JWT authentication
│   └── errorHandler.js               # Error handling
└── db/
    ├── schema.sql                    # Database schema
    └── seed.sql                      # Sample data (optional)
```

---

## 1. Main Server File

### **server/src/index.js**

**Purpose:** Entry point, sets up Express server, CORS, Socket.io, and routes

**Key Features:**
- Express app initialization
- CORS configuration (multiple origins)
- Socket.io setup for real-time notifications
- Route mounting
- Error handling
- Server startup

**Routes Mounted:**
```javascript
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/claims', claimsRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/admin', adminRoutes);
```

**Location:** `/home/dell/IdeaProjects/MealBridge/server/src/index.js`

---

## 2. Configuration Files

### **server/src/config/db.js**

**Purpose:** PostgreSQL database connection pool

**Features:**
- Creates connection pool
- Handles connection events
- Exports pool for use in controllers

**Usage:**
```javascript
const pool = require('./config/db');
const result = await pool.query('SELECT * FROM users');
```

**Location:** `/home/dell/IdeaProjects/MealBridge/server/src/config/db.js`

---

## 3. Route Files

### **3.1 server/src/routes/auth.routes.js**

**Purpose:** Authentication and user management routes

**Endpoints:**
| Method | Path | Controller | Description | Auth Required |
|--------|------|------------|-------------|---------------|
| POST | `/register` | `authController.register` | Register new user | No |
| POST | `/login` | `authController.login` | Login user | No |
| GET | `/me` | `authController.getProfile` | Get current user profile | Yes |
| PATCH | `/profile` | `authController.updateProfile` | Update profile | Yes |

**Full URLs:**
```
POST   http://localhost:5000/api/auth/register
POST   http://localhost:5000/api/auth/login
GET    http://localhost:5000/api/auth/me
PATCH  http://localhost:5000/api/auth/profile
```

**Location:** `/home/dell/IdeaProjects/MealBridge/server/src/routes/auth.routes.js`

---

### **3.2 server/src/routes/listings.routes.js**

**Purpose:** Food listings management routes

**Endpoints:**
| Method | Path | Controller | Description | Auth Required |
|--------|------|------------|-------------|---------------|
| POST | `/` | `listingsController.create` | Create new listing | Yes (Donor) |
| GET | `/mine` | `listingsController.getMine` | Get my listings | Yes (Donor) |
| GET | `/nearby` | `listingsController.getNearby` | Get nearby listings | Yes (NGO) |
| GET | `/:id` | `listingsController.getById` | Get listing details | Yes |
| PATCH | `/:id` | `listingsController.update` | Update listing | Yes (Owner) |
| DELETE | `/:id` | `listingsController.delete` | Delete listing | Yes (Owner) |

**Full URLs:**
```
POST   http://localhost:5000/api/listings
GET    http://localhost:5000/api/listings/mine
GET    http://localhost:5000/api/listings/nearby?lat=12.97&lng=77.59
GET    http://localhost:5000/api/listings/1
PATCH  http://localhost:5000/api/listings/1
DELETE http://localhost:5000/api/listings/1
```

**Location:** `/home/dell/IdeaProjects/MealBridge/server/src/routes/listings.routes.js`

---

### **3.3 server/src/routes/claims.routes.js**

**Purpose:** Food claim management routes

**Endpoints:**
| Method | Path | Controller | Description | Auth Required |
|--------|------|------------|-------------|---------------|
| POST | `/:listingId` | `claimsController.create` | Claim a listing | Yes (NGO) |
| GET | `/mine` | `claimsController.getMine` | Get my claims | Yes (NGO) |
| PATCH | `/:id/pickup` | `claimsController.markPickup` | Mark pickup started | Yes (NGO) |
| PATCH | `/:id/complete` | `claimsController.complete` | Complete claim | Yes (Donor) |
| DELETE | `/:id` | `claimsController.cancel` | Cancel claim | Yes (NGO) |

**Full URLs:**
```
POST   http://localhost:5000/api/claims/1
GET    http://localhost:5000/api/claims/mine
PATCH  http://localhost:5000/api/claims/1/pickup
PATCH  http://localhost:5000/api/claims/1/complete
DELETE http://localhost:5000/api/claims/1
```

**Location:** `/home/dell/IdeaProjects/MealBridge/server/src/routes/claims.routes.js`

---

### **3.4 server/src/routes/ratings.routes.js**

**Purpose:** Rating and feedback routes

**Endpoints:**
| Method | Path | Controller | Description | Auth Required |
|--------|------|------------|-------------|---------------|
| POST | `/` | `ratingsController.create` | Submit rating | Yes |
| GET | `/received` | `ratingsController.getReceived` | Get ratings received | Yes |

**Full URLs:**
```
POST   http://localhost:5000/api/ratings
GET    http://localhost:5000/api/ratings/received
```

**Location:** `/home/dell/IdeaProjects/MealBridge/server/src/routes/ratings.routes.js`

---

### **3.5 server/src/routes/admin.routes.js**

**Purpose:** Admin management routes

**Endpoints:**
| Method | Path | Controller | Description | Auth Required |
|--------|------|------------|-------------|---------------|
| GET | `/verifications` | `adminController.getVerifications` | Get pending NGO verifications | Yes (Admin) |
| PATCH | `/verify/:userId` | `adminController.verifyUser` | Approve/reject NGO | Yes (Admin) |
| GET | `/stats` | `adminController.getStats` | Get platform statistics | Yes (Admin) |
| GET | `/users` | `adminController.getUsers` | List all users | Yes (Admin) |
| PATCH | `/users/:id/suspend` | `adminController.suspendUser` | Suspend user | Yes (Admin) |

**Full URLs:**
```
GET    http://localhost:5000/api/admin/verifications
PATCH  http://localhost:5000/api/admin/verify/1
GET    http://localhost:5000/api/admin/stats
GET    http://localhost:5000/api/admin/users
PATCH  http://localhost:5000/api/admin/users/1/suspend
```

**Location:** `/home/dell/IdeaProjects/MealBridge/server/src/routes/admin.routes.js`

---

## 4. Controller Files

### **4.1 server/src/controllers/auth.controller.js**

**Purpose:** Handle authentication and user management logic

**Functions:**
```javascript
exports.register = async (req, res, next) => { ... }
exports.login = async (req, res, next) => { ... }
exports.getProfile = async (req, res, next) => { ... }
exports.updateProfile = async (req, res, next) => { ... }
```

**Key Operations:**
- User registration with password hashing
- User login with password verification
- JWT token generation
- Profile retrieval and updates
- Geospatial data handling (lat/lng)

**Database Tables Used:**
- `users`

**Location:** `/home/dell/IdeaProjects/MealBridge/server/src/controllers/auth.controller.js`

---

### **4.2 server/src/controllers/listings.controller.js**

**Purpose:** Handle food listings operations

**Functions:**
```javascript
exports.create = async (req, res, next) => { ... }
exports.getMine = async (req, res, next) => { ... }
exports.getNearby = async (req, res, next) => { ... }
exports.getById = async (req, res, next) => { ... }
exports.update = async (req, res, next) => { ... }
exports.delete = async (req, res, next) => { ... }
```

**Key Operations:**
- Create food listings
- Get donor's listings
- Find nearby listings (PostGIS geospatial queries)
- Update listing details
- Delete/cancel listings
- Auto-matching with NGOs

**Database Tables Used:**
- `food_listings`
- `users` (for donor info)

**Location:** `/home/dell/IdeaProjects/MealBridge/server/src/controllers/listings.controller.js`

---

### **4.3 server/src/controllers/claims.controller.js**

**Purpose:** Handle food claim operations

**Functions:**
```javascript
exports.create = async (req, res, next) => { ... }
exports.getMine = async (req, res, next) => { ... }
exports.markPickup = async (req, res, next) => { ... }
exports.complete = async (req, res, next) => { ... }
exports.cancel = async (req, res, next) => { ... }
```

**Key Operations:**
- Claim food listings (with transaction safety)
- Get NGO's claims
- Update claim status
- Complete claims (handover)
- Cancel claims
- Send Socket.io notifications

**Database Tables Used:**
- `claims`
- `food_listings`
- `users`

**Location:** `/home/dell/IdeaProjects/MealBridge/server/src/controllers/claims.controller.js`

---

### **4.4 server/src/controllers/ratings.controller.js**

**Purpose:** Handle rating and feedback operations

**Functions:**
```javascript
exports.create = async (req, res, next) => { ... }
exports.getReceived = async (req, res, next) => { ... }
```

**Key Operations:**
- Submit ratings for completed claims
- Retrieve ratings received by user
- Calculate average ratings
- Update user's avg_rating

**Database Tables Used:**
- `ratings`
- `claims`
- `users`

**Location:** `/home/dell/IdeaProjects/MealBridge/server/src/controllers/ratings.controller.js`

---

### **4.5 server/src/controllers/admin.controller.js**

**Purpose:** Handle admin operations

**Functions:**
```javascript
exports.getVerifications = async (req, res, next) => { ... }
exports.verifyUser = async (req, res, next) => { ... }
exports.getStats = async (req, res, next) => { ... }
exports.getUsers = async (req, res, next) => { ... }
exports.suspendUser = async (req, res, next) => { ... }
```

**Key Operations:**
- Manage NGO verifications
- Approve/reject NGO applications
- Generate platform statistics
- List and manage users
- Suspend/ban users

**Database Tables Used:**
- `users`
- `food_listings`
- `claims`
- `ratings`

**Location:** `/home/dell/IdeaProjects/MealBridge/server/src/controllers/admin.controller.js`

---

## 5. Middleware Files

### **5.1 server/src/middleware/auth.js**

**Purpose:** JWT authentication middleware

**Functions:**
```javascript
exports.authMiddleware = async (req, res, next) => { ... }
exports.requireRole = (roles) => { ... }
```

**Key Operations:**
- Verify JWT tokens
- Extract user info from token
- Add `req.user` to request object
- Role-based access control

**Usage in Routes:**
```javascript
router.get('/me', authMiddleware, authController.getProfile);
router.post('/listings', authMiddleware, listingsController.create);
```

**Location:** `/home/dell/IdeaProjects/MealBridge/server/src/middleware/auth.js`

---

### **5.2 server/src/middleware/errorHandler.js**

**Purpose:** Centralized error handling

**Function:**
```javascript
module.exports = (err, req, res, next) => { ... }
```

**Key Operations:**
- Catch all errors
- Format error responses
- Log errors
- Send appropriate HTTP status codes

**Usage:**
```javascript
app.use(errorHandler);  // Last middleware in chain
```

**Location:** `/home/dell/IdeaProjects/MealBridge/server/src/middleware/errorHandler.js`

---

## 6. Database Files

### **6.1 server/src/db/schema.sql**

**Purpose:** Database schema definition

**Contains:**
- Table definitions (users, food_listings, claims, ratings, notifications)
- Indexes (including GiST indexes for geospatial)
- Foreign key constraints
- Check constraints
- PostGIS extension setup

**Location:** `/home/dell/IdeaProjects/MealBridge/server/src/db/schema.sql`

---

### **6.2 server/src/db/seed.sql** (Optional)

**Purpose:** Sample test data

**Contains:**
- Sample users (donors, NGOs, admin)
- Sample food listings
- Sample claims
- Sample ratings

**Location:** `/home/dell/IdeaProjects/MealBridge/server/src/db/seed.sql`

---

## Quick Reference: All API Endpoints

### Authentication (`/api/auth`)
```
POST   /register              # Register user
POST   /login                 # Login user
GET    /me                    # Get profile (auth required)
PATCH  /profile               # Update profile (auth required)
```

### Listings (`/api/listings`)
```
POST   /                      # Create listing (donor)
GET    /mine                  # Get my listings (donor)
GET    /nearby                # Get nearby listings (ngo)
GET    /:id                   # Get listing details
PATCH  /:id                   # Update listing (owner)
DELETE /:id                   # Delete listing (owner)
```

### Claims (`/api/claims`)
```
POST   /:listingId            # Claim listing (ngo)
GET    /mine                  # Get my claims (ngo)
PATCH  /:id/pickup            # Mark pickup started (ngo)
PATCH  /:id/complete          # Complete claim (donor)
DELETE /:id                   # Cancel claim (ngo)
```

### Ratings (`/api/ratings`)
```
POST   /                      # Submit rating
GET    /received              # Get ratings received
```

### Admin (`/api/admin`)
```
GET    /verifications         # Get pending verifications (admin)
PATCH  /verify/:userId        # Verify NGO (admin)
GET    /stats                 # Get statistics (admin)
GET    /users                 # List users (admin)
PATCH  /users/:id/suspend     # Suspend user (admin)
```

---

## File Paths Summary

### Core Files
```
/home/dell/IdeaProjects/MealBridge/server/src/index.js
/home/dell/IdeaProjects/MealBridge/server/src/config/db.js
```

### Routes (5 files)
```
/home/dell/IdeaProjects/MealBridge/server/src/routes/auth.routes.js
/home/dell/IdeaProjects/MealBridge/server/src/routes/listings.routes.js
/home/dell/IdeaProjects/MealBridge/server/src/routes/claims.routes.js
/home/dell/IdeaProjects/MealBridge/server/src/routes/ratings.routes.js
/home/dell/IdeaProjects/MealBridge/server/src/routes/admin.routes.js
```

### Controllers (5 files)
```
/home/dell/IdeaProjects/MealBridge/server/src/controllers/auth.controller.js
/home/dell/IdeaProjects/MealBridge/server/src/controllers/listings.controller.js
/home/dell/IdeaProjects/MealBridge/server/src/controllers/claims.controller.js
/home/dell/IdeaProjects/MealBridge/server/src/controllers/ratings.controller.js
/home/dell/IdeaProjects/MealBridge/server/src/controllers/admin.controller.js
```

### Middleware (2 files)
```
/home/dell/IdeaProjects/MealBridge/server/src/middleware/auth.js
/home/dell/IdeaProjects/MealBridge/server/src/middleware/errorHandler.js
```

### Database (2 files)
```
/home/dell/IdeaProjects/MealBridge/server/src/db/schema.sql
/home/dell/IdeaProjects/MealBridge/server/src/db/seed.sql
```

---

## How They Work Together

### Request Flow Example: Login

```
1. Client → POST /api/auth/login
              ↓
2. index.js → Routes request to auth.routes.js
              ↓
3. auth.routes.js → Maps to authController.login
              ↓
4. auth.controller.js →
   - Validates credentials
   - Queries database via db.js
   - Generates JWT token
   - Returns response
              ↓
5. Client ← Receives { user, token }
```

### Request Flow Example: Create Listing (with Auth)

```
1. Client → POST /api/listings (with JWT token in header)
              ↓
2. index.js → Routes to listings.routes.js
              ↓
3. listings.routes.js → Passes through authMiddleware
              ↓
4. auth.js → Verifies token, adds req.user
              ↓
5. listings.routes.js → Calls listingsController.create
              ↓
6. listings.controller.js →
   - Uses req.user.id as donor_id
   - Inserts into database
   - Triggers Socket.io notification
   - Returns response
              ↓
7. Client ← Receives { listing }
```

---

## Key Technologies Used

- **Express.js** - Web framework
- **PostgreSQL + PostGIS** - Database with geospatial support
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Socket.io** - Real-time notifications
- **CORS** - Cross-origin requests
- **Helmet** - Security headers

---

**Last Updated:** 2024-01-16
**Total API Files:** 15 files