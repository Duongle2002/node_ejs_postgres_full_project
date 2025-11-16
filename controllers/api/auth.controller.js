const pool = require('../../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'missing' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [name || null, email, hashed]);
    return res.json({ ok: true });
  } catch (e) {
    console.error('api.register error', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'missing' });
  try {
    const r = await pool.query('SELECT id, name, email, password, role FROM users WHERE email=$1', [email]);
    if (!r.rows.length) return res.status(401).json({ error: 'invalid' });
    const user = r.rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'invalid' });
    const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true });
    return res.json({ ok: true });
  } catch (e) {
    console.error('api.login error', e.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  return res.json({ ok: true });
};

exports.me = async (req, res) => {
  // read token from cookie
  const token = req.cookies && req.cookies.token;
  if (!token) return res.status(401).json({ error: 'unauth' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ ok: true, user: decoded });
  } catch (e) {
    return res.status(401).json({ error: 'unauth' });
  }
};
