const bcrypt = require('bcryptjs');
const pool = require('../db');

// Creates an admin user if none exists. Uses env vars:
// ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME (defaults below if not set)
module.exports = async function ensureAdminUser(){
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const pass = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const name = process.env.ADMIN_NAME || 'Admin';
  if (!email || !pass) return; // skip silently if missing
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email=$1 LIMIT 1', [email]);
    if (existing.rows.length) {
      // optionally ensure role is admin
      await pool.query('UPDATE users SET role=\'admin\' WHERE id=$1', [existing.rows[0].id]);
      return;
    }
    const hash = await bcrypt.hash(pass, 10);
    await pool.query('INSERT INTO users (name,email,password,role) VALUES ($1,$2,$3,$4)', [name, email, hash, 'admin']);
    console.log('Admin user created:', email);
  } catch (e) {
    console.error('ensure_admin_user failed', e.message);
  }
};
