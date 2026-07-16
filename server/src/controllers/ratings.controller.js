const pool = require('../config/db');

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
    `;
    await client.query(avgQuery, [ratee_id]);

    await client.query('COMMIT');

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
      SELECT r.*, u.name as rater_name
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