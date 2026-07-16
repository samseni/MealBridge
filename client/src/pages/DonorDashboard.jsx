import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listingsAPI } from '../api/listings.api';
import { useSocket } from '../context/SocketContext';

export default function DonorDashboard() {
  const { user, logout } = useAuth();
  const [listings, setListings] = useState([]);
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
        alert(`Your listing "${data.title}" has been claimed!`);
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

      alert('Listing created successfully!');
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
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to cancel this listing?')) return;

    try {
      await listingsAPI.delete(id);
      fetchListings();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete listing');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">🍛 MealBridge - Donor Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user?.name}</span>
            <button onClick={logout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">My Listings</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Cancel' : '+ New Listing'}
          </button>
        </div>

        {/* Create Listing Form */}
        {showForm && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-4">Create New Listing</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                  >
                    <option value="cooked">Cooked</option>
                    <option value="packaged">Packaged</option>
                    <option value="raw">Raw</option>
                    <option value="bakery">Bakery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Servings</label>
                  <input
                    type="number"
                    value={formData.servings}
                    onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                    className="input"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      checked={formData.is_veg}
                      onChange={(e) => setFormData({ ...formData, is_veg: e.target.checked })}
                    />
                    <span className="text-sm font-medium">Vegetarian</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Pickup Start</label>
                  <input
                    type="datetime-local"
                    value={formData.pickup_start}
                    onChange={(e) => setFormData({ ...formData, pickup_start: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pickup End</label>
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
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary w-full">
                {loading ? 'Creating...' : 'Create Listing'}
              </button>
            </form>
          </div>
        )}

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.length === 0 ? (
            <p className="text-gray-600 col-span-full text-center py-8">
              No listings yet. Create your first listing!
            </p>
          ) : (
            listings.map((listing) => (
              <div key={listing.id} className="card">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{listing.title}</h3>
                  <span className={`px-2 py-1 rounded text-sm ${
                    listing.status === 'available' ? 'bg-green-100 text-green-800' :
                    listing.status === 'claimed' ? 'bg-blue-100 text-blue-800' :
                    listing.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {listing.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">{listing.description}</p>
                <div className="space-y-1 text-sm">
                  <p><strong>Servings:</strong> {listing.servings}</p>
                  <p><strong>Category:</strong> {listing.category}</p>
                  <p><strong>Type:</strong> {listing.is_veg ? '🌱 Veg' : '🍖 Non-veg'}</p>
                </div>
                {listing.status === 'available' && (
                  <button
                    onClick={() => handleDelete(listing.id)}
                    className="mt-4 w-full btn bg-red-500 text-white hover:bg-red-600"
                  >
                    Cancel Listing
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}