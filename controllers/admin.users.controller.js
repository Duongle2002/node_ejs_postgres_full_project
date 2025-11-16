const pool = require('../db');

exports.list = async (req, res) => {
  try {
    // attempt to read users table; if not present, show message
    let rows = [];
    try {
      // select only well-known columns; avoid assuming created_at exists
      const r = await pool.query('SELECT id, name, email, role FROM users ORDER BY id DESC');
      rows = r.rows;
    } catch (e) {
      console.warn('users table not found or query failed', e.message || e);
    }
    return res.render('admin/users', { title: 'Quản lý người dùng', users: rows, user: req.user });
  } catch (e) {
    console.error('admin.users.list error', e);
    return res.status(500).send('Lỗi máy chủ');
  }
};

exports.view = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.redirect('/admin/users');
  try {
    const r = await pool.query('SELECT id, name, email, role FROM users WHERE id=$1', [id]);
    if (!r.rows.length) return res.redirect('/admin/users');
    const u = r.rows[0];
    return res.render('admin/user_detail', { title: 'Chi tiết người dùng', u, user: req.user });
  } catch (e) {
    console.error('admin.users.view error', e);
    return res.status(500).send('Lỗi máy chủ');
  }
};

exports.update = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, email, role } = req.body;
  if (!id) return res.status(400).json({ error: 'missing' });
  try {
    try {
      await pool.query('UPDATE users SET name=$1, email=$2, role=$3 WHERE id=$4', [name || null, email || null, role || 'user', id]);
      return res.json({ ok: true });
    } catch (e) {
      console.warn('update users failed (maybe no users table)', e.message || e);
      return res.status(500).json({ error: 'update_failed' });
    }
  } catch (e) {
    console.error('admin.users.update error', e);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.remove = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'missing' });
  try {
    try {
      await pool.query('DELETE FROM users WHERE id=$1', [id]);
      return res.json({ ok: true });
    } catch (e) {
      console.warn('delete users failed', e.message || e);
      return res.status(500).json({ error: 'delete_failed' });
    }
  } catch (e) {
    console.error('admin.users.remove error', e);
    return res.status(500).json({ error: 'server_error' });
  }
};
