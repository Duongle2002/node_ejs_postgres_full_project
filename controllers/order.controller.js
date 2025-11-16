const paypal = require('@paypal/checkout-server-sdk');
const pool = require('../db');

const env = process.env.PAYPAL_MODE === 'live'
  ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
  : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);

const client = new paypal.core.PayPalHttpClient(env);
const buildVietQR = (bin, acc, amount, info, template='compact') => {
  if (!bin || !acc) return null;
  const base = `https://img.vietqr.io/image/${encodeURIComponent(bin)}-${encodeURIComponent(acc)}-qr_only.png`;
  const qs = new URLSearchParams();
  if (amount && /^\d+$/.test(String(amount))) qs.set('amount', String(amount));
  if (info) qs.set('addInfo', info);
  if (template) qs.set('template', template);
  return `${base}?${qs.toString()}`;
};

const shippingFee = (method) => {
  switch (method) {
    case 'express': return 5.00;
    case 'standard':
    default: return 2.00;
  }
};

exports.checkoutPage = async (req, res) => {
  const user_id = req.user.id;
  const r = await pool.query(
    `SELECT p.id AS product_id, p.name, p.price, p.stock, p.image, ci.qty AS quantity
     FROM cart c
     JOIN cart_items ci ON ci.cart_id = c.id
     JOIN products p ON p.id = ci.product_id
     WHERE c.user_id=$1`,
    [user_id]
  );

  const items = r.rows.map(row => ({
    product_id: row.product_id,
    name: row.name,
    image: row.image || '',
    price: parseFloat(row.price),
    quantity: row.quantity,
    stock: parseInt(row.stock,10) || 0,
    subtotal: +(parseFloat(row.price) * row.quantity).toFixed(2)
  }));
  const total = items.reduce((s,row) => s + row.subtotal, 0).toFixed(2);
  const a = await pool.query('SELECT * FROM addresses WHERE user_id=$1 ORDER BY is_default DESC, id DESC', [user_id]);
  const addresses = a.rows;
  const selectedAddressId = (addresses.find(x => x.is_default) || addresses[0] || {}).id || null;
  res.render('checkout', { title: 'Thanh toán', items, total, user: req.user || null, addresses, selectedAddressId });
};

exports.createOrder = async (req, res) => {
  const user_id = req.user.id;
  const address_id = parseInt(req.body.address_id, 10);
  const ship_method = (req.body.ship_method === 'express') ? 'express' : 'standard';
  if (!address_id || Number.isNaN(address_id)) {
    return res.status(400).json({ error: 'missing_address' });
  }
  // verify address belongs to user
  const addr = await pool.query('SELECT id FROM addresses WHERE id=$1 AND user_id=$2', [address_id, user_id]);
  if (!addr.rows.length) return res.status(400).json({ error: 'invalid_address' });
  const r = await pool.query(
    `SELECT p.id, p.price, p.stock, ci.qty AS quantity
     FROM cart c
     JOIN cart_items ci ON ci.cart_id = c.id
     JOIN products p ON p.id = ci.product_id
     WHERE c.user_id=$1`,
    [user_id]
  );
  const itemsTotal = r.rows.reduce((s,row) => s + parseFloat(row.price) * row.quantity, 0);
  const ship_fee = shippingFee(ship_method);
  const grandTotal = (itemsTotal + ship_fee).toFixed(2);

  // Check stock before creating PayPal order
  const insufficient = r.rows.find(row => (parseInt(row.stock,10)||0) < row.quantity);
  if (insufficient) {
    return res.status(400).json({ error: 'out_of_stock', product_id: insufficient.id });
  }

  const request = new paypal.orders.OrdersCreateRequest();
  // ensure PayPal redirects back to our capture endpoint after the buyer approves
  const baseUrl = req.protocol + '://' + req.get('host');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{ amount: { currency_code: 'USD', value: grandTotal } }],
    application_context: {
      return_url: baseUrl + '/order/paypal/success',
      cancel_url: baseUrl + '/checkout'
    }
  });

  try {
    const order = await client.execute(request);
    // Log PayPal create response and approval link for debugging
    try { console.log('PayPal create id=', order.result && order.result.id); } catch (e) {}
    try { const approve = (order.result && order.result.links)||[]; const a = approve.find(l=>l.rel==='approve'); if (a) console.log('PayPal approve link=', a.href); } catch(e){}
    // store selected address id in short-lived cookie for capture step
    res.cookie('checkout_address_id', address_id, { httpOnly: true, maxAge: 15 * 60 * 1000 });
    res.cookie('checkout_ship_method', ship_method, { httpOnly: true, maxAge: 15 * 60 * 1000 });
    res.json(order.result);
  } catch (err) {
    console.error('PayPal create error', err && err.message ? err.message : err);
    res.status(500).json({ error: 'PayPal error' });
  }
};

exports.capture = async (req, res) => {
  const orderID = req.query.token;
  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const capture = await client.execute(request);
    console.log('PayPal captured order token=', orderID);
    const user_id = req.user.id;
    const rows = await pool.query(
      `SELECT p.id, p.price, p.stock, ci.qty AS quantity
       FROM cart c
       JOIN cart_items ci ON ci.cart_id = c.id
       JOIN products p ON p.id = ci.product_id
       WHERE c.user_id=$1`,
      [user_id]
    );

    const clientDb = await pool.connect();
    try {
      await clientDb.query('BEGIN');

      // Re-check stock for all items inside transaction
      for (const it of rows.rows) {
        const s = parseInt(it.stock,10) || 0;
        if (s < it.quantity) {
          await clientDb.query('ROLLBACK');
          return res.send('Một số sản phẩm đã hết hàng. Vui lòng cập nhật giỏ hàng.');
        }
      }

      const itemsTotal = rows.rows.reduce((s,row) => s + parseFloat(row.price) * row.quantity, 0);
      const ship_method = (req.cookies.checkout_ship_method === 'express') ? 'express' : 'standard';
      const ship_fee = shippingFee(ship_method);
      const grandTotal = (itemsTotal + ship_fee).toFixed(2);
      const address_id = parseInt(req.cookies.checkout_address_id, 10) || null;
      const orderInsert = await clientDb.query(
        'INSERT INTO orders(user_id, total, payment_method, status, address_id, ship_method, shipping_fee) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',
        [user_id, grandTotal, 'paypal', 'processing', address_id, ship_method, ship_fee]
      );
      const orderId = orderInsert.rows[0].id;

      for (const it of rows.rows) {
        await clientDb.query('INSERT INTO order_items(order_id, product_id, quantity, price) VALUES($1,$2,$3,$4)',
          [orderId, it.id, it.quantity, it.price]);
        await clientDb.query('UPDATE products SET stock = stock - $1 WHERE id=$2', [it.quantity, it.id]);
      }

      await clientDb.query('DELETE FROM cart WHERE user_id=$1', [user_id]);
      await clientDb.query('COMMIT');

    res.clearCookie('checkout_address_id');
    res.clearCookie('checkout_ship_method');
    // redirect to success page with order id so we can display order details
    res.redirect('/order/success?orderId=' + orderId);
    } catch (e) {
      await clientDb.query('ROLLBACK');
      console.error(e);
      res.send('Thanh toán thất bại');
    } finally {
      clientDb.release();
    }
  } catch (err) {
    console.error('PayPal capture error', err && err._originalError ? err._originalError.text || err.message : err);
    res.send('Capture failed');
  }
};

// User-facing view of an order (mounted at /orders/:id)
exports.viewOrder = async (req, res) => {
  const user_id = (req.user && req.user.id) ? req.user.id : null;
  const id = parseInt(req.params.id, 10);
  if (!id || !user_id) return res.status(404).send('Không tìm thấy đơn hàng');
  try {
    const ores = await pool.query(
      `SELECT o.*, a.full_name AS addr_name, a.phone AS addr_phone, a.line1 AS addr_line1, a.line2 AS addr_line2, a.city AS addr_city, a.state AS addr_state, a.postal_code AS addr_postal_code, a.country AS addr_country
       FROM orders o LEFT JOIN addresses a ON o.address_id=a.id WHERE o.id=$1 AND o.user_id=$2`,
      [id, user_id]
    );
    if (!ores.rows.length) return res.status(404).send('Không tìm thấy đơn hàng');
    const order = ores.rows[0];
    const itemsRes = await pool.query(
      `SELECT oi.*, p.name AS product_name, p.image AS product_image FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=$1`,
      [id]
    );
    order.items = itemsRes.rows.map(r => ({ id: r.product_id, name: r.product_name, image: r.product_image, quantity: r.quantity, price: parseFloat(r.price), subtotal: +(parseFloat(r.price) * r.quantity).toFixed(2) }));
    order.address = {
      full_name: order.addr_name,
      phone: order.addr_phone,
      line1: order.addr_line1,
      line2: order.addr_line2,
      city: order.addr_city,
      state: order.addr_state,
      postal_code: order.addr_postal_code,
      country: order.addr_country
    };
    return res.render('order_detail', { order });
  } catch (e) {
    console.error('viewOrder error', e);
    return res.status(500).send('Lỗi máy chủ');
  }
};

// List orders for current user (order history)
exports.orderHistory = async (req, res) => {
  const user_id = (req.user && req.user.id) ? req.user.id : null;
  if (!user_id) return res.redirect('/login');
  try {
    const r = await pool.query('SELECT id, total, status, payment_method, created_at, cancelled_at FROM orders WHERE user_id=$1 ORDER BY created_at DESC', [user_id]);
    const orders = r.rows.map(o => ({
      id: o.id,
      total: parseFloat(o.total),
      status: o.status,
      payment_method: o.payment_method,
      created_at: o.created_at,
      cancelled_at: o.cancelled_at
    }));
    return res.render('order_history', { title: 'Lịch sử đơn hàng', orders, user: req.user });
  } catch (e) {
    console.error('orderHistory error', e);
    return res.status(500).send('Lỗi máy chủ');
  }
};

// Simple status endpoint for polling
exports.orderStatus = async (req, res) => {
  const user_id = (req.user && req.user.id) ? req.user.id : null;
  const id = parseInt(req.params.id, 10);
  if (!id || !user_id) return res.status(404).json({ error: 'not_found' });
  try {
    const o = await pool.query('SELECT id, status FROM orders WHERE id=$1 AND user_id=$2', [id, user_id]);
    if (!o.rows.length) return res.status(404).json({ error: 'not_found' });
    return res.json({ id: o.rows[0].id, status: o.rows[0].status });
  } catch (e) {
    console.error('orderStatus error', e);
    return res.status(500).json({ error: 'server_error' });
  }
};

// Cancel an order (user request)
exports.orderCancel = async (req, res) => {
  const user_id = (req.user && req.user.id) ? req.user.id : null;
  const id = parseInt(req.params.id, 10);
  const reason = (req.body && req.body.reason) ? String(req.body.reason).trim() : null;
  if (!id || !user_id) return res.status(404).json({ error: 'not_found' });
  try {
    const ores = await pool.query('SELECT id, status FROM orders WHERE id=$1 AND user_id=$2', [id, user_id]);
    if (!ores.rows.length) return res.status(404).json({ error: 'not_found' });
    const order = ores.rows[0];
    // statuses where immediate cancel is allowed
    const immediateAllowed = ['paid','processing','confirmed'];
    if (immediateAllowed.includes(order.status)) {
      await pool.query("UPDATE orders SET status='cancelled', cancelled_at=NOW(), cancellation_reason=$1 WHERE id=$2", [reason || null, id]);
      return res.json({ ok: true, status: 'cancelled' });
    }
    // delivered: allow cancel request only if a reason provided
    if (order.status === 'delivered') {
      if (!reason) return res.status(400).json({ error: 'reason_required' });
      await pool.query("UPDATE orders SET status='cancelled', cancelled_at=NOW(), cancellation_reason=$1 WHERE id=$2", [reason, id]);
      return res.json({ ok: true, status: 'cancelled' });
    }
    // shipped or other statuses: not allowed
    return res.status(400).json({ error: 'cannot_cancel' });
  } catch (e) {
    console.error('orderCancel error', e);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.successPage = async (req, res) => {
  const user_id = (req.user && req.user.id) ? req.user.id : null;
  const orderId = req.query.orderId ? parseInt(req.query.orderId, 10) : null;
  if (!orderId || !user_id) {
    return res.render('success', { order: null });
  }
  try {
    // fetch order with address
    const ores = await pool.query(
      `SELECT o.*, a.full_name AS addr_name, a.phone AS addr_phone, a.line1 AS addr_line1, a.line2 AS addr_line2, a.city AS addr_city, a.state AS addr_state, a.postal_code AS addr_postal_code, a.country AS addr_country
       FROM orders o LEFT JOIN addresses a ON o.address_id=a.id WHERE o.id=$1 AND o.user_id=$2`,
      [orderId, user_id]
    );
    if (!ores.rows.length) return res.render('success', { order: null });
    const order = ores.rows[0];
    // fetch items
    const itemsRes = await pool.query(
      `SELECT oi.*, p.name AS product_name, p.image AS product_image FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=$1`,
      [orderId]
    );
    order.items = itemsRes.rows.map(r => ({ id: r.product_id, name: r.product_name, image: r.product_image, quantity: r.quantity, price: parseFloat(r.price), subtotal: +(parseFloat(r.price) * r.quantity).toFixed(2) }));
    // normalize address
    order.address = {
      full_name: order.addr_name,
      phone: order.addr_phone,
      line1: order.addr_line1,
      line2: order.addr_line2,
      city: order.addr_city,
      state: order.addr_state,
      postal_code: order.addr_postal_code,
      country: order.addr_country
    };
    return res.render('success', { order });
  } catch (e) {
    console.error('Error loading order for success page', e);
    return res.render('success', { order: null });
  }
};

// VietQR (test): show QR then user confirms
exports.qrStart = async (req, res) => {
  const user_id = req.user.id;
  const address_id = parseInt(req.body.address_id, 10);
  if (!address_id || Number.isNaN(address_id)) return res.status(400).json({ error: 'missing_address' });
  const addr = await pool.query('SELECT id FROM addresses WHERE id=$1 AND user_id=$2', [address_id, user_id]);
  if (!addr.rows.length) return res.status(400).json({ error: 'invalid_address' });

  const r = await pool.query(
    `SELECT p.price, p.stock, ci.qty AS quantity
     FROM cart c
     JOIN cart_items ci ON ci.cart_id = c.id
     JOIN products p ON p.id = ci.product_id
     WHERE c.user_id=$1`,
    [user_id]
  );
  // stock check
  const insufficient = r.rows.find(row => (parseInt(row.stock,10)||0) < row.quantity);
  if (insufficient) return res.status(400).json({ error: 'out_of_stock' });
  const ship_method = (req.body.ship_method === 'express') ? 'express' : 'standard';
  const itemsTotal = r.rows.reduce((s,row) => s + parseFloat(row.price) * row.quantity, 0);
  const ship_fee = shippingFee(ship_method);
  const grandTotal = (itemsTotal + ship_fee).toFixed(2);
  res.cookie('checkout_address_id', address_id, { httpOnly: true, maxAge: 15 * 60 * 1000 });
  res.cookie('checkout_ship_method', ship_method, { httpOnly: true, maxAge: 15 * 60 * 1000 });

  const note = `ORDER-${user_id}-${Date.now()}`;
  // Do not fix amount in QR to avoid incompatibility (no FX rate). Still display total to user
  const imgUrl = buildVietQR(
    process.env.VIETQR_BIN,
    process.env.VIETQR_ACC,
    null,
    note,
    process.env.VIETQR_TEMPLATE || 'compact'
  );
  if (!imgUrl) return res.status(400).json({ error: 'vietqr_not_configured' });
  res.json({ ok: true, imgUrl, note, total: grandTotal, ship_method, ship_fee });
};

exports.qrConfirm = async (req, res) => {
  const user_id = req.user.id;
  const clientDb = await pool.connect();
  try {
    const rows = await clientDb.query(
      `SELECT p.id, p.price, p.stock, ci.qty AS quantity
       FROM cart c
       JOIN cart_items ci ON ci.cart_id = c.id
       JOIN products p ON p.id = ci.product_id
       WHERE c.user_id=$1`,
      [user_id]
    );
    await clientDb.query('BEGIN');
    for (const it of rows.rows){
      const s = parseInt(it.stock,10)||0; if (s < it.quantity){ await clientDb.query('ROLLBACK'); return res.status(400).json({ error: 'out_of_stock' }); }
    }
    const itemsTotal = rows.rows.reduce((s,row)=> s + parseFloat(row.price) * row.quantity, 0);
    const ship_method = (req.cookies.checkout_ship_method === 'express') ? 'express' : 'standard';
    const ship_fee = shippingFee(ship_method);
    const grandTotal = (itemsTotal + ship_fee).toFixed(2);
    const address_id = parseInt(req.cookies.checkout_address_id, 10) || null;
    const orderInsert = await clientDb.query(
      'INSERT INTO orders(user_id, total, payment_method, status, address_id, ship_method, shipping_fee) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [user_id, grandTotal, 'vietqr', 'processing', address_id, ship_method, ship_fee]
    );
    const orderId = orderInsert.rows[0].id;
    for (const it of rows.rows){
      await clientDb.query('INSERT INTO order_items(order_id, product_id, quantity, price) VALUES($1,$2,$3,$4)', [orderId, it.id, it.quantity, it.price]);
      await clientDb.query('UPDATE products SET stock = stock - $1 WHERE id=$2', [it.quantity, it.id]);
    }
    await clientDb.query('DELETE FROM cart WHERE user_id=$1', [user_id]);
    await clientDb.query('COMMIT');
  res.clearCookie('checkout_address_id');
  res.clearCookie('checkout_ship_method');
    return res.json({ ok: true, redirect: '/order/success?orderId=' + orderId });
  } catch (e) {
    try { await clientDb.query('ROLLBACK'); } catch {}
    console.error(e);
    return res.status(500).json({ ok:false });
  } finally {
    clientDb.release();
  }
};

// Cash On Delivery
exports.codCreate = async (req, res) => {
  const user_id = req.user.id;
  const address_id = parseInt(req.body.address_id, 10);
  if (!address_id || Number.isNaN(address_id)) return res.status(400).json({ error: 'missing_address' });
  const addr = await pool.query('SELECT id FROM addresses WHERE id=$1 AND user_id=$2', [address_id, user_id]);
  if (!addr.rows.length) return res.status(400).json({ error: 'invalid_address' });

  const clientDb = await pool.connect();
  try {
    const rows = await clientDb.query(
      `SELECT p.id, p.price, p.stock, ci.qty AS quantity
       FROM cart c
       JOIN cart_items ci ON ci.cart_id = c.id
       JOIN products p ON p.id = ci.product_id
       WHERE c.user_id=$1`,
      [user_id]
    );
    await clientDb.query('BEGIN');
    for (const it of rows.rows){
      const s = parseInt(it.stock,10)||0; if (s < it.quantity){ await clientDb.query('ROLLBACK'); return res.status(400).json({ error: 'out_of_stock' }); }
    }
    const ship_method = (req.body.ship_method === 'express') ? 'express' : 'standard';
    const itemsTotal = rows.rows.reduce((s,row)=> s + parseFloat(row.price) * row.quantity, 0);
    const ship_fee = shippingFee(ship_method);
    const grandTotal = (itemsTotal + ship_fee).toFixed(2);
    const orderInsert = await clientDb.query(
      'INSERT INTO orders(user_id, total, payment_method, status, address_id, ship_method, shipping_fee) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [user_id, grandTotal, 'cod', 'processing', address_id, ship_method, ship_fee]
    );
    const orderId = orderInsert.rows[0].id;
    for (const it of rows.rows){
      await clientDb.query('INSERT INTO order_items(order_id, product_id, quantity, price) VALUES($1,$2,$3,$4)', [orderId, it.id, it.quantity, it.price]);
      await clientDb.query('UPDATE products SET stock = stock - $1 WHERE id=$2', [it.quantity, it.id]);
    }
    await clientDb.query('DELETE FROM cart WHERE user_id=$1', [user_id]);
    await clientDb.query('COMMIT');
    return res.json({ ok: true, redirect: '/order/success?orderId=' + orderId });
  } catch (e) {
    try { await clientDb.query('ROLLBACK'); } catch {}
    console.error(e);
    return res.status(500).json({ ok:false });
  } finally {
    clientDb.release();
  }
};
