import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
import { showToast } from '../../components/common/ToastProvider';
import NotificationBell from '../../components/common/NotificationBell';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminReports() {
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  });
  const [loading, setLoading] = useState(true);
  const [exportFormat, setExportFormat] = useState('csv');

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAnalytics({
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      showToast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  // Export report
  const handleExport = async () => {
    try {
      const response = await adminAPI.exportReport({
        start_date: dateRange.start,
        end_date: dateRange.end,
        format: exportFormat
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: exportFormat === 'csv' ? 'text/csv' : 'application/pdf'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mealbridge-report-${dateRange.start}-to-${dateRange.end}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast.success(`Report exported as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      showToast.error('Failed to export report');
    }
  };

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
              className="w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
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
              className="w-full text-left px-4 py-2 rounded-lg bg-primary-50 text-primary-700 font-medium"
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
              <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
              <p className="text-gray-600 mt-1">View platform statistics and export reports</p>
            </div>
            <NotificationBell />
          </div>
        </header>

        <div className="p-8">
          {/* Date Range & Export Controls */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Export Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>

              {/* Export Button */}
              <div className="flex items-end">
                <button
                  onClick={handleExport}
                  disabled={!analytics}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📥 Export Report
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow-sm">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : !analytics ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <p className="text-gray-500">No data available</p>
            </div>
          ) : (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Listings</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {analytics.total_listings || 0}
                      </p>
                    </div>
                    <div className="text-4xl">🍱</div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {analytics.active_listings || 0} active
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Claims</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {analytics.total_claims || 0}
                      </p>
                    </div>
                    <div className="text-4xl">🤝</div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {analytics.successful_claims || 0} successful
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Users</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {analytics.total_users || 0}
                      </p>
                    </div>
                    <div className="text-4xl">👥</div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {analytics.active_users || 0} active
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Verified NGOs</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {analytics.verified_ngos || 0}
                      </p>
                    </div>
                    <div className="text-4xl">✅</div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {analytics.pending_verifications || 0} pending
                  </p>
                </div>
              </div>

              {/* User Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">User Breakdown</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                          🎁
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Donors</p>
                          <p className="text-sm text-gray-500">Individual & Organizations</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {analytics.total_donors || 0}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                          🏢
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">NGOs</p>
                          <p className="text-sm text-gray-500">Verified Organizations</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {analytics.total_ngos || 0}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                          👑
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Admins</p>
                          <p className="text-sm text-gray-500">Platform Administrators</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {analytics.total_admins || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Activity Stats */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Stats</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Listings Created</span>
                        <span className="text-sm font-medium text-gray-900">
                          {analytics.listings_created || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              ((analytics.listings_created || 0) / (analytics.total_listings || 1)) * 100,
                              100
                            )}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Claims Made</span>
                        <span className="text-sm font-medium text-gray-900">
                          {analytics.claims_made || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              ((analytics.claims_made || 0) / (analytics.total_claims || 1)) * 100,
                              100
                            )}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">New Registrations</span>
                        <span className="text-sm font-medium text-gray-900">
                          {analytics.new_users || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              ((analytics.new_users || 0) / (analytics.total_users || 1)) * 100,
                              100
                            )}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Verification Requests</span>
                        <span className="text-sm font-medium text-gray-900">
                          {analytics.verification_requests || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              ((analytics.verification_requests || 0) / (analytics.total_ngos || 1)) * 100,
                              100
                            )}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Food Impact */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Food Impact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-5xl mb-3">🍽️</div>
                    <p className="text-3xl font-bold text-gray-900">
                      {analytics.total_meals || 0}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Total Meals Shared</p>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl mb-3">⚖️</div>
                    <p className="text-3xl font-bold text-gray-900">
                      {analytics.total_weight ? `${analytics.total_weight} kg` : '0 kg'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Total Food Weight</p>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl mb-3">🌍</div>
                    <p className="text-3xl font-bold text-gray-900">
                      {analytics.waste_prevented ? `${analytics.waste_prevented} kg` : '0 kg'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Waste Prevented</p>
                  </div>
                </div>
              </div>

              {/* Top Contributors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Donors</h3>
                  {analytics.top_donors && analytics.top_donors.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.top_donors.slice(0, 5).map((donor, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{donor.name}</p>
                              <p className="text-sm text-gray-500">{donor.listings_count} listings</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ⭐ {donor.avg_rating?.toFixed(1) || 'N/A'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No data available</p>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top NGOs</h3>
                  {analytics.top_ngos && analytics.top_ngos.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.top_ngos.slice(0, 5).map((ngo, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{ngo.org_name}</p>
                              <p className="text-sm text-gray-500">{ngo.claims_count} claims</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ⭐ {ngo.avg_rating?.toFixed(1) || 'N/A'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No data available</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}