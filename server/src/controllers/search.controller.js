const pool = require('../config/db');

// Save a search
exports.saveSearch = async (req, res) => {
  try {
    const { name, filters } = req.body;
    const user_id = req.user.id;

    if (!name || !filters) {
      return res.status(400).json({ message: 'Name and filters are required' });
    }

    const result = await pool.query(
      `INSERT INTO saved_searches (user_id, name, filters)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user_id, name, JSON.stringify(filters)]
    );

    res.status(201).json({
      message: 'Search saved successfully',
      search: result.rows[0]
    });
  } catch (error) {
    console.error('Save search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get saved searches
exports.getSavedSearches = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      `SELECT id, name, filters, created_at, last_used_at
       FROM saved_searches
       WHERE user_id = $1
       ORDER BY last_used_at DESC`,
      [user_id]
    );

    res.json({ searches: result.rows });
  } catch (error) {
    console.error('Get saved searches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Use a saved search (updates last_used_at)
exports.useSavedSearch = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await pool.query(
      `UPDATE saved_searches
       SET last_used_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Saved search not found' });
    }

    res.json({ search: result.rows[0] });
  } catch (error) {
    console.error('Use saved search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete saved search
exports.deleteSavedSearch = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await pool.query(
      'DELETE FROM saved_searches WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Saved search not found' });
    }

    res.json({ message: 'Saved search deleted successfully' });
  } catch (error) {
    console.error('Delete saved search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add to search history
exports.addSearchHistory = async (req, res) => {
  try {
    const { query, filters, results_count } = req.body;
    const user_id = req.user.id;

    await pool.query(
      `INSERT INTO search_history (user_id, query, filters, results_count)
       VALUES ($1, $2, $3, $4)`,
      [user_id, query || '', JSON.stringify(filters || {}), results_count || 0]
    );

    // Keep only last 50 searches per user
    await pool.query(
      `DELETE FROM search_history
       WHERE id IN (
         SELECT id FROM search_history
         WHERE user_id = $1
         ORDER BY created_at DESC
         OFFSET 50
       )`,
      [user_id]
    );

    res.status(201).json({ message: 'Search history updated' });
  } catch (error) {
    console.error('Add search history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get search history
exports.getSearchHistory = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { limit = 20 } = req.query;

    const result = await pool.query(
      `SELECT id, query, filters, results_count, created_at
       FROM search_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [user_id, limit]
    );

    res.json({ history: result.rows });
  } catch (error) {
    console.error('Get search history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Clear search history
exports.clearSearchHistory = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      'DELETE FROM search_history WHERE user_id = $1',
      [user_id]
    );

    res.json({
      message: 'Search history cleared',
      count: result.rowCount
    });
  } catch (error) {
    console.error('Clear search history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};