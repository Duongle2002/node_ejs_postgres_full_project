const pool = require('../db');

module.exports = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_method VARCHAR(20) DEFAULT 'standard'");
    await client.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(10,2) DEFAULT 0");
    await client.query('COMMIT');
    console.log('ensure_ship_method_column: columns present');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('ensure_ship_method_column failed', e.message);
  } finally {
    client.release();
  }
};
