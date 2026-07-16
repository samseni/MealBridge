import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listingsAPI } from '../api/listings.api';
import axios from '../api/axios';
import { useSocket } from '../context/SocketContext';

export default function NgoDashboard() {
  const { user, logout } = useAuth();
  const [listings, setListings] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [view, setView] = useState('available'); // 'available' or 'claims'
  const socket = useSocket();

  useEffect(() => {
    if (user?.verification === 'approved') {
      fetchNearbyListings();
      fetchMyClaims();
    }

    if (socket) {
      socket.on('listing:new', (data) => {
        alert(`New food available: ${data.title}`);
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
      // For demo, using fixed coordinates. In production, get user's location
      const response = await listingsAPI.getNearby(28.6139, 77.2090, 10000);
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
    if (!confirm('Are you sure you want to claim this listing?')) return;

    try {
      await axios.post(`/claims/${listingId}`);
      alert('Listing claimed successfully!');
      fetchNearbyListings();
      fetchMyClaims();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to claim listing');
    }
  };

  const markInTransit = async (claimId) => {
    try {
      await axios.patch(`/claims/${claimId}/pickup`);
      alert('Marked as in transit!');
      fetchMyClaims();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update claim');
    }
  };

  if (user?.verification === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">⏳ Verification Pending</h2>
          <p className="text-gray-600">
            Your NGO account is pending verification. Please wait for admin approval.
          </p>
          <button onClick={logout} className="btn btn-secondary mt-6">
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (user?.verification === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">❌ Verification Rejected</h2>
          <p className="text-gray-600">
            Your NGO account verification was rejected. Please contact support.
          </p>
          <button onClick={logout} className="btn btn-secondary mt-6">
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">🍛 MealBridge - NGO Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.org_name || user?.name}</span>
            <button onClick={logout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setView('available')}
              className={`py-4 px-6 font-medium border-b-2 ${
                view === 'available'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Available Food
            </button>
            <button
              onClick={() => setView('claims')}
              className={`py-4 px-6 font-medium border-b-2 ${
                view === 'claims'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              My Claims ({myClaims.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'available' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.length === 0 ? (
              <p className="text-gray-600 col-span-full text-center py-8">
                No available listings nearby
              </p>
            ) : (
              listings.map((listing) => (
                <div key={listing.id} className="card">
                  <h3 className="font-semibold text-lg mb-2">{listing.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{listing.description}</p>
                  <div className="space-y-1 text-sm mb-4">
                    <p><strong>Servings:</strong> {listing.servings}</p>
                    <p><strong>Category:</strong> {listing.category}</p>
                    <p><strong>Distance:</strong> {Math.round(listing.distance)}m</p>
                    <p><strong>Donor:</strong> {listing.donor_name}</p>
                    <p><strong>Address:</strong> {listing.address}</p>
                  </div>
                  <button
                    onClick={() => handleClaim(listing.id)}
                    className="w-full btn btn-primary"
                  >
                    Claim This Food
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myClaims.length === 0 ? (
              <p className="text-gray-600 col-span-full text-center py-8">
                No claims yet
              </p>
            ) : (
              myClaims.map((claim) => (
                <div key={claim.id} className="card">
                  <h3 className="font-semibold text-lg mb-2">{claim.title}</h3>
                  <div className="space-y-1 text-sm mb-4">
                    <p><strong>Servings:</strong> {claim.servings}</p>
                    <p><strong>Donor:</strong> {claim.donor_name}</p>
                    <p><strong>Phone:</strong> {claim.donor_phone}</p>
                    <p><strong>Address:</strong> {claim.address}</p>
                    <p><strong>Claimed:</strong> {new Date(claim.claimed_at).toLocaleString()}</p>
                    {claim.picked_up_at && (
                      <p className="text-green-600"><strong>✓ Picked up</strong></p>
                    )}
                  </div>
                  {!claim.picked_up_at && !claim.completed_at && (
                    <button
                      onClick={() => markInTransit(claim.id)}
                      className="w-full btn btn-primary"
                    >
                      Mark as Picked Up
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}