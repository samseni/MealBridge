import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../api/analytics.api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await analyticsAPI.getMyAnalytics();
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="card text-center py-8">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  // Format monthly stats for charts
  const monthlyData = analytics.monthlyStats.map(stat => ({
    month: new Date(stat.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    count: parseInt(stat.listings_count || stat.claims_count || 0),
    servings: parseInt(stat.servings_count || 0)
  })).reverse();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analytics.role === 'donor' ? (
          <>
            <div className="card bg-gradient-to-br from-primary-50 to-primary-100">
              <div className="text-3xl mb-2">📦</div>
              <p className="text-sm text-gray-600 mb-1">Total Listings</p>
              <p className="text-3xl font-bold text-primary-700">{analytics.summary.total_listings}</p>
            </div>
            <div className="card bg-gradient-to-br from-green-50 to-green-100">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-700">{analytics.summary.completed_listings}</p>
            </div>
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="text-3xl mb-2">🍽️</div>
              <p className="text-sm text-gray-600 mb-1">Total Servings</p>
              <p className="text-3xl font-bold text-blue-700">{analytics.summary.total_servings_donated || 0}</p>
            </div>
            <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
              <div className="text-3xl mb-2">⭐</div>
              <p className="text-sm text-gray-600 mb-1">Average Rating</p>
              <p className="text-3xl font-bold text-yellow-700">{analytics.ratingStats.avg_rating || 'N/A'}</p>
            </div>
          </>
        ) : (
          <>
            <div className="card bg-gradient-to-br from-green-50 to-green-100">
              <div className="text-3xl mb-2">📦</div>
              <p className="text-sm text-gray-600 mb-1">Total Claims</p>
              <p className="text-3xl font-bold text-green-700">{analytics.summary.total_claims}</p>
            </div>
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-blue-700">{analytics.summary.completed_claims}</p>
            </div>
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="text-3xl mb-2">🍽️</div>
              <p className="text-sm text-gray-600 mb-1">Servings Collected</p>
              <p className="text-3xl font-bold text-purple-700">{analytics.summary.total_servings_received || 0}</p>
            </div>
            <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
              <div className="text-3xl mb-2">⭐</div>
              <p className="text-sm text-gray-600 mb-1">Average Rating</p>
              <p className="text-3xl font-bold text-yellow-700">{analytics.ratingStats.avg_rating || 'N/A'}</p>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Activity Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {analytics.role === 'donor' ? 'Monthly Listings' : 'Monthly Claims'}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name={analytics.role === 'donor' ? 'Listings' : 'Claims'} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Servings Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Monthly Servings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="servings" stroke="#10b981" strokeWidth={2} name="Servings" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rating Stats */}
      {analytics.ratingStats.total_ratings > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Rating Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Average Rating</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-yellow-700">{analytics.ratingStats.avg_rating}</p>
                <p className="text-yellow-600">⭐</p>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Ratings</p>
              <p className="text-3xl font-bold text-blue-700">{analytics.ratingStats.total_ratings}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {analytics.recentActivity.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No recent activity</p>
          ) : (
            analytics.recentActivity.map((activity, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                {analytics.role === 'donor' ? (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <span className={`badge ${
                        activity.status === 'completed' ? 'badge-success' :
                        activity.status === 'claimed' ? 'badge-warning' :
                        activity.status === 'available' ? 'badge-info' :
                        'badge-error'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{activity.servings} servings</p>
                    {activity.ngo_name && (
                      <p className="text-sm text-gray-600">Claimed by: {activity.ngo_org_name || activity.ngo_name}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <span className="badge badge-info">{activity.servings} servings</span>
                    </div>
                    <p className="text-sm text-gray-600">Donor: {activity.donor_name}</p>
                    <p className="text-sm text-gray-600">📍 {activity.address}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Claimed: {new Date(activity.claimed_at).toLocaleDateString()}
                    </p>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}