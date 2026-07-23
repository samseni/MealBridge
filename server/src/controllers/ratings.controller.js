const pool = require('../config/db');
const emailService = require('../utils/email.service');

exports.createRating = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { claim_id, score, comment } = req.body;

    if (!claim_id || !score) {
      return res.status(400).json({ message: 'Claim ID and score are required' });
    }

    if (score < 1 || score > 5) {
      return res.status(400).json({ message: 'Score must be between 1 and 5' });
    }

    await client.query('BEGIN');

    // Get claim details
    const claimQuery = `
      SELECT c.*, l.donor_id
      FROM claims c
      JOIN food_listings l ON c.listing_id = l.id
      WHERE c.id = $1 AND c.completed_at IS NOT NULL
    `;
    const claimResult = await client.query(claimQuery, [claim_id]);

    if (claimResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Completed claim not found' });
    }

    const claim = claimResult.rows[0];

    // Determine ratee (person being rated)
    let ratee_id;
    if (req.user.id === claim.donor_id) {
      ratee_id = claim.ngo_id; // Donor rating NGO
    } else if (req.user.id === claim.ngo_id) {
      ratee_id = claim.donor_id; // NGO rating donor
    } else {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'You are not part of this claim' });
    }

    // Create rating
    const ratingQuery = `
      INSERT INTO ratings (claim_id, rater_id, ratee_id, score, comment)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const ratingResult = await client.query(ratingQuery, [
      claim_id,
      req.user.id,
      ratee_id,
      score,
      comment
    ]);

    // Update user's average rating
    const avgQuery = `
      UPDATE users
      SET avg_rating = (
        SELECT ROUND(AVG(score)::numeric, 1)
        FROM ratings
        WHERE ratee_id = $1
      )
      WHERE id = $1
      RETURNING name, email, email_verified, avg_rating
    `;
    const avgResult = await client.query(avgQuery, [ratee_id]);
    const ratee = avgResult.rows[0];

    await client.query('COMMIT');

    // Send email notification to ratee
    if (ratee.email_verified) {
      const ratingInfo = {
        score,
        comment: comment || '',
        raterName: req.user.name,
        newAvgRating: ratee.avg_rating
      };
      emailService.sendRatingNotification(
        ratee.email,
        ratee.name,
        ratingInfo
      ).catch(err => console.error('Failed to send rating email:', err.message));
    }

    res.status(201).json({
      message: 'Rating submitted successfully',
      rating: ratingResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ message: 'You have already rated this claim' });
    }
    next(error);
  } finally {
    client.release();
  }
};

exports.getReceivedRatings = async (req, res, next) => {
  try {
    const query = `
      SELECT
        r.*,
        u.name as rater_name,
        u.profile_picture as rater_picture,
        (SELECT COUNT(*) FROM rating_replies WHERE rating_id = r.id) as reply_count,
        (SELECT reply FROM rating_replies WHERE rating_id = r.id LIMIT 1) as reply
      FROM ratings r
      JOIN users u ON r.rater_id = u.id
      WHERE r.ratee_id = $1
      ORDER BY r.created_at DESC
      LIMIT 20
    `;

    const result = await pool.query(query, [req.user.id]);

    res.json({ ratings: result.rows });
  } catch (error) {
    next(error);
  }
};

// Reply to a rating
exports.replyToRating = async (req, res) => {
  try {
    const { rating_id } = req.params;
    const { reply } = req.body;
    const user_id = req.user.id;

    if (!reply || !reply.trim()) {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    // Check if user is the ratee (person being rated)
    const ratingCheck = await pool.query(
      'SELECT ratee_id FROM ratings WHERE id = $1',
      [rating_id]
    );

    if (ratingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    if (ratingCheck.rows[0].ratee_id !== user_id) {
      return res.status(403).json({ message: 'You can only reply to ratings about you' });
    }

    // Insert or update reply
    const result = await pool.query(
      `INSERT INTO rating_replies (rating_id, user_id, reply)
       VALUES ($1, $2, $3)
       ON CONFLICT (rating_id)
       DO UPDATE SET reply = $3, updated_at = NOW()
       RETURNING *`,
      [rating_id, user_id, reply.trim()]
    );

    res.json({
      message: 'Reply posted successfully',
      reply: result.rows[0]
    });
  } catch (error) {
    console.error('Reply to rating error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Report a rating
exports.reportRating = async (req, res) => {
  try {
    const { rating_id } = req.params;
    const { reason, description } = req.body;
    const reporter_id = req.user.id;

    if (!reason) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    const validReasons = ['spam', 'inappropriate', 'fake', 'offensive', 'other'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ message: 'Invalid reason' });
    }

    // Check if rating exists
    const ratingCheck = await pool.query(
      'SELECT id FROM ratings WHERE id = $1',
      [rating_id]
    );

    if (ratingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    // Insert report
    const result = await pool.query(
      `INSERT INTO rating_reports (rating_id, reporter_id, reason, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [rating_id, reporter_id, reason, description || null]
    );

    res.status(201).json({
      message: 'Rating reported successfully',
      report: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'You have already reported this rating' });
    }
    console.error('Report rating error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Vote if rating was helpful
exports.voteHelpful = async (req, res) => {
  try {
    const { rating_id } = req.params;
    const { is_helpful } = req.body;
    const user_id = req.user.id;

    if (is_helpful === undefined) {
      return res.status(400).json({ message: 'is_helpful is required' });
    }

    // Check if rating exists
    const ratingCheck = await pool.query(
      'SELECT id FROM ratings WHERE id = $1',
      [rating_id]
    );

    if (ratingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    // Insert or update vote
    const result = await pool.query(
      `INSERT INTO rating_helpful_votes (rating_id, user_id, is_helpful)
       VALUES ($1, $2, $3)
       ON CONFLICT (rating_id, user_id)
       DO UPDATE SET is_helpful = $3
       RETURNING *`,
      [rating_id, user_id, is_helpful]
    );

    // Get updated counts
    const countsResult = await pool.query(
      'SELECT helpful_count, not_helpful_count FROM ratings WHERE id = $1',
      [rating_id]
    );

    res.json({
      message: 'Vote recorded successfully',
      vote: result.rows[0],
      counts: countsResult.rows[0]
    });
  } catch (error) {
    console.error('Vote helpful error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get rating reports (Admin only)
exports.getRatingReports = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    let query = `
      SELECT
        rr.*,
        r.score, r.comment,
        rater.name as rater_name,
        ratee.name as ratee_name,
        reporter.name as reporter_name
      FROM rating_reports rr
      JOIN ratings r ON rr.rating_id = r.id
      JOIN users rater ON r.rater_id = rater.id
      JOIN users ratee ON r.ratee_id = ratee.id
      JOIN users reporter ON rr.reporter_id = reporter.id
    `;

    const params = [];
    if (status && status !== 'all') {
      query += ' WHERE rr.status = $1';
      params.push(status);
    }

    query += ' ORDER BY rr.created_at DESC LIMIT 50';

    const result = await pool.query(query, params);

    res.json({ reports: result.rows });
  } catch (error) {
    console.error('Get rating reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Resolve rating report (Admin only)
exports.resolveRatingReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, action } = req.body;

    if (!status || !['resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE rating_reports
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // If resolved and action is delete, delete the rating
    if (status === 'resolved' && action === 'delete_rating') {
      await pool.query('DELETE FROM ratings WHERE id = $1', [result.rows[0].rating_id]);
    }

    res.json({
      message: 'Report resolved successfully',
      report: result.rows[0]
    });
  } catch (error) {
    console.error('Resolve rating report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};