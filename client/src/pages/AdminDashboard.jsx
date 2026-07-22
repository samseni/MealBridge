import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import StatsCard from '../components/donor/StatsCard';
import { showToast } from '../components/common/ToastProvider';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import { SkeletonStats, SkeletonCard } from '../components/common/LoadingSkeleton';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [verifications, setVerifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [donors, setDonors] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [listings, setListings] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, verifications, stats, users
  const [userFilter, setUserFilter] = useState('all'); // all, donor, ngo, admin

  useEffect(() => {
    fetchVerifications();
    fetchStats();
    fetchDonors();
    fetchNgos();
    fetchListings();
    if (currentView === 'users') {
      fetchAllUsers();
    }
  }, [currentView]);

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

  const fetchDonors = async () => {
    try {
      const response = await axios.get('/admin/users?role=donor&limit=10');
      setDonors(response.data.users);
    } catch (error) {
      console.error('Failed to fetch donors:', error);
    }
  };

  const fetchNgos = async () => {
    try {
      const response = await axios.get('/admin/users?role=ngo&limit=10');
      setNgos(response.data.users);
    } catch (error) {
      console.error('Failed to fetch NGOs:', error);
    }
  };

  const fetchListings = async () => {
    try {
      const response = await axios.get('/listings?limit=10');
      setListings(response.data.listings || []);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get('/admin/users?limit=100');
      setAllUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch all users:', error);
    }
  };

  const handleVerification = async (userId, status) => {
    try {
      await axios.patch(`/admin/verify/${userId}`, { status });
      showToast.success(`NGO ${status} successfully!`);
      fetchVerifications();
      fetchNgos();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to update verification');
    }
  };

  const filteredUsers = userFilter === 'all'
    ? allUsers
    : allUsers.filter(u => u.role === userFilter);

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
                  onClick={() => {
                    setUserFilter('donor');
                    setCurrentView('users');
                  }}
                />
                <StatsCard
                  title="Verified NGOs"
                  value={stats.verified_ngos}
                  icon="🤝"
                  color="green"
                  subtitle="Active NGOs"
                  onClick={() => {
                    setUserFilter('ngo');
                    setCurrentView('users');
                  }}
                />
                <StatsCard
                  title="Total Listings"
                  value={stats.total_listings}
                  icon="📦"
                  color="purple"
                  subtitle="Food donations"
                  onClick={() => setCurrentView('stats')}
                />
                <StatsCard
                  title="Meals Saved"
                  value={stats.total_meals_saved}
                  icon="✨"
                  color="yellow"
                  subtitle="Total servings"
                  onClick={() => setCurrentView('stats')}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

              {/* Active Users Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active NGOs */}
                <div className="card">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Active NGOs</h3>
                    <span className="badge badge-success">{ngos.filter(n => n.verification === 'approved').length} Verified</span>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {ngos.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No NGOs registered yet</p>
                    ) : (
                      ngos.map((ngo) => (
                        <div key={ngo.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-white rounded-lg border border-green-100 hover:shadow-md transition-all">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {(ngo.org_name || ngo.name)?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{ngo.org_name || ngo.name}</h4>
                            <p className="text-sm text-gray-600 truncate">{ngo.email}</p>
                          </div>
                          <div>
                            {ngo.verification === 'approved' && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                <span>✓</span>
                                <span>Verified</span>
                              </span>
                            )}
                            {ngo.verification === 'pending' && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                                <span>⏳</span>
                                <span>Pending</span>
                              </span>
                            )}
                            {ngo.verification === 'rejected' && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                <span>✗</span>
                                <span>Rejected</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Active Donors */}
                <div className="card">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Active Donors</h3>
                    <span className="badge badge-info">{donors.length} Registered</span>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {donors.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No donors registered yet</p>
                    ) : (
                      donors.map((donor) => (
                        <div key={donor.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-100 hover:shadow-md transition-all">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {donor.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{donor.name}</h4>
                            <p className="text-sm text-gray-600 truncate">{donor.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Joined</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(donor.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Verifications View */}
          {currentView === 'verifications' && (
            <div className="space-y-6">
              {verifications.length === 0 ? (
                <EmptyState
                  icon="✓"
                  title="All caught up!"
                  description="No pending NGO verifications. Check back later for new applications."
                />
              ) : (
                verifications.map((ngo) => (
                  <div key={ngo.id} className="card card-hover-lift animate-slide-up">
                    <div className="flex items-start gap-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-blue-500/30">
                        {ngo.org_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{ngo.org_name}</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Contact Person</p>
                            <p className="font-semibold text-gray-900">{ngo.name}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Email</p>
                            <p className="font-semibold text-gray-900 truncate">{ngo.email}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Phone</p>
                            <p className="font-semibold text-gray-900">{ngo.phone || 'Not provided'}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Applied</p>
                            <p className="font-semibold text-gray-900">{new Date(ngo.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => handleVerification(ngo.id, 'approved')}
                          className="btn bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all px-6"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleVerification(ngo.id, 'rejected')}
                          className="btn bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all px-6"
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
                <div
                  className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200"
                  onClick={() => {
                    setUserFilter('donor');
                    setCurrentView('users');
                  }}
                >
                  <h3 className="text-lg font-medium opacity-90">Total Donors</h3>
                  <p className="text-4xl font-bold mt-2">{stats.total_donors}</p>
                  <p className="text-sm opacity-80 mt-1">Registered users</p>
                  <p className="text-xs opacity-60 mt-2">Click to view all donors →</p>
                </div>
                <div
                  className="card bg-gradient-to-br from-green-500 to-green-600 text-white cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200"
                  onClick={() => {
                    setUserFilter('ngo');
                    setCurrentView('users');
                  }}
                >
                  <h3 className="text-lg font-medium opacity-90">Verified NGOs</h3>
                  <p className="text-4xl font-bold mt-2">{stats.verified_ngos}</p>
                  <p className="text-sm opacity-80 mt-1">Active organizations</p>
                  <p className="text-xs opacity-60 mt-2">Click to view all NGOs →</p>
                </div>
                <div
                  className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200"
                  onClick={() => setCurrentView('dashboard')}
                >
                  <h3 className="text-lg font-medium opacity-90">Total Listings</h3>
                  <p className="text-4xl font-bold mt-2">{stats.total_listings}</p>
                  <p className="text-sm opacity-80 mt-1">Food donations created</p>
                  <p className="text-xs opacity-60 mt-2">Click to view dashboard →</p>
                </div>
                <div
                  className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200"
                  onClick={() => setCurrentView('dashboard')}
                >
                  <h3 className="text-lg font-medium opacity-90">Completed Claims</h3>
                  <p className="text-4xl font-bold mt-2">{stats.completed_claims}</p>
                  <p className="text-sm opacity-80 mt-1">Successful handovers</p>
                  <p className="text-xs opacity-60 mt-2">Click to view dashboard →</p>
                </div>
                <div
                  className="card bg-gradient-to-br from-pink-500 to-pink-600 text-white cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200"
                  onClick={() => setCurrentView('dashboard')}
                >
                  <h3 className="text-lg font-medium opacity-90">Meals Saved</h3>
                  <p className="text-4xl font-bold mt-2">{stats.total_meals_saved}</p>
                  <p className="text-sm opacity-80 mt-1">Total servings distributed</p>
                  <p className="text-xs opacity-60 mt-2">Click to view dashboard →</p>
                </div>
                <div
                  className="card bg-gradient-to-br from-indigo-500 to-indigo-600 text-white cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200"
                  onClick={() => setCurrentView('dashboard')}
                >
                  <h3 className="text-lg font-medium opacity-90">Success Rate</h3>
                  <p className="text-4xl font-bold mt-2">
                    {stats.total_listings > 0
                      ? Math.round((stats.completed_claims / stats.total_listings) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm opacity-80 mt-1">Claim completion rate</p>
                  <p className="text-xs opacity-60 mt-2">Click to view dashboard →</p>
                </div>
              </div>
            </div>
          )}

          {/* Users View */}
          {currentView === 'users' && (
            <div className="space-y-6">
              {/* Filter Tabs */}
              <div className="flex gap-2">
                {['all', 'donor', 'ngo', 'admin'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setUserFilter(filter)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      userFilter === filter
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    <span className="ml-2 text-xs opacity-75">
                      ({filter === 'all' ? allUsers.length : allUsers.filter(u => u.role === filter).length})
                    </span>
                  </button>
                ))}
              </div>

              {/* Users Table */}
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-16 text-center text-gray-500">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                  u.role === 'donor' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                                  u.role === 'ngo' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                                  'bg-gradient-to-br from-purple-400 to-purple-600'
                                }`}>
                                  {u.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">{u.name}</div>
                                  <div className="text-sm text-gray-500">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                u.role === 'donor' ? 'bg-blue-100 text-blue-800' :
                                u.role === 'ngo' ? 'bg-green-100 text-green-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {u.role.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {u.org_name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {u.role === 'ngo' ? (
                                u.verification === 'approved' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                    <span>✓</span>
                                    <span>Verified</span>
                                  </span>
                                ) : u.verification === 'pending' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                                    <span>⏳</span>
                                    <span>Pending</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                    <span>✗</span>
                                    <span>Rejected</span>
                                  </span>
                                )
                              ) : (
                                <span className="text-gray-500 text-sm">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}