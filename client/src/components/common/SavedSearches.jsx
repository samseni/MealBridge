import { useState, useEffect } from 'react';
import searchAPI from '../../api/search.api';
import { showToast } from './ToastProvider';

export default function SavedSearches({ onApplySearch }) {
  const [savedSearches, setSavedSearches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSavedSearches();
  }, []);

  const fetchSavedSearches = async () => {
    try {
      const response = await searchAPI.getSavedSearches();
      setSavedSearches(response.data.searches);
    } catch (error) {
      console.error('Failed to fetch saved searches:', error);
    }
  };

  const handleApplySearch = (search) => {
    if (onApplySearch) {
      onApplySearch(search.search_params);
      showToast.success(`Applied search: ${search.search_name}`);
    }
  };

  const handleDeleteSearch = async (id) => {
    if (!window.confirm('Delete this saved search?')) return;

    setLoading(true);
    try {
      await searchAPI.deleteSearch(id);
      showToast.success('Saved search deleted');
      fetchSavedSearches();
    } catch (error) {
      showToast.error('Failed to delete search');
    } finally {
      setLoading(false);
    }
  };

  if (savedSearches.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          No saved searches yet. Use filters and click "Save Search" to save your preferences.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Saved Searches</h4>
      {savedSearches.map((search) => (
        <div
          key={search.id}
          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <h5 className="font-medium text-gray-900 truncate">{search.search_name}</h5>
            <div className="flex flex-wrap gap-2 mt-1">
              {search.search_params.category && (
                <span className="badge badge-sm">{search.search_params.category}</span>
              )}
              {search.search_params.is_veg && (
                <span className="badge badge-sm bg-green-100 text-green-700">🌱 Veg</span>
              )}
              {search.search_params.min_servings && (
                <span className="badge badge-sm">{search.search_params.min_servings}+ servings</span>
              )}
            </div>
          </div>
          <div className="flex gap-2 ml-3">
            <button
              onClick={() => handleApplySearch(search)}
              className="btn btn-sm btn-primary"
              disabled={loading}
            >
              Apply
            </button>
            <button
              onClick={() => handleDeleteSearch(search.id)}
              className="btn btn-sm btn-ghost text-red-600"
              disabled={loading}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}