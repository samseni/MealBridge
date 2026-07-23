import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
import { showToast } from '../../components/common/ToastProvider';
import NotificationBell from '../../components/common/NotificationBell';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: 'all',
    verification: 'all',
    search: ''
  });

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.role !== 'all') params.role = filters.role;
      if (filters.verification !== 'all') params.verification = filters.verification;

      const response = await adminAPI.getAllUsers(params);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      showToast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters.role, filters.verification]);

  // Toggle user status
  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await adminAPI.toggleUserStatus(userId, { active: !currentStatus });
      showToast.success(`User ${!currentStatus ? 'activated' : 'suspended'} successfully`);
      fetchUsers();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  // Filter users by search
  const filteredUsers = users.filter(u => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      u.name.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      (u.org_name && u.org_name.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-primary-600">🍛 MealBridge</h1>
            <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => navigate('/admin-dashboard')}
              className="w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => navigate('/admin/users')}
              className="w-full text-left px-4 py-2 rounded-lg bg-primary-50 text-primary-700 font-medium"
            >
              👥 Users
            </button>
            <button
              onClick={() => navigate('/admin/verifications')}
              className="w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              ✅ Verifications
            </button>
            <button
              onClick={() => navigate('/admin/reports')}
              className="w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              📈 Reports
            </button>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500">Admin</p>
              </div>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-red-600"
                title="Logout"
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <p className="text-gray-600 mt-1">Manage all platform users</p>
            </div>
            <NotificationBell />
          </div>
        </header>

        {/* Filters */}
        <div className="p-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Name, email, organization..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Roles</option>
                  <option value="donor">Donors</option>
                  <option value="ngo">NGOs</option>
                  <option value="admin">Admins</option>
                </select>
              </div>

              {/* Verification Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Status
                </label>
                <select
                  value={filters.verification}
                  onChange={(e) => setFilters({ ...filters, verification: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Verification
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900">{u.name}</div>
                            <div className="text-sm text-gray-500">{u.email}</div>
                            {u.org_name && (
                              <div className="text-sm text-gray-500">🏢 {u.org_name}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            u.role === 'ngo' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {u.role === 'ngo' ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              u.verification === 'approved' ? 'bg-green-100 text-green-800' :
                              u.verification === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {u.verification}
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            u.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {u.active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-yellow-500">⭐</span>
                            <span className="ml-1 text-sm font-medium">
                              {u.avg_rating ? u.avg_rating.toFixed(1) : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleToggleStatus(u.id, u.active)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                u.active
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {u.active ? 'Suspend' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Donors</p>
              <p className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.role === 'donor').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">NGOs</p>
              <p className="text-2xl font-bold text-green-600">
                {users.filter(u => u.role === 'ngo').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-primary-600">
                {users.filter(u => u.active).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}