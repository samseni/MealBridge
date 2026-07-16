const pool = require('../config/db');

exports.createListing = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      title,
      description,
      category,
      is_veg,
      is_halal,
      servings,
      prepared_at,
      pickup_start,
      pickup_end,
      lat,
      lng,
      address
    } = req.body;

    if (!title || !servings || !pickup_start || !pickup_end || !lat || !lng || !address) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Calculate expiry time based on category (2 hours for cooked, 24 hours for others)
    const expiryHours = category === 'cooked' ? 2 : 24;
    const expires_at = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    await client.query('BEGIN');

    const listingQuery = `
      INSERT INTO food_listings (
        donor_id, title, description, category, is_veg, is_halal, servings,
        prepared_at, expires_at, pickup_start, pickup_end, location, address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, ST_GeogFromText('SRID=4326;POINT(${lng} ${lat})'), $12)
      RETURNING *
    `;

    const listingResult = await client.query(listingQuery, [
      req.user.id,
      title,
      description,
      category || 'cooked',
      is_veg !== undefined ? is_veg : true,
      is_halal !== undefined ? is_halal : false,
      servings,
      prepared_at || new Date(),
      expires_at,
      pickup_start,
      pickup_end,
      address
    ]);

    const listing = listingResult.rows[0];

    // Find nearby verified NGOs
    const radius = process.env.MATCH_RADIUS_METERS || 10000;
    const ngoQuery = `
      SELECT id, name, org_name, ST_Distance(location, ST_GeogFromText('SRID=4326;POINT(${lng} ${lat})')) as distance
      FROM users
      WHERE role = 'ngo'
        AND verification = 'approved'
        AND ST_DWithin(location, ST_GeogFromText('SRID=4326;POINT(${lng} ${lat})'), $1)
      ORDER BY distance ASC, avg_rating DESC
      LIMIT 50
    `;

    const ngoResult = await client.query(ngoQuery, [radius]);

    // Create notifications for nearby NGOs
    if (ngoResult.rows.length > 0) {
      const notificationValues = ngoResult.rows.map(ngo =>
        `(${ngo.id}, 'new_listing', 'New Food Available', '${title} - ${servings} servings available nearby', '{"listing_id": ${listing.id}, "distance": ${ngo.distance}}')`
      ).join(',');

      await client.query(`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES ${notificationValues}
      `);

      // Emit socket event to NGOs
      const io = req.app.get('io');
      ngoResult.rows.forEach(ngo => {
        io.to(`user:${ngo.id}`).emit('listing:new', {
          listingId: listing.id,
          title,
          servings,
          distance: Math.round(ngo.distance),
          pickup_start
        });
      });
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Listing created successfully',
      listing,
      notified_ngos: ngoResult.rows.length
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

exports.getNearbyListings = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const query = `
      SELECT l.*, u.name as donor_name, u.phone as donor_phone,
             ST_Distance(l.location, ST_GeogFromText('SRID=4326;POINT(${lng} ${lat})')) as distance
      FROM food_listings l
      JOIN users u ON l.donor_id = u.id
      WHERE l.status = 'available'
        AND l.expires_at > NOW()
        AND ST_DWithin(l.location, ST_GeogFromText('SRID=4326;POINT(${lng} ${lat})'), $1)
      ORDER BY distance ASC
    `;

    const result = await pool.query(query, [radius]);

    res.json({ listings: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getMyListings = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM food_listings WHERE donor_id = $1';
    const params = [req.user.id];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    res.json({ listings: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getListingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT l.*, u.name as donor_name, u.phone as donor_phone, u.address as donor_address,
             ST_Y(l.location::geometry) as lat, ST_X(l.location::geometry) as lng
      FROM food_listings l
      JOIN users u ON l.donor_id = u.id
      WHERE l.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ listing: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, pickup_end } = req.body;

    // Check if listing belongs to user and is not claimed
    const checkQuery = 'SELECT * FROM food_listings WHERE id = $1 AND donor_id = $2';
    const checkResult = await pool.query(checkQuery, [id, req.user.id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (checkResult.rows[0].status !== 'available') {
      return res.status(400).json({ message: 'Cannot update claimed or completed listing' });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (pickup_end) {
      updates.push(`pickup_end = $${paramCount++}`);
      values.push(pickup_end);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE food_listings SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    res.json({
      message: 'Listing updated successfully',
      listing: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE food_listings SET status = $1 WHERE id = $2 AND donor_id = $3 AND status = $4 RETURNING *',
      ['cancelled', id, req.user.id, 'available']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found or cannot be cancelled' });
    }

    res.json({ message: 'Listing cancelled successfully' });
  } catch (error) {
    next(error);
  }
};