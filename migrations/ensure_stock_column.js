const pool = require('../db');

module.exports = async function ensureStockColumn() {
  try {
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INT NOT NULL DEFAULT 0');
  } catch (err) {
    console.error('Failed to ensure products.stock column:', err.message);
  }
};
