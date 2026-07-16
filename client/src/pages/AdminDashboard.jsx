import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import StatsCard from '../components/donor/StatsCard';
import { showToast } from '../components/common/ToastProvider';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [verifications, setVerifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, verifications, stats, users

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
      showToast.success(`NGO ${status} successfully!`);
      fetchVerifications();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to update verification');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg min-h-screen">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600 mb-2">🍛 MealBridge</h1>
          <p className="text-sm text-gray-600">Admin Portal</p>
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
            onClick={() => setCurrentView('verifications')}
            className={`sidebar-link w-full ${currentView === 'verifications' ? 'sidebar-link-active' : ''}`}
          >
            <span className="text-xl">✓</span>
            <span>Verifications</span>
            {verifications.length > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {verifications.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setCurrentView('stats')}
            className={`sidebar-link w-full ${currentView === 'stats' ? 'sidebar-link-active' : ''}`}
          >
            <span className="text-xl">📈</span>
            <span>Statistics</span>
          </button>
          <button
            onClick={() => setCurrentView('users')}
            className={`sidebar-link w-full ${currentView === 'users' ? 'sidebar-link-active' : ''}`}
          >
            <span className="text-xl">👥</span>
            <span>Users</span>
          </button>
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500">Administrator</p>
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
              {currentView === 'dashboard' && 'Admin Dashboard'}
              {currentView === 'verifications' && 'NGO Verifications'}
              {currentView === 'stats' && 'Platform Statistics'}
              {currentView === 'users' && 'User Management'}
            </h2>
            <p className="text-gray-600 mt-1">
              {currentView === 'dashboard' && 'Monitor and manage the MealBridge platform'}
              {currentView === 'verifications' && 'Review and approve NGO applications'}
              {currentView === 'stats' && 'View detailed platform analytics'}
              {currentView === 'users' && 'Manage platform users'}
            </p>
          </div>
        </header>

        <div className="px-8 py-6">
          {/* Dashboard View */}
          {currentView === 'dashboard' && stats && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                  title="Total Donors"
                  value={stats.total_donors}
                  icon="🍽️"
                  color="blue"
                  subtitle="Registered donors"
                />
                <StatsCard
                  title="Verified NGOs"
                  value={stats.verified_ngos}
                  icon="🤝"
                  color="green"
                  subtitle="Active NGOs"
                />
                <StatsCard
                  title="Total Listings"
                  value={stats.total_listings}
                  icon="📦"
                  color="purple"
                  subtitle="Food donations"
                />
                <StatsCard
                  title="Meals Saved"
                  value={stats.total_meals_saved}
                  icon="✨"
                  color="yellow"
                  subtitle="Total servings"
                />
              </div>

              {/* Quick Actions */}
              <div className="card mb-8">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setCurrentView('verifications')}
                    className="btn btn-primary justify-start"
                  >
                    <span className="text-xl">✓</span>
                    <span>Review Verifications ({verifications.length})</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('stats')}
                    className="btn btn-outline justify-start"
                  >
                    <span className="text-xl">📈</span>
                    <span>View Statistics</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('users')}
                    className="btn btn-ghost justify-start"
                  >
                    <span className="text-xl">👥</span>
                    <span>Manage Users</span>
                  </button>
                </div>
              </div>

              {/* Pending Verifications Preview */}
              <div className="card mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Pending Verifications</h3>
                  <button
                    onClick={() => setCurrentView('verifications')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View all →
                  </button>
                </div>
                <div className="space-y-3">
                  {verifications.slice(0, 5).map((ngo) => (
                    <div key={ngo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{ngo.org_name}</h4>
                        <p className="text-sm text-gray-600">{ngo.name} • {ngo.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerification(ngo.id, 'approved')}
                          className="btn btn-sm bg-green-600 text-white hover:bg-green-700"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => handleVerification(ngo.id, 'rejected')}
                          className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
                        >
                          ✗
                        </button>
                      </div>
                    </div>
                  ))}
                  {verifications.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No pending verifications
                    </p>
                  )}
                </div>
              </div>

              {/* Platform Health */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Platform Activity</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Success Rate</span>
                      <span className="font-bold text-green-600">
                        {stats.total_listings > 0
                          ? Math.round((stats.completed_claims / stats.total_listings) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Listings</span>
                      <span className="font-bold text-blue-600">{stats.active_listings || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Completed Claims</span>
                      <span className="font-bold text-purple-600">{stats.completed_claims}</span>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Impact Summary</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600">Meals Saved</p>
                      <p className="text-2xl font-bold text-green-700">{stats.total_meals_saved}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600">Food Waste Prevented</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {Math.round(stats.total_meals_saved * 0.5)} kg
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Verifications View */}
          {currentView === 'verifications' && (
            <div className="space-y-6">
              {verifications.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">✓</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
                  <p className="text-gray-600">No pending NGO verifications</p>
                </div>
              ) : (
                verifications.map((ngo) => (
                  <div key={ngo.id} className="card hover:shadow-lg transition-all">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                        {ngo.org_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{ngo.org_name}</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Contact Person</p>
                            <p className="font-medium">{ngo.name}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Email</p>
                            <p className="font-medium">{ngo.email}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Phone</p>
                            <p className="font-medium">{ngo.phone || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Applied</p>
                            <p className="font-medium">{new Date(ngo.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
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
          )}

          {/* Statistics View */}
          {currentView === 'stats' && stats && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <h3 className="text-lg font-medium opacity-90">Total Donors</h3>
                  <p className="text-4xl font-bold mt-2">{stats.total_donors}</p>
                  <p className="text-sm opacity-80 mt-1">Registered users</p>
                </div>
                <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <h3 className="text-lg font-medium opacity-90">Verified NGOs</h3>
                  <p className="text-4xl font-bold mt-2">{stats.verified_ngos}</p>
                  <p className="text-sm opacity-80 mt-1">Active organizations</p>
                </div>
                <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <h3 className="text-lg font-medium opacity-90">Total Listings</h3>
                  <p className="text-4xl font-bold mt-2">{stats.total_listings}</p>
                  <p className="text-sm opacity-80 mt-1">Food donations created</p>
                </div>
                <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                  <h3 className="text-lg font-medium opacity-90">Completed Claims</h3>
                  <p className="text-4xl font-bold mt-2">{stats.completed_claims}</p>
                  <p className="text-sm opacity-80 mt-1">Successful handovers</p>
                </div>
                <div className="card bg-gradient-to-br from-pink-500 to-pink-600 text-white">
                  <h3 className="text-lg font-medium opacity-90">Meals Saved</h3>
                  <p className="text-4xl font-bold mt-2">{stats.total_meals_saved}</p>
                  <p className="text-sm opacity-80 mt-1">Total servings distributed</p>
                </div>
                <div className="card bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                  <h3 className="text-lg font-medium opacity-90">Success Rate</h3>
                  <p className="text-4xl font-bold mt-2">
                    {stats.total_listings > 0
                      ? Math.round((stats.completed_claims / stats.total_listings) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm opacity-80 mt-1">Claim completion rate</p>
                </div>
              </div>
            </div>
          )}

          {/* Users View */}
          {currentView === 'users' && (
            <div className="card">
              <div className="text-center py-16">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">User Management</h3>
                <p className="text-gray-600">User management features coming soon</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}