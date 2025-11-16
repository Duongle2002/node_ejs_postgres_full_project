const pool = require('../db');

module.exports = async function ensureOrdersAddressId(){
  const r = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='orders' AND column_name='address_id'`);
  if (!r.rows.length){
    await pool.query(`ALTER TABLE orders ADD COLUMN address_id INT REFERENCES addresses(id)`);
  }
};
