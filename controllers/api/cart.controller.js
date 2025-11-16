const pool = require('../../db');

// Helper: get or create cart by user id (simple session-less cart stored in DB by user)
exports.get = async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauth' });
  try {
    const r = await pool.query('SELECT id FROM cart WHERE user_id=$1 LIMIT 1', [user.id]);
    let cartId;
    if (!r.rows.length) {
      const ins = await pool.query('INSERT INTO cart (user_id) VALUES ($1) RETURNING id', [user.id]);
      cartId = ins.rows[0].id;
    } else cartId = r.rows[0].id;

    const items = await pool.query(
      `SELECT ci.id, ci.product_id, ci.qty, p.name, p.price, p.slug
       FROM cart_items ci
       LEFT JOIN products p ON p.id=ci.product_id
       WHERE ci.cart_id=$1`,
      [cartId]
    );
    return res.json({ ok: true, cartId, items: items.rows });
  } catch (e) {
    console.error('api.cart.get', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.add = async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauth' });
  const { product_id, qty } = req.body;
  if (!product_id || !qty) return res.status(400).json({ error: 'missing' });
  try {
    const r = await pool.query('SELECT id FROM cart WHERE user_id=$1 LIMIT 1', [user.id]);
    let cartId;
    if (!r.rows.length) {
      const ins = await pool.query('INSERT INTO cart (user_id) VALUES ($1) RETURNING id', [user.id]);
      cartId = ins.rows[0].id;
    } else cartId = r.rows[0].id;

    // upsert item
    await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, qty) VALUES ($1,$2,$3)
       ON CONFLICT (cart_id, product_id) DO UPDATE SET qty = cart_items.qty + EXCLUDED.qty`,
      [cartId, product_id, qty]
    );
    return exports.get(req, res);
  } catch (e) {
    console.error('api.cart.add', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.update = async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauth' });
  const { product_id, qty } = req.body;
  if (!product_id || typeof qty === 'undefined') return res.status(400).json({ error: 'missing' });
  try {
    const r = await pool.query('SELECT id FROM cart WHERE user_id=$1 LIMIT 1', [user.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'cart_not_found' });
    const cartId = r.rows[0].id;
    if (qty <= 0) {
      await pool.query('DELETE FROM cart_items WHERE cart_id=$1 AND product_id=$2', [cartId, product_id]);
    } else {
      await pool.query('UPDATE cart_items SET qty=$1 WHERE cart_id=$2 AND product_id=$3', [qty, cartId, product_id]);
    }
    return exports.get(req, res);
  } catch (e) {
    console.error('api.cart.update', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.remove = async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauth' });
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ error: 'missing' });
  try {
    const r = await pool.query('SELECT id FROM cart WHERE user_id=$1 LIMIT 1', [user.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'cart_not_found' });
    const cartId = r.rows[0].id;
    await pool.query('DELETE FROM cart_items WHERE cart_id=$1 AND product_id=$2', [cartId, product_id]);
    return exports.get(req, res);
  } catch (e) {
    console.error('api.cart.remove', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.clear = async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauth' });
  try {
    const r = await pool.query('SELECT id FROM cart WHERE user_id=$1 LIMIT 1', [user.id]);
    if (r.rows.length) {
      const cartId = r.rows[0].id;
      await pool.query('DELETE FROM cart_items WHERE cart_id=$1', [cartId]);
    }
    return exports.get(req, res);
  } catch (e) {
    console.error('api.cart.clear', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};
