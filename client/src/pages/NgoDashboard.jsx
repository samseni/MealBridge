import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listingsAPI } from '../api/listings.api';
import axios from '../api/axios';
import { useSocket } from '../context/SocketContext';
import StatsCard from '../components/donor/StatsCard';
import { showToast } from '../components/common/ToastProvider';

export default function NgoDashboard() {
  const { user, logout } = useAuth();
  const [listings, setListings] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, find, claims
  const [searchQuery, setSearchQuery] = useState('');
  const socket = useSocket();

  useEffect(() => {
    if (user?.verification === 'approved') {
      fetchNearbyListings();
      fetchMyClaims();
    }

    if (socket) {
      socket.on('listing:new', (data) => {
        showToast.info(`New food available: ${data.title}`);
        fetchNearbyListings();
      });
    }

    return () => {
      if (socket) {
        socket.off('listing:new');
      }
    };
  }, [socket, user]);

  const fetchNearbyListings = async () => {
    try {
      // Use NGO's location if available, otherwise use a large radius to show all listings
      const lat = user?.lat || 28.6139;
      const lng = user?.lng || 77.2090;
      const radius = user?.lat ? 10000 : 1000000; // 10km if user has location, 1000km otherwise

      const response = await listingsAPI.getNearby(lat, lng, radius);
      setListings(response.data.listings);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    }
  };

  const fetchMyClaims = async () => {
    try {
      const response = await axios.get('/claims/mine');
      setMyClaims(response.data.claims);
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    }
  };

  const handleClaim = async (listingId) => {
    if (!window.confirm('Are you sure you want to claim this listing?')) return;

    try {
      await axios.post(`/claims/${listingId}`);
      showToast.success('Listing claimed successfully!');
      fetchNearbyListings();
      fetchMyClaims();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to claim listing');
    }
  };

  const markInTransit = async (claimId) => {
    try {
      await axios.patch(`/claims/${claimId}/pickup`);
      showToast.success('Marked as picked up!');
      fetchMyClaims();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to update claim');
    }
  };

  if (user?.verification === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-primary-50 flex items-center justify-center p-4">
        <div className="card max-w-lg w-full text-center animate-bounce-in">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-4xl shadow-lg shadow-orange-500/30 animate-pulse">
              ⏳
            </div>
            <h2 className="text-3xl font-bold mb-3 text-gray-900">Verification Pending</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 mx-auto rounded-full mb-6"></div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-6 border border-yellow-200">
            <p className="text-gray-700 leading-relaxed mb-4">
              Your NGO account is currently under review by our admin team.
            </p>
            <div className="text-sm text-gray-600 space-y-2">
              <p className="flex items-center justify-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Account created successfully</span>
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="text-yellow-500">⏳</span>
                <span>Awaiting admin verification</span>
              </p>
              <p className="flex items-center justify-center gap-2 text-gray-400">
                <span>○</span>
                <span>Access to dashboard</span>
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            You will receive a notification once your account is verified.
          </p>

          <button onClick={logout} className="btn btn-outline w-full">
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (user?.verification === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
        <div className="card max-w-lg w-full text-center animate-bounce-in">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-4xl shadow-lg shadow-red-500/30">
              ❌
            </div>
            <h2 className="text-3xl font-bold mb-3 text-red-600">Verification Rejected</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-red-500 to-red-600 mx-auto rounded-full mb-6"></div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 mb-6 border border-red-200">
            <p className="text-gray-700 leading-relaxed mb-4">
              Unfortunately, your NGO verification request has been declined.
            </p>
            <div className="text-sm text-gray-600 space-y-2">
              <p className="font-medium text-red-600 mb-2">Next steps:</p>
              <p className="flex items-start gap-2 text-left">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Contact our support team for more information</span>
              </p>
              <p className="flex items-start gap-2 text-left">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Review and update your organization details</span>
              </p>
              <p className="flex items-start gap-2 text-left">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Reapply with correct documentation</span>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={logout} className="btn btn-outline flex-1">
              Logout
            </button>
            <button className="btn btn-primary flex-1">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const stats = {
    totalClaims: myClaims.length,
    activeClaims: myClaims.filter(c => !c.completed_at).length,
    completedClaims: myClaims.filter(c => c.completed_at).length,
    totalServings: myClaims.reduce((sum, c) => sum + (c.servings || 0), 0),
    availableListings: listings.length,
  };

  // Filter listings based on search
  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.donor_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg min-h-screen">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-green-600 mb-2">🍛 MealBridge</h1>
          <p className="text-sm text-gray-600">NGO Portal</p>
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
            onClick={() => setCurrentView('find')}
            className={`sidebar-link w-full ${currentView === 'find' ? 'sidebar-link-active' : ''}`}
          >
            <span className="text-xl">🔍</span>
            <span>Find Food</span>
          </button>
          <button
            onClick={() => setCurrentView('claims')}
            className={`sidebar-link w-full ${currentView === 'claims' ? 'sidebar-link-active' : ''}`}
          >
            <span className="text-xl">📦</span>
            <span>My Claims</span>
            {stats.activeClaims > 0 && (
              <span className="ml-auto bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                {stats.activeClaims}
              </span>
            )}
          </button>
          <button
            onClick={() => setCurrentView('impact')}
            className={`sidebar-link w-full ${currentView === 'impact' ? 'sidebar-link-active' : ''}`}
          >
            <span className="text-xl">🌱</span>
            <span>Impact</span>
          </button>
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
              {(user?.org_name || user?.name)?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.org_name || user?.name}</p>
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
              {currentView === 'find' && 'Find Available Food'}
              {currentView === 'claims' && 'My Claims'}
              {currentView === 'impact' && 'Impact Report'}
            </h2>
            <p className="text-gray-600 mt-1">
              {currentView === 'dashboard' && 'Track your food rescue activities'}
              {currentView === 'find' && 'Browse and claim available food donations'}
              {currentView === 'claims' && 'Manage your active and completed claims'}
              {currentView === 'impact' && 'View your organization\'s impact'}
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
                  title="Total Claims"
                  value={stats.totalClaims}
                  icon="📦"
                  color="green"
                  subtitle="All time"
                />
                <StatsCard
                  title="Active Claims"
                  value={stats.activeClaims}
                  icon="🚚"
                  color="yellow"
                  subtitle="In progress"
                />
                <StatsCard
                  title="Meals Collected"
                  value={stats.totalServings}
                  icon="🍽️"
                  color="blue"
                  subtitle="Total servings"
                />
                <StatsCard
                  title="Available Now"
                  value={stats.availableListings}
                  icon="✨"
                  color="purple"
                  subtitle="Nearby listings"
                />
              </div>

              {/* Quick Actions */}
              <div className="card mb-8">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setCurrentView('find')}
                    className="btn btn-primary justify-start"
                  >
                    <span className="text-xl">🔍</span>
                    <span>Find Available Food</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('claims')}
                    className="btn btn-outline justify-start"
                  >
                    <span className="text-xl">📦</span>
                    <span>View My Claims</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('impact')}
                    className="btn btn-ghost justify-start"
                  >
                    <span className="text-xl">🌱</span>
                    <span>View Impact</span>
                  </button>
                </div>
              </div>

              {/* Available Listings Preview */}
              <div className="card mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Nearby Available Food</h3>
                  <button
                    onClick={() => setCurrentView('find')}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    View all →
                  </button>
                </div>
                <div className="space-y-3">
                  {listings.slice(0, 5).map((listing) => (
                    <div key={listing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{listing.title}</h4>
                        <p className="text-sm text-gray-600">
                          {listing.servings} servings • {listing.category} • {Math.round(listing.distance)}m away
                        </p>
                      </div>
                      <button
                        onClick={() => handleClaim(listing.id)}
                        className="btn btn-sm btn-primary"
                      >
                        Claim
                      </button>
                    </div>
                  ))}
                  {listings.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No available food nearby
                    </p>
                  )}
                </div>
              </div>

              {/* Active Claims Preview */}
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Active Claims</h3>
                  <button
                    onClick={() => setCurrentView('claims')}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    View all →
                  </button>
                </div>
                <div className="space-y-3">
                  {myClaims.filter(c => !c.completed_at).slice(0, 3).map((claim) => (
                    <div key={claim.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{claim.title}</h4>
                        <p className="text-sm text-gray-600">
                          {claim.servings} servings • {claim.donor_name}
                        </p>
                      </div>
                      <span className={`badge ${claim.picked_up_at ? 'badge-info' : 'badge-warning'}`}>
                        {claim.picked_up_at ? 'In Transit' : 'Claimed'}
                      </span>
                    </div>
                  ))}
                  {myClaims.filter(c => !c.completed_at).length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No active claims
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Find Food View */}
          {currentView === 'find' && (
            <>
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by title, category, or donor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-12"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                    🔍
                  </span>
                </div>
              </div>

              {/* Listings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.length === 0 ? (
                  <div className="col-span-full text-center py-16">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No food available</h3>
                    <p className="text-gray-600">Check back later for new donations</p>
                  </div>
                ) : (
                  filteredListings.map((listing) => (
                    <div key={listing.id} className="card hover:shadow-lg transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg text-gray-900">{listing.title}</h3>
                        <span className="badge badge-success">Available</span>
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
                          <span className="text-gray-600">Distance:</span>
                          <span className="font-medium">{Math.round(listing.distance)}m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Donor:</span>
                          <span className="font-medium">{listing.donor_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium">{listing.is_veg ? '🌱 Veg' : '🍖 Non-veg'}</span>
                        </div>
                      </div>
                      <div className="pt-3 border-t">
                        <p className="text-xs text-gray-500 mb-2">📍 {listing.address}</p>
                      </div>
                      <button
                        onClick={() => handleClaim(listing.id)}
                        className="w-full btn btn-primary mt-2"
                      >
                        🤝 Claim This Food
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* My Claims View */}
          {currentView === 'claims' && (
            <>
              <div className="flex gap-2 mb-6">
                <button className="btn btn-sm btn-primary">All ({stats.totalClaims})</button>
                <button className="btn btn-sm btn-ghost">Active ({stats.activeClaims})</button>
                <button className="btn btn-sm btn-ghost">Completed ({stats.completedClaims})</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myClaims.length === 0 ? (
                  <div className="col-span-full text-center py-16">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No claims yet</h3>
                    <p className="text-gray-600 mb-6">Start claiming available food donations</p>
                    <button
                      onClick={() => setCurrentView('find')}
                      className="btn btn-primary"
                    >
                      🔍 Find Food
                    </button>
                  </div>
                ) : (
                  myClaims.map((claim) => (
                    <div key={claim.id} className="card">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg text-gray-900">{claim.title}</h3>
                        <span className={`badge ${
                          claim.completed_at ? 'badge-success' :
                          claim.picked_up_at ? 'badge-info' :
                          'badge-warning'
                        }`}>
                          {claim.completed_at ? 'Completed' :
                           claim.picked_up_at ? 'In Transit' :
                           'Claimed'}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Servings:</span>
                          <span className="font-medium">{claim.servings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Donor:</span>
                          <span className="font-medium">{claim.donor_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="font-medium">{claim.donor_phone}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-500 mb-1">📍 {claim.address}</p>
                          <p className="text-xs text-gray-500">
                            Claimed: {new Date(claim.claimed_at).toLocaleString()}
                          </p>
                          {claim.picked_up_at && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Picked up: {new Date(claim.picked_up_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      {!claim.picked_up_at && !claim.completed_at && (
                        <button
                          onClick={() => markInTransit(claim.id)}
                          className="w-full btn btn-primary btn-sm"
                        >
                          ✅ Mark as Picked Up
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Impact View */}
          {currentView === 'impact' && (
            <div className="max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatsCard
                  title="Total Meals Rescued"
                  value={stats.totalServings}
                  icon="🍽️"
                  color="green"
                  subtitle="Servings collected"
                />
                <StatsCard
                  title="Completed Claims"
                  value={stats.completedClaims}
                  icon="✅"
                  color="blue"
                  subtitle="Successful pickups"
                />
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Your Impact</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">{stats.totalServings} meals</p>
                    <p className="text-sm text-green-600">rescued from going to waste</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-700">{Math.round(stats.totalServings * 0.5)} kg</p>
                    <p className="text-sm text-blue-600">of food waste prevented</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-700">{Math.round(stats.totalServings * 2.5)} kg CO₂</p>
                    <p className="text-sm text-purple-600">emissions avoided</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}