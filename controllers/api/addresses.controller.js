const pool = require('../../db');

exports.list = async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauth' });
  try {
    const r = await pool.query('SELECT id, name, phone, address, city, is_default FROM addresses WHERE user_id=$1 ORDER BY id DESC', [user.id]);
    return res.json({ ok: true, addresses: r.rows });
  } catch (e) {
    console.error('api.addresses.list', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.create = async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauth' });
  const { name, phone, address, city, is_default } = req.body;
  try {
    const r = await pool.query('INSERT INTO addresses (user_id, name, phone, address, city, is_default) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id', [user.id, name||null, phone||null, address||null, city||null, !!is_default]);
    if (is_default) {
      await pool.query('UPDATE addresses SET is_default=false WHERE user_id=$1 AND id<>$2', [user.id, r.rows[0].id]);
    }
    return res.status(201).json({ ok: true, id: r.rows[0].id });
  } catch (e) {
    console.error('api.addresses.create', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.update = async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauth' });
  const id = parseInt(req.params.id, 10);
  const { name, phone, address, city, is_default } = req.body;
  if (!id) return res.status(400).json({ error: 'missing' });
  try {
    await pool.query('UPDATE addresses SET name=$1, phone=$2, address=$3, city=$4, is_default=$5 WHERE id=$6 AND user_id=$7', [name||null, phone||null, address||null, city||null, !!is_default, id, user.id]);
    if (is_default) {
      await pool.query('UPDATE addresses SET is_default=false WHERE user_id=$1 AND id<>$2', [user.id, id]);
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error('api.addresses.update', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.remove = async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauth' });
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'missing' });
  try {
    await pool.query('DELETE FROM addresses WHERE id=$1 AND user_id=$2', [id, user.id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error('api.addresses.remove', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};
