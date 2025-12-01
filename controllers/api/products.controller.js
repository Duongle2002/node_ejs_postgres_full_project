const pool = require('../../db');
const path = require('path');
const fs = require('fs');

exports.list = async (req, res) => {
  const q = (req.query.q || '').trim();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const offset = (page - 1) * limit;
  try {
    let rows, total;
    if (q) {
      const sql = `SELECT id, slug, name, price, stock, short_description, image FROM products WHERE name ILIKE $1 OR description ILIKE $1 ORDER BY id DESC LIMIT $2 OFFSET $3`;
      const r = await pool.query(sql, [`%${q}%`, limit, offset]);
      rows = r.rows;
      const cnt = await pool.query('SELECT COUNT(*) FROM products WHERE name ILIKE $1 OR description ILIKE $1', [`%${q}%`]);
      total = parseInt(cnt.rows[0].count, 10);
    } else {
      const r = await pool.query('SELECT id, slug, name, price, stock, short_description, image FROM products ORDER BY id DESC LIMIT $1 OFFSET $2', [limit, offset]);
      rows = r.rows;
      const cnt = await pool.query('SELECT COUNT(*) FROM products');
      total = parseInt(cnt.rows[0].count, 10);
    }
    return res.json({ ok: true, products: rows, meta: { page, limit, total } });
  } catch (e) {
    console.error('api.products.list', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.view = async (req, res) => {
  const idOrSlug = req.params.id;
  try {
    let r;
    if (!isNaN(parseInt(idOrSlug, 10))) {
      r = await pool.query('SELECT id, slug, name, price, stock, description, image FROM products WHERE id=$1 LIMIT 1', [parseInt(idOrSlug, 10)]);
    } else {
      r = await pool.query('SELECT id, slug, name, price, stock, description, image FROM products WHERE slug=$1 LIMIT 1', [idOrSlug]);
    }
    if (!r.rows.length) return res.status(404).json({ error: 'not_found' });
    return res.json({ ok: true, product: r.rows[0] });
  } catch (e) {
    console.error('api.products.view', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

// Admin: create product
exports.create = async (req, res) => {
  const { slug, name, price, stock, short_description, description, image } = req.body;
  if (!name) return res.status(400).json({ error: 'missing_name' });
  try {
    const r = await pool.query(
      'INSERT INTO products (slug, name, price, stock, short_description, description, image) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [slug || null, name, price || 0, stock || 0, short_description || null, description || null, image || null]
    );
    return res.status(201).json({ ok: true, id: r.rows[0].id });
  } catch (e) {
    console.error('api.products.create', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

// Admin: update product
exports.update = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'missing' });
  const { slug, name, price, stock, short_description, description, image } = req.body;
  try {
    // remove old image file if being replaced by a new uploads path
    try {
      const cur = await pool.query('SELECT image FROM products WHERE id=$1', [id]);
      const old = cur.rows[0] && cur.rows[0].image ? cur.rows[0].image : null;
      if (old && image && old !== image && old.startsWith('/uploads/')){
        const p = path.join(__dirname, '../../public', old.replace(/^\//, ''));
        fs.unlink(p, () => {});
      }
    } catch (e) { /* ignore */ }
    await pool.query(
      'UPDATE products SET slug=$1, name=$2, price=$3, stock=$4, short_description=$5, description=$6, image=$7 WHERE id=$8',
      [slug || null, name || null, price || 0, stock || 0, short_description || null, description || null, image || null, id]
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error('api.products.update', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

// Admin: delete product
exports.remove = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'missing' });
  try {
    await pool.query('DELETE FROM products WHERE id=$1', [id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error('api.products.remove', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};
