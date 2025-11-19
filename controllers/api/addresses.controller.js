const pool = require('../../db');

exports.list = async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauth' });
  try {
    // addresses table uses full_name and line1 columns; return aliases for frontend compatibility
    const r = await pool.query("SELECT id, full_name AS full_name, full_name AS name, phone, line1 AS address, line1 AS line1, city, is_default FROM addresses WHERE user_id=$1 ORDER BY id DESC", [user.id]);
    return res.json({ ok: true, addresses: r.rows });
  } catch (e) {
    console.error('api.addresses.list', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.create = async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauth' });
  const { name, full_name, phone, address, line1, city, is_default } = req.body;
  try {
    const fullNameVal = full_name || name || null;
    const line1Val = line1 || address || null;
    const r = await pool.query('INSERT INTO addresses (user_id, full_name, phone, line1, city, is_default) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id', [user.id, fullNameVal, phone||null, line1Val, city||null, !!is_default]);
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
  const { name, full_name, phone, address, line1, city, is_default } = req.body;
  if (!id) return res.status(400).json({ error: 'missing' });
  try {
    const fullNameVal = full_name || name || null;
    const line1Val = line1 || address || null;
    await pool.query('UPDATE addresses SET full_name=$1, phone=$2, line1=$3, city=$4, is_default=$5 WHERE id=$6 AND user_id=$7', [fullNameVal, phone||null, line1Val, city||null, !!is_default, id, user.id]);
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
    // Prevent deleting an address that is referenced by orders (FK constraint)
    const or = await pool.query('SELECT 1 FROM orders WHERE address_id=$1 LIMIT 1', [id]);
    if (or.rows.length) {
      return res.status(400).json({ error: 'address_in_use' });
    }
    await pool.query('DELETE FROM addresses WHERE id=$1 AND user_id=$2', [id, user.id]);
    return res.json({ ok: true });
  } catch (e) {
    // Handle FK violation just in case (code 23503)
    if (e && e.code === '23503') {
      return res.status(400).json({ error: 'address_in_use' });
    }
    console.error('api.addresses.remove', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};
