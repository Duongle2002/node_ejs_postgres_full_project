const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.renderLogin = (req, res) => {
  res.render('login', { title: 'Đăng nhập' });
};

exports.renderRegister = (req, res) => {
  res.render('register', { title: 'Đăng ký' });
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
      [name, email, hashed]
    );
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.send('Đăng ký thất bại: ' + err.message);
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const r = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!r.rows.length) return res.send('Sai email');

    const user = r.rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.send('Sai mật khẩu');

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

  res.cookie('token', token, { httpOnly: true });
  if (user.role === 'admin') return res.redirect('/admin');
  res.redirect('/products');
  } catch (err) {
    console.error(err);
    res.send('Lỗi đăng nhập');
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/products');
};
