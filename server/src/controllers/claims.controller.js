const pool = require('../config/db');
const emailService = require('../utils/email.service');

exports.createClaim = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { listingId } = req.params;

    await client.query('BEGIN');

    // Lock the listing row
    const lockQuery = 'SELECT * FROM food_listings WHERE id = $1 FOR UPDATE';
    const lockResult = await client.query(lockQuery, [listingId]);

    if (lockResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Listing not found' });
    }

    const listing = lockResult.rows[0];

    if (listing.status !== 'available') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Listing is not available' });
    }

    // Check if NGO is verified
    const ngoQuery = 'SELECT verification FROM users WHERE id = $1';
    const ngoResult = await client.query(ngoQuery, [req.user.id]);

    if (ngoResult.rows[0].verification !== 'approved') {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'NGO not verified' });
    }

    // Update listing status
    await client.query(
      'UPDATE food_listings SET status = $1 WHERE id = $2',
      ['claimed', listingId]
    );

    // Create claim
    const claimQuery = `
      INSERT INTO claims (listing_id, ngo_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    const claimResult = await client.query(claimQuery, [listingId, req.user.id]);

    // Get donor details for email
    const donorQuery = 'SELECT name, email, email_verified FROM users WHERE id = $1';
    const donorResult = await client.query(donorQuery, [listing.donor_id]);
    const donor = donorResult.rows[0];

    // Notify donor
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, 'listing_claimed', 'Listing Claimed', 'Your listing has been claimed by an NGO', $2)`,
      [listing.donor_id, JSON.stringify({ listing_id: listingId, claim_id: claimResult.rows[0].id })]
    );

    // Emit socket event to donor
    const io = req.app.get('io');
    io.to(`user:${listing.donor_id}`).emit('listing:claimed', {
      listingId,
      claimId: claimResult.rows[0].id,
      ngo: {
        name: req.user.name
      }
    });

    await client.query('COMMIT');

    // Send email notification to donor
    if (donor.email_verified) {
      const listingData = {
        id: listingId,
        title: listing.title
      };
      emailService.sendClaimStatusUpdate(
        donor.email,
        donor.name,
        listingData,
        'claimed',
        req.user.org_name || req.user.name
      ).catch(err => console.error('Failed to send claim email:', err.message));
    }

    res.status(201).json({
      message: 'Listing claimed successfully',
      claim: claimResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Listing already claimed' });
    }
    next(error);
  } finally {
    client.release();
  }
};

exports.getMyClaims = async (req, res, next) => {
  try {
    const query = `
      SELECT c.*, l.title, l.servings, l.address, l.pickup_start, l.pickup_end, l.status as listing_status,
             u.name as donor_name, u.phone as donor_phone,
             ST_Y(l.location::geometry) as lat, ST_X(l.location::geometry) as lng,
             r.score as rating_score, r.comment as rating_comment
      FROM claims c
      JOIN food_listings l ON c.listing_id = l.id
      JOIN users u ON l.donor_id = u.id
      LEFT JOIN ratings r ON c.id = r.claim_id AND r.ratee_id = $1
      WHERE c.ngo_id = $1
      ORDER BY c.claimed_at DESC
    `;

    const result = await pool.query(query, [req.user.id]);

    res.json({ claims: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.markInTransit = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE claims SET picked_up_at = NOW() WHERE id = $1 AND ngo_id = $2 AND picked_up_at IS NULL RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Claim not found or already in transit' });
    }

    res.json({
      message: 'Claim marked as in transit',
      claim: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.markCompleted = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Get claim details
    const claimQuery = `
      SELECT c.*, l.donor_id, l.title, u.name as ngo_name, u.email as ngo_email, u.email_verified
      FROM claims c
      JOIN food_listings l ON c.listing_id = l.id
      JOIN users u ON c.ngo_id = u.id
      WHERE c.id = $1
    `;
    const claimResult = await client.query(claimQuery, [id]);

    if (claimResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Claim not found' });
    }

    const claim = claimResult.rows[0];

    // Verify that the requester is the donor
    if (claim.donor_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Only the donor can mark claim as completed' });
    }

    // Update claim
    await client.query(
      'UPDATE claims SET completed_at = NOW() WHERE id = $1',
      [id]
    );

    // Update listing
    await client.query(
      'UPDATE food_listings SET status = $1 WHERE id = $2',
      ['completed', claim.listing_id]
    );

    await client.query('COMMIT');

    // Send email notification to NGO
    if (claim.email_verified) {
      const listingData = {
        id: claim.listing_id,
        title: claim.title
      };
      emailService.sendClaimStatusUpdate(
        claim.ngo_email,
        claim.ngo_name,
        listingData,
        'completed'
      ).catch(err => console.error('Failed to send completion email:', err.message));
    }

    res.json({ message: 'Claim marked as completed' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

exports.cancelClaim = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await client.query('BEGIN');

    const claimResult = await client.query(
      `SELECT c.*, l.title, l.donor_id, u.name as donor_name, u.email as donor_email, u.email_verified
       FROM claims c
       JOIN food_listings l ON c.listing_id = l.id
       JOIN users u ON l.donor_id = u.id
       WHERE c.id = $1 AND c.ngo_id = $2`,
      [id, req.user.id]
    );

    if (claimResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Claim not found' });
    }

    const claim = claimResult.rows[0];

    // Update claim
    await client.query(
      'UPDATE claims SET cancelled_at = NOW(), cancel_reason = $1 WHERE id = $2',
      [reason, id]
    );

    // Make listing available again
    await client.query(
      'UPDATE food_listings SET status = $1 WHERE id = $2',
      ['available', claim.listing_id]
    );

    await client.query('COMMIT');

    // Send email notification to donor
    if (claim.email_verified) {
      const listingData = {
        id: claim.listing_id,
        title: claim.title
      };
      emailService.sendClaimStatusUpdate(
        claim.donor_email,
        claim.donor_name,
        listingData,
        'cancelled',
        req.user.org_name || req.user.name
      ).catch(err => console.error('Failed to send cancellation email:', err.message));
    }

    res.json({ message: 'Claim cancelled successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};