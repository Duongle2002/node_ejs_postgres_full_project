const pool = require('../db');

module.exports = async function ensureBannersTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id SERIAL PRIMARY KEY,
        title TEXT,
        subtitle TEXT,
        image_url TEXT,
        link TEXT,
        type TEXT DEFAULT 'promo', -- 'hero' or 'promo'
        accent TEXT,
        priority INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('ensure_banners_table: OK');
  } catch (err) {
    console.error('ensure_banners_table failed', err && err.message);
  }
}
