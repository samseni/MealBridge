const pool = require('../config/db');

exports.getPendingVerifications = async (req, res, next) => {
  try {
    const query = `
      SELECT id, name, email, org_name, phone, role, verification, created_at
      FROM users
      WHERE role = 'ngo' AND verification = 'pending'
      ORDER BY created_at ASC
    `;

    const result = await pool.query(query);

    res.json({ verifications: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.verifyUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE users SET verification = $1 WHERE id = $2 AND role = $3 RETURNING id, name, email, verification',
      [status, userId, 'ngo']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'NGO not found' });
    }

    // Create notification
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, 'verification_update', 'Verification Status Update', $2)`,
      [userId, `Your verification has been ${status}`]
    );

    res.json({
      message: `NGO ${status} successfully`,
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'donor') as total_donors,
        (SELECT COUNT(*) FROM users WHERE role = 'ngo' AND verification = 'approved') as verified_ngos,
        (SELECT COUNT(*) FROM food_listings) as total_listings,
        (SELECT COUNT(*) FROM claims WHERE completed_at IS NOT NULL) as completed_claims,
        (SELECT COALESCE(SUM(servings), 0) FROM food_listings WHERE status = 'completed') as total_meals_saved
    `;

    const result = await pool.query(statsQuery);

    res.json({ stats: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { role, limit = 50 } = req.query;

    let query = 'SELECT id, name, email, role, org_name, verification, avg_rating, created_at FROM users';
    const params = [];

    if (role) {
      query += ' WHERE role = $1';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({ users: result.rows });
  } catch (error) {
    next(error);
  }
};