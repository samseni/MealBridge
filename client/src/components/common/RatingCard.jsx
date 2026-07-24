import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ratingsAPI from '../../api/ratings.api';
import { showToast } from './ToastProvider';

export default function RatingCard({ rating, onUpdate }) {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmitting(true);
    try {
      await ratingsAPI.replyToRating(rating.id, replyText.trim());
      showToast.success('Reply posted successfully');
      setReplyText('');
      setShowReplyForm(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    setSubmitting(true);
    try {
      await ratingsAPI.reportRating(rating.id, reportReason.trim());
      showToast.success('Rating reported successfully');
      setReportReason('');
      setShowReportForm(false);
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to report rating');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleHelpful = async () => {
    try {
      if (rating.is_helpful) {
        await ratingsAPI.unmarkHelpful(rating.id);
        showToast.success('Removed from helpful');
      } else {
        await ratingsAPI.markHelpful(rating.id);
        showToast.success('Marked as helpful');
      }
      if (onUpdate) onUpdate();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to update helpful status');
    }
  };

  const renderStars = (score) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={`text-lg ${star <= score ? 'text-yellow-400' : 'text-gray-300'}`}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Rating Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
              {rating.rater_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{rating.rater_name}</h4>
              <p className="text-xs text-gray-500">
                {new Date(rating.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          {renderStars(rating.score)}
        </div>

        {/* Helpful Count */}
        {rating.helpful_count > 0 && (
          <span className="text-sm text-gray-600">
            👍 {rating.helpful_count} helpful
          </span>
        )}
      </div>

      {/* Comment */}
      {rating.comment && (
        <p className="text-gray-700 mb-3">{rating.comment}</p>
      )}

      {/* Reply Display */}
      {rating.reply && (
        <div className="ml-6 p-3 bg-blue-50 border-l-4 border-blue-400 rounded mb-3">
          <p className="text-sm font-semibold text-blue-900 mb-1">Response from {rating.ratee_name}:</p>
          <p className="text-sm text-gray-700">{rating.reply}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(rating.replied_at).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
        {/* Helpful Button */}
        {user && user.id !== rating.rater_id && (
          <button
            onClick={toggleHelpful}
            className={`btn btn-sm ${rating.is_helpful ? 'btn-primary' : 'btn-ghost'}`}
          >
            👍 {rating.is_helpful ? 'Helpful' : 'Mark Helpful'}
          </button>
        )}

        {/* Reply Button - Only for ratee */}
        {user && user.id === rating.ratee_id && !rating.reply && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="btn btn-sm btn-ghost"
          >
            💬 Reply
          </button>
        )}

        {/* Report Button */}
        {user && user.id !== rating.rater_id && (
          <button
            onClick={() => setShowReportForm(!showReportForm)}
            className="btn btn-sm btn-ghost text-red-600"
          >
            🚩 Report
          </button>
        )}
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <form onSubmit={handleReply} className="mt-3 pt-3 border-t border-gray-100">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your response..."
            className="input w-full mb-2"
            rows="3"
            required
          />
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
              {submitting ? 'Posting...' : 'Post Reply'}
            </button>
            <button
              type="button"
              onClick={() => setShowReplyForm(false)}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Report Form */}
      {showReportForm && (
        <form onSubmit={handleReport} className="mt-3 pt-3 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for reporting:
          </label>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="input w-full mb-2"
            required
          >
            <option value="">Select a reason</option>
            <option value="spam">Spam</option>
            <option value="inappropriate">Inappropriate content</option>
            <option value="harassment">Harassment</option>
            <option value="false_information">False information</option>
            <option value="other">Other</option>
          </select>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="btn btn-danger btn-sm">
              {submitting ? 'Reporting...' : 'Submit Report'}
            </button>
            <button
              type="button"
              onClick={() => setShowReportForm(false)}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}