const pool = require('../config/db');

// Send a message in a claim
exports.sendMessage = async (req, res) => {
  try {
    const { claim_id, message } = req.body;
    const sender_id = req.user.id;

    if (!claim_id || !message || !message.trim()) {
      return res.status(400).json({ message: 'Claim ID and message are required' });
    }

    // Verify the claim exists and user is part of it
    const claimResult = await pool.query(
      `SELECT c.id, c.ngo_id, fl.donor_id
       FROM claims c
       JOIN food_listings fl ON c.listing_id = fl.id
       WHERE c.id = $1`,
      [claim_id]
    );

    if (claimResult.rows.length === 0) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    const claim = claimResult.rows[0];
    const { ngo_id, donor_id } = claim;

    // Check if user is either the donor or NGO
    if (sender_id !== donor_id && sender_id !== ngo_id) {
      return res.status(403).json({ message: 'You are not part of this claim' });
    }

    // Determine receiver
    const receiver_id = sender_id === donor_id ? ngo_id : donor_id;

    // Insert message
    const result = await pool.query(
      `INSERT INTO messages (claim_id, sender_id, receiver_id, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, claim_id, sender_id, receiver_id, message, is_read, created_at`,
      [claim_id, sender_id, receiver_id, message.trim()]
    );

    const newMessage = result.rows[0];

    // Emit socket event to receiver
    const io = req.app.get('io');
    io.to(`user:${receiver_id}`).emit('message:new', {
      ...newMessage,
      claim_id: parseInt(claim_id)
    });

    // Create notification for receiver
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, 'new_message', 'New Message', $2, $3)`,
      [receiver_id, `You have a new message about claim #${claim_id}`, JSON.stringify({ claim_id, message_id: newMessage.id })]
    );

    io.to(`user:${receiver_id}`).emit('notification:new', {
      type: 'new_message',
      title: 'New Message',
      message: `You have a new message about claim #${claim_id}`,
      claim_id
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get messages for a claim
exports.getClaimMessages = async (req, res) => {
  try {
    const { claim_id } = req.params;
    const user_id = req.user.id;

    // Verify user is part of the claim
    const claimResult = await pool.query(
      `SELECT c.id, c.ngo_id, fl.donor_id
       FROM claims c
       JOIN food_listings fl ON c.listing_id = fl.id
       WHERE c.id = $1`,
      [claim_id]
    );

    if (claimResult.rows.length === 0) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    const { ngo_id, donor_id } = claimResult.rows[0];

    if (user_id !== donor_id && user_id !== ngo_id) {
      return res.status(403).json({ message: 'You are not part of this claim' });
    }

    // Get all messages for this claim
    const result = await pool.query(
      `SELECT
        m.id, m.claim_id, m.sender_id, m.receiver_id, m.message, m.is_read, m.created_at,
        sender.name as sender_name, sender.profile_picture as sender_picture
       FROM messages m
       JOIN users sender ON m.sender_id = sender.id
       WHERE m.claim_id = $1
       ORDER BY m.created_at ASC`,
      [claim_id]
    );

    // Mark messages as read if current user is the receiver
    await pool.query(
      `UPDATE messages
       SET is_read = TRUE
       WHERE claim_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
      [claim_id, user_id]
    );

    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Get claim messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all conversations for a user
exports.getUserConversations = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get all claims where user is involved with last message
    const result = await pool.query(
      `SELECT DISTINCT ON (c.id)
        c.id as claim_id,
        fl.id as listing_id,
        fl.title as listing_title,
        c.claimed_at,
        c.completed_at,
        CASE
          WHEN fl.donor_id = $1 THEN ngo.id
          ELSE donor.id
        END as other_user_id,
        CASE
          WHEN fl.donor_id = $1 THEN ngo.name
          ELSE donor.name
        END as other_user_name,
        CASE
          WHEN fl.donor_id = $1 THEN ngo.profile_picture
          ELSE donor.profile_picture
        END as other_user_picture,
        CASE
          WHEN fl.donor_id = $1 THEN ngo.org_name
          ELSE NULL
        END as other_user_org,
        (SELECT message FROM messages WHERE claim_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE claim_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages WHERE claim_id = c.id AND receiver_id = $1 AND is_read = FALSE) as unread_count
       FROM claims c
       JOIN food_listings fl ON c.listing_id = fl.id
       JOIN users donor ON fl.donor_id = donor.id
       JOIN users ngo ON c.ngo_id = ngo.id
       WHERE fl.donor_id = $1 OR c.ngo_id = $1
       ORDER BY c.id, last_message_time DESC NULLS LAST`,
      [user_id]
    );

    res.json({ conversations: result.rows });
  } catch (error) {
    console.error('Get user conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { claim_id } = req.params;
    const user_id = req.user.id;

    await pool.query(
      `UPDATE messages
       SET is_read = TRUE
       WHERE claim_id = $1 AND receiver_id = $2`,
      [claim_id, user_id]
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};