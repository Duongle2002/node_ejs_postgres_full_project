const pool = require('../../db');

exports.me = async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauth' });
  try {
    // attempt to fetch fresh profile
    const r = await pool.query('SELECT id, name, email, role FROM users WHERE id=$1', [user.id]);
    if (r.rows.length) return res.json({ ok: true, user: r.rows[0] });
    // fallback to token info
    return res.json({ ok: true, user });
  } catch (e) {
    console.error('api.users.me', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.updateMe = async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauth' });
  const { name, email } = req.body;
  try {
    try {
      await pool.query('UPDATE users SET name=$1, email=$2 WHERE id=$3', [name || null, email || null, user.id]);
    } catch (e) {
      console.warn('updateMe ignored (users table?)', e.message || e);
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error('api.users.updateMe', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

// Admin
exports.list = async (req, res) => {
  try {
    const r = await pool.query('SELECT id, name, email, role FROM users ORDER BY id DESC LIMIT 200');
    return res.json({ ok: true, users: r.rows });
  } catch (e) {
    console.error('api.users.list', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.view = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'missing' });
  try {
    const r = await pool.query('SELECT id, name, email, role FROM users WHERE id=$1', [id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not_found' });
    return res.json({ ok: true, user: r.rows[0] });
  } catch (e) {
    console.error('api.users.view', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.update = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, email, role } = req.body;
  if (!id) return res.status(400).json({ error: 'missing' });
  try {
    await pool.query('UPDATE users SET name=$1, email=$2, role=$3 WHERE id=$4', [name || null, email || null, role || 'user', id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error('api.users.update', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.remove = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'missing' });
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error('api.users.remove', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};
