import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listingsAPI } from '../api/listings.api';
import { useSocket } from '../context/SocketContext';
import StatsCard from '../components/donor/StatsCard';
import { showToast } from '../components/common/ToastProvider';

export default function DonorDashboard() {
  const { user, logout } = useAuth();
  const [listings, setListings] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, create, listings
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const socket = useSocket();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'cooked',
    servings: '',
    is_veg: true,
    pickup_start: '',
    pickup_end: '',
    address: '',
    lat: '',
    lng: ''
  });

  useEffect(() => {
    fetchListings();

    if (socket) {
      socket.on('listing:claimed', (data) => {
        showToast.info(`Your listing "${data.title}" has been claimed!`);
        fetchListings();
      });
    }

    return () => {
      if (socket) {
        socket.off('listing:claimed');
      }
    };
  }, [socket]);

  const fetchListings = async () => {
    try {
      const response = await listingsAPI.getMine();
      setListings(response.data.listings);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await listingsAPI.create({
        ...formData,
        servings: parseInt(formData.servings),
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng)
      });

      showToast.success('Listing created successfully!');
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        category: 'cooked',
        servings: '',
        is_veg: true,
        pickup_start: '',
        pickup_end: '',
        address: '',
        lat: '',
        lng: ''
      });
      fetchListings();
      setCurrentView('listings');
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this listing?')) return;

    try {
      await listingsAPI.delete(id);
      showToast.success('Listing cancelled successfully');
      fetchListings();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to delete listing');
    }
  };

  // Calculate statistics
  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === 'available').length,
    claimed: listings.filter(l => l.status === 'claimed').length,
    completed: listings.filter(l => l.status === 'completed').length,
    totalServings: listings.reduce((sum, l) => sum + (l.servings || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg min-h-screen">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary-600 mb-2">🍛 MealBridge</h1>
          <p className="text-sm text-gray-600">Donor Portal</p>
        </div>

        <nav className="px-4">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`sidebar-link w-full ${currentView === 'dashboard' ? 'sidebar-link-active' : ''}`}
          >
            <span className="text-xl">📊</span>
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => { setCurrentView('create'); setShowForm(true); }}
            className={`sidebar-link w-full ${currentView === 'create' ? 'sidebar-link-active' : ''}`}
          >
            <span className="text-xl">➕</span>
            <span>Create Listing</span>
          </button>
          <button
            onClick={() => setCurrentView('listings')}
            className={`sidebar-link w-full ${currentView === 'listings' ? 'sidebar-link-active' : ''}`}
          >
            <span className="text-xl">📋</span>
            <span>My Listings</span>
          </button>
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="btn btn-ghost w-full text-sm">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="px-8 py-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {currentView === 'dashboard' && 'Dashboard Overview'}
              {currentView === 'create' && 'Create New Listing'}
              {currentView === 'listings' && 'My Listings'}
            </h2>
            <p className="text-gray-600 mt-1">
              {currentView === 'dashboard' && 'Welcome back! Here\'s your impact summary'}
              {currentView === 'create' && 'Share your surplus food with those in need'}
              {currentView === 'listings' && 'Manage all your food donation listings'}
            </p>
          </div>
        </header>

        <div className="px-8 py-6">
          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                  title="Total Listings"
                  value={stats.total}
                  icon="📦"
                  color="primary"
                  subtitle="All time"
                />
                <StatsCard
                  title="Active Listings"
                  value={stats.active}
                  icon="✅"
                  color="green"
                  subtitle="Available now"
                />
                <StatsCard
                  title="Total Servings"
                  value={stats.totalServings}
                  icon="🍽️"
                  color="blue"
                  subtitle="Meals donated"
                />
                <StatsCard
                  title="Completed"
                  value={stats.completed}
                  icon="🎉"
                  color="purple"
                  subtitle="Successfully distributed"
                />
              </div>

              {/* Quick Actions */}
              <div className="card mb-8">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => { setCurrentView('create'); setShowForm(true); }}
                    className="btn btn-primary justify-start"
                  >
                    <span className="text-xl">➕</span>
                    <span>Create New Listing</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('listings')}
                    className="btn btn-outline justify-start"
                  >
                    <span className="text-xl">📋</span>
                    <span>View All Listings</span>
                  </button>
                  <button className="btn btn-ghost justify-start">
                    <span className="text-xl">📊</span>
                    <span>View Analytics</span>
                  </button>
                </div>
              </div>

              {/* Recent Listings */}
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Recent Listings</h3>
                  <button
                    onClick={() => setCurrentView('listings')}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View all →
                  </button>
                </div>
                <div className="space-y-3">
                  {listings.slice(0, 5).map((listing) => (
                    <div key={listing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{listing.title}</h4>
                        <p className="text-sm text-gray-600">{listing.servings} servings • {listing.category}</p>
                      </div>
                      <span className={`badge ${
                        listing.status === 'available' ? 'badge-success' :
                        listing.status === 'claimed' ? 'badge-warning' :
                        listing.status === 'completed' ? 'badge-info' :
                        'badge-error'
                      }`}>
                        {listing.status}
                      </span>
                    </div>
                  ))}
                  {listings.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No listings yet. Create your first one!
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Create Listing View */}
          {currentView === 'create' && (
            <div className="max-w-4xl">
              <div className="card">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="label">Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="input"
                        placeholder="e.g., Fresh Vegetable Biryani"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="input"
                      >
                        <option value="cooked">🍲 Cooked Meal</option>
                        <option value="packaged">📦 Packaged Food</option>
                        <option value="raw">🥕 Raw Ingredients</option>
                        <option value="bakery">🍞 Bakery Items</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="label">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input"
                      rows="4"
                      placeholder="Describe the food, preparation method, ingredients, etc."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="label">Number of Servings *</label>
                      <input
                        type="number"
                        value={formData.servings}
                        onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                        className="input"
                        placeholder="e.g., 50"
                        required
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="label">Dietary Type</label>
                      <label className="flex items-center gap-3 mt-3">
                        <input
                          type="checkbox"
                          checked={formData.is_veg}
                          onChange={(e) => setFormData({ ...formData, is_veg: e.target.checked })}
                          className="w-5 h-5"
                        />
                        <span className="text-gray-700">🌱 Vegetarian</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="label">Pickup Start Time *</label>
                      <input
                        type="datetime-local"
                        value={formData.pickup_start}
                        onChange={(e) => setFormData({ ...formData, pickup_start: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Pickup End Time *</label>
                      <input
                        type="datetime-local"
                        value={formData.pickup_end}
                        onChange={(e) => setFormData({ ...formData, pickup_end: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Pickup Address *</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="input"
                      placeholder="Full address with landmark"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="label">Latitude *</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={formData.lat}
                        onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                        className="input"
                        placeholder="e.g., 12.9716"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Longitude *</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={formData.lng}
                        onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                        className="input"
                        placeholder="e.g., 77.5946"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                      {loading ? 'Creating Listing...' : '✅ Create Listing'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentView('dashboard')}
                      className="btn btn-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* My Listings View */}
          {currentView === 'listings' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                  <button className="btn btn-sm btn-primary">All ({stats.total})</button>
                  <button className="btn btn-sm btn-ghost">Active ({stats.active})</button>
                  <button className="btn btn-sm btn-ghost">Claimed ({stats.claimed})</button>
                  <button className="btn btn-sm btn-ghost">Completed ({stats.completed})</button>
                </div>
                <button
                  onClick={() => { setCurrentView('create'); setShowForm(true); }}
                  className="btn btn-primary"
                >
                  ➕ New Listing
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.length === 0 ? (
                  <div className="col-span-full text-center py-16">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings yet</h3>
                    <p className="text-gray-600 mb-6">Create your first listing to start helping those in need</p>
                    <button
                      onClick={() => { setCurrentView('create'); setShowForm(true); }}
                      className="btn btn-primary"
                    >
                      ➕ Create First Listing
                    </button>
                  </div>
                ) : (
                  listings.map((listing) => (
                    <div key={listing.id} className="card">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg text-gray-900">{listing.title}</h3>
                        <span className={`badge ${
                          listing.status === 'available' ? 'badge-success' :
                          listing.status === 'claimed' ? 'badge-warning' :
                          listing.status === 'completed' ? 'badge-info' :
                          'badge-error'
                        }`}>
                          {listing.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{listing.description}</p>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Servings:</span>
                          <span className="font-medium">{listing.servings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Category:</span>
                          <span className="font-medium">{listing.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium">{listing.is_veg ? '🌱 Veg' : '🍖 Non-veg'}</span>
                        </div>
                      </div>
                      {listing.status === 'available' && (
                        <button
                          onClick={() => handleDelete(listing.id)}
                          className="w-full btn btn-danger btn-sm"
                        >
                          Cancel Listing
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}