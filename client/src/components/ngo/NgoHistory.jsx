import { useState, useEffect } from 'react';
import axios from '../../api/axios';

export default function NgoHistory() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, completed, active, cancelled

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/claims/mine');
      setClaims(response.data.claims);
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

  const filteredClaims = claims.filter(claim => {
    if (filter === 'all') return true;
    if (filter === 'completed') return claim.completed_at !== null;
    if (filter === 'active') return !claim.completed_at && !claim.cancelled_at;
    if (filter === 'cancelled') return claim.cancelled_at !== null;
    return true;
  });

  const stats = {
    all: claims.length,
    completed: claims.filter(c => c.completed_at).length,
    active: claims.filter(c => !c.completed_at && !c.cancelled_at).length,
    cancelled: claims.filter(c => c.cancelled_at).length
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
          onClick={() => setFilter('active')}
          className={`btn btn-sm ${filter === 'active' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Active ({stats.active})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`btn btn-sm ${filter === 'completed' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Completed ({stats.completed})
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
        {filteredClaims.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📜</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No history yet</h3>
            <p className="text-gray-600">Your claim history will appear here</p>
          </div>
        ) : (
          filteredClaims.map((claim) => (
            <div key={claim.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{claim.title}</h3>
                  <p className="text-sm text-gray-600">From: {claim.donor_name}</p>
                </div>
                <span className={`badge ${
                  claim.completed_at ? 'badge-success' :
                  claim.cancelled_at ? 'badge-error' :
                  claim.picked_up_at ? 'badge-info' :
                  'badge-warning'
                }`}>
                  {claim.completed_at ? 'Completed' :
                   claim.cancelled_at ? 'Cancelled' :
                   claim.picked_up_at ? 'In Transit' :
                   'Claimed'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Servings</p>
                  <p className="font-medium">{claim.servings}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Donor Phone</p>
                  <p className="font-medium">{claim.donor_phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pickup Window</p>
                  <p className="font-medium text-xs">
                    {new Date(claim.pickup_start).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Claimed</p>
                  <p className="font-medium text-xs">{new Date(claim.claimed_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Address */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Pickup Address</p>
                <p className="text-sm">📍 {claim.address}</p>
              </div>

              {/* Timeline */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Timeline</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Claimed</p>
                      <p className="text-xs text-gray-500">{new Date(claim.claimed_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {claim.picked_up_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                        ✓
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Picked Up</p>
                        <p className="text-xs text-gray-500">{new Date(claim.picked_up_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {claim.completed_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs">
                        ✓
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Completed</p>
                        <p className="text-xs text-gray-500">{new Date(claim.completed_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {claim.cancelled_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
                        ✗
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-600">Cancelled</p>
                        <p className="text-xs text-gray-500">{new Date(claim.cancelled_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rating Information */}
              {claim.rating_score && (
                <div className="bg-yellow-50 p-3 rounded-lg mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-semibold">Rating: {claim.rating_score}/5</span>
                  </div>
                  {claim.rating_comment && (
                    <p className="text-sm text-gray-700">{claim.rating_comment}</p>
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