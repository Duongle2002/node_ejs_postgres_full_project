const pool = require('../db');

module.exports = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP NULL");
    await client.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL");
    await client.query('COMMIT');
    console.log('ensure_order_cancellation: columns present');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('ensure_order_cancellation failed', e.message);
  } finally {
    client.release();
  }
};
