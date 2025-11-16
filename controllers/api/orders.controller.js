const pool = require('../../db');
const paypal = require('../../controllers/paypal.client') || null;
// reuse web controller flows for creation
const webOrderCtrl = require('../order.controller');

// Create order API: delegates to existing web flows depending on payment method
exports.create = async (req, res, next) => {
  // expects body: { payment_method: 'paypal'|'vietqr'|'cod', address_id, ship_method }
  const method = (req.body && req.body.payment_method) ? String(req.body.payment_method).toLowerCase() : 'paypal';
  try {
    if (method === 'paypal') return webOrderCtrl.createOrder(req, res, next);
    if (method === 'vietqr') return webOrderCtrl.qrStart(req, res, next);
    if (method === 'cod') return webOrderCtrl.codCreate(req, res, next);
    return res.status(400).json({ error: 'invalid_method' });
  } catch (e) {
    console.error('api.orders.create', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

// Capture PayPal order via API (client posts token and address info)
exports.capture = async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauth' });
  const token = (req.body && req.body.token) ? String(req.body.token) : null;
  if (!token) return res.status(400).json({ error: 'missing_token' });

  const address_id = req.body.address_id ? parseInt(req.body.address_id, 10) : null;
  const ship_method = (req.body.ship_method === 'express') ? 'express' : 'standard';

  try {
    const RequestClass = paypal.paypal.orders.OrdersCaptureRequest;
    const request = new RequestClass(token);
    request.requestBody({});
    const capture = await paypal.client.execute(request);

    // proceed to create order in DB similar to web capture
    const user_id = user.id;
    const rows = await pool.query(
      `SELECT products.id, products.price, products.stock, cart.quantity FROM cart JOIN products ON products.id=cart.product_id WHERE cart.user_id=$1`,
      [user_id]
    );

    const clientDb = await pool.connect();
    try {
      await clientDb.query('BEGIN');
      for (const it of rows.rows) {
        const s = parseInt(it.stock,10) || 0;
        if (s < it.quantity) {
          await clientDb.query('ROLLBACK');
          return res.status(400).json({ error: 'out_of_stock', product_id: it.id });
        }
      }

      const itemsTotal = rows.rows.reduce((s,row) => s + parseFloat(row.price) * row.quantity, 0);
      const ship_fee = (ship_method === 'express') ? 5.00 : 2.00;
      const grandTotal = (itemsTotal + ship_fee).toFixed(2);

      const orderInsert = await clientDb.query(
        'INSERT INTO orders(user_id, total, payment_method, status, address_id, ship_method, shipping_fee) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',
        [user_id, grandTotal, 'paypal', 'paid', address_id, ship_method, ship_fee]
      );
      const orderId = orderInsert.rows[0].id;

      for (const it of rows.rows) {
        await clientDb.query('INSERT INTO order_items(order_id, product_id, quantity, price) VALUES($1,$2,$3,$4)', [orderId, it.id, it.quantity, it.price]);
        await clientDb.query('UPDATE products SET stock = stock - $1 WHERE id=$2', [it.quantity, it.id]);
      }

      await clientDb.query('DELETE FROM cart WHERE user_id=$1', [user_id]);
      await clientDb.query('COMMIT');

      return res.json({ ok: true, orderId });
    } catch (e) {
      try { await clientDb.query('ROLLBACK'); } catch(e){}
      console.error('api.orders.capture db error', e.message || e);
      return res.status(500).json({ error: 'server_error' });
    } finally {
      clientDb.release();
    }
  } catch (err) {
    console.error('api.orders.capture paypal error', err && (err.message || err));
    return res.status(500).json({ error: 'paypal_capture_failed' });
  }
};

// List orders for current user
exports.list = async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauth' });
  try {
    const r = await pool.query('SELECT id, total, status, created_at, cancelled_at FROM orders WHERE user_id=$1 ORDER BY id DESC LIMIT 200', [user.id]);
    return res.json({ ok: true, orders: r.rows });
  } catch (e) {
    console.error('api.orders.list', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

// Get order detail (user or admin)
exports.view = async (req, res) => {
  const user = req.user;
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'missing' });
  try {
    const r = await pool.query('SELECT * FROM orders WHERE id=$1 LIMIT 1', [id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not_found' });
    const order = r.rows[0];
    if (order.user_id !== user.id && user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    const items = await pool.query('SELECT oi.*, p.name, p.price FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=$1', [id]);
    return res.json({ ok: true, order, items: items.rows });
  } catch (e) {
    console.error('api.orders.view', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

// Cancel order (user)
exports.cancel = async (req, res) => {
  const user = req.user;
  const id = parseInt(req.params.id, 10);
  const { reason } = req.body;
  if (!id) return res.status(400).json({ error: 'missing' });
  try {
    const r = await pool.query('SELECT id, status, user_id FROM orders WHERE id=$1 LIMIT 1', [id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not_found' });
    const order = r.rows[0];
    if (order.user_id !== user.id && user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    // Only allow cancel if not shipped/delivered
    if (order.status === 'shipped' || order.status === 'delivered') {
      // mark for cancellation request
      await pool.query('UPDATE orders SET cancellation_reason=$1 WHERE id=$2', [reason||null, id]);
      return res.json({ ok: true, requested: true });
    }
    await pool.query('UPDATE orders SET status=$1, cancelled_at=now(), cancellation_reason=$2 WHERE id=$3', ['cancelled', reason||null, id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error('api.orders.cancel', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

// Admin: list all orders
exports.adminList = async (req, res) => {
  try {
    const r = await pool.query('SELECT id, user_id, total, status, created_at FROM orders ORDER BY id DESC LIMIT 500');
    return res.json({ ok: true, orders: r.rows });
  } catch (e) {
    console.error('api.orders.adminList', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

// Admin: update order status
exports.adminUpdate = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body;
  if (!id || !status) return res.status(400).json({ error: 'missing' });
  try {
    await pool.query('UPDATE orders SET status=$1 WHERE id=$2', [status, id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error('api.orders.adminUpdate', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};
