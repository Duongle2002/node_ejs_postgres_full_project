const pool = require('../db');

exports.index = async (req, res) => {
  const { q, sort } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const perPage = Math.max(parseInt(req.query.perPage, 10) || 12, 1);

  const where = [];
  const params = [];

  if (q && q.trim()) {
    params.push(`%${q.trim()}%`);
    where.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
  }

  let orderBy = 'ORDER BY id DESC'; // newest by default
  if (sort === 'price_asc') orderBy = 'ORDER BY price ASC, id DESC';
  else if (sort === 'price_desc') orderBy = 'ORDER BY price DESC, id DESC';
  else if (sort === 'newest') orderBy = 'ORDER BY id DESC';

  // total count
  const countSql = `SELECT COUNT(*)::int AS count FROM products ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
  const totalRow = await pool.query(countSql, params);
  const total = totalRow.rows[0]?.count || 0;

  // page slice
  const offset = (page - 1) * perPage;
  const sql = `SELECT * FROM products ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const r = await pool.query(sql, [...params, perPage, offset]);
  const user = req.user || null;
  const totalPages = Math.max(Math.ceil(total / perPage), 1);
  res.render('products', {
    title: 'Sản phẩm',
    products: r.rows,
    user,
    q: q || '',
    sort: sort || 'newest',
    page,
    perPage,
    total,
    totalPages
  });
};

exports.renderAdd = (req, res) => {
  if (!req.user || req.user.role !== 'admin') return res.send('Không có quyền');
  res.render('add_product', { title: 'Thêm sản phẩm' });
};

exports.add = async (req, res) => {
  if (!req.user || req.user.role !== 'admin') return res.send('Không có quyền');
  const { name, price, description, image } = req.body;
  await pool.query(
    'INSERT INTO products(name, price, description, image) VALUES($1,$2,$3,$4)',
    [name, price, description, image]
  );
  res.redirect('/products');
};

exports.detail = async (req, res) => {
  const r = await pool.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
  if (!r.rows.length) return res.status(404).render('product_detail', { product: null, notFound: true, title: 'Không tìm thấy' });
  const product = r.rows[0];
  // related products: latest others
  const related = await pool.query('SELECT * FROM products WHERE id<>$1 ORDER BY id DESC LIMIT 4', [product.id]);
  res.render('product_detail', { title: product.name, product, related: related.rows, user: req.user || null, notFound: false });
};
