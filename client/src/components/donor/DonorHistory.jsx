import { useState, useEffect } from 'react';
import { listingsAPI } from '../../api/listings.api';

export default function DonorHistory() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, completed, claimed, cancelled

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await listingsAPI.getMine();
      setListings(response.data.listings);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-3">📜</div>
          <p className="text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  const filteredListings = listings.filter(listing => {
    if (filter === 'all') return true;
    return listing.status === filter;
  });

  const stats = {
    all: listings.length,
    completed: listings.filter(l => l.status === 'completed').length,
    claimed: listings.filter(l => l.status === 'claimed').length,
    cancelled: listings.filter(l => l.status === 'cancelled').length
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
        >
          All ({stats.all})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`btn btn-sm ${filter === 'completed' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Completed ({stats.completed})
        </button>
        <button
          onClick={() => setFilter('claimed')}
          className={`btn btn-sm ${filter === 'claimed' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Claimed ({stats.claimed})
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`btn btn-sm ${filter === 'cancelled' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Cancelled ({stats.cancelled})
        </button>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredListings.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📜</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No history yet</h3>
            <p className="text-gray-600">Your listing history will appear here</p>
          </div>
        ) : (
          filteredListings.map((listing) => (
            <div key={listing.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{listing.title}</h3>
                  <p className="text-sm text-gray-600">{listing.description}</p>
                </div>
                <span className={`badge ${
                  listing.status === 'completed' ? 'badge-success' :
                  listing.status === 'claimed' ? 'badge-warning' :
                  listing.status === 'available' ? 'badge-info' :
                  'badge-error'
                }`}>
                  {listing.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Servings</p>
                  <p className="font-medium">{listing.servings}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="font-medium">{listing.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="font-medium">{listing.is_veg ? '🌱 Veg' : '🍖 Non-veg'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="font-medium">{new Date(listing.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Claim Information */}
              {listing.claim_id && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Claim Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Claimed by</p>
                      <p className="font-medium">{listing.ngo_org_name || listing.ngo_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Contact</p>
                      <p className="font-medium">{listing.ngo_phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Claimed at</p>
                      <p className="font-medium">{new Date(listing.claimed_at).toLocaleString()}</p>
                    </div>
                    {listing.picked_up_at && (
                      <div>
                        <p className="text-xs text-gray-500">Picked up at</p>
                        <p className="font-medium text-green-600">{new Date(listing.picked_up_at).toLocaleString()}</p>
                      </div>
                    )}
                    {listing.completed_at && (
                      <div>
                        <p className="text-xs text-gray-500">Completed at</p>
                        <p className="font-medium text-green-600">{new Date(listing.completed_at).toLocaleString()}</p>
                      </div>
                    )}
                    {listing.cancelled_at && (
                      <div>
                        <p className="text-xs text-gray-500">Cancelled at</p>
                        <p className="font-medium text-red-600">{new Date(listing.cancelled_at).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Rating Information */}
                  {listing.rating_score && (
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-yellow-500">⭐</span>
                        <span className="font-semibold">Rating: {listing.rating_score}/5</span>
                      </div>
                      {listing.rating_comment && (
                        <p className="text-sm text-gray-700">{listing.rating_comment}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}