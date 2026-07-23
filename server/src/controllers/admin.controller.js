const pool = require('../config/db');

// Get all users with filters
exports.getAllUsers = async (req, res) => {
  try {
    const { role, verification, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        id, name, email, phone, role, org_name, verification,
        ST_X(location::geometry) as lng,
        ST_Y(location::geometry) as lat,
        address, avg_rating, created_at
      FROM users
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (role) {
      query += ` AND role = $${paramCount++}`;
      params.push(role);
    }

    if (verification) {
      query += ` AND verification = $${paramCount++}`;
      params.push(verification);
    }

    if (search) {
      query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR org_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
    const countParams = [];
    let countParamCount = 1;

    if (role) {
      countQuery += ` AND role = $${countParamCount++}`;
      countParams.push(role);
    }

    if (verification) {
      countQuery += ` AND verification = $${countParamCount++}`;
      countParams.push(verification);
    }

    if (search) {
      countQuery += ` AND (name ILIKE $${countParamCount} OR email ILIKE $${countParamCount} OR org_name ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get pending NGO verifications
exports.getPendingVerifications = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id, name, email, phone, org_name,
        ST_X(location::geometry) as lng,
        ST_Y(location::geometry) as lat,
        address, created_at
      FROM users
      WHERE role = 'ngo' AND verification = 'pending'
      ORDER BY created_at ASC
    `);

    res.json({ ngos: result.rows });
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve NGO verification
exports.approveNGO = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE users 
       SET verification = 'approved', updated_at = NOW()
       WHERE id = $1 AND role = 'ngo' AND verification = 'pending'
       RETURNING id, name, org_name, email`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'NGO not found or already processed' });
    }

    res.json({
      message: 'NGO approved successfully',
      ngo: result.rows[0]
    });
  } catch (error) {
    console.error('Approve NGO error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject NGO verification
exports.rejectNGO = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE users 
       SET verification = 'rejected', updated_at = NOW()
       WHERE id = $1 AND role = 'ngo' AND verification = 'pending'
       RETURNING id, name, org_name, email`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'NGO not found or already processed' });
    }

    res.json({
      message: 'NGO rejected',
      ngo: result.rows[0]
    });
  } catch (error) {
    console.error('Reject NGO error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get platform statistics
exports.getPlatformStats = async (req, res) => {
  try {
    // User statistics
    const userStats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE role = 'donor') as total_donors,
        COUNT(*) FILTER (WHERE role = 'ngo') as total_ngos,
        COUNT(*) FILTER (WHERE role = 'ngo' AND verification = 'pending') as pending_verifications,
        COUNT(*) FILTER (WHERE role = 'ngo' AND verification = 'approved') as approved_ngos,
        COUNT(*) as total_users
      FROM users
    `);

    // Listing statistics
    const listingStats = await pool.query(`
      SELECT
        COUNT(*) as total_listings,
        COUNT(*) FILTER (WHERE status = 'available') as available_listings,
        COUNT(*) FILTER (WHERE status = 'claimed') as claimed_listings,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_listings,
        COALESCE(SUM(servings), 0) as total_servings,
        COALESCE(SUM(servings) FILTER (WHERE status = 'completed'), 0) as servings_distributed
      FROM food_listings
    `);

    // Claim statistics
    const claimStats = await pool.query(`
      SELECT
        COUNT(*) as total_claims,
        COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed_claims,
        COUNT(*) FILTER (WHERE cancelled_at IS NOT NULL) as cancelled_claims,
        COUNT(*) FILTER (WHERE picked_up_at IS NOT NULL AND completed_at IS NULL) as in_transit_claims
      FROM claims
    `);

    // Recent activity (last 7 days)
    const recentStats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7d,
        (SELECT COUNT(*) FROM food_listings WHERE created_at > NOW() - INTERVAL '7 days') as new_listings_7d,
        (SELECT COUNT(*) FROM claims WHERE claimed_at > NOW() - INTERVAL '7 days') as new_claims_7d
    `);

    // Monthly trends (last 6 months)
    const monthlyTrends = await pool.query(`
      SELECT
        TO_CHAR(month, 'YYYY-MM') as month,
        COALESCE(listings_count, 0) as listings_count,
        COALESCE(claims_count, 0) as claims_count,
        COALESCE(servings_count, 0) as servings_count
      FROM (
        SELECT generate_series(
          date_trunc('month', NOW() - INTERVAL '5 months'),
          date_trunc('month', NOW()),
          '1 month'::interval
        ) as month
      ) months
      LEFT JOIN (
        SELECT
          date_trunc('month', created_at) as month,
          COUNT(*) as listings_count,
          SUM(servings) as servings_count
        FROM food_listings
        WHERE created_at > NOW() - INTERVAL '6 months'
        GROUP BY date_trunc('month', created_at)
      ) listings ON months.month = listings.month
      LEFT JOIN (
        SELECT
          date_trunc('month', claimed_at) as month,
          COUNT(*) as claims_count
        FROM claims
        WHERE claimed_at > NOW() - INTERVAL '6 months'
        GROUP BY date_trunc('month', claimed_at)
      ) claims ON months.month = claims.month
      ORDER BY month DESC
    `);

    res.json({
      users: userStats.rows[0],
      listings: listingStats.rows[0],
      claims: claimStats.rows[0],
      recent: recentStats.rows[0],
      monthlyTrends: monthlyTrends.rows
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle user status (suspend/activate)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    // Note: This requires adding an 'active' column to users table
    // For now, we'll return a placeholder response
    res.status(501).json({
      message: 'User status toggle not yet implemented - requires database migration'
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists and is not an admin
    const userCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userCheck.rows[0].role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    // Delete user (cascade will handle related records)
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get recent activity
exports.getRecentActivity = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent registrations
    const recentUsers = await pool.query(`
      SELECT
        id, name, email, role, org_name, verification, created_at,
        'registration' as activity_type
      FROM users
      ORDER BY created_at DESC
      LIMIT $1
    `, [Math.floor(limit / 3)]);

    // Get recent listings
    const recentListings = await pool.query(`
      SELECT
        fl.id, fl.title, fl.servings, fl.status, fl.created_at,
        u.name as donor_name,
        'listing' as activity_type
      FROM food_listings fl
      JOIN users u ON fl.donor_id = u.id
      ORDER BY fl.created_at DESC
      LIMIT $1
    `, [Math.floor(limit / 3)]);

    // Get recent claims
    const recentClaims = await pool.query(`
      SELECT
        c.id, c.claimed_at,
        fl.title,
        donor.name as donor_name,
        ngo.name as ngo_name, ngo.org_name,
        'claim' as activity_type
      FROM claims c
      JOIN food_listings fl ON c.listing_id = fl.id
      JOIN users donor ON fl.donor_id = donor.id
      JOIN users ngo ON c.ngo_id = ngo.id
      ORDER BY c.claimed_at DESC
      LIMIT $1
    `, [Math.floor(limit / 3)]);

    // Combine and sort all activities
    const allActivities = [
      ...recentUsers.rows,
      ...recentListings.rows,
      ...recentClaims.rows
    ].sort((a, b) => {
      const dateA = a.created_at || a.claimed_at;
      const dateB = b.created_at || b.claimed_at;
      return new Date(dateB) - new Date(dateA);
    }).slice(0, limit);

    res.json({ activities: allActivities });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
