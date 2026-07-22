const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const emailService = require('../utils/email.service');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, org_name, phone, address, lat, lng } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Build query based on provided fields
    let query;
    let params;

    if (lat && lng) {
      query = `
        INSERT INTO users (name, email, password_hash, role, org_name, phone, address, location)
        VALUES ($1, $2, $3, $4, $5, $6, $7, ST_GeogFromText('SRID=4326;POINT(' || $8 || ' ' || $9 || ')'))
        RETURNING id, name, email, role, org_name, phone, verification, created_at
      `;
      params = [
        name,
        email,
        password_hash,
        role,
        org_name || null,
        phone || null,
        address || null,
        lng,
        lat
      ];
    } else {
      query = `
        INSERT INTO users (name, email, password_hash, role, org_name, phone, address, location)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)
        RETURNING id, name, email, role, org_name, phone, verification, created_at
      `;
      params = [
        name,
        email,
        password_hash,
        role,
        org_name || null,
        phone || null,
        address || null
      ];
    }

    const result = await pool.query(query, params);

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    // Remove password hash from response
    delete user.password_hash;

    res.json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, org_name, phone, address, verification, avg_rating,
              ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng,
              created_at, updated_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, org_name, lat, lng } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(address);
    }
    if (org_name !== undefined && req.user.role === 'ngo') {
      updates.push(`org_name = $${paramCount++}`);
      values.push(org_name);
    }
    if (lat && lng) {
      updates.push(`location = ST_GeogFromText('SRID=4326;POINT(' || $${paramCount++} || ' ' || $${paramCount++} || ')')`);
      values.push(lng);
      values.push(lat);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(req.user.id);
    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, email, role, org_name, phone, address, verification, avg_rating, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Get current password hash
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

exports.deleteAccount = async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete user's listings
    await client.query('DELETE FROM food_listings WHERE donor_id = $1', [req.user.id]);

    // Delete user's claims
    await client.query('DELETE FROM claims WHERE ngo_id = $1', [req.user.id]);

    // Delete user's ratings
    await client.query('DELETE FROM ratings WHERE rater_id = $1 OR ratee_id = $1', [req.user.id]);

    // Delete user's notifications
    await client.query('DELETE FROM notifications WHERE user_id = $1', [req.user.id]);

    // Delete user account
    await client.query('DELETE FROM users WHERE id = $1', [req.user.id]);

    await client.query('COMMIT');

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email]
    );

    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0) {
      return res.json({ message: 'If an account exists with that email, a password reset link has been sent.' });
    }

    const user = userResult.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Delete any existing tokens for this user
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

    // Store reset token
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, resetToken, expiresAt]
    );

    // Send email
    await emailService.sendPasswordResetEmail(user.email, resetToken, user.name);

    res.json({ message: 'If an account exists with that email, a password reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Find valid token
    const tokenResult = await pool.query(
      `SELECT prt.*, u.email, u.name
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token = $1 AND prt.used = FALSE AND prt.expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const resetData = tokenResult.rows[0];

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password and mark token as used
    await pool.query('BEGIN');

    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, resetData.user_id]
    );

    await pool.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE id = $1',
      [resetData.id]
    );

    await pool.query('COMMIT');

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    // Find user with valid verification token
    const userResult = await pool.query(
      `SELECT id, email, name FROM users
       WHERE verification_token = $1
       AND verification_token_expires > NOW()
       AND email_verified = FALSE`,
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    const user = userResult.rows[0];

    // Update user as verified
    await pool.query(
      `UPDATE users
       SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL
       WHERE id = $1`,
      [user.id]
    );

    res.json({ message: 'Email verified successfully', user: { email: user.email, name: user.name } });
  } catch (error) {
    next(error);
  }
};

exports.resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user
    const userResult = await pool.query(
      'SELECT id, name, email, email_verified FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.json({ message: 'If an account exists with that email, a verification email has been sent.' });
    }

    const user = userResult.rows[0];

    if (user.email_verified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 86400000); // 24 hours

    // Update verification token
    await pool.query(
      'UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3',
      [verificationToken, expiresAt, user.id]
    );

    // Send verification email
    await emailService.sendEmailVerification(user.email, verificationToken, user.name);

    res.json({ message: 'If an account exists with that email, a verification email has been sent.' });
  } catch (error) {
    next(error);
  }
};