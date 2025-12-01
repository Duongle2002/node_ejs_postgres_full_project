const pool = require('../db');

exports.list = async (req, res) => {
  const r = await pool.query('SELECT * FROM products ORDER BY id DESC');
  res.render('admin/products/list', { title: 'Quản lý sản phẩm', products: r.rows, user: req.user });
};

exports.renderNew = (req, res) => {
  res.render('admin/products/form', { title: 'Thêm sản phẩm', product: null, action: '/admin/products' });
};

exports.create = async (req, res) => {
  let { name, price, description, image, stock } = req.body;
  const errors = [];
  name = String(name||'').trim();
  description = String(description||'').trim();
  image = String(image||'').trim();
  const imageMax = 10000; // guard against extremely large data URI submissions
  if (!name) errors.push('Tên không được để trống');
  if (!price || isNaN(price)) errors.push('Giá không hợp lệ');
  if (image && image.length > imageMax) errors.push(`Ảnh quá dài (>${imageMax} ký tự)`);
  if (errors.length){
    return res.status(400).render('admin/products/form', { title: 'Thêm sản phẩm', product: { name, price, description, image, stock }, action: '/admin/products', errors });
  }
  try {
    await pool.query(
      'INSERT INTO products(name, price, description, image, stock) VALUES($1,$2,$3,$4,$5)',
      [name, price, description, image, parseInt(stock,10)||0]
    );
    res.redirect('/admin/products');
  } catch (e){
    errors.push('Lỗi khi tạo sản phẩm: ' + e.code);
    return res.status(500).render('admin/products/form', { title: 'Thêm sản phẩm', product: { name, price, description, image, stock }, action: '/admin/products', errors });
  }
};

exports.renderEdit = async (req, res) => {
  const id = req.params.id;
  const r = await pool.query('SELECT * FROM products WHERE id=$1', [id]);
  if (!r.rows.length) return res.redirect('/admin/products');
  res.render('admin/products/form', { title: 'Sửa sản phẩm', product: r.rows[0], action: `/admin/products/${id}` });
};

exports.update = async (req, res) => {
  const id = req.params.id;
  let { name, price, description, image, stock } = req.body;
  const errors = [];
  name = String(name||'').trim();
  description = String(description||'').trim();
  image = String(image||'').trim();
  const imageMax = 10000;
  if (!name) errors.push('Tên không được để trống');
  if (!price || isNaN(price)) errors.push('Giá không hợp lệ');
  if (image && image.length > imageMax) errors.push(`Ảnh quá dài (>${imageMax} ký tự)`);
  if (errors.length){
    return res.status(400).render('admin/products/form', { title: 'Sửa sản phẩm', product: { id, name, price, description, image, stock }, action: `/admin/products/${id}`, errors });
  }
  try {
    // remove old image file if replaced by new uploads path
    try {
      const cur = await pool.query('SELECT image FROM products WHERE id=$1', [id]);
      const old = cur.rows[0] && cur.rows[0].image ? cur.rows[0].image : null;
      if (old && image && old !== image && old.startsWith('/uploads/')){
        const p = require('path').join(__dirname, '../public', old.replace(/^\//, ''));
        require('fs').unlink(p, () => {});
      }
    } catch (e) {}
    await pool.query(
      'UPDATE products SET name=$1, price=$2, description=$3, image=$4, stock=$5 WHERE id=$6',
      [name, price, description, image, parseInt(stock,10)||0, id]
    );
    res.redirect('/admin/products');
  } catch (e){
    errors.push('Lỗi khi cập nhật: ' + e.code);
    return res.status(500).render('admin/products/form', { title: 'Sửa sản phẩm', product: { id, name, price, description, image, stock }, action: `/admin/products/${id}`, errors });
  }
};

exports.remove = async (req, res) => {
  const id = req.params.id;
  await pool.query('DELETE FROM products WHERE id=$1', [id]);
  res.redirect('/admin/products');
};
