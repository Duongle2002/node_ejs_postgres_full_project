const pool = require('../db');

module.exports = async function ensureShortDescription() {
  try {
    await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT");
    console.log('ensure_short_description: column present')
  } catch (err) {
    console.error('ensure_short_description failed', err && err.message);
  }
}
