const pool = require('../db');

exports.index = async (req, res) => {
  try {
  // Assumption: show 8 featured products for a fuller grid (change as needed)
  const r = await pool.query('SELECT * FROM products ORDER BY id DESC LIMIT 8');
    const products = r.rows || [];
    const user = req.user || null;
    res.render('home', { title: 'Trang chủ', products, user });
  } catch (err) {
    console.error(err);
    res.render('home', { title: 'Trang chủ', products: [], user: req.user || null });
  }
};
