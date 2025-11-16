const pool = require('../db');

// Render user account page with profile, addresses and recent orders
exports.accountPage = async (req, res) => {
  const user_id = (req.user && req.user.id) ? req.user.id : null;
  if (!user_id) return res.redirect('/login');
  try {
    // try to load users table for extra profile fields; fallback to JWT
    let user = { id: user_id, name: req.user.name || '', email: req.user.email || '' };
    try {
      const u = await pool.query('SELECT id, name, email FROM users WHERE id=$1', [user_id]);
      if (u.rows.length) user = u.rows[0];
    } catch (e) {
      // ignore if users table doesn't exist
    }

    const addressesRes = await pool.query('SELECT id, full_name, phone, line1, line2, city, state, postal_code, country, is_default FROM addresses WHERE user_id=$1 ORDER BY is_default DESC, id DESC', [user_id]);
    const ordersRes = await pool.query('SELECT id, total, status, payment_method, created_at FROM orders WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20', [user_id]);

    return res.render('user_profile', { title: 'Tài khoản', userProfile: user, addresses: addressesRes.rows, orders: ordersRes.rows });
  } catch (e) {
    console.error('accountPage error', e);
    return res.status(500).send('Lỗi máy chủ');
  }
};

// Update basic profile (name/email)
exports.updateProfile = async (req, res) => {
  const user_id = (req.user && req.user.id) ? req.user.id : null;
  if (!user_id) return res.status(401).json({ error: 'unauth' });
  const name = (req.body.name) ? String(req.body.name).trim() : null;
  const email = (req.body.email) ? String(req.body.email).trim() : null;
  if (!name && !email) return res.status(400).json({ error: 'missing' });
  try {
    // attempt update if users table exists
    try {
      await pool.query('UPDATE users SET name=$1, email=$2 WHERE id=$3', [name, email, user_id]);
    } catch (e) {
      // if update fails (no users table), ignore and return ok
      console.warn('updateProfile ignored (users table?)', e.message || e);
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error('updateProfile error', e);
    return res.status(500).json({ error: 'server_error' });
  }
};

// Add a new address
exports.addAddress = async (req, res) => {
  const user_id = (req.user && req.user.id) ? req.user.id : null;
  if (!user_id) return res.status(401).json({ error: 'unauth' });
  const { full_name, phone, line1, line2, city, state, postal_code, country, is_default } = req.body;
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (is_default) {
        await client.query('UPDATE addresses SET is_default=false WHERE user_id=$1', [user_id]);
      }
      const ins = await client.query('INSERT INTO addresses(user_id, full_name, phone, line1, line2, city, state, postal_code, country, is_default) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id', [user_id, full_name, phone, line1, line2, city, state, postal_code, country, !!is_default]);
      await client.query('COMMIT');
      return res.json({ ok: true, id: ins.rows[0].id });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('addAddress error', e);
    return res.status(500).json({ error: 'server_error' });
  }
};

// Delete address
exports.deleteAddress = async (req, res) => {
  const user_id = (req.user && req.user.id) ? req.user.id : null;
  const id = parseInt(req.params.id, 10);
  if (!user_id) return res.status(401).json({ error: 'unauth' });
  if (!id) return res.status(400).json({ error: 'missing' });
  try {
    await pool.query('DELETE FROM addresses WHERE id=$1 AND user_id=$2', [id, user_id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error('deleteAddress error', e);
    return res.status(500).json({ error: 'server_error' });
  }
};

// Set default address
exports.setDefaultAddress = async (req, res) => {
  const user_id = (req.user && req.user.id) ? req.user.id : null;
  const id = parseInt(req.params.id, 10);
  if (!user_id) return res.status(401).json({ error: 'unauth' });
  if (!id) return res.status(400).json({ error: 'missing' });
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE addresses SET is_default=false WHERE user_id=$1', [user_id]);
      await client.query('UPDATE addresses SET is_default=true WHERE id=$1 AND user_id=$2', [id, user_id]);
      await client.query('COMMIT');
      return res.json({ ok: true });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally { client.release(); }
  } catch (e) {
    console.error('setDefaultAddress error', e);
    return res.status(500).json({ error: 'server_error' });
  }
};
