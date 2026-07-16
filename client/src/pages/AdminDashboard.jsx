import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [verifications, setVerifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [view, setView] = useState('verifications'); // 'verifications' or 'stats'

  useEffect(() => {
    fetchVerifications();
    fetchStats();
  }, []);

  const fetchVerifications = async () => {
    try {
      const response = await axios.get('/admin/verifications');
      setVerifications(response.data.verifications);
    } catch (error) {
      console.error('Failed to fetch verifications:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/admin/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleVerification = async (userId, status) => {
    try {
      await axios.patch(`/admin/verify/${userId}`, { status });
      alert(`NGO ${status} successfully!`);
      fetchVerifications();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update verification');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">🍛 MealBridge - Admin Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Admin: {user?.name}</span>
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
              onClick={() => setView('verifications')}
              className={`py-4 px-6 font-medium border-b-2 ${
                view === 'verifications'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              NGO Verifications ({verifications.length})
            </button>
            <button
              onClick={() => setView('stats')}
              className={`py-4 px-6 font-medium border-b-2 ${
                view === 'stats'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Platform Stats
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'verifications' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Pending NGO Verifications</h2>
            {verifications.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No pending verifications
              </p>
            ) : (
              verifications.map((ngo) => (
                <div key={ngo.id} className="card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{ngo.org_name}</h3>
                      <div className="space-y-1 text-sm text-gray-600 mt-2">
                        <p><strong>Contact Person:</strong> {ngo.name}</p>
                        <p><strong>Email:</strong> {ngo.email}</p>
                        <p><strong>Phone:</strong> {ngo.phone}</p>
                        <p><strong>Applied:</strong> {new Date(ngo.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerification(ngo.id, 'approved')}
                        className="btn bg-green-600 text-white hover:bg-green-700"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleVerification(ngo.id, 'rejected')}
                        className="btn bg-red-600 text-white hover:bg-red-700"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-6">Platform Statistics</h2>
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <h3 className="text-lg font-medium opacity-90">Total Donors</h3>
                  <p className="text-4xl font-bold mt-2">{stats.total_donors}</p>
                </div>
                <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <h3 className="text-lg font-medium opacity-90">Verified NGOs</h3>
                  <p className="text-4xl font-bold mt-2">{stats.verified_ngos}</p>
                </div>
                <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <h3 className="text-lg font-medium opacity-90">Total Listings</h3>
                  <p className="text-4xl font-bold mt-2">{stats.total_listings}</p>
                </div>
                <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                  <h3 className="text-lg font-medium opacity-90">Completed Claims</h3>
                  <p className="text-4xl font-bold mt-2">{stats.completed_claims}</p>
                </div>
                <div className="card bg-gradient-to-br from-pink-500 to-pink-600 text-white">
                  <h3 className="text-lg font-medium opacity-90">Meals Saved</h3>
                  <p className="text-4xl font-bold mt-2">{stats.total_meals_saved}</p>
                </div>
                <div className="card bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                  <h3 className="text-lg font-medium opacity-90">Success Rate</h3>
                  <p className="text-4xl font-bold mt-2">
                    {stats.total_listings > 0
                      ? Math.round((stats.completed_claims / stats.total_listings) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}