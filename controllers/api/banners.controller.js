const pool = require('../../db');

exports.list = async (req, res) => {
  try {
    const r = await pool.query('SELECT id, title, subtitle, image_url, link, type, accent, priority FROM banners ORDER BY priority DESC, id DESC');
    return res.json({ ok: true, banners: r.rows });
  } catch (e) {
    console.error('api.banners.list', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

// Admin create
exports.create = async (req, res) => {
  const { title, subtitle, image_url, link, type, accent, priority } = req.body;
  try {
    const r = await pool.query('INSERT INTO banners (title, subtitle, image_url, link, type, accent, priority) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id', [title||null, subtitle||null, image_url||null, link||null, type||'promo', accent||null, priority||0]);
    return res.status(201).json({ ok: true, id: r.rows[0].id });
  } catch (e) {
    console.error('api.banners.create', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.update = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { title, subtitle, image_url, link, type, accent, priority } = req.body;
  if (!id) return res.status(400).json({ error: 'missing' });
  try {
    await pool.query('UPDATE banners SET title=$1, subtitle=$2, image_url=$3, link=$4, type=$5, accent=$6, priority=$7 WHERE id=$8', [title||null, subtitle||null, image_url||null, link||null, type||'promo', accent||null, priority||0, id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error('api.banners.update', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.remove = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'missing' });
  try {
    await pool.query('DELETE FROM banners WHERE id=$1', [id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error('api.banners.remove', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};
