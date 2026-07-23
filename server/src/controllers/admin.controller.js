const pool = require('../config/db');

// Get all users with filters
exports.getAllUsers = async (req, res) => {
  try {
    const { role, verification, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        id, name, email, phone, role, org_name, verification, active,
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
        TO_CHAR(months.month, 'YYYY-MM') as month,
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
      ORDER BY months.month DESC
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

    if (typeof active !== 'boolean') {
      return res.status(400).json({ message: 'Active status must be a boolean' });
    }

    // Check if user exists and is not an admin
    const userCheck = await pool.query(
      'SELECT role, name, email FROM users WHERE id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userCheck.rows[0].role === 'admin') {
      return res.status(403).json({ message: 'Cannot suspend admin users' });
    }

    // Update user active status
    const result = await pool.query(
      `UPDATE users
       SET active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role, active`,
      [active, id]
    );

    res.json({
      message: `User ${active ? 'activated' : 'suspended'} successfully`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Toggle user status error:', error);

    // Handle case where active column doesn't exist yet
    if (error.code === '42703') {
      return res.status(500).json({
        message: 'Database migration required. Please run: server/src/db/migrations/add_user_active_column.sql'
      });
    }

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

// Get verification requests with filters
exports.getVerificationRequests = async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT
        u.id, u.name as user_name, u.email as user_email, u.phone,
        u.org_name, u.verification as status,
        u.created_at, u.updated_at,
        vr.id as verification_id, vr.registration_number, vr.documents,
        vr.admin_note, vr.reviewed_at
      FROM users u
      LEFT JOIN verification_requests vr ON u.id = vr.user_id
      WHERE u.role = 'ngo'
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ` AND u.verification = $1`;
      params.push(status);
    }

    query += ` ORDER BY u.created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ requests: result.rows });
  } catch (error) {
    console.error('Get verification requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Review verification request (approve/reject with notes)
exports.reviewVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (!admin_note || admin_note.trim() === '') {
      return res.status(400).json({ message: 'Admin note is required' });
    }

    // Update user verification status
    const userResult = await pool.query(
      `UPDATE users
       SET verification = $1, updated_at = NOW()
       WHERE id = $2 AND role = 'ngo'
       RETURNING id, name, org_name, email, verification`,
      [status, id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'NGO not found' });
    }

    // Update or insert verification request with admin note
    await pool.query(
      `INSERT INTO verification_requests (user_id, admin_note, reviewed_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET admin_note = $2, reviewed_at = NOW(), updated_at = NOW()`,
      [id, admin_note]
    );

    res.json({
      message: `Verification ${status} successfully`,
      user: userResult.rows[0]
    });
  } catch (error) {
    console.error('Review verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get analytics with date range
exports.getAnalytics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = end_date || new Date().toISOString();

    // Total counts
    const totalCounts = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE role = 'donor') as total_donors,
        COUNT(*) FILTER (WHERE role = 'ngo') as total_ngos,
        COUNT(*) FILTER (WHERE role = 'admin') as total_admins,
        COUNT(*) FILTER (WHERE active = true) as active_users,
        COUNT(*) FILTER (WHERE role = 'ngo' AND verification = 'approved') as verified_ngos,
        COUNT(*) FILTER (WHERE role = 'ngo' AND verification = 'pending') as pending_verifications,
        COUNT(*) as total_users
      FROM users
    `);

    // Listing stats
    const listingStats = await pool.query(`
      SELECT
        COUNT(*) as total_listings,
        COUNT(*) FILTER (WHERE status = 'available') as active_listings,
        COUNT(*) FILTER (WHERE created_at >= $1 AND created_at <= $2) as listings_created,
        COALESCE(SUM(servings), 0) as total_meals,
        COALESCE(SUM(weight), 0) as total_weight
      FROM food_listings
    `, [startDate, endDate]);

    // Claim stats
    const claimStats = await pool.query(`
      SELECT
        COUNT(*) as total_claims,
        COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as successful_claims,
        COUNT(*) FILTER (WHERE claimed_at >= $1 AND claimed_at <= $2) as claims_made
      FROM claims
    `, [startDate, endDate]);

    // New users in date range
    const newUsers = await pool.query(`
      SELECT COUNT(*) as new_users
      FROM users
      WHERE created_at >= $1 AND created_at <= $2
    `, [startDate, endDate]);

    // Verification requests in date range
    const verificationRequests = await pool.query(`
      SELECT COUNT(*) as verification_requests
      FROM users
      WHERE role = 'ngo' AND created_at >= $1 AND created_at <= $2
    `, [startDate, endDate]);

    // Top donors
    const topDonors = await pool.query(`
      SELECT
        u.id, u.name, u.avg_rating,
        COUNT(fl.id) as listings_count
      FROM users u
      LEFT JOIN food_listings fl ON u.id = fl.donor_id
      WHERE u.role = 'donor'
      GROUP BY u.id, u.name, u.avg_rating
      ORDER BY listings_count DESC
      LIMIT 10
    `);

    // Top NGOs
    const topNgos = await pool.query(`
      SELECT
        u.id, u.name, u.org_name, u.avg_rating,
        COUNT(c.id) as claims_count
      FROM users u
      LEFT JOIN claims c ON u.id = c.ngo_id
      WHERE u.role = 'ngo'
      GROUP BY u.id, u.name, u.org_name, u.avg_rating
      ORDER BY claims_count DESC
      LIMIT 10
    `);

    // Calculate waste prevented (assume 1 serving = 0.5 kg)
    const wastePrevented = Math.round(listingStats.rows[0].total_meals * 0.5);

    res.json({
      ...totalCounts.rows[0],
      ...listingStats.rows[0],
      ...claimStats.rows[0],
      new_users: parseInt(newUsers.rows[0].new_users),
      verification_requests: parseInt(verificationRequests.rows[0].verification_requests),
      waste_prevented: wastePrevented,
      top_donors: topDonors.rows,
      top_ngos: topNgos.rows
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export report as CSV or PDF
exports.exportReport = async (req, res) => {
  try {
    const { start_date, end_date, format = 'csv' } = req.query;
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = end_date || new Date().toISOString();

    // Get all data for the report
    const result = await pool.query(`
      SELECT
        'Listing' as type,
        fl.id, fl.title, fl.description, fl.servings, fl.status,
        fl.created_at, fl.expires_at,
        u.name as created_by, u.email as creator_email
      FROM food_listings fl
      JOIN users u ON fl.donor_id = u.id
      WHERE fl.created_at >= $1 AND fl.created_at <= $2
      UNION ALL
      SELECT
        'Claim' as type,
        c.id::text, fl.title, NULL, fl.servings,
        CASE WHEN c.completed_at IS NOT NULL THEN 'completed' ELSE 'pending' END as status,
        c.claimed_at, c.completed_at,
        ngo.org_name, ngo.email
      FROM claims c
      JOIN food_listings fl ON c.listing_id = fl.id
      JOIN users ngo ON c.ngo_id = ngo.id
      WHERE c.claimed_at >= $1 AND c.claimed_at <= $2
      ORDER BY created_at DESC
    `, [startDate, endDate]);

    if (format === 'csv') {
      // Generate CSV
      const header = 'Type,ID,Title,Description,Servings,Status,Created At,Completed/Expired At,Created By,Email\n';
      const rows = result.rows.map(row =>
        `${row.type},${row.id},"${row.title || ''}","${row.description || ''}",${row.servings || ''},${row.status},${row.created_at},${row.expires_at || row.completed_at || ''},${row.created_by},${row.creator_email}`
      ).join('\n');

      const csv = header + rows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=mealbridge-report-${startDate}-to-${endDate}.csv`);
      res.send(csv);
    } else if (format === 'pdf') {
      // For PDF, we'll return a simple text format (in production, use a PDF library like pdfkit)
      const pdfContent = `
MealBridge Platform Report
Date Range: ${startDate} to ${endDate}
Generated: ${new Date().toISOString()}

================================================================================

Total Records: ${result.rows.length}

${result.rows.map(row => `
Type: ${row.type}
ID: ${row.id}
Title: ${row.title || 'N/A'}
Servings: ${row.servings || 'N/A'}
Status: ${row.status}
Created: ${row.created_at}
Created By: ${row.created_by} (${row.creator_email})
${row.description ? `Description: ${row.description}` : ''}
--------------------------------------------------------------------------------
`).join('\n')}

End of Report
      `;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=mealbridge-report-${startDate}-to-${endDate}.pdf`);
      res.send(pdfContent);
    } else {
      res.status(400).json({ message: 'Invalid format. Use csv or pdf' });
    }
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
