import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
import { showToast } from '../../components/common/ToastProvider';
import NotificationBell from '../../components/common/NotificationBell';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminVerifications() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch verification requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await adminAPI.getVerificationRequests(params);
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      showToast.error('Failed to load verification requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  // Handle approve
  const handleApprove = async (id) => {
    if (!reviewNote.trim()) {
      showToast.error('Please add a review note');
      return;
    }

    try {
      setProcessing(true);
      await adminAPI.reviewVerification(id, {
        status: 'approved',
        admin_note: reviewNote
      });
      showToast.success('Verification approved successfully');
      setSelectedRequest(null);
      setReviewNote('');
      fetchRequests();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to approve verification');
    } finally {
      setProcessing(false);
    }
  };

  // Handle reject
  const handleReject = async (id) => {
    if (!reviewNote.trim()) {
      showToast.error('Please add a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      await adminAPI.reviewVerification(id, {
        status: 'rejected',
        admin_note: reviewNote
      });
      showToast.success('Verification rejected');
      setSelectedRequest(null);
      setReviewNote('');
      fetchRequests();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to reject verification');
    } finally {
      setProcessing(false);
    }
  };

  // Open review modal
  const openReviewModal = (request) => {
    setSelectedRequest(request);
    setReviewNote('');
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
              className="w-full text-left px-4 py-2 rounded-lg bg-primary-50 text-primary-700 font-medium"
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
              <h2 className="text-2xl font-bold text-gray-900">NGO Verifications</h2>
              <p className="text-gray-600 mt-1">Review and manage NGO verification requests</p>
            </div>
            <NotificationBell />
          </div>
        </header>

        {/* Filters */}
        <div className="p-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({requests.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'approved'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'rejected'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rejected
              </button>
            </div>
          </div>

          {/* Requests List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <p className="text-gray-500">No verification requests found</p>
              </div>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    {/* Request Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{request.org_name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Contact Person</p>
                          <p className="font-medium text-gray-900">{request.user_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Email</p>
                          <p className="font-medium text-gray-900">{request.user_email}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Registration Number</p>
                          <p className="font-medium text-gray-900">{request.registration_number || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Submitted</p>
                          <p className="font-medium text-gray-900">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Documents */}
                      {request.documents && request.documents.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-2">Documents:</p>
                          <div className="flex flex-wrap gap-2">
                            {request.documents.map((doc, idx) => (
                              <a
                                key={idx}
                                href={doc}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                              >
                                📄 Document {idx + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Admin Note */}
                      {request.admin_note && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Admin Note:</p>
                          <p className="text-sm text-gray-900 mt-1">{request.admin_note}</p>
                          {request.reviewed_at && (
                            <p className="text-xs text-gray-500 mt-1">
                              Reviewed on {new Date(request.reviewed_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {request.status === 'pending' && (
                      <div className="ml-6">
                        <button
                          onClick={() => openReviewModal(request)}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          Review
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {requests.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {requests.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">
                {requests.filter(r => r.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Review Verification Request</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Organization Details */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Organization Name</p>
                  <p className="font-medium text-gray-900">{selectedRequest.org_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact Person</p>
                  <p className="font-medium text-gray-900">{selectedRequest.user_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{selectedRequest.user_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registration Number</p>
                  <p className="font-medium text-gray-900">{selectedRequest.registration_number || 'N/A'}</p>
                </div>
              </div>

              {/* Documents */}
              {selectedRequest.documents && selectedRequest.documents.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Submitted Documents:</p>
                  <div className="space-y-2">
                    {selectedRequest.documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <span>📄</span>
                        <span>Document {idx + 1}</span>
                        <span className="ml-auto text-xs">Open →</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Note (Required)
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Add your review note or reason for decision..."
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
              <button
                onClick={() => setSelectedRequest(null)}
                disabled={processing}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedRequest.id)}
                disabled={processing || !reviewNote.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => handleApprove(selectedRequest.id)}
                disabled={processing || !reviewNote.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}