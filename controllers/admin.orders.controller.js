const pool = require('../db');

exports.list = async (req, res) => {
  const r = await pool.query(
    `SELECT orders.*, users.name as customer
     FROM orders LEFT JOIN users ON users.id = orders.user_id
     ORDER BY orders.id DESC`
  );
  res.render('admin/orders/list', { title: 'Đơn hàng', orders: r.rows, user: req.user });
};

exports.detail = async (req, res) => {
  const id = req.params.id;
  const o = await pool.query(
    `SELECT orders.*, users.name as customer, users.email
     FROM orders LEFT JOIN users ON users.id = orders.user_id WHERE orders.id=$1`, [id]
  );
  if (!o.rows.length) return res.redirect('/admin/orders');
  const items = await pool.query(
    `SELECT order_items.*, products.name FROM order_items
     LEFT JOIN products ON products.id = order_items.product_id
     WHERE order_items.order_id=$1`, [id]
  );
  res.render('admin/orders/detail', { title: 'Chi tiết đơn hàng', order: o.rows[0], items: items.rows, user: req.user });
};

exports.updateStatus = async (req, res) => {
  const id = req.params.id;
  const allowed = ['pending','paid','processing','shipped','cancelled','refunded'];
  const status = String(req.body.status || '').toLowerCase();
  if (!allowed.includes(status)) return res.status(400).send('Trạng thái không hợp lệ');
  await pool.query('UPDATE orders SET status=$1 WHERE id=$2', [status, id]);
  const back = req.get('referer') || '/admin/orders';
  res.redirect(back);
};
