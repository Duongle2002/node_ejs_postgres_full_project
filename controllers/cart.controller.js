const pool = require('../db');

exports.addToCart = async (req, res) => {
  const user_id = req.user.id;
  const product_id = req.params.id;
  let qty = parseInt(req.body.quantity, 10);
  if (isNaN(qty) || qty < 1) qty = 1;

  try {
    const p = await pool.query('SELECT stock FROM products WHERE id=$1', [product_id]);
    if (!p.rows.length) {
      const msg = 'Sản phẩm không tồn tại';
      return wantsJson(req) ? res.status(404).json({ ok: false, error: msg }) : res.send(msg);
    }
    const stock = parseInt(p.rows[0].stock, 10) || 0;

    const existing = await pool.query(
      'SELECT * FROM cart WHERE user_id=$1 AND product_id=$2',
      [user_id, product_id]
    );

    if (existing.rows.length) {
      const currentQty = parseInt(existing.rows[0].quantity, 10) || 0;
      if (currentQty + qty > stock) {
        const msg = `Chỉ còn ${stock} sản phẩm trong kho`;
        return wantsJson(req) ? res.status(400).json({ ok: false, error: msg, stock }) : res.send('Sản phẩm tạm hết hàng');
      }
      await pool.query('UPDATE cart SET quantity = COALESCE(quantity,0) + $1 WHERE id=$2', [qty, existing.rows[0].id]);
    } else {
      if (qty > stock || stock <= 0) {
        const msg = stock <= 0 ? 'Sản phẩm tạm hết hàng' : `Chỉ còn ${stock} sản phẩm trong kho`;
        return wantsJson(req) ? res.status(400).json({ ok: false, error: msg, stock }) : res.send('Sản phẩm tạm hết hàng');
      }
      await pool.query('INSERT INTO cart(user_id, product_id, quantity) VALUES($1,$2,$3)', [user_id, product_id, qty]);
    }

    if (wantsJson(req)) return res.json({ ok: true, added: qty });
    return res.redirect('/cart');
  } catch (e) {
    console.error(e);
    return wantsJson(req) ? res.status(500).json({ ok: false }) : res.redirect('/cart');
  }
};

function wantsJson(req){
  const accept = (req.headers.accept || '').toLowerCase();
  const ct = (req.headers['content-type'] || '').toLowerCase();
  return accept.includes('application/json') || ct.includes('application/json');
}

exports.viewCart = async (req, res) => {
  const user_id = req.user.id;
  // Cleanup: remove cart rows whose product no longer exists
  await pool.query('DELETE FROM cart WHERE user_id=$1 AND product_id NOT IN (SELECT id FROM products)', [user_id]);

  const r = await pool.query(
    `SELECT cart.id, products.id as product_id, products.name, products.price, cart.quantity
     FROM cart JOIN products ON products.id = cart.product_id
     WHERE cart.user_id=$1`,
     [user_id]
  );

  // Normalize quantity to at least 1 for rendering (in case legacy nulls remain)
  const items = r.rows.map(row => ({...row, quantity: row.quantity == null ? 1 : row.quantity}));
  res.render('cart', { items });
};

exports.updateQuantity = async (req, res) => {
  const user_id = req.user.id;
  const cart_id = req.params.id;
  let qty = parseInt(req.body.quantity, 10);
  if (isNaN(qty)) qty = 1;

  try {
    if (qty <= 0) {
      await pool.query('DELETE FROM cart WHERE id=$1 AND user_id=$2', [cart_id, user_id]);
    } else {
      await pool.query('UPDATE cart SET quantity=$1 WHERE id=$2 AND user_id=$3', [qty, cart_id, user_id]);
    }
  } catch (err) {
    console.error(err);
  }
  // If client expects JSON (AJAX), return current totals and row info
  const acceptsJson = (req.headers.accept || '').includes('application/json');
  if (acceptsJson) {
    try {
      // compute total
      const totalRows = await pool.query(
        `SELECT products.price, cart.quantity
         FROM cart JOIN products ON products.id=cart.product_id
         WHERE cart.user_id=$1`, [user_id]
      );
      const total = totalRows.rows.reduce((s, row) => s + parseFloat(row.price) * row.quantity, 0);

      // fetch updated row (if exists)
      const it = await pool.query(
        `SELECT products.price, cart.quantity
         FROM cart JOIN products ON products.id=cart.product_id
         WHERE cart.id=$1 AND cart.user_id=$2`, [cart_id, user_id]
      );
      if (!it.rows.length) {
        return res.json({ ok: true, removed: true, total: +total.toFixed(2) });
      }
      const price = parseFloat(it.rows[0].price);
      const quantity = it.rows[0].quantity;
      const subtotal = price * quantity;
      return res.json({ ok: true, removed: false, quantity, subtotal: +subtotal.toFixed(2), total: +total.toFixed(2) });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ ok: false });
    }
  }

  res.redirect('/cart');
};

exports.removeItem = async (req, res) => {
  const user_id = req.user.id;
  const cart_id = req.params.id;
  try {
    await pool.query('DELETE FROM cart WHERE id=$1 AND user_id=$2', [cart_id, user_id]);
  } catch (err) {
    console.error(err);
  }
  const acceptsJson = (req.headers.accept || '').includes('application/json');
  if (acceptsJson) {
    try {
      const totalRows = await pool.query(
        `SELECT products.price, cart.quantity
         FROM cart JOIN products ON products.id=cart.product_id
         WHERE cart.user_id=$1`, [user_id]
      );
      const total = totalRows.rows.reduce((s, row) => s + parseFloat(row.price) * row.quantity, 0);
      return res.json({ ok: true, removed: true, total: +total.toFixed(2) });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ ok: false });
    }
  }
  res.redirect('/cart');
};

exports.clearCart = async (req, res) => {
  const user_id = req.user.id;
  try {
    await pool.query('DELETE FROM cart WHERE user_id=$1', [user_id]);
  } catch (err) {
    console.error(err);
  }
  const acceptsJson = (req.headers.accept || '').includes('application/json');
  if (acceptsJson) return res.json({ ok: true, total: 0 });
  res.redirect('/cart');
};

exports.count = async (req, res) => {
  const user_id = req.user.id;
  try {
    const r = await pool.query('SELECT COALESCE(SUM(quantity),0)::int AS count FROM cart WHERE user_id=$1', [user_id]);
    return res.json({ count: r.rows[0].count || 0 });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ count: 0 });
  }
};
