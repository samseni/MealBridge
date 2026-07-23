# MealBridge - Complete Project Documentation

> **Food Rescue Platform connecting Donors with NGOs**
> Version: 1.0
> Last Updated: 2026-07-23

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Database Schema](#database-schema)
5. [API Documentation](#api-documentation)
6. [Real-time Features (Socket.io)](#real-time-features-socketio)
7. [Authentication & Authorization](#authentication--authorization)
8. [Features Implemented](#features-implemented)
9. [Frontend Pages & Components](#frontend-pages--components)
10. [Environment Setup](#environment-setup)
11. [Deployment](#deployment)

---

## Project Overview

**MealBridge** is a full-stack web application that bridges the gap between food donors (restaurants, caterers, individuals) and NGOs that distribute food to those in need. The platform prevents food waste while addressing hunger.

### Key Features
- 🍱 **Food Listing Management** - Donors can create and manage food donations
- 🤝 **Claims System** - NGOs can claim available food listings
- ✅ **NGO Verification** - Admin approval system for NGOs
- 📊 **Analytics Dashboard** - Track impact and platform statistics
- 🗺️ **Geospatial Search** - Find nearby food donations using PostGIS
- 🔔 **Real-time Notifications** - Socket.io powered live updates
- ⭐ **Rating System** - Rate donors and NGOs after successful exchanges
- 📧 **Email Notifications** - Automated emails for key actions
- 👤 **User Management** - Profile management and account suspension

### User Roles
1. **Donor** - Creates food listings, manages donations
2. **NGO** - Claims food, manages pickups
3. **Admin** - Verifies NGOs, manages platform, views analytics

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                        │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │
│  │ Donor   │  │   NGO    │  │  Admin   │  │   Public    │ │
│  │Dashboard│  │Dashboard │  │Dashboard │  │   Pages     │ │
│  └────┬────┘  └─────┬────┘  └─────┬────┘  └──────┬──────┘ │
│       │             │              │              │         │
│       └─────────────┴──────────────┴──────────────┘         │
│                         │                                    │
│                    HTTP/HTTPS                                │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVER (Node.js/Express)                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐ │
│  │  Routes  │  │Controllers│  │Middleware │  │  Socket   │ │
│  │          │  │           │  │   (Auth)  │  │   .io     │ │
│  └────┬─────┘  └─────┬────┘  └─────┬─────┘  └─────┬─────┘ │
│       │              │              │              │         │
│       └──────────────┴──────────────┴──────────────┘         │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (PostgreSQL)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Users   │  │ Listings │  │  Claims  │  │ Ratings  │  │
│  │  Table   │  │  Table   │  │  Table   │  │  Table   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
│  PostGIS Extension for Geospatial Queries                  │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **Authentication Flow**
   ```
   Client → Login Request → Server (auth.controller.js)
   → Validate Credentials → Check Active Status
   → Generate JWT Token → Return to Client
   → Store in localStorage → Include in subsequent requests
   ```

2. **Listing Creation Flow**
   ```
   Donor → Create Listing → Upload Images (if any)
   → Get Current Location → Submit to Server
   → Validate Data → Store in DB with PostGIS point
   → Emit Socket.io event → Notify nearby NGOs
   → Return success response
   ```

3. **Claim Flow**
   ```
   NGO → Browse Listings → Select Listing → Claim
   → Server validates → Update listing status
   → Notify donor via Socket.io & Email
   → Return claim details
   ```

---

## Tech Stack

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+ with PostGIS extension
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Real-time**: Socket.io
- **Email**: Nodemailer
- **File Upload**: Multer
- **Environment**: dotenv
- **Security**: express-rate-limit, cors

### Frontend
- **Framework**: React 18+ with Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Maps**: Leaflet & React-Leaflet
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Real-time**: Socket.io-client

### Database Extensions
- **PostGIS**: Geospatial queries and distance calculations

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'donor', -- 'donor', 'ngo', 'admin'
    org_name VARCHAR(200),
    verification verification_status DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    active BOOLEAN DEFAULT TRUE, -- User suspension status
    location GEOGRAPHY(POINT, 4326),
    address TEXT,
    avg_rating NUMERIC(2,1) DEFAULT 0 CHECK (avg_rating >= 0 AND avg_rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_location ON users USING GIST (location);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_verification ON users (verification);
CREATE INDEX idx_users_active ON users (active);
```

### Listings Table
```sql
CREATE TABLE listings (
    id SERIAL PRIMARY KEY,
    donor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category food_category NOT NULL, -- 'cooked', 'raw', 'packaged', 'bakery'
    servings INTEGER NOT NULL CHECK (servings > 0),
    is_veg BOOLEAN DEFAULT TRUE,
    is_halal BOOLEAN DEFAULT FALSE,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    address TEXT NOT NULL,
    pickup_start TIMESTAMPTZ NOT NULL,
    pickup_end TIMESTAMPTZ NOT NULL,
    status listing_status DEFAULT 'available', -- 'available', 'claimed', 'completed', 'cancelled'
    image_urls TEXT[],
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_listings_donor ON listings(donor_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_location ON listings USING GIST (location);
CREATE INDEX idx_listings_created ON listings(created_at DESC);
```

### Claims Table
```sql
CREATE TABLE claims (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
    ngo_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    picked_up_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    UNIQUE(listing_id, ngo_id)
);

-- Indexes
CREATE INDEX idx_claims_listing ON claims(listing_id);
CREATE INDEX idx_claims_ngo ON claims(ngo_id);
CREATE INDEX idx_claims_completed ON claims(completed_at);
```

### Ratings Table
```sql
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES claims(id) ON DELETE CASCADE,
    rater_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rated_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(claim_id, rater_id)
);

-- Indexes
CREATE INDEX idx_ratings_rated ON ratings(rated_id);
```

### Notifications Table
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

### Password Reset Tokens Table
```sql
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);
```

---

## API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### Authentication Header
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Authentication APIs

### POST `/auth/register`
Register a new user (Donor or NGO)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+1234567890",
  "role": "donor", // or "ngo"
  "org_name": "Food Bank Inc", // Required for NGO
  "address": "123 Main St, City",
  "lat": 40.7128,
  "lng": -74.0060
}
```

**Response (201):**
```json
{
  "message": "Registration successful!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "donor",
    "verification": "pending"
  }
}
```

---

### POST `/auth/login`
Login existing user

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "donor",
    "verification": "approved",
    "active": true
  }
}
```

**Errors:**
- `401`: Invalid credentials
- `403`: Account suspended (active = false)

---

### POST `/auth/forgot-password`
Request password reset

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent"
}
```

---

### POST `/auth/reset-password/:token`
Reset password with token

**Request Body:**
```json
{
  "password": "newSecurePassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successful"
}
```

---

## 2. User/Profile APIs

### GET `/users/profile`
Get current user profile

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": "donor",
    "address": "123 Main St",
    "avg_rating": 4.5,
    "created_at": "2026-01-15T10:30:00Z"
  }
}
```

---

### PUT `/users/profile`
Update user profile

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+0987654321",
  "address": "456 New St"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": { /* updated user object */ }
}
```

---

### PUT `/users/change-password`
Change user password

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

---

## 3. Listings APIs

### POST `/listings`
Create a new food listing (Donor only)

**Request Body:**
```json
{
  "title": "Fresh Vegetable Biryani",
  "description": "50 servings of fresh vegetable biryani prepared today",
  "category": "cooked",
  "servings": 50,
  "is_veg": true,
  "is_halal": false,
  "lat": 40.7128,
  "lng": -74.0060,
  "address": "123 Restaurant St, City",
  "pickup_start": "2026-07-23T18:00:00Z",
  "pickup_end": "2026-07-23T21:00:00Z",
  "image_urls": ["https://example.com/image1.jpg"]
}
```

**Response (201):**
```json
{
  "message": "Listing created successfully",
  "listing": {
    "id": 1,
    "title": "Fresh Vegetable Biryani",
    "servings": 50,
    "status": "available",
    "created_at": "2026-07-23T12:00:00Z"
  }
}
```

**Side Effects:**
- Socket.io event `listing:new` emitted to nearby NGOs
- Email notification sent to verified NGOs within 5km radius

---

### GET `/listings`
Get all available listings (with geospatial filtering)

**Query Parameters:**
```
lat=40.7128         (optional - user's latitude)
lng=-74.0060        (optional - user's longitude)
radius=5000         (optional - radius in meters, default: unlimited)
category=cooked     (optional - filter by category)
is_veg=true         (optional - vegetarian only)
```

**Response (200):**
```json
{
  "listings": [
    {
      "id": 1,
      "title": "Fresh Vegetable Biryani",
      "description": "50 servings...",
      "category": "cooked",
      "servings": 50,
      "is_veg": true,
      "status": "available",
      "donor_name": "John Doe",
      "donor_phone": "+1234567890",
      "address": "123 Restaurant St",
      "lat": 40.7128,
      "lng": -74.0060,
      "distance": 1234.56, // meters from user location
      "pickup_start": "2026-07-23T18:00:00Z",
      "pickup_end": "2026-07-23T21:00:00Z",
      "image_urls": ["https://example.com/image1.jpg"],
      "created_at": "2026-07-23T12:00:00Z"
    }
  ]
}
```

---

### GET `/listings/mine`
Get current user's listings (Donor only)

**Response (200):**
```json
{
  "listings": [
    {
      "id": 1,
      "title": "Fresh Vegetable Biryani",
      "servings": 50,
      "status": "available",
      "created_at": "2026-07-23T12:00:00Z"
    }
  ]
}
```

---

### DELETE `/listings/:id`
Cancel a listing (Donor only, only if status = 'available')

**Response (200):**
```json
{
  "message": "Listing cancelled successfully"
}
```

---

### POST `/listings/upload-images`
Upload listing images (multipart/form-data)

**Request Body:**
```
Content-Type: multipart/form-data
images: [File, File, File] // Max 5 images
```

**Response (200):**
```json
{
  "image_urls": [
    "http://localhost:5000/uploads/1234567890-image1.jpg",
    "http://localhost:5000/uploads/1234567890-image2.jpg"
  ]
}
```

---

## 4. Claims APIs

### POST `/claims/:listingId`
Claim a food listing (NGO only)

**Response (201):**
```json
{
  "message": "Listing claimed successfully",
  "claim": {
    "id": 1,
    "listing_id": 1,
    "ngo_id": 2,
    "claimed_at": "2026-07-23T13:00:00Z"
  }
}
```

**Side Effects:**
- Listing status updated to 'claimed'
- Socket.io event `listing:claimed` emitted to donor
- Email notification sent to donor

**Errors:**
- `400`: Listing already claimed or not available
- `403`: User is not a verified NGO

---

### GET `/claims/mine`
Get current NGO's claims

**Response (200):**
```json
{
  "claims": [
    {
      "id": 1,
      "listing_id": 1,
      "title": "Fresh Vegetable Biryani",
      "servings": 50,
      "donor_name": "John Doe",
      "donor_phone": "+1234567890",
      "address": "123 Restaurant St",
      "claimed_at": "2026-07-23T13:00:00Z",
      "picked_up_at": null,
      "completed_at": null
    }
  ]
}
```

---

### PATCH `/claims/:id/pickup`
Mark claim as picked up

**Response (200):**
```json
{
  "message": "Marked as picked up",
  "claim": {
    "id": 1,
    "picked_up_at": "2026-07-23T19:00:00Z"
  }
}
```

---

### PATCH `/claims/:id/complete`
Mark claim as completed

**Response (200):**
```json
{
  "message": "Claim completed",
  "claim": {
    "id": 1,
    "completed_at": "2026-07-23T20:00:00Z"
  }
}
```

**Side Effects:**
- Listing status updated to 'completed'

---

### DELETE `/claims/:id`
Cancel a claim

**Request Body:**
```json
{
  "reason": "Unable to pick up due to transport issues"
}
```

**Response (200):**
```json
{
  "message": "Claim cancelled"
}
```

**Side Effects:**
- Listing status reverted to 'available'
- Donor notified via email

---

## 5. Ratings APIs

### POST `/ratings/:claimId`
Rate a user after claim completion

**Request Body:**
```json
{
  "rating": 5,
  "review": "Excellent food quality and coordination!"
}
```

**Response (201):**
```json
{
  "message": "Rating submitted successfully"
}
```

**Side Effects:**
- Rated user's `avg_rating` recalculated

**Errors:**
- `400`: Claim not completed yet
- `409`: Already rated this claim

---

### GET `/ratings/received`
Get ratings received by current user

**Response (200):**
```json
{
  "ratings": [
    {
      "id": 1,
      "rating": 5,
      "review": "Excellent!",
      "rater_name": "Food Bank Inc",
      "created_at": "2026-07-23T21:00:00Z"
    }
  ],
  "avg_rating": 4.8
}
```

---

## 6. Admin APIs

### GET `/admin/verifications/pending`
Get pending NGO verifications (Admin only)

**Response (200):**
```json
{
  "ngos": [
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@foodbank.org",
      "org_name": "City Food Bank",
      "phone": "+1234567890",
      "verification": "pending",
      "created_at": "2026-07-20T10:00:00Z"
    }
  ]
}
```

---

### PATCH `/admin/verifications/:id/approve`
Approve NGO verification

**Response (200):**
```json
{
  "message": "NGO approved successfully"
}
```

**Side Effects:**
- User's `verification` status updated to 'approved'
- Email notification sent to NGO

---

### PATCH `/admin/verifications/:id/reject`
Reject NGO verification

**Response (200):**
```json
{
  "message": "NGO rejected"
}
```

**Side Effects:**
- User's `verification` status updated to 'rejected'
- Email notification sent to NGO

---

### GET `/admin/stats`
Get platform statistics

**Response (200):**
```json
{
  "users": {
    "total_donors": 150,
    "total_ngos": 25,
    "approved_ngos": 20,
    "pending_verifications": 3,
    "rejected_ngos": 2
  },
  "listings": {
    "total_listings": 500,
    "available_listings": 45,
    "claimed_listings": 30,
    "completed_listings": 400,
    "cancelled_listings": 25,
    "servings_distributed": 15000
  },
  "claims": {
    "total_claims": 430,
    "active_claims": 30,
    "completed_claims": 400
  },
  "monthly_trends": [
    {
      "month": "2026-01",
      "listings": 50,
      "claims": 45,
      "servings": 2000
    }
  ],
  "recent_activity": [
    {
      "type": "listing_created",
      "user_name": "John Doe",
      "details": "Fresh Vegetable Biryani - 50 servings",
      "timestamp": "2026-07-23T12:00:00Z"
    }
  ]
}
```

---

### GET `/admin/users`
Get all users with filters

**Query Parameters:**
```
role=donor          (optional - filter by role)
verification=approved (optional - filter by verification)
limit=50            (optional - default 50)
offset=0            (optional - default 0)
```

**Response (200):**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "donor",
      "verification": "approved",
      "active": true,
      "avg_rating": 4.5,
      "created_at": "2026-01-15T10:00:00Z"
    }
  ],
  "total": 150
}
```

---

### PATCH `/admin/users/:id/toggle-status`
Suspend or activate user account

**Request Body:**
```json
{
  "active": false
}
```

**Response (200):**
```json
{
  "message": "User suspended successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "active": false
  }
}
```

**Errors:**
- `403`: Cannot suspend admin users

---

### GET `/admin/verifications`
Get all verification requests with filters (NEW - Added July 2026)

**Query Parameters:**
```
status=pending      (optional - filter by status: pending/approved/rejected/all)
```

**Response (200):**
```json
{
  "requests": [
    {
      "id": 2,
      "user_name": "Jane Smith",
      "user_email": "jane@foodbank.org",
      "org_name": "City Food Bank",
      "phone": "+1234567890",
      "status": "pending",
      "registration_number": "NGO12345",
      "documents": ["https://cdn.mealbridge.com/docs/cert1.pdf"],
      "admin_note": null,
      "reviewed_at": null,
      "created_at": "2026-07-20T10:00:00Z"
    }
  ]
}
```

---

### PATCH `/admin/verifications/:id/review`
Review and approve/reject NGO verification with admin notes (NEW - Added July 2026)

**Request Body:**
```json
{
  "status": "approved",
  "admin_note": "All documents verified. Registration number confirmed."
}
```

**Response (200):**
```json
{
  "message": "Verification approved successfully",
  "user": {
    "id": 2,
    "name": "Jane Smith",
    "org_name": "City Food Bank",
    "email": "jane@foodbank.org",
    "verification": "approved"
  }
}
```

**Side Effects:**
- User's `verification` status updated
- Admin note saved to verification_requests table
- Email notification sent to NGO

**Errors:**
- `400`: Invalid status or missing admin note
- `404`: NGO not found

---

### GET `/admin/analytics`
Get platform analytics with date range filtering (NEW - Added July 2026)

**Query Parameters:**
```
start_date=2026-06-01  (optional - defaults to 30 days ago)
end_date=2026-07-23    (optional - defaults to today)
```

**Response (200):**
```json
{
  "total_users": 200,
  "total_donors": 150,
  "total_ngos": 45,
  "total_admins": 5,
  "active_users": 180,
  "verified_ngos": 40,
  "pending_verifications": 5,
  "total_listings": 500,
  "active_listings": 45,
  "listings_created": 120,
  "total_meals": 15000,
  "total_weight": 7500,
  "total_claims": 430,
  "successful_claims": 400,
  "claims_made": 110,
  "new_users": 25,
  "verification_requests": 8,
  "waste_prevented": 7500,
  "top_donors": [
    {
      "id": 1,
      "name": "John's Restaurant",
      "avg_rating": 4.8,
      "listings_count": 50
    }
  ],
  "top_ngos": [
    {
      "id": 2,
      "name": "Jane Smith",
      "org_name": "City Food Bank",
      "avg_rating": 4.9,
      "claims_count": 45
    }
  ]
}
```

---

### GET `/admin/reports/export`
Export platform reports as CSV or PDF (NEW - Added July 2026)

**Query Parameters:**
```
start_date=2026-06-01  (optional - defaults to 30 days ago)
end_date=2026-07-23    (optional - defaults to today)
format=csv             (required - csv or pdf)
```

**Response (200):**
```
Content-Type: text/csv (or application/pdf)
Content-Disposition: attachment; filename=mealbridge-report-2026-06-01-to-2026-07-23.csv

CSV Content:
Type,ID,Title,Description,Servings,Status,Created At,Completed/Expired At,Created By,Email
Listing,1,"Fresh Biryani","50 servings of vegetable biryani",50,completed,2026-06-15T10:00:00Z,2026-06-15T18:00:00Z,John Doe,john@example.com
Claim,1,"Fresh Biryani",,50,completed,2026-06-15T11:00:00Z,2026-06-15T17:00:00Z,City Food Bank,jane@foodbank.org
```

**Side Effects:**
- Downloads file to user's device
- File includes all listings and claims within date range

**Errors:**
- `400`: Invalid format (must be csv or pdf)

---

### DELETE `/admin/users/:id`
Delete user account (Admin only)

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

**Errors:**
- `403`: Cannot delete admin users
- `404`: User not found

---

### GET `/admin/activity`
Get recent platform activity

**Query Parameters:**
```
limit=20  (optional - default 20)
```

**Response (200):**
```json
{
  "activities": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "donor",
      "activity_type": "registration",
      "created_at": "2026-07-23T10:00:00Z"
    },
    {
      "id": 1,
      "title": "Fresh Biryani",
      "servings": 50,
      "status": "available",
      "donor_name": "John Doe",
      "activity_type": "listing",
      "created_at": "2026-07-23T11:00:00Z"
    },
    {
      "id": 1,
      "title": "Fresh Biryani",
      "donor_name": "John Doe",
      "ngo_name": "Jane Smith",
      "org_name": "City Food Bank",
      "activity_type": "claim",
      "claimed_at": "2026-07-23T12:00:00Z"
    }
  ]
}
```

---

## 7. Notifications APIs

### GET `/notifications`
Get user's notifications

**Query Parameters:**
```
limit=20            (optional - default 20)
offset=0            (optional)
unreadOnly=true     (optional - only unread)
```

**Response (200):**
```json
{
  "notifications": [
    {
      "id": 1,
      "type": "claim_received",
      "title": "New Claim Received",
      "message": "Your listing 'Fresh Biryani' has been claimed by City Food Bank",
      "data": {
        "listing_id": 1,
        "claim_id": 1
      },
      "is_read": false,
      "created_at": "2026-07-23T13:00:00Z"
    }
  ],
  "unreadCount": 5,
  "total": 20
}
```

---

### GET `/notifications/unread-count`
Get unread notification count

**Response (200):**
```json
{
  "unreadCount": 5
}
```

---

### PATCH `/notifications/:id/read`
Mark notification as read

**Response (200):**
```json
{
  "message": "Notification marked as read"
}
```

---

### PATCH `/notifications/read-all`
Mark all notifications as read

**Response (200):**
```json
{
  "message": "12 notifications marked as read",
  "count": 12
}
```

---

### DELETE `/notifications/:id`
Delete a notification

**Response (200):**
```json
{
  "message": "Notification deleted successfully"
}
```

---

### DELETE `/notifications`
Clear all notifications

**Response (200):**
```json
{
  "message": "15 notifications cleared",
  "count": 15
}
```

---

## 8. Analytics APIs

### GET `/analytics/donor`
Get donor analytics (Donor only)

**Response (200):**
```json
{
  "totalListings": 50,
  "activeListings": 5,
  "completedListings": 40,
  "totalServings": 2000,
  "avgRating": 4.5,
  "monthlyData": [
    {
      "month": "2026-01",
      "listings": 10,
      "servings": 400
    }
  ]
}
```

---

### GET `/analytics/ngo`
Get NGO analytics (NGO only)

**Response (200):**
```json
{
  "totalClaims": 30,
  "completedClaims": 25,
  "totalServings": 1200,
  "avgRating": 4.7,
  "monthlyData": [
    {
      "month": "2026-01",
      "claims": 5,
      "servings": 200
    }
  ]
}
```

---

## 9. History APIs

### GET `/history/donor`
Get donor's listing history

**Response (200):**
```json
{
  "history": [
    {
      "id": 1,
      "title": "Fresh Biryani",
      "servings": 50,
      "status": "completed",
      "ngo_name": "City Food Bank",
      "claimed_at": "2026-07-23T13:00:00Z",
      "completed_at": "2026-07-23T20:00:00Z"
    }
  ]
}
```

---

### GET `/history/ngo`
Get NGO's claim history

**Response (200):**
```json
{
  "history": [
    {
      "id": 1,
      "listing_title": "Fresh Biryani",
      "servings": 50,
      "donor_name": "John's Restaurant",
      "claimed_at": "2026-07-23T13:00:00Z",
      "completed_at": "2026-07-23T20:00:00Z",
      "rating": 5
    }
  ]
}
```

---

## Real-time Features (Socket.io)

### Connection
```javascript
// Client-side
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('token')
  }
});
```

### Events Emitted by Server

#### 1. `notification`
New notification for user
```javascript
socket.on('notification', (data) => {
  console.log(data);
  // {
  //   id: 1,
  //   type: 'claim_received',
  //   title: 'New Claim',
  //   message: 'Your listing has been claimed',
  //   created_at: '2026-07-23T13:00:00Z'
  // }
});
```

#### 2. `listing:new`
New listing created nearby (for NGOs within 5km)
```javascript
socket.on('listing:new', (data) => {
  console.log(data);
  // {
  //   id: 1,
  //   title: 'Fresh Biryani',
  //   servings: 50,
  //   distance: 2500
  // }
});
```

#### 3. `listing:claimed`
Listing has been claimed (for donor)
```javascript
socket.on('listing:claimed', (data) => {
  console.log(data);
  // {
  //   listing_id: 1,
  //   title: 'Fresh Biryani',
  //   ngo_name: 'City Food Bank'
  // }
});
```

#### 4. `claim:cancelled`
Claim has been cancelled (for donor)
```javascript
socket.on('claim:cancelled', (data) => {
  console.log(data);
  // {
  //   listing_id: 1,
  //   reason: 'Transport unavailable'
  // }
});
```

---

## Authentication & Authorization

### JWT Token Structure
```javascript
{
  id: 1,
  email: "john@example.com",
  role: "donor",
  iat: 1234567890,
  exp: 1234654290
}
```

### Middleware: `authMiddleware`
Validates JWT token and attaches user to request
```javascript
req.user = {
  id: 1,
  email: "john@example.com",
  role: "donor"
}
```

### Middleware: `requireRole(['donor', 'ngo'])`
Ensures user has specific role
```javascript
requireRole(['admin']) // Only admins can access
requireRole(['donor', 'admin']) // Donors or admins
```

### Login Flow with Active Check
```javascript
// 1. Validate credentials
// 2. Check if user.active === false
//    → Return 403 "Account suspended"
// 3. Generate JWT token
// 4. Return token + user data
```

---

## Features Implemented

### ✅ Core Features

1. **User Authentication**
   - Registration (Donor/NGO)
   - Login with JWT
   - Password reset via email
   - Profile management
   - Account suspension system

2. **Food Listing Management**
   - Create listings with images
   - Geospatial search (PostGIS)
   - Category filtering (cooked, raw, packaged, bakery)
   - Dietary filters (veg, non-veg, halal)
   - Auto-expiry system
   - Distance-based sorting

3. **Claims System**
   - Claim listings
   - Track pickup status
   - Mark as completed
   - Cancel claims with reason
   - One listing = one claim (enforced)

4. **NGO Verification**
   - Admin approval workflow
   - Pending/Approved/Rejected states
   - Email notifications
   - Restricted access for unverified NGOs

5. **Rating & Reviews**
   - 5-star rating system
   - Written reviews
   - Average rating calculation
   - One rating per claim

6. **Real-time Notifications**
   - Socket.io integration
   - In-app notification bell
   - Unread badge counter
   - Mark as read/unread
   - Delete notifications
   - Email notifications for key events

7. **Analytics & Insights**
   - Platform-wide statistics (admin)
   - Donor analytics (personal)
   - NGO analytics (personal)
   - Monthly trends
   - Impact metrics (meals saved, waste prevented)

8. **Geospatial Features**
   - Distance calculation
   - Radius-based search
   - Interactive map view (Leaflet)
   - Location-based notifications

9. **Admin Dashboard**
   - Platform statistics
   - User management
   - NGO verification queue
   - User suspension
   - Activity monitoring

10. **History & Tracking**
    - Donor listing history
    - NGO claim history
    - Status tracking
    - Timeline view

---

## Frontend Pages & Components

### Pages

#### Public Pages
- `/` - Landing page
- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Password reset request
- `/reset-password/:token` - Password reset form
- `/verify-email/:token` - Email verification

#### Donor Dashboard (`/donor-dashboard`)
- Dashboard overview with stats
- Create listing form
- My listings (active, claimed, completed)
- Analytics & insights
- Donation history

#### NGO Dashboard (`/ngo-dashboard`)
- Dashboard overview
- Find available food (with filters)
- My claims (active, completed)
- Interactive map view
- Analytics & insights
- Claim history

#### Admin Dashboard (`/admin-dashboard`)
- Platform statistics
- NGO verification queue overview
- User management overview
- Platform health metrics

#### Admin Users Page (`/admin/users`) **NEW - Added July 2026**
- Complete user management interface
- Search users by name, email, organization
- Filter by role (donor/ngo/admin)
- Filter by verification status
- Suspend/activate user accounts
- User statistics cards
- Pagination support

#### Admin Verifications Page (`/admin/verifications`) **NEW - Added July 2026**
- NGO verification review system
- Filter by status (pending/approved/rejected)
- Review modal with approve/reject actions
- Add admin notes for decisions
- View submitted documents
- Track review history
- Verification statistics

#### Admin Reports Page (`/admin/reports`) **NEW - Added July 2026**
- Analytics dashboard with date range filtering
- Platform statistics (listings, claims, users)
- User breakdown (donors, NGOs, admins)
- Activity statistics with progress bars
- Food impact metrics (meals, weight, waste prevented)
- Top donors and NGOs leaderboards
- Export reports as CSV or PDF

#### Profile Page (`/profile`)
- View/edit profile
- Change password
- View ratings

### Key Components

#### Common Components
- `NotificationBell.jsx` - Notification dropdown with real-time updates
- `ToastProvider.jsx` - Toast notifications (success, error, info)
- `Modal.jsx` - Reusable modal component
- `FilterPanel.jsx` - Advanced filtering for listings
- `ImageUpload.jsx` - Image upload with preview
- `MapView.jsx` - Leaflet map for geospatial visualization
- `StatsCard.jsx` - Statistics display card
- `EmptyState.jsx` - Empty state placeholder
- `LoadingSkeleton.jsx` - Loading skeletons

#### Donor Components
- `DonorHistory.jsx` - Donation history timeline
- `Analytics.jsx` - Charts and insights

#### NGO Components
- `NgoHistory.jsx` - Claim history
- `FilterPanel.jsx` - Search and filter listings

### Context Providers
- `AuthContext` - User authentication state
- `SocketContext` - Socket.io connection
- `ToastContext` - Toast notifications

---

## Environment Setup

### Backend Environment Variables (`.env`)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mealbridge
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM="MealBridge <noreply@mealbridge.com>"

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

### Frontend Environment Variables (`.env`)
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

---

## Installation & Setup

### Prerequisites
```bash
Node.js v18+
PostgreSQL 14+
PostGIS extension
```

### Backend Setup
```bash
cd server
npm install

# Create database
createdb mealbridge

# Enable PostGIS
psql -d mealbridge -c "CREATE EXTENSION postgis;"

# Run schema
psql -d mealbridge -f src/db/schema.sql

# Run migration (if exists)
psql -d mealbridge -f src/db/migrations/add_user_active_column.sql

# Start server
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

---

## Deployment

### Backend Deployment (Node.js)
```bash
# Build (if needed)
npm run build

# Production start
npm start

# Or with PM2
pm2 start src/index.js --name mealbridge-api
```

### Frontend Deployment (Vite)
```bash
# Build
npm run build

# Serve build folder with nginx/apache
# or deploy to Vercel/Netlify
```

### Database Migration Checklist
1. Backup existing database
2. Run schema.sql on production
3. Run all migration files in order:
   - `add_user_active_column.sql`
4. Verify data integrity

---

## API Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions or account suspended |
| 404 | Not Found |
| 409 | Conflict - Duplicate entry |
| 500 | Internal Server Error |
| 501 | Not Implemented |

---

## Common Error Responses

### Validation Error
```json
{
  "message": "Validation failed",
  "errors": [
    "Email is required",
    "Password must be at least 6 characters"
  ]
}
```

### Authentication Error
```json
{
  "message": "Invalid token",
  "error": "Token expired"
}
```

### Account Suspended
```json
{
  "message": "Your account has been suspended. Please contact support."
}
```

---

## Testing

### Manual API Testing with cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "donor"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get listings (with auth)
curl http://localhost:5000/api/listings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Security Considerations

1. **Password Security**
   - Hashed with bcrypt (10 rounds)
   - Min 6 characters required

2. **JWT Tokens**
   - Signed with secret key
   - 7-day expiration
   - Stored in localStorage (client)

3. **Rate Limiting**
   - Applied to authentication endpoints
   - Prevents brute force attacks

4. **Input Validation**
   - All inputs sanitized
   - SQL injection prevention via parameterized queries

5. **File Upload**
   - Max 5MB per image
   - Only image files allowed
   - Unique filenames to prevent overwrite

6. **CORS**
   - Configured for specific origins
   - Credentials enabled

7. **Account Suspension**
   - Admins can suspend users
   - Suspended users cannot login
   - Prevents abuse

---

## Future Enhancements

### Planned Features
- [ ] PWA support (offline access)
- [ ] SMS notifications (Twilio)
- [ ] Advanced search with Elasticsearch
- [ ] Saved searches and favorites
- [ ] In-app chat between donors and NGOs
- [ ] Multi-language support (i18n)
- [ ] Export reports to CSV/PDF
- [ ] Separate admin pages (Users, Verifications, Reports)
- [ ] Profile picture upload
- [ ] Two-factor authentication (2FA)
- [ ] Push notifications (web push)
- [ ] Calendar integration for pickups
- [ ] QR code for claim verification
- [ ] Donation certificates (PDF)
- [ ] Leaderboard for top donors/NGOs
- [ ] Social media sharing

---

## Contributing

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add feature description"

# Push to remote
git push origin feature/your-feature-name

# Create pull request
```

### Commit Message Format
```
feat: Add notification system
fix: Resolve login redirect issue
docs: Update API documentation
refactor: Improve listing query performance
```

---

## Support & Contact

For issues or questions:
- GitHub Issues: [github.com/yourusername/mealbridge/issues](https://github.com/yourusername/mealbridge/issues)
- Email: support@mealbridge.com

---

## License

MIT License - See LICENSE file for details

---

## Acknowledgments

- PostGIS for geospatial capabilities
- Socket.io for real-time features
- Leaflet for mapping
- React & Vite for frontend framework
- Express.js for backend API

---

**Last Updated:** July 23, 2026
**Version:** 1.0
**Documentation Maintained By:** MealBridge Team

---

## Appendix

### Database Query Examples

#### Find listings within 5km radius
```sql
SELECT
  id, title, servings,
  ST_Distance(location, ST_MakePoint(-74.0060, 40.7128)::geography) as distance
FROM listings
WHERE status = 'available'
  AND ST_DWithin(
    location,
    ST_MakePoint(-74.0060, 40.7128)::geography,
    5000
  )
ORDER BY distance ASC;
```

#### Calculate user average rating
```sql
SELECT AVG(rating) as avg_rating
FROM ratings
WHERE rated_id = 1;
```

#### Get monthly statistics
```sql
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_listings,
  SUM(servings) as total_servings
FROM listings
WHERE donor_id = 1
GROUP BY month
ORDER BY month DESC;
```

---

**END OF DOCUMENTATION**