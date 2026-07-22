import { useState } from 'react';
import PropTypes from 'prop-types';

export default function FilterPanel({ filters, onChange, onReset }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const activeFiltersCount = Object.values(filters).filter(v =>
    v !== '' && v !== null && v !== undefined && v !== 'all'
  ).length;

  return (
    <div className="card mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Filters</h3>
          {activeFiltersCount > 0 && (
            <span className="badge badge-primary">{activeFiltersCount} active</span>
          )}
        </div>
        <div className="flex gap-2">
          {activeFiltersCount > 0 && (
            <button onClick={onReset} className="btn btn-sm btn-ghost">
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-sm btn-outline"
          >
            {isExpanded ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
          {/* Category Filter */}
          <div>
            <label className="label">Category</label>
            <select
              value={filters.category || 'all'}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input"
            >
              <option value="all">All Categories</option>
              <option value="cooked">Cooked Food</option>
              <option value="raw">Raw Ingredients</option>
              <option value="packaged">Packaged Food</option>
              <option value="bakery">Bakery Items</option>
            </select>
          </div>

          {/* Dietary Filter */}
          <div>
            <label className="label">Dietary</label>
            <select
              value={filters.dietary || 'all'}
              onChange={(e) => handleFilterChange('dietary', e.target.value)}
              className="input"
            >
              <option value="all">All Types</option>
              <option value="veg">Vegetarian Only</option>
              <option value="nonveg">Non-Vegetarian</option>
              <option value="halal">Halal</option>
            </select>
          </div>

          {/* Servings Filter */}
          <div>
            <label className="label">Min Servings</label>
            <input
              type="number"
              placeholder="e.g., 10"
              value={filters.minServings || ''}
              onChange={(e) => handleFilterChange('minServings', e.target.value)}
              className="input"
              min="1"
            />
          </div>

          {/* Max Distance Filter */}
          <div>
            <label className="label">Max Distance (km)</label>
            <input
              type="number"
              placeholder="e.g., 5"
              value={filters.maxDistance || ''}
              onChange={(e) => handleFilterChange('maxDistance', e.target.value)}
              className="input"
              min="1"
              step="0.5"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="label">Sort By</label>
            <select
              value={filters.sortBy || 'distance'}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="input"
            >
              <option value="distance">Distance (Near to Far)</option>
              <option value="servings_desc">Servings (High to Low)</option>
              <option value="servings_asc">Servings (Low to High)</option>
              <option value="created_desc">Newest First</option>
              <option value="created_asc">Oldest First</option>
              <option value="expires_soon">Expires Soon</option>
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="label">Pickup Time</label>
            <select
              value={filters.availability || 'all'}
              onChange={(e) => handleFilterChange('availability', e.target.value)}
              className="input"
            >
              <option value="all">Any Time</option>
              <option value="today">Available Today</option>
              <option value="tomorrow">Available Tomorrow</option>
              <option value="urgent">Urgent (Expires in 2hrs)</option>
            </select>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          <span className="text-sm text-gray-600">Active filters:</span>
          {filters.category && filters.category !== 'all' && (
            <span className="badge badge-outline">
              Category: {filters.category}
              <button
                onClick={() => handleFilterChange('category', 'all')}
                className="ml-1 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </span>
          )}
          {filters.dietary && filters.dietary !== 'all' && (
            <span className="badge badge-outline">
              Dietary: {filters.dietary}
              <button
                onClick={() => handleFilterChange('dietary', 'all')}
                className="ml-1 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </span>
          )}
          {filters.minServings && (
            <span className="badge badge-outline">
              Min Servings: {filters.minServings}
              <button
                onClick={() => handleFilterChange('minServings', '')}
                className="ml-1 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </span>
          )}
          {filters.maxDistance && (
            <span className="badge badge-outline">
              Max Distance: {filters.maxDistance}km
              <button
                onClick={() => handleFilterChange('maxDistance', '')}
                className="ml-1 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </span>
          )}
          {filters.availability && filters.availability !== 'all' && (
            <span className="badge badge-outline">
              Pickup: {filters.availability}
              <button
                onClick={() => handleFilterChange('availability', 'all')}
                className="ml-1 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

FilterPanel.propTypes = {
  filters: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};