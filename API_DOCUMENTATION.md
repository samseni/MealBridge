# MealBridge API Documentation

Complete reference for all API endpoints used in the MealBridge application.

**Base URL:** `http://localhost:5000/api` (Development)
**Base URL:** `http://192.168.29.84:5000/api` (Network Access)

---

## Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [Food Listings APIs](#food-listings-apis)
3. [Claims APIs](#claims-apis)
4. [Ratings APIs](#ratings-apis)
5. [Admin APIs](#admin-apis)
6. [Socket.io Events](#socketio-events)
7. [Error Responses](#error-responses)

---

## Authentication APIs

### 1. Register User

**Endpoint:** `POST /api/auth/register`
**Access:** Public
**Description:** Create a new user account

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "donor",
  "org_name": "My Organization",
  "phone": "1234567890",
  "address": "123 Main St",
  "lat": 12.9716,
  "lng": 77.5946
}
```

**Required Fields:**
- `name` (string)
- `email` (string, unique)
- `password` (string, min 6 characters)
- `role` (enum: "donor", "ngo", "admin")

**Optional Fields:**
- `org_name` (string, required if role is "ngo")
- `phone` (string)
- `address` (string)
- `lat` (number, latitude)
- `lng` (number, longitude)

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "donor",
    "org_name": null,
    "phone": "1234567890",
    "verification": "pending",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (409):**
```json
{
  "message": "Email already exists"
}
```

---

### 2. Login User

**Endpoint:** `POST /api/auth/login`
**Access:** Public
**Description:** Authenticate user and receive JWT token

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "donor",
    "org_name": null,
    "phone": "1234567890",
    "address": "123 Main St",
    "verification": "approved",
    "avg_rating": 4.5,
    "created_at": "2024-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401):**
```json
{
  "message": "Invalid credentials"
}
```

---

### 3. Get Current User Profile

**Endpoint:** `GET /api/auth/me`
**Access:** Authenticated (requires JWT token)
**Description:** Get logged-in user's profile

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Success Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "donor",
    "org_name": null,
    "phone": "1234567890",
    "address": "123 Main St",
    "verification": "approved",
    "avg_rating": 4.5,
    "lat": 12.9716,
    "lng": 77.5946,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### 4. Update User Profile

**Endpoint:** `PATCH /api/auth/profile`
**Access:** Authenticated
**Description:** Update user profile information

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "phone": "9876543210",
  "address": "456 New Street",
  "lat": 12.9800,
  "lng": 77.6000
}
```

**All Fields Optional**

**Success Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "name": "John Doe Updated",
    "email": "john@example.com",
    "role": "donor",
    "org_name": null,
    "phone": "9876543210",
    "address": "456 New Street",
    "verification": "approved",
    "avg_rating": 4.5,
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

---

## Food Listings APIs

### 1. Create Food Listing

**Endpoint:** `POST /api/listings`
**Access:** Donor only
**Description:** Create a new food donation listing

**Request Body:**
```json
{
  "title": "50 Meals - Biryani",
  "description": "Fresh biryani from wedding event",
  "category": "cooked",
  "is_veg": false,
  "is_halal": true,
  "servings": 50,
  "prepared_at": "2024-01-15T18:00:00Z",
  "pickup_start": "2024-01-15T20:00:00Z",
  "pickup_end": "2024-01-15T22:00:00Z",
  "address": "123 Event Hall, Bangalore",
  "lat": 12.9716,
  "lng": 77.5946,
  "photo_url": "https://example.com/photo.jpg"
}
```

**Required Fields:**
- `title` (string)
- `category` (enum: "cooked", "packaged", "raw")
- `servings` (number, > 0)
- `pickup_start` (ISO datetime)
- `pickup_end` (ISO datetime)
- `address` (string)
- `lat` (number)
- `lng` (number)

**Success Response (201):**
```json
{
  "message": "Listing created successfully",
  "listing": {
    "id": 1,
    "donor_id": 1,
    "title": "50 Meals - Biryani",
    "category": "cooked",
    "servings": 50,
    "status": "available",
    "expires_at": "2024-01-15T20:00:00Z",
    "created_at": "2024-01-15T19:00:00Z"
  },
  "matched_ngos": 5
}
```

---

### 2. Get My Listings (Donor)

**Endpoint:** `GET /api/listings/mine`
**Access:** Donor only
**Description:** Get all listings created by logged-in donor

**Query Parameters:**
- `status` (optional): "available", "claimed", "completed", "expired"
- `limit` (optional, default: 20)
- `offset` (optional, default: 0)

**Example:** `/api/listings/mine?status=available&limit=10`

**Success Response (200):**
```json
{
  "listings": [
    {
      "id": 1,
      "title": "50 Meals - Biryani",
      "category": "cooked",
      "servings": 50,
      "status": "available",
      "pickup_start": "2024-01-15T20:00:00Z",
      "pickup_end": "2024-01-15T22:00:00Z",
      "expires_at": "2024-01-15T20:00:00Z",
      "created_at": "2024-01-15T19:00:00Z"
    }
  ],
  "total": 1
}
```

---

### 3. Get Nearby Listings (NGO)

**Endpoint:** `GET /api/listings/nearby`
**Access:** NGO only
**Description:** Get available food listings near NGO location

**Query Parameters:**
- `lat` (required): Latitude
- `lng` (required): Longitude
- `radius` (optional, default: 10000): Search radius in meters
- `limit` (optional, default: 20)

**Example:** `/api/listings/nearby?lat=12.9716&lng=77.5946&radius=5000`

**Success Response (200):**
```json
{
  "listings": [
    {
      "id": 1,
      "title": "50 Meals - Biryani",
      "description": "Fresh biryani from wedding event",
      "category": "cooked",
      "is_veg": false,
      "is_halal": true,
      "servings": 50,
      "pickup_start": "2024-01-15T20:00:00Z",
      "pickup_end": "2024-01-15T22:00:00Z",
      "address": "123 Event Hall, Bangalore",
      "lat": 12.9716,
      "lng": 77.5946,
      "distance_meters": 1250,
      "donor": {
        "name": "John Doe",
        "phone": "1234567890",
        "avg_rating": 4.5
      }
    }
  ],
  "total": 1
}
```

---

### 4. Get Listing Details

**Endpoint:** `GET /api/listings/:id`
**Access:** Authenticated
**Description:** Get detailed information about a specific listing

**Success Response (200):**
```json
{
  "listing": {
    "id": 1,
    "title": "50 Meals - Biryani",
    "description": "Fresh biryani from wedding event",
    "category": "cooked",
    "is_veg": false,
    "is_halal": true,
    "servings": 50,
    "prepared_at": "2024-01-15T18:00:00Z",
    "pickup_start": "2024-01-15T20:00:00Z",
    "pickup_end": "2024-01-15T22:00:00Z",
    "expires_at": "2024-01-15T20:00:00Z",
    "address": "123 Event Hall, Bangalore",
    "lat": 12.9716,
    "lng": 77.5946,
    "photo_url": "https://example.com/photo.jpg",
    "status": "available",
    "donor": {
      "id": 1,
      "name": "John Doe",
      "phone": "1234567890",
      "avg_rating": 4.5
    },
    "created_at": "2024-01-15T19:00:00Z"
  }
}
```

---

### 5. Update Listing

**Endpoint:** `PATCH /api/listings/:id`
**Access:** Donor (owner only)
**Description:** Update listing details (only if not claimed)

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "pickup_end": "2024-01-15T23:00:00Z"
}
```

**Success Response (200):**
```json
{
  "message": "Listing updated successfully",
  "listing": {
    "id": 1,
    "title": "Updated Title",
    "updated_at": "2024-01-15T19:30:00Z"
  }
}
```

---

### 6. Delete Listing

**Endpoint:** `DELETE /api/listings/:id`
**Access:** Donor (owner only)
**Description:** Cancel/delete a listing

**Success Response (200):**
```json
{
  "message": "Listing deleted successfully"
}
```

---

## Claims APIs

### 1. Claim a Listing

**Endpoint:** `POST /api/claims/:listingId`
**Access:** NGO only
**Description:** Claim an available food listing

**Success Response (201):**
```json
{
  "message": "Listing claimed successfully",
  "claim": {
    "id": 1,
    "listing_id": 1,
    "ngo_id": 2,
    "claimed_at": "2024-01-15T19:45:00Z"
  }
}
```

**Error Response (409):**
```json
{
  "message": "Listing already claimed"
}
```

---

### 2. Get My Claims (NGO)

**Endpoint:** `GET /api/claims/mine`
**Access:** NGO only
**Description:** Get all claims made by logged-in NGO

**Query Parameters:**
- `status` (optional): Filter by claim status
- `limit` (optional, default: 20)

**Success Response (200):**
```json
{
  "claims": [
    {
      "id": 1,
      "listing": {
        "id": 1,
        "title": "50 Meals - Biryani",
        "servings": 50,
        "address": "123 Event Hall",
        "pickup_start": "2024-01-15T20:00:00Z",
        "pickup_end": "2024-01-15T22:00:00Z"
      },
      "donor": {
        "name": "John Doe",
        "phone": "1234567890"
      },
      "claimed_at": "2024-01-15T19:45:00Z",
      "picked_up_at": null,
      "completed_at": null
    }
  ],
  "total": 1
}
```

---

### 3. Mark Pickup Started

**Endpoint:** `PATCH /api/claims/:id/pickup`
**Access:** NGO (claim owner)
**Description:** Mark that NGO is on the way to pickup

**Request Body:**
```json
{
  "estimated_arrival": "2024-01-15T20:15:00Z"
}
```

**Success Response (200):**
```json
{
  "message": "Claim updated - pickup started",
  "claim": {
    "id": 1,
    "picked_up_at": "2024-01-15T20:00:00Z"
  }
}
```

---

### 4. Complete Claim

**Endpoint:** `PATCH /api/claims/:id/complete`
**Access:** Donor only
**Description:** Mark claim as completed after successful handover

**Success Response (200):**
```json
{
  "message": "Claim completed successfully",
  "claim": {
    "id": 1,
    "completed_at": "2024-01-15T20:30:00Z"
  }
}
```

---

### 5. Cancel Claim

**Endpoint:** `DELETE /api/claims/:id`
**Access:** NGO (claim owner)
**Description:** Cancel a claim

**Request Body:**
```json
{
  "reason": "Unable to reach on time"
}
```

**Success Response (200):**
```json
{
  "message": "Claim cancelled successfully"
}
```

---

## Ratings APIs

### 1. Submit Rating

**Endpoint:** `POST /api/ratings`
**Access:** Authenticated
**Description:** Rate a user after completing a claim

**Request Body:**
```json
{
  "claim_id": 1,
  "score": 5,
  "comment": "Very professional and food was well-packaged"
}
```

**Required Fields:**
- `claim_id` (number)
- `score` (number, 1-5)

**Optional Fields:**
- `comment` (string)

**Success Response (201):**
```json
{
  "message": "Rating submitted successfully",
  "rating": {
    "id": 1,
    "claim_id": 1,
    "score": 5,
    "comment": "Very professional and food was well-packaged",
    "created_at": "2024-01-15T21:00:00Z"
  }
}
```

---

### 2. Get Received Ratings

**Endpoint:** `GET /api/ratings/received`
**Access:** Authenticated
**Description:** Get ratings received by logged-in user

**Query Parameters:**
- `limit` (optional, default: 20)

**Success Response (200):**
```json
{
  "ratings": [
    {
      "id": 1,
      "score": 5,
      "comment": "Very professional",
      "rater": {
        "name": "NGO Name",
        "role": "ngo"
      },
      "created_at": "2024-01-15T21:00:00Z"
    }
  ],
  "avg_rating": 4.8,
  "total": 10
}
```

---

## Admin APIs

### 1. Get Pending Verifications

**Endpoint:** `GET /api/admin/verifications`
**Access:** Admin only
**Description:** Get list of NGOs pending verification

**Query Parameters:**
- `status` (optional): "pending", "approved", "rejected"

**Success Response (200):**
```json
{
  "verifications": [
    {
      "id": 2,
      "name": "Food Bank NGO",
      "org_name": "City Food Bank",
      "email": "ngo@example.com",
      "phone": "9876543210",
      "verification": "pending",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

---

### 2. Verify NGO

**Endpoint:** `PATCH /api/admin/verify/:userId`
**Access:** Admin only
**Description:** Approve or reject NGO verification

**Request Body:**
```json
{
  "status": "approved"
}
```

**Status Options:** "approved", "rejected"

**Success Response (200):**
```json
{
  "message": "User verification updated",
  "user": {
    "id": 2,
    "verification": "approved"
  }
}
```

---

### 3. Get Platform Statistics

**Endpoint:** `GET /api/admin/stats`
**Access:** Admin only
**Description:** Get platform-wide statistics

**Query Parameters:**
- `start_date` (optional): Filter from date
- `end_date` (optional): Filter to date

**Success Response (200):**
```json
{
  "stats": {
    "total_users": 150,
    "total_donors": 80,
    "total_ngos": 65,
    "verified_ngos": 45,
    "pending_verifications": 20,
    "total_listings": 500,
    "active_listings": 25,
    "completed_claims": 450,
    "total_meals_redistributed": 12500,
    "avg_claim_time_minutes": 35
  }
}
```

---

### 4. Get All Users

**Endpoint:** `GET /api/admin/users`
**Access:** Admin only
**Description:** Get list of all users

**Query Parameters:**
- `role` (optional): Filter by role
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

**Success Response (200):**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "donor",
      "verification": "approved",
      "avg_rating": 4.5,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 150
}
```

---

### 5. Suspend User

**Endpoint:** `PATCH /api/admin/users/:id/suspend`
**Access:** Admin only
**Description:** Suspend a user account

**Request Body:**
```json
{
  "reason": "Violation of terms of service"
}
```

**Success Response (200):**
```json
{
  "message": "User suspended successfully"
}
```

---

## Socket.io Events

**Connection URL:** `http://localhost:5000` or `http://192.168.29.84:5000`

### Client → Server Events

#### 1. Join Room
```javascript
socket.emit('join', userId);
```

**Description:** Join user-specific room for notifications

---

#### 2. Mark Notification as Read
```javascript
socket.emit('notification:read', { notificationId: 123 });
```

---

### Server → Client Events

#### 1. New Listing Alert
```javascript
socket.on('listing:new', (data) => {
  // data structure:
  {
    listingId: 1,
    title: "50 Meals - Biryani",
    distance: 1250,
    servings: 50,
    pickup_start: "2024-01-15T20:00:00Z"
  }
});
```

**Target:** NGOs within matching radius

---

#### 2. Listing Claimed
```javascript
socket.on('listing:claimed', (data) => {
  // data structure:
  {
    listingId: 1,
    ngo: {
      name: "City Food Bank",
      org_name: "Food Bank NGO",
      phone: "9876543210"
    }
  }
});
```

**Target:** Donor who created the listing

---

#### 3. Claim Status Update
```javascript
socket.on('claim:status_update', (data) => {
  // data structure:
  {
    claimId: 1,
    status: "in_transit",
    eta: "15 minutes"
  }
});
```

**Target:** Both donor and NGO

---

#### 4. Claim Completed
```javascript
socket.on('claim:completed', (data) => {
  // data structure:
  {
    claimId: 1,
    completedAt: "2024-01-15T20:30:00Z"
  }
});
```

**Target:** Both donor and NGO

---

## Error Responses

All error responses follow this format:

```json
{
  "message": "Error description"
}
```

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Missing required fields |
| 401 | Unauthorized | Invalid or missing JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Email already exists, listing already claimed |
| 500 | Server Error | Database error, server issue |

---

## Authentication

Most endpoints require JWT authentication. Include the token in request headers:

```javascript
headers: {
  'Authorization': 'Bearer <JWT_TOKEN>',
  'Content-Type': 'application/json'
}
```

**Token Expiry:** 7 days (configurable)

**Where to get token:** Returned from `/api/auth/register` and `/api/auth/login`

---

## Example Usage

### JavaScript (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Register user
const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Get nearby listings
const getNearbyListings = async (lat, lng) => {
  const response = await api.get('/listings/nearby', {
    params: { lat, lng, radius: 10000 }
  });
  return response.data;
};
```

---

### cURL Examples

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "donor"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Create Listing (with token):**
```bash
curl -X POST http://localhost:5000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "50 Meals",
    "category": "cooked",
    "servings": 50,
    "pickup_start": "2024-01-15T20:00:00Z",
    "pickup_end": "2024-01-15T22:00:00Z",
    "address": "123 Main St",
    "lat": 12.9716,
    "lng": 77.5946
  }'
```

---

## Rate Limiting

- **Window:** 15 minutes (900000ms)
- **Max Requests:** 100 per window
- **Applies to:** All API endpoints

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705329600
```

---

## Testing the APIs

Use tools like:
- **Postman** - Import endpoints and test manually
- **Thunder Client** - VS Code extension
- **cURL** - Command line testing
- **Frontend** - Test through the React app

---

## API Health Check

**Endpoint:** `GET /api/health`
**Access:** Public

**Success Response (200):**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

Use this to verify the server is running and database is connected.

---

**Last Updated:** 2024-01-16
**API Version:** 1.0.0