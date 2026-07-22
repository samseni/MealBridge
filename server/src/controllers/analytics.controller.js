const pool = require('../config/db');

exports.getMyAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const analytics = {};

    if (role === 'donor') {
      // Total listings statistics
      const listingsStats = await pool.query(
        `SELECT
          COUNT(*) as total_listings,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_listings,
          COUNT(CASE WHEN status = 'claimed' THEN 1 END) as active_claims,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_listings,
          SUM(CASE WHEN status = 'completed' THEN servings ELSE 0 END) as total_servings_donated
        FROM food_listings
        WHERE donor_id = $1`,
        [userId]
      );

      // Monthly statistics (last 6 months)
      const monthlyStats = await pool.query(
        `SELECT
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as listings_count,
          SUM(servings) as servings_count
        FROM food_listings
        WHERE donor_id = $1
          AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC`,
        [userId]
      );

      // Average rating received
      const ratingStats = await pool.query(
        `SELECT
          ROUND(AVG(score)::numeric, 1) as avg_rating,
          COUNT(*) as total_ratings
        FROM ratings
        WHERE ratee_id = $1`,
        [userId]
      );

      // Recent activity
      const recentActivity = await pool.query(
        `SELECT
          l.id, l.title, l.servings, l.status, l.created_at,
          c.claimed_at, c.completed_at,
          u.name as ngo_name, u.org_name as ngo_org_name
        FROM food_listings l
        LEFT JOIN claims c ON l.id = c.listing_id
        LEFT JOIN users u ON c.ngo_id = u.id
        WHERE l.donor_id = $1
        ORDER BY l.created_at DESC
        LIMIT 10`,
        [userId]
      );

      analytics.summary = listingsStats.rows[0];
      analytics.monthlyStats = monthlyStats.rows;
      analytics.ratingStats = ratingStats.rows[0];
      analytics.recentActivity = recentActivity.rows;
      analytics.role = 'donor';

    } else if (role === 'ngo') {
      // Total claims statistics
      const claimsStats = await pool.query(
        `SELECT
          COUNT(*) as total_claims,
          COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_claims,
          COUNT(CASE WHEN cancelled_at IS NOT NULL THEN 1 END) as cancelled_claims,
          COUNT(CASE WHEN picked_up_at IS NULL AND completed_at IS NULL AND cancelled_at IS NULL THEN 1 END) as pending_pickup
        FROM claims
        WHERE ngo_id = $1`,
        [userId]
      );

      // Total servings received
      const servingsStats = await pool.query(
        `SELECT
          SUM(l.servings) as total_servings_received
        FROM claims c
        JOIN food_listings l ON c.listing_id = l.id
        WHERE c.ngo_id = $1 AND c.completed_at IS NOT NULL`,
        [userId]
      );

      // Monthly statistics (last 6 months)
      const monthlyStats = await pool.query(
        `SELECT
          DATE_TRUNC('month', c.claimed_at) as month,
          COUNT(*) as claims_count,
          SUM(l.servings) as servings_count
        FROM claims c
        JOIN food_listings l ON c.listing_id = l.id
        WHERE c.ngo_id = $1
          AND c.claimed_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', c.claimed_at)
        ORDER BY month DESC`,
        [userId]
      );

      // Average rating received
      const ratingStats = await pool.query(
        `SELECT
          ROUND(AVG(score)::numeric, 1) as avg_rating,
          COUNT(*) as total_ratings
        FROM ratings
        WHERE ratee_id = $1`,
        [userId]
      );

      // Recent activity
      const recentActivity = await pool.query(
        `SELECT
          c.id as claim_id, c.claimed_at, c.picked_up_at, c.completed_at, c.cancelled_at,
          l.id as listing_id, l.title, l.servings, l.address, l.pickup_start,
          u.name as donor_name
        FROM claims c
        JOIN food_listings l ON c.listing_id = l.id
        JOIN users u ON l.donor_id = u.id
        WHERE c.ngo_id = $1
        ORDER BY c.claimed_at DESC
        LIMIT 10`,
        [userId]
      );

      analytics.summary = {
        ...claimsStats.rows[0],
        total_servings_received: servingsStats.rows[0].total_servings_received || 0
      };
      analytics.monthlyStats = monthlyStats.rows;
      analytics.ratingStats = ratingStats.rows[0];
      analytics.recentActivity = recentActivity.rows;
      analytics.role = 'ngo';
    }

    res.json({ analytics });
  } catch (error) {
    next(error);
  }
};