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

    // ensure a cart exists for the user
    let cartId;
    const r = await pool.query('SELECT id FROM cart WHERE user_id=$1 LIMIT 1', [user_id]);
    if (!r.rows.length) {
      const ins = await pool.query('INSERT INTO cart (user_id) VALUES ($1) RETURNING id', [user_id]);
      cartId = ins.rows[0].id;
    } else cartId = r.rows[0].id;

    // check existing item
    const ex = await pool.query('SELECT id, qty FROM cart_items WHERE cart_id=$1 AND product_id=$2 LIMIT 1', [cartId, product_id]);
    if (ex.rows.length) {
      const currentQty = parseInt(ex.rows[0].qty, 10) || 0;
      if (currentQty + qty > stock) {
        const msg = `Chỉ còn ${stock} sản phẩm trong kho`;
        return wantsJson(req) ? res.status(400).json({ ok: false, error: msg, stock }) : res.send('Sản phẩm tạm hết hàng');
      }
      await pool.query('UPDATE cart_items SET qty = COALESCE(qty,0) + $1 WHERE id=$2', [qty, ex.rows[0].id]);
    } else {
      if (qty > stock || stock <= 0) {
        const msg = stock <= 0 ? 'Sản phẩm tạm hết hàng' : `Chỉ còn ${stock} sản phẩm trong kho`;
        return wantsJson(req) ? res.status(400).json({ ok: false, error: msg, stock }) : res.send('Sản phẩm tạm hết hàng');
      }
      await pool.query('INSERT INTO cart_items (cart_id, product_id, qty) VALUES ($1,$2,$3)', [cartId, product_id, qty]);
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
  // Ensure a cart exists and fetch items from cart_items
  let cartId;
  const rCart = await pool.query('SELECT id FROM cart WHERE user_id=$1 LIMIT 1', [user_id]);
  if (!rCart.rows.length) {
    const ins = await pool.query('INSERT INTO cart (user_id) VALUES ($1) RETURNING id', [user_id]);
    cartId = ins.rows[0].id;
  } else cartId = rCart.rows[0].id;

  // Cleanup: remove cart_items whose product no longer exists
  await pool.query('DELETE FROM cart_items WHERE cart_id=$1 AND product_id NOT IN (SELECT id FROM products)', [cartId]);

  const r = await pool.query(
    `SELECT ci.id, p.id as product_id, p.name, p.price, ci.qty as quantity
     FROM cart_items ci JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id=$1`,
     [cartId]
  );

  const items = r.rows.map(row => ({...row, quantity: row.quantity == null ? 1 : row.quantity}));
  res.render('cart', { items });
};

exports.updateQuantity = async (req, res) => {
  const user_id = req.user.id;
  const item_id = req.params.id; // cart_items.id
  let qty = parseInt(req.body.quantity, 10);
  if (isNaN(qty)) qty = 1;

  try {
    // ensure the item belongs to the user's cart
    const rCart = await pool.query('SELECT c.id FROM cart c JOIN cart_items ci ON ci.cart_id=c.id WHERE ci.id=$1 AND c.user_id=$2', [item_id, user_id]);
    if (!rCart.rows.length) return res.status(404).json({ ok: false });
    const cartId = rCart.rows[0].id;

    if (qty <= 0) {
      await pool.query('DELETE FROM cart_items WHERE id=$1 AND cart_id=$2', [item_id, cartId]);
    } else {
      await pool.query('UPDATE cart_items SET qty=$1 WHERE id=$2 AND cart_id=$3', [qty, item_id, cartId]);
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
        `SELECT p.price, ci.qty as quantity
         FROM cart c JOIN cart_items ci ON ci.cart_id=c.id JOIN products p ON p.id=ci.product_id
         WHERE c.user_id=$1`, [user_id]
      );
      const total = totalRows.rows.reduce((s, row) => s + parseFloat(row.price) * row.quantity, 0);

      // fetch updated row (if exists)
      const it = await pool.query(
        `SELECT p.price, ci.qty as quantity
         FROM cart c JOIN cart_items ci ON ci.cart_id=c.id JOIN products p ON p.id=ci.product_id
         WHERE ci.id=$1 AND c.user_id=$2`, [item_id, user_id]
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
  const item_id = req.params.id; // cart_items.id
  try {
    const rCart = await pool.query('SELECT c.id FROM cart c JOIN cart_items ci ON ci.cart_id=c.id WHERE ci.id=$1 AND c.user_id=$2', [item_id, user_id]);
    if (rCart.rows.length) {
      await pool.query('DELETE FROM cart_items WHERE id=$1 AND cart_id=$2', [item_id, rCart.rows[0].id]);
    }
  } catch (err) {
    console.error(err);
  }
  const acceptsJson = (req.headers.accept || '').includes('application/json');
  if (acceptsJson) {
    try {
      const totalRows = await pool.query(
        `SELECT p.price, ci.qty as quantity
         FROM cart c JOIN cart_items ci ON ci.cart_id=c.id JOIN products p ON p.id=ci.product_id
         WHERE c.user_id=$1`, [user_id]
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
    const rCart = await pool.query('SELECT id FROM cart WHERE user_id=$1 LIMIT 1', [user_id]);
    if (rCart.rows.length) {
      await pool.query('DELETE FROM cart_items WHERE cart_id=$1', [rCart.rows[0].id]);
    }
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
    const r = await pool.query(
      `SELECT COALESCE(SUM(ci.qty),0)::int AS count
       FROM cart c LEFT JOIN cart_items ci ON ci.cart_id=c.id
       WHERE c.user_id=$1`, [user_id]
    );
    return res.json({ count: r.rows[0].count || 0 });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ count: 0 });
  }
};
