# MealBridge Frontend Documentation

## Overview
The frontend is a modern React application built with Vite, using React Router for navigation, Context API for state management, Socket.io for real-time updates, and Tailwind CSS for styling.

---

## 📁 Project Structure

```
client/
├── public/
│   └── (static assets)
├── src/
│   ├── api/
│   │   ├── axios.js              # Configured Axios instance
│   │   ├── auth.api.js           # Authentication API calls
│   │   └── listings.api.js       # Listings API calls
│   ├── components/
│   │   ├── common/               # Reusable components (future)
│   │   ├── donor/                # Donor-specific components (future)
│   │   ├── ngo/                  # NGO-specific components (future)
│   │   └── admin/                # Admin-specific components (future)
│   ├── context/
│   │   ├── AuthContext.jsx       # Authentication state management
│   │   └── SocketContext.jsx     # Socket.io connection management
│   ├── hooks/                    # Custom React hooks (future)
│   ├── pages/
│   │   ├── Login.jsx             # Login page
│   │   ├── Register.jsx          # Registration page
│   │   ├── DonorDashboard.jsx    # Donor portal
│   │   ├── NgoDashboard.jsx      # NGO portal
│   │   └── AdminDashboard.jsx    # Admin panel
│   ├── styles/
│   │   └── index.css             # Global styles + Tailwind
│   ├── utils/                    # Helper functions (future)
│   ├── App.jsx                   # Root component + routing
│   └── main.jsx                  # React entry point
├── index.html                    # HTML template
├── vite.config.js                # Vite configuration
├── tailwind.config.js            # Tailwind configuration
├── postcss.config.js             # PostCSS configuration
├── package.json
└── .env.example
```

---

## 🎨 Styling & Configuration

### File: `client/tailwind.config.js`

**Purpose:** Configure Tailwind CSS theme

**Custom Theme:**
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        50: '#f0fdf4',   // Lightest green
        100: '#dcfce7',
        // ... through ...
        900: '#14532d'   // Darkest green
      }
    }
  }
}
```

**Why custom colors?**
- Brand consistency (green = fresh food, nature)
- Easy to use: `bg-primary-600`, `text-primary-700`
- Accessible color palette with proper contrast ratios

### File: `client/src/styles/index.css`

**Custom CSS Classes:**

1. **Button Styles:**
   ```css
   .btn {
     @apply px-4 py-2 rounded-lg font-medium transition-colors;
   }
   .btn-primary {
     @apply bg-primary-600 text-white hover:bg-primary-700;
   }
   .btn-secondary {
     @apply bg-gray-200 text-gray-800 hover:bg-gray-300;
   }
   ```
   - Reusable button components
   - Consistent spacing and transitions
   - Easy to apply: `<button className="btn btn-primary">`

2. **Form Inputs:**
   ```css
   .input {
     @apply w-full px-4 py-2 border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary-500;
   }
   ```
   - Consistent form styling
   - Built-in focus states
   - Accessibility-friendly (focus rings)

3. **Card Containers:**
   ```css
   .card {
     @apply bg-white rounded-lg shadow-md p-6;
   }
   ```
   - Uniform spacing for content boxes
   - Subtle shadow for depth

### File: `client/vite.config.js`

**Configuration:**
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true  // Allows network access (e.g., mobile testing)
  }
})
```

- React plugin for JSX support and Fast Refresh
- Custom port (5173)
- Host mode for local network access

---

## 🔌 API Layer

### File: `client/src/api/axios.js`

**Purpose:** Centralized HTTP client with interceptors

**Key Features:**

1. **Base URL Configuration:**
   ```javascript
   baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
   ```
   - Reads from environment variable
   - Falls back to localhost for development

2. **Request Interceptor:**
   ```javascript
   axiosInstance.interceptors.request.use((config) => {
     const token = localStorage.getItem('token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });
   ```
   - **Automatically adds JWT token** to every request
   - No need to manually set headers in API calls
   - Reads token from localStorage

3. **Response Interceptor:**
   ```javascript
   axiosInstance.interceptors.response.use(
     (response) => response,
     (error) => {
       if (error.response?.status === 401) {
         localStorage.removeItem('token');
         localStorage.removeItem('user');
         window.location.href = '/login';
       }
       return Promise.reject(error);
     }
   );
   ```
   - **Automatic logout on 401 (Unauthorized)**
   - Clears localStorage
   - Redirects to login page
   - Handles expired/invalid tokens globally

**Why interceptors?**
- DRY principle (don't repeat auth header code)
- Centralized error handling
- Easy token refresh implementation (future enhancement)

### File: `client/src/api/auth.api.js`

**API Methods:**
```javascript
export const authAPI = {
  register: (userData) => axios.post('/auth/register', userData),
  login: (credentials) => axios.post('/auth/login', credentials),
  getProfile: () => axios.get('/auth/me'),
  updateProfile: (data) => axios.patch('/auth/profile', data)
};
```

**Usage Example:**
```javascript
const response = await authAPI.login({ email, password });
// No need to manually add token - interceptor handles it
```

### File: `client/src/api/listings.api.js`

**API Methods:**
```javascript
export const listingsAPI = {
  create: (listingData) => axios.post('/listings', listingData),
  getNearby: (lat, lng, radius) =>
    axios.get('/listings/nearby', { params: { lat, lng, radius } }),
  getMine: () => axios.get('/listings/mine'),
  getById: (id) => axios.get(`/listings/${id}`),
  update: (id, data) => axios.patch(`/listings/${id}`, data),
  delete: (id) => axios.delete(`/listings/${id}`)
};
```

**Query Parameters:**
```javascript
getNearby: (lat, lng, radius) =>
  axios.get('/listings/nearby', { params: { lat, lng, radius } })
// Generates: /listings/nearby?lat=28.61&lng=77.20&radius=5000
```

---

## 🔐 State Management (Context API)

### File: `client/src/context/AuthContext.jsx`

**Purpose:** Global authentication state

**State Managed:**
- `user` - Current user object (null if logged out)
- `loading` - Initial auth check in progress

**Methods Provided:**

1. **login(credentials)**
   ```javascript
   const login = async (credentials) => {
     const response = await authAPI.login(credentials);
     const { user, token } = response.data;

     localStorage.setItem('token', token);
     localStorage.setItem('user', JSON.stringify(user));
     setUser(user);

     return response;
   };
   ```
   - Calls API
   - Stores token and user in localStorage (persists across page refreshes)
   - Updates state
   - Returns response for navigation

2. **register(userData)**
   - Similar to login
   - Creates account and auto-logs in

3. **logout()**
   ```javascript
   const logout = () => {
     localStorage.removeItem('token');
     localStorage.removeItem('user');
     setUser(null);
   };
   ```
   - Clears localStorage
   - Resets state
   - User is redirected by route guards

**Initial State Restoration:**
```javascript
useEffect(() => {
  const token = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');

  if (token && savedUser) {
    setUser(JSON.parse(savedUser));
  }
  setLoading(false);
}, []);
```
- On app load, checks localStorage
- Restores user session if token exists
- Sets loading to false when check complete

**Usage in Components:**
```javascript
const { user, login, logout } = useAuth();

if (user?.role === 'donor') {
  // Show donor features
}
```

### File: `client/src/context/SocketContext.jsx`

**Purpose:** Manage Socket.io connection

**Key Features:**

1. **Auto-connect when user logs in:**
   ```javascript
   useEffect(() => {
     if (user) {
       const newSocket = io(import.meta.env.VITE_SOCKET_URL);

       newSocket.on('connect', () => {
         console.log('Socket.io connected');
         newSocket.emit('join', user.id);  // Join user's room
       });

       setSocket(newSocket);

       return () => {
         newSocket.close();  // Cleanup on logout
       };
     }
   }, [user]);
   ```

2. **Automatic cleanup:**
   - Closes connection when user logs out
   - Prevents memory leaks

**Usage in Components:**
```javascript
const socket = useSocket();

useEffect(() => {
  if (socket) {
    socket.on('listing:new', (data) => {
      alert(`New food: ${data.title}`);
    });

    return () => {
      socket.off('listing:new');  // Cleanup listener
    };
  }
}, [socket]);
```

---

## 🧭 Routing & Navigation

### File: `client/src/App.jsx`

**Architecture:**

1. **Provider Hierarchy:**
   ```javascript
   <Router>
     <AuthProvider>
       <SocketProvider>
         <AppRoutes />
       </SocketProvider>
     </AuthProvider>
   </Router>
   ```
   - Router wraps everything (for navigation)
   - AuthProvider wraps SocketProvider (Socket needs user)
   - SocketProvider wraps routes (pages need Socket)

2. **ProtectedRoute Component:**
   ```javascript
   const ProtectedRoute = ({ children, allowedRoles }) => {
     const { user, loading } = useAuth();

     if (loading) return <div>Loading...</div>;
     if (!user) return <Navigate to="/login" />;
     if (allowedRoles && !allowedRoles.includes(user.role)) {
       return <Navigate to="/" />;
     }

     return children;
   };
   ```
   - **Purpose:** Prevent unauthorized access
   - **Loading state:** Wait for auth check before redirecting
   - **Not logged in:** Redirect to login
   - **Wrong role:** Redirect to home (or could show 403 page)

3. **RootRedirect Component:**
   ```javascript
   const RootRedirect = () => {
     const { user } = useAuth();

     if (!user) return <Navigate to="/login" />;

     switch (user.role) {
       case 'donor': return <Navigate to="/donor" />;
       case 'ngo': return <Navigate to="/ngo" />;
       case 'admin': return <Navigate to="/admin" />;
     }
   };
   ```
   - Redirects `/` to appropriate dashboard based on role
   - Improves UX (users don't need to remember their portal URL)

4. **Route Configuration:**
   ```javascript
   <Routes>
     <Route path="/" element={<RootRedirect />} />
     <Route path="/login" element={<Login />} />
     <Route path="/register" element={<Register />} />

     <Route path="/donor" element={
       <ProtectedRoute allowedRoles={['donor']}>
         <DonorDashboard />
       </ProtectedRoute>
     } />

     <Route path="/ngo" element={
       <ProtectedRoute allowedRoles={['ngo']}>
         <NgoDashboard />
       </ProtectedRoute>
     } />

     <Route path="/admin" element={
       <ProtectedRoute allowedRoles={['admin']}>
         <AdminDashboard />
       </ProtectedRoute>
     } />
   </Routes>
   ```

---

## 📄 Pages (Components)

### File: `client/src/pages/Login.jsx`

**Features:**

1. **State Management:**
   ```javascript
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);
   ```
   - Controlled inputs (React controls form state)
   - Error display state
   - Loading state for button disable

2. **Form Submission:**
   ```javascript
   const handleSubmit = async (e) => {
     e.preventDefault();  // Prevent page reload
     setError('');
     setLoading(true);

     try {
       const response = await login({ email, password });
       const role = response.data.user.role;

       // Navigate based on role
       if (role === 'donor') navigate('/donor');
       else if (role === 'ngo') navigate('/ngo');
       else if (role === 'admin') navigate('/admin');
     } catch (err) {
       setError(err.response?.data?.message || 'Login failed');
     } finally {
       setLoading(false);
     }
   };
   ```
   - Prevents default form behavior
   - Calls login from AuthContext
   - Role-based navigation
   - Error handling with user feedback
   - Loading state management

3. **UI Elements:**
   - Gradient background for visual appeal
   - Error message display (conditional rendering)
   - Disabled button during loading (prevents double submission)
   - Link to registration page

**Controlled Input Example:**
```javascript
<input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="input"
  required
/>
```
- Value comes from state
- onChange updates state
- React re-renders with new value (one-way data flow)

### File: `client/src/pages/Register.jsx`

**Key Differences from Login:**

1. **Complex Form State:**
   ```javascript
   const [formData, setFormData] = useState({
     name: '',
     email: '',
     password: '',
     role: 'donor',
     org_name: '',
     phone: ''
   });
   ```
   - Object state (easier to manage multiple fields)

2. **Dynamic Input Handler:**
   ```javascript
   const handleChange = (e) => {
     setFormData({
       ...formData,
       [e.target.name]: e.target.value
     });
   };
   ```
   - Works for all inputs (using `name` attribute)
   - Spreads existing data, updates one field
   - DRY principle

3. **Conditional Fields:**
   ```javascript
   {formData.role === 'ngo' && (
     <div>
       <label>Organization Name</label>
       <input
         name="org_name"
         required={formData.role === 'ngo'}
         // ...
       />
     </div>
   )}
   ```
   - Shows org_name field only for NGOs
   - Conditionally required
   - Improves UX

4. **Role Selection:**
   ```javascript
   <select name="role" value={formData.role} onChange={handleChange}>
     <option value="donor">Donor (Restaurant/Hotel/Individual)</option>
     <option value="ngo">NGO/Volunteer</option>
   </select>
   ```
   - No 'admin' option (admins created manually)
   - Clear descriptions

### File: `client/src/pages/DonorDashboard.jsx`

**Major Features:**

1. **Multi-state Management:**
   ```javascript
   const [listings, setListings] = useState([]);
   const [showForm, setShowForm] = useState(false);
   const [loading, setLoading] = useState(false);
   const [formData, setFormData] = useState({ /* ... */ });
   ```
   - Listings data from backend
   - Form visibility toggle
   - Form data for new listing
   - Loading state

2. **Real-time Notifications:**
   ```javascript
   useEffect(() => {
     if (socket) {
       socket.on('listing:claimed', (data) => {
         alert(`Your listing "${data.title}" has been claimed!`);
         fetchListings();  // Refresh list
       });

       return () => {
         socket.off('listing:claimed');  // Cleanup
       };
     }
   }, [socket]);
   ```
   - Listens for claims on donor's listings
   - Shows alert (could be toast notification)
   - Refreshes listings to show updated status
   - Cleanup prevents memory leaks

3. **Create Listing Flow:**
   ```javascript
   const handleSubmit = async (e) => {
     e.preventDefault();
     setLoading(true);

     try {
       await listingsAPI.create({
         ...formData,
         servings: parseInt(formData.servings),  // Convert to number
         lat: parseFloat(formData.lat),
         lng: parseFloat(formData.lng)
       });

       alert('Listing created successfully!');
       setShowForm(false);  // Hide form
       setFormData({ /* reset */ });  // Clear form
       fetchListings();  // Refresh list
     } catch (error) {
       alert(error.response?.data?.message || 'Failed');
     } finally {
       setLoading(false);
     }
   };
   ```

4. **Listing Grid Display:**
   ```javascript
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
     {listings.map((listing) => (
       <div key={listing.id} className="card">
         {/* Listing details */}
         <span className={`status-badge ${
           listing.status === 'available' ? 'bg-green-100' :
           listing.status === 'claimed' ? 'bg-blue-100' :
           'bg-gray-100'
         }`}>
           {listing.status}
         </span>
       </div>
     ))}
   </div>
   ```
   - Responsive grid (1 col mobile, 2 tablet, 3 desktop)
   - Dynamic status badges with color coding
   - Key prop for React reconciliation

5. **Delete/Cancel Listing:**
   ```javascript
   const handleDelete = async (id) => {
     if (!confirm('Are you sure?')) return;  // Confirmation

     try {
       await listingsAPI.delete(id);
       fetchListings();
     } catch (error) {
       alert(error.response?.data?.message);
     }
   };
   ```
   - Confirmation dialog (prevents accidental deletion)
   - Only shows button for 'available' listings

6. **Header with Logout:**
   ```javascript
   <header className="bg-white shadow">
     <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between">
       <h1>🍛 MealBridge - Donor Portal</h1>
       <div className="flex items-center gap-4">
         <span>Welcome, {user?.name}</span>
         <button onClick={logout}>Logout</button>
       </div>
     </div>
   </header>
   ```

### File: `client/src/pages/NgoDashboard.jsx`

**Major Features:**

1. **Verification Status Handling:**
   ```javascript
   if (user?.verification === 'pending') {
     return (
       <div className="card">
         <h2>⏳ Verification Pending</h2>
         <p>Please wait for admin approval.</p>
         <button onClick={logout}>Logout</button>
       </div>
     );
   }

   if (user?.verification === 'rejected') {
     return (
       <div className="card">
         <h2>❌ Verification Rejected</h2>
         <button onClick={logout}>Logout</button>
       </div>
     );
   }
   ```
   - **Early returns** for non-approved NGOs
   - Prevents unapproved NGOs from seeing/claiming food
   - Clear messaging about status

2. **Tab Navigation:**
   ```javascript
   const [view, setView] = useState('available');  // or 'claims'

   <div className="flex gap-4">
     <button
       onClick={() => setView('available')}
       className={view === 'available' ? 'active-tab' : 'inactive-tab'}
     >
       Available Food
     </button>
     <button
       onClick={() => setView('claims')}
       className={view === 'claims' ? 'active-tab' : 'inactive-tab'}
     >
       My Claims ({myClaims.length})
     </button>
   </div>
   ```
   - Toggle between available food and claimed food
   - Shows claim count in tab label

3. **Real-time Food Alerts:**
   ```javascript
   useEffect(() => {
     if (socket) {
       socket.on('listing:new', (data) => {
         alert(`New food available: ${data.title}`);
         fetchNearbyListings();  // Refresh list
       });
     }
   }, [socket]);
   ```
   - NGOs get instant notification when food is posted nearby
   - Auto-refreshes available listings

4. **Nearby Listings:**
   ```javascript
   const fetchNearbyListings = async () => {
     try {
       // For demo, using fixed coordinates
       // In production, get user's location from browser
       const response = await listingsAPI.getNearby(28.6139, 77.2090, 10000);
       setListings(response.data.listings);
     } catch (error) {
       console.error('Failed to fetch listings:', error);
     }
   };
   ```
   - Shows listings within 10km radius
   - Includes distance information
   - **TODO:** Get real user location using Geolocation API

5. **Claim Food:**
   ```javascript
   const handleClaim = async (listingId) => {
     if (!confirm('Are you sure?')) return;

     try {
       await axios.post(`/claims/${listingId}`);
       alert('Listing claimed successfully!');
       fetchNearbyListings();  // Remove from available
       fetchMyClaims();  // Add to my claims
     } catch (error) {
       alert(error.response?.data?.message || 'Failed to claim');
     }
   };
   ```
   - Confirmation before claiming
   - Updates both tabs
   - Shows error if already claimed (race condition)

6. **Mark as Picked Up:**
   ```javascript
   const markInTransit = async (claimId) => {
     try {
       await axios.patch(`/claims/${claimId}/pickup`);
       alert('Marked as in transit!');
       fetchMyClaims();
     } catch (error) {
       alert(error.response?.data?.message);
     }
   };
   ```
   - NGO confirms they've picked up food
   - Updates claim status
   - Shows pickup timestamp

7. **Listing Card with Distance:**
   ```javascript
   <div className="card">
     <h3>{listing.title}</h3>
     <p>Servings: {listing.servings}</p>
     <p>Distance: {Math.round(listing.distance)}m</p>
     <p>Donor: {listing.donor_name}</p>
     <p>Address: {listing.address}</p>
     <button onClick={() => handleClaim(listing.id)}>
       Claim This Food
     </button>
   </div>
   ```
   - Shows all relevant info for pickup decision
   - Distance helps NGO prioritize nearby food

### File: `client/src/pages/AdminDashboard.jsx`

**Major Features:**

1. **Dual Tab System:**
   ```javascript
   const [view, setView] = useState('verifications');  // or 'stats'
   ```
   - Verifications: Approve/reject NGOs
   - Stats: Platform metrics

2. **Verification List:**
   ```javascript
   const fetchVerifications = async () => {
     try {
       const response = await axios.get('/admin/verifications');
       setVerifications(response.data.verifications);
     } catch (error) {
       console.error('Failed to fetch verifications:', error);
     }
   };
   ```
   - Shows pending NGO applications
   - Displays org name, contact info, application date

3. **Approve/Reject Actions:**
   ```javascript
   const handleVerification = async (userId, status) => {
     try {
       await axios.patch(`/admin/verify/${userId}`, { status });
       alert(`NGO ${status} successfully!`);
       fetchVerifications();  // Refresh list
     } catch (error) {
       alert(error.response?.data?.message);
     }
   };

   <button onClick={() => handleVerification(ngo.id, 'approved')}>
     ✓ Approve
   </button>
   <button onClick={() => handleVerification(ngo.id, 'rejected')}>
     ✗ Reject
   </button>
   ```
   - Two-button interface for quick decisions
   - Confirmation feedback
   - Removes from list after action

4. **Statistics Dashboard:**
   ```javascript
   const [stats, setStats] = useState(null);

   useEffect(() => {
     fetchStats();
   }, []);

   const fetchStats = async () => {
     try {
       const response = await axios.get('/admin/stats');
       setStats(response.data.stats);
     } catch (error) {
       console.error('Failed to fetch stats:', error);
     }
   };
   ```

5. **Stat Cards:**
   ```javascript
   <div className="grid grid-cols-3 gap-4">
     <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
       <h3>Total Donors</h3>
       <p className="text-4xl font-bold">{stats.total_donors}</p>
     </div>

     <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
       <h3>Verified NGOs</h3>
       <p className="text-4xl font-bold">{stats.verified_ngos}</p>
     </div>

     <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
       <h3>Total Listings</h3>
       <p className="text-4xl font-bold">{stats.total_listings}</p>
     </div>

     {/* More stat cards... */}
   </div>
   ```
   - Colorful gradient backgrounds
   - Large numbers for visibility
   - Grid layout for organization

6. **Success Rate Calculation:**
   ```javascript
   <div className="card">
     <h3>Success Rate</h3>
     <p className="text-4xl font-bold">
       {stats.total_listings > 0
         ? Math.round((stats.completed_claims / stats.total_listings) * 100)
         : 0}%
     </p>
   </div>
   ```
   - Calculates percentage of listings that were claimed and completed
   - Handles division by zero

---

## 🔑 Environment Variables

### File: `client/.env.example`

**Required Variables:**

1. **VITE_API_URL** - Backend API base URL
   - Development: `http://localhost:5000/api`
   - Production: `https://api.mealbridge.com/api`

2. **VITE_SOCKET_URL** - WebSocket server URL
   - Development: `http://localhost:5000`
   - Production: `https://api.mealbridge.com`

3. **VITE_GOOGLE_MAPS_BROWSER_KEY** - Google Maps API key (for future features)
   - Browser-restricted key (HTTP referrer restriction)
   - Required for map display, geocoding

**Why VITE_ prefix?**
- Vite only exposes env vars starting with `VITE_`
- Security: Prevents accidental exposure of server-side secrets
- Access via `import.meta.env.VITE_VARIABLE_NAME`

---

## 📦 Dependencies

### File: `client/package.json`

**Production Dependencies:**
- `react` (^18.2.0) - UI library
- `react-dom` (^18.2.0) - React renderer for web
- `react-router-dom` (^6.21.0) - Client-side routing
- `axios` (^1.6.2) - HTTP client
- `socket.io-client` (^4.6.1) - WebSocket client

**Dev Dependencies:**
- `@vitejs/plugin-react` - Fast Refresh and JSX support
- `vite` - Build tool (fast HMR, optimized builds)
- `tailwindcss` - Utility-first CSS
- `autoprefixer` - Auto-add vendor prefixes
- `postcss` - CSS processing

**Why Vite over Create React App?**
- 10-100x faster dev server startup
- Instant Hot Module Replacement (HMR)
- Optimized production builds with Rollup
- Native ES modules support
- Better TypeScript support

---

## 🚀 Running the Frontend

**1. Install Dependencies:**
```bash
cd client
npm install
```

**2. Configure Environment:**
```bash
cp .env.example .env
# Edit .env with your API URLs
```

**3. Start Development Server:**
```bash
npm run dev
# Runs on http://localhost:5173
```

**4. Build for Production:**
```bash
npm run build
# Outputs to dist/ folder
```

**5. Preview Production Build:**
```bash
npm run preview
# Test production build locally
```

---

## 🎯 Key Architectural Decisions

**1. Why Context API over Redux?**
- Simpler for this app size
- No boilerplate
- Built into React
- Sufficient for auth and socket state
- Can migrate to Redux/Zustand if needed

**2. Why React Router v6?**
- Declarative routing
- Nested routes support
- Built-in navigation hooks
- Better TypeScript support
- Smaller bundle size than v5

**3. Why Tailwind CSS?**
- Utility-first = rapid development
- No CSS naming conflicts
- Purges unused CSS (tiny production bundle)
- Responsive design built-in
- Consistent design system

**4. Why Axios over Fetch?**
- Automatic JSON parsing
- Request/response interceptors
- Better error handling
- Timeout support
- Request cancellation
- Backward compatibility

**5. Why Socket.io over native WebSockets?**
- Auto-reconnection
- Room support (user-specific messages)
- Fallback to polling if WebSocket fails
- Better cross-browser support
- Event-based API (easier to use)

---

## 🔍 Common Patterns Used

**1. Controlled Components:**
```javascript
const [value, setValue] = useState('');
<input value={value} onChange={(e) => setValue(e.target.value)} />
```
- React controls input state
- Single source of truth
- Enables validation, formatting

**2. Conditional Rendering:**
```javascript
{error && <div className="error">{error}</div>}
{loading ? <Spinner /> : <Content />}
{user?.role === 'donor' && <DonorFeatures />}
```

**3. Effect Cleanup:**
```javascript
useEffect(() => {
  socket.on('event', handler);
  return () => {
    socket.off('event', handler);  // Cleanup
  };
}, [socket]);
```
- Prevents memory leaks
- Removes event listeners on unmount

**4. Early Returns:**
```javascript
if (loading) return <Spinner />;
if (!user) return <Navigate to="/login" />;
return <Dashboard />;
```
- Improves readability
- Reduces nesting

**5. Object State Updates:**
```javascript
setFormData({
  ...formData,  // Spread existing state
  [field]: value  // Update one field
});
```
- Immutable updates (React requirement)
- Dynamic field names

---

## 🐛 Common Issues & Solutions

**1. "Cannot read property 'map' of undefined"**
- **Cause:** State not initialized as array
- **Fix:** `useState([])` instead of `useState()`

**2. "Too many re-renders"**
- **Cause:** `useEffect` without dependency array
- **Fix:** Add `[]` or proper dependencies

**3. "Network Error"**
- **Cause:** CORS issue or wrong API URL
- **Fix:** Check VITE_API_URL, ensure backend CORS configured

**4. "401 Unauthorized"**
- **Cause:** Token expired or invalid
- **Fix:** Login again, check JWT_EXPIRES_IN on backend

**5. "Socket not connecting"**
- **Cause:** Wrong VITE_SOCKET_URL or CORS
- **Fix:** Check URL, ensure Socket.io CORS configured

**6. "Warning: Can't perform state update on unmounted component"**
- **Cause:** Async operation completes after component unmounts
- **Fix:** Use cleanup function or isMounted flag

---

## 🎨 UI/UX Improvements (Future)

**1. Toast Notifications:**
- Replace `alert()` with elegant toast library (e.g., react-hot-toast)
- Non-blocking, styled notifications

**2. Loading States:**
- Add skeleton loaders instead of "Loading..."
- Better perceived performance

**3. Form Validation:**
- Client-side validation before API call
- Real-time error messages
- Field-level validation

**4. Maps Integration:**
- Google Maps for location selection
- Visual distance display
- Route planning for NGOs

**5. Image Upload:**
- Photo upload for food listings
- Image preview before upload
- Compress images client-side

**6. Pagination:**
- Infinite scroll for listings
- Load more button
- Virtual scrolling for large lists

**7. Search & Filters:**
- Search by food name
- Filter by category, dietary preferences
- Date range filters

**8. Responsive Improvements:**
- Mobile-optimized forms
- Touch-friendly buttons
- Bottom navigation for mobile

---

## 📱 Progressive Web App (Future)

**To make MealBridge a PWA:**

1. **Add manifest.json:**
   ```json
   {
     "name": "MealBridge",
     "short_name": "MealBridge",
     "icons": [
       { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
       { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
     ],
     "start_url": "/",
     "display": "standalone",
     "theme_color": "#16a34a",
     "background_color": "#ffffff"
   }
   ```

2. **Add Service Worker:**
   - Cache static assets
   - Offline support
   - Background sync for claims

3. **Enable Install Prompt:**
   - "Add to Home Screen" banner
   - Native app-like experience

---

This frontend provides a modern, responsive, and user-friendly interface for the MealBridge platform with real-time updates, role-based dashboards, and seamless API integration.