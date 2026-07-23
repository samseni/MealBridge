# API Creation & Data Flow Guide

> **Complete guide on how APIs are created, how data is stored, and how to push data to backend**
> Last Updated: 2026-07-23

---

## Table of Contents

1. [What is an API?](#what-is-an-api)
2. [How APIs are Created in Backend](#how-apis-are-created-in-backend)
3. [Data Flow: Frontend → Backend → Database](#data-flow-frontend--backend--database)
4. [Step-by-Step API Creation Process](#step-by-step-api-creation-process)
5. [How Data is Stored in APIs](#how-data-is-stored-in-apis)
6. [How to Push Data to Backend (Frontend to Backend)](#how-to-push-data-to-backend-frontend-to-backend)
7. [Complete Real-World Example](#complete-real-world-example)
8. [Common Data Flow Scenarios](#common-data-flow-scenarios)

---

## What is an API?

**API = Application Programming Interface**

Think of an API as a **waiter in a restaurant**:

```
You (Frontend)  →  Waiter (API)  →  Kitchen (Backend/Database)
     ↑                                      ↓
     └──────────────────────────────────────┘
                 (Food comes back)
```

- **You** = Frontend (React app)
- **Waiter** = API endpoints (routes)
- **Kitchen** = Backend server + Database
- **Menu** = API documentation
- **Order** = HTTP Request (POST, GET, PUT, DELETE)
- **Food** = HTTP Response (data)

---

## How APIs are Created in Backend

### Step 1: Define Route (The URL)

**File:** `server/src/routes/auth.routes.js`

```javascript
// Import Express Router
const express = require('express');
const router = express.Router();

// Import controller (the actual logic)
const authController = require('../controllers/auth.controller');

// ===== DEFINE API ROUTE =====
// POST = HTTP method (create/send data)
// '/register' = URL path
// authController.register = function to handle request
router.post('/register', authController.register);

// This creates the API endpoint:
// POST http://localhost:5000/api/auth/register
//      └─ server URL ─┘ └─ prefix ─┘ └─ route ─┘
```

### Step 2: Create Controller (The Logic)

**File:** `server/src/controllers/auth.controller.js`

```javascript
const pool = require('../config/db'); // Database connection
const bcrypt = require('bcryptjs');   // Password hashing

// ===== THIS IS THE API FUNCTION =====
// Handles POST /api/auth/register
exports.register = async (req, res) => {
  // req = REQUEST (data coming FROM frontend)
  // res = RESPONSE (data going TO frontend)

  try {
    // STEP 1: GET DATA FROM REQUEST
    // req.body contains JSON data sent by frontend
    const { name, email, password } = req.body;

    // STEP 2: VALIDATE DATA
    if (!email || !password) {
      // Send error response to frontend
      return res.status(400).json({
        message: 'Email and password required'
      });
    }

    // STEP 3: PROCESS DATA
    // Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // STEP 4: SAVE TO DATABASE
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email',
      [name, email, hashedPassword]
    );

    // STEP 5: SEND RESPONSE TO FRONTEND
    // res.json() sends JSON response
    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0]
    });

  } catch (error) {
    // STEP 6: HANDLE ERRORS
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};
```

### Step 3: Register Route in Main Server

**File:** `server/src/index.js`

```javascript
const express = require('express');
const app = express();

// Import routes
const authRoutes = require('./routes/auth.routes');

// MOUNT ROUTES
// All routes in authRoutes get /api/auth prefix
app.use('/api/auth', authRoutes);

// Now the route is accessible:
// POST http://localhost:5000/api/auth/register
```

---

## Data Flow: Frontend → Backend → Database

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│                                                                 │
│  User fills form:                                               │
│  ┌──────────────────────┐                                       │
│  │ Name: John Doe       │                                       │
│  │ Email: john@test.com │                                       │
│  │ Password: pass123    │                                       │
│  │ [Register Button]    │                                       │
│  └──────────────────────┘                                       │
│                  ↓                                               │
│  handleSubmit() function triggers                               │
│                  ↓                                               │
│  axios.post('/api/auth/register', {                             │
│    name: 'John Doe',                                            │
│    email: 'john@test.com',                                      │
│    password: 'pass123'                                          │
│  })                                                             │
└─────────────────────────────────────────────────────────────────┘
                           ↓
                    (HTTP Request)
                    JSON payload:
                    {
                      "name": "John Doe",
                      "email": "john@test.com",
                      "password": "pass123"
                    }
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express Server)                     │
│                                                                 │
│  1. Request arrives at: POST /api/auth/register                 │
│                  ↓                                               │
│  2. Middleware processes request:                               │
│     - express.json() parses JSON → req.body                     │
│     - CORS allows cross-origin request                          │
│                  ↓                                               │
│  3. Route matches: router.post('/register', ...)                │
│                  ↓                                               │
│  4. Controller function executes:                               │
│     authController.register(req, res)                           │
│                  ↓                                               │
│  5. Extract data: const { name, email, password } = req.body    │
│                  ↓                                               │
│  6. Validate data: if (!email) return error                     │
│                  ↓                                               │
│  7. Process data: hash password                                 │
│     hashedPassword = "$2a$10$xyz..."                            │
│                  ↓                                               │
│  8. Prepare database query:                                     │
│     INSERT INTO users (name, email, password_hash)              │
│     VALUES ('John Doe', 'john@test.com', '$2a$10$xyz...')       │
└─────────────────────────────────────────────────────────────────┘
                           ↓
                    (SQL Query)
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE (PostgreSQL)                         │
│                                                                 │
│  1. Receive query from backend                                  │
│                  ↓                                               │
│  2. Execute INSERT statement                                    │
│                  ↓                                               │
│  3. Create new row in 'users' table:                            │
│     ┌────┬──────────┬─────────────────┬─────────────────┐      │
│     │ id │   name   │      email      │  password_hash  │      │
│     ├────┼──────────┼─────────────────┼─────────────────┤      │
│     │ 1  │ John Doe │ john@test.com   │ $2a$10$xyz...   │      │
│     └────┴──────────┴─────────────────┴─────────────────┘      │
│                  ↓                                               │
│  4. Return inserted row:                                        │
│     { id: 1, name: 'John Doe', email: 'john@test.com' }        │
└─────────────────────────────────────────────────────────────────┘
                           ↓
                    (Query Result)
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express Server)                     │
│                                                                 │
│  9. Receive database result                                     │
│                  ↓                                               │
│  10. Format response:                                           │
│      res.status(201).json({                                     │
│        message: 'User created successfully',                    │
│        user: { id: 1, name: 'John Doe', email: 'john@test.com' }│
│      })                                                         │
└─────────────────────────────────────────────────────────────────┘
                           ↓
                    (HTTP Response)
                    Status: 201 Created
                    JSON payload:
                    {
                      "message": "User created successfully",
                      "user": {
                        "id": 1,
                        "name": "John Doe",
                        "email": "john@test.com"
                      }
                    }
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│                                                                 │
│  11. axios.post() receives response                             │
│                  ↓                                               │
│  12. .then() or await processes response:                       │
│      const response = await axios.post(...)                     │
│      console.log(response.data)                                 │
│      // { message: '...', user: {...} }                         │
│                  ↓                                               │
│  13. Update UI:                                                 │
│      - Show success message                                     │
│      - Redirect to dashboard                                    │
│      - Save token to localStorage                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step API Creation Process

Let's create a **Create Food Listing** API from scratch.

### Step 1: Plan the API

**What we need:**
- **URL:** POST `/api/listings`
- **Purpose:** Create a new food listing
- **Input data:** title, description, servings, category, location
- **Output data:** Created listing with ID

### Step 2: Create Database Table (Already done in schema.sql)

```sql
-- This table already exists in our database
CREATE TABLE listings (
    id SERIAL PRIMARY KEY,
    donor_id INTEGER,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    servings INTEGER,
    category food_category,
    location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 3: Create Controller Function

**File:** `server/src/controllers/listings.controller.js`

```javascript
const pool = require('../config/db');

// ===== CREATE LISTING API =====
exports.createListing = async (req, res) => {
  try {
    // ─────────────────────────────────────────
    // STEP 1: GET DATA FROM REQUEST
    // ─────────────────────────────────────────
    // req.user comes from auth middleware (JWT token)
    const donorId = req.user.id;

    // req.body comes from frontend form
    const {
      title,        // "Fresh Biryani"
      description,  // "50 servings of vegetable biryani"
      servings,     // 50
      category,     // "cooked"
      lat,          // 40.7128
      lng           // -74.0060
    } = req.body;

    // ─────────────────────────────────────────
    // STEP 2: VALIDATE DATA
    // ─────────────────────────────────────────
    if (!title || !servings || !category) {
      return res.status(400).json({
        message: 'Title, servings, and category are required'
      });
    }

    // Validate servings is positive number
    if (servings <= 0) {
      return res.status(400).json({
        message: 'Servings must be greater than 0'
      });
    }

    // ─────────────────────────────────────────
    // STEP 3: PROCESS DATA
    // ─────────────────────────────────────────
    // Create PostGIS point from lat/lng
    let locationSQL = 'NULL';
    let queryParams = [donorId, title, description, servings, category];

    if (lat && lng) {
      // ST_MakePoint(longitude, latitude) - note the order!
      locationSQL = `ST_SetSRID(ST_MakePoint($${queryParams.length + 1}, $${queryParams.length + 2}), 4326)::geography`;
      queryParams.push(lng, lat);
    }

    // ─────────────────────────────────────────
    // STEP 4: INSERT INTO DATABASE
    // ─────────────────────────────────────────
    const result = await pool.query(
      `INSERT INTO listings
       (donor_id, title, description, servings, category, location)
       VALUES ($1, $2, $3, $4, $5, ${locationSQL})
       RETURNING id, title, servings, created_at`,
      queryParams
    );

    // Get the inserted listing
    const listing = result.rows[0];

    // ─────────────────────────────────────────
    // STEP 5: SEND RESPONSE TO FRONTEND
    // ─────────────────────────────────────────
    res.status(201).json({
      message: 'Listing created successfully',
      listing: listing
    });

  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({
      message: 'Failed to create listing',
      error: error.message
    });
  }
};
```

### Step 4: Create Route

**File:** `server/src/routes/listings.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const listingsController = require('../controllers/listings.controller');
const { authMiddleware } = require('../middleware/auth');

// ===== CREATE LISTING ROUTE =====
// POST /api/listings
// Protected route - requires authentication
router.post(
  '/',                                    // URL path
  authMiddleware,                         // Verify JWT token first
  listingsController.createListing        // Then run controller
);

// URL becomes: POST http://localhost:5000/api/listings

module.exports = router;
```

### Step 5: Register Route in Main Server

**File:** `server/src/index.js`

```javascript
const listingsRoutes = require('./routes/listings.routes');

// Mount routes
app.use('/api/listings', listingsRoutes);
```

### Step 6: Create Frontend API Client

**File:** `client/src/api/listings.api.js`

```javascript
import axios from './axios'; // Configured axios instance

export const listingsAPI = {
  // CREATE LISTING
  create: (data) => axios.post('/listings', data),
  // This calls: POST http://localhost:5000/api/listings
  // with data as request body
};
```

### Step 7: Use API in React Component

**File:** `client/src/pages/DonorDashboard.jsx`

```javascript
import { listingsAPI } from '../api/listings.api';

function DonorDashboard() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    servings: 0,
    category: 'cooked',
    lat: 40.7128,
    lng: -74.0060
  });

  // ─────────────────────────────────────────
  // SUBMIT FORM → CALL API
  // ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // CALL BACKEND API
      const response = await listingsAPI.create(formData);

      // response.data contains the JSON returned by backend
      console.log(response.data);
      // {
      //   message: 'Listing created successfully',
      //   listing: { id: 1, title: 'Fresh Biryani', ... }
      // }

      // Show success message
      alert('Listing created!');

    } catch (error) {
      // Handle error
      console.error(error.response?.data?.message);
      alert('Failed to create listing');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
      />
      <button type="submit">Create Listing</button>
    </form>
  );
}
```

---

## How Data is Stored in APIs

### 1. Request Data (Frontend → Backend)

**Format:** JSON (JavaScript Object Notation)

```javascript
// Frontend sends this:
{
  "title": "Fresh Biryani",
  "servings": 50,
  "category": "cooked",
  "lat": 40.7128,
  "lng": -74.0060
}
```

**How it travels:**
```
Frontend (JavaScript Object)
    ↓
JSON.stringify() - converts to text
    ↓
HTTP Request Body (text/string)
    ↓
Network (Internet)
    ↓
Backend receives text
    ↓
express.json() middleware - converts back to object
    ↓
req.body (JavaScript Object again)
```

### 2. Database Storage

**Data is stored in table rows:**

```
listings table:
┌────┬──────────┬───────────────┬──────────┬──────────┬─────────────────┐
│ id │ donor_id │     title     │ servings │ category │    location     │
├────┼──────────┼───────────────┼──────────┼──────────┼─────────────────┤
│ 1  │    5     │Fresh Biryani  │    50    │  cooked  │ POINT(-74 40.7) │
└────┴──────────┴───────────────┴──────────┴──────────┴─────────────────┘
```

### 3. Response Data (Backend → Frontend)

**Format:** JSON

```javascript
// Backend sends this:
{
  "message": "Listing created successfully",
  "listing": {
    "id": 1,
    "title": "Fresh Biryani",
    "servings": 50,
    "created_at": "2026-07-23T12:00:00Z"
  }
}
```

**How it travels back:**
```
Database (table row)
    ↓
pool.query() result - JavaScript object
    ↓
res.json() - converts to JSON text
    ↓
HTTP Response Body (text)
    ↓
Network (Internet)
    ↓
Frontend receives text
    ↓
axios automatically parses JSON → JavaScript object
    ↓
response.data (JavaScript Object)
```

---

## How to Push Data to Backend (Frontend to Backend)

### Method 1: Using Axios (Recommended)

**Setup Axios:**

```javascript
// File: client/src/api/axios.js

import axios from 'axios';

// Create configured axios instance
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api',  // Backend URL
  headers: {
    'Content-Type': 'application/json'   // Send JSON data
  }
});

// Automatically add token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
```

**Create API Functions:**

```javascript
// File: client/src/api/listings.api.js

import axios from './axios';

export const listingsAPI = {
  // ═══════════════════════════════════════
  // POST Request - Create new listing
  // ═══════════════════════════════════════
  create: (data) => {
    // axios.post(url, data, config)
    return axios.post('/listings', data);
    // Sends: POST http://localhost:5000/api/listings
    // Body: data object as JSON
  },

  // ═══════════════════════════════════════
  // GET Request - Fetch listings
  // ═══════════════════════════════════════
  getAll: (lat, lng) => {
    // axios.get(url, { params: {...} })
    return axios.get('/listings', {
      params: { lat, lng }  // Query parameters
    });
    // Sends: GET http://localhost:5000/api/listings?lat=40.7&lng=-74
  },

  // ═══════════════════════════════════════
  // PUT Request - Update listing
  // ═══════════════════════════════════════
  update: (id, data) => {
    return axios.put(`/listings/${id}`, data);
    // Sends: PUT http://localhost:5000/api/listings/1
    // Body: data object as JSON
  },

  // ═══════════════════════════════════════
  // DELETE Request - Delete listing
  // ═══════════════════════════════════════
  delete: (id) => {
    return axios.delete(`/listings/${id}`);
    // Sends: DELETE http://localhost:5000/api/listings/1
  }
};
```

**Use in React Component:**

```javascript
// File: client/src/pages/CreateListing.jsx

import { useState } from 'react';
import { listingsAPI } from '../api/listings.api';

function CreateListing() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    servings: 0,
    category: 'cooked'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ═══════════════════════════════════════
  // PUSH DATA TO BACKEND
  // ═══════════════════════════════════════
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload
    setLoading(true);
    setError('');

    try {
      // ─────────────────────────────────────
      // CALL API - Sends data to backend
      // ─────────────────────────────────────
      const response = await listingsAPI.create(formData);

      // ─────────────────────────────────────
      // SUCCESS - Data was saved
      // ─────────────────────────────────────
      console.log('Response:', response.data);
      // response.data = {
      //   message: 'Listing created successfully',
      //   listing: { id: 1, title: '...', ... }
      // }

      alert('Listing created successfully!');

      // Reset form
      setFormData({
        title: '',
        description: '',
        servings: 0,
        category: 'cooked'
      });

    } catch (err) {
      // ─────────────────────────────────────
      // ERROR - Something went wrong
      // ─────────────────────────────────────
      console.error('Error:', err);

      // Get error message from backend
      const errorMessage = err.response?.data?.message || 'Failed to create listing';
      setError(errorMessage);

    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}

      <input
        type="text"
        placeholder="Title"
        value={formData.title}
        onChange={(e) => setFormData({
          ...formData,
          title: e.target.value
        })}
        required
      />

      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({
          ...formData,
          description: e.target.value
        })}
      />

      <input
        type="number"
        placeholder="Servings"
        value={formData.servings}
        onChange={(e) => setFormData({
          ...formData,
          servings: parseInt(e.target.value)
        })}
        required
      />

      <select
        value={formData.category}
        onChange={(e) => setFormData({
          ...formData,
          category: e.target.value
        })}
      >
        <option value="cooked">Cooked</option>
        <option value="raw">Raw</option>
        <option value="packaged">Packaged</option>
      </select>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Listing'}
      </button>
    </form>
  );
}
```

### Method 2: Using Fetch API (Built-in JavaScript)

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    // Make POST request
    const response = await fetch('http://localhost:5000/api/listings', {
      method: 'POST',                          // HTTP method
      headers: {
        'Content-Type': 'application/json',    // Sending JSON
        'Authorization': `Bearer ${token}`     // Authentication
      },
      body: JSON.stringify(formData)          // Convert object to JSON string
    });

    // Parse JSON response
    const data = await response.json();

    if (response.ok) {
      // Success (status 200-299)
      console.log('Success:', data);
    } else {
      // Error (status 400-599)
      console.error('Error:', data.message);
    }

  } catch (error) {
    console.error('Network error:', error);
  }
};
```

---

## Complete Real-World Example

Let's trace a **complete user registration flow** from form to database.

### 1. User Fills Registration Form

```javascript
// File: client/src/pages/Register.jsx

import { useState } from 'react';
import axios from '../api/axios';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'donor'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('1. USER CLICKED SUBMIT');
    console.log('   Form data:', formData);
    // {
    //   name: 'John Doe',
    //   email: 'john@test.com',
    //   password: 'pass123',
    //   role: 'donor'
    // }

    try {
      console.log('2. SENDING DATA TO BACKEND');
      console.log('   URL: POST http://localhost:5000/api/auth/register');

      // ─────────────────────────────────────
      // THIS IS WHERE DATA IS PUSHED!
      // ─────────────────────────────────────
      const response = await axios.post('/auth/register', formData);

      console.log('9. RECEIVED RESPONSE FROM BACKEND');
      console.log('   Response:', response.data);
      // {
      //   message: 'Registration successful!',
      //   token: 'eyJhbGc...',
      //   user: { id: 1, name: 'John Doe', email: 'john@test.com' }
      // }

      // Save token to localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      alert('Registration successful!');

    } catch (error) {
      console.error('ERROR:', error.response?.data?.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        placeholder="Name"
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        placeholder="Email"
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        placeholder="Password"
      />
      <button type="submit">Register</button>
    </form>
  );
}
```

### 2. Axios Sends HTTP Request

```javascript
// What happens inside axios.post():

console.log('3. AXIOS PREPARING REQUEST');

// Convert JavaScript object to JSON string
const jsonString = JSON.stringify(formData);
// '{"name":"John Doe","email":"john@test.com","password":"pass123","role":"donor"}'

console.log('4. SENDING HTTP REQUEST');
console.log('   Method: POST');
console.log('   URL: http://localhost:5000/api/auth/register');
console.log('   Headers: Content-Type: application/json');
console.log('   Body:', jsonString);

// HTTP Request looks like this:
/*
POST /api/auth/register HTTP/1.1
Host: localhost:5000
Content-Type: application/json
Content-Length: 85

{"name":"John Doe","email":"john@test.com","password":"pass123","role":"donor"}
*/
```

### 3. Backend Receives Request

```javascript
// File: server/src/controllers/auth.controller.js

exports.register = async (req, res) => {
  console.log('5. BACKEND RECEIVED REQUEST');
  console.log('   req.body:', req.body);
  // {
  //   name: 'John Doe',
  //   email: 'john@test.com',
  //   password: 'pass123',
  //   role: 'donor'
  // }

  try {
    // Extract data
    const { name, email, password, role } = req.body;

    // Validate
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('6. PASSWORD HASHED');
    console.log('   Original:', password);
    console.log('   Hashed:', passwordHash);
    // Original: pass123
    // Hashed: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

    // Save to database
    console.log('7. SAVING TO DATABASE');
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, passwordHash, role]
    );

    console.log('7b. DATABASE RETURNED:');
    console.log('   ', result.rows[0]);
    // { id: 1, name: 'John Doe', email: 'john@test.com', role: 'donor' }

    const user = result.rows[0];

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('8. SENDING RESPONSE TO FRONTEND');

    // Send response
    res.status(201).json({
      message: 'Registration successful!',
      token: token,
      user: user
    });

  } catch (error) {
    console.error('ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
```

### 4. Data Saved in Database

```sql
-- What happens in PostgreSQL:

-- Query executed:
INSERT INTO users (name, email, password_hash, role)
VALUES ('John Doe', 'john@test.com', '$2a$10$N9qo8u...', 'donor')
RETURNING id, name, email, role;

-- Result:
--  id |   name   |      email      | role
-- ----+----------+-----------------+-------
--   1 | John Doe | john@test.com   | donor

-- Table now looks like:
SELECT * FROM users;
┌────┬──────────┬─────────────────┬───────────────────────┬───────┐
│ id │   name   │      email      │    password_hash      │ role  │
├────┼──────────┼─────────────────┼───────────────────────┼───────┤
│ 1  │ John Doe │ john@test.com   │ $2a$10$N9qo8u...     │ donor │
└────┴──────────┴─────────────────┴───────────────────────┴───────┘
```

---

## Common Data Flow Scenarios

### Scenario 1: Create (POST)

**Purpose:** Add new data to database

```
Frontend                 Backend                 Database
   │                        │                        │
   │  POST /api/listings    │                        │
   │  { title: "Food" }     │                        │
   │ ────────────────────> │                        │
   │                        │  INSERT INTO listings  │
   │                        │ ────────────────────> │
   │                        │                        │
   │                        │  ← { id: 1, title... } │
   │                        │ <──────────────────── │
   │                        │                        │
   │  ← { listing: {...} }  │                        │
   │ <──────────────────── │                        │
```

### Scenario 2: Read (GET)

**Purpose:** Fetch data from database

```
Frontend                 Backend                 Database
   │                        │                        │
   │  GET /api/listings     │                        │
   │ ────────────────────> │                        │
   │                        │  SELECT * FROM listings│
   │                        │ ────────────────────> │
   │                        │                        │
   │                        │  ← [list of listings]  │
   │                        │ <──────────────────── │
   │                        │                        │
   │  ← { listings: [...] } │                        │
   │ <──────────────────── │                        │
```

### Scenario 3: Update (PUT)

**Purpose:** Modify existing data

```
Frontend                 Backend                 Database
   │                        │                        │
   │  PUT /api/listings/1   │                        │
   │  { title: "New" }      │                        │
   │ ────────────────────> │                        │
   │                        │  UPDATE listings       │
   │                        │  SET title = 'New'     │
   │                        │  WHERE id = 1          │
   │                        │ ────────────────────> │
   │                        │                        │
   │                        │  ← updated row         │
   │                        │ <──────────────────── │
   │                        │                        │
   │  ← { listing: {...} }  │                        │
   │ <──────────────────── │                        │
```

### Scenario 4: Delete (DELETE)

**Purpose:** Remove data from database

```
Frontend                 Backend                 Database
   │                        │                        │
   │  DELETE /api/listings/1│                        │
   │ ────────────────────> │                        │
   │                        │  DELETE FROM listings  │
   │                        │  WHERE id = 1          │
   │                        │ ────────────────────> │
   │                        │                        │
   │                        │  ← success             │
   │                        │ <──────────────────── │
   │                        │                        │
   │  ← { message: "..." }  │                        │
   │ <──────────────────── │                        │
```

---

## Summary

### Key Takeaways

1. **API = Route + Controller**
   - Route defines the URL
   - Controller handles the logic

2. **Data Flow = Request → Process → Store → Response**
   - Frontend sends data (request)
   - Backend processes data
   - Database stores data
   - Backend sends result (response)

3. **Data Format = JSON**
   - Frontend: JavaScript Object → JSON string
   - Backend: JSON string → JavaScript Object
   - Database: Structured table rows
   - Backend: JavaScript Object → JSON string
   - Frontend: JSON string → JavaScript Object

4. **Push Data = HTTP Request**
   - Use axios.post() / axios.put()
   - Data goes in request body as JSON
   - Backend receives in req.body

5. **Store Data = SQL Query**
   - Backend executes INSERT/UPDATE query
   - Database saves data in table
   - Returns saved row to backend

---

**END OF GUIDE**