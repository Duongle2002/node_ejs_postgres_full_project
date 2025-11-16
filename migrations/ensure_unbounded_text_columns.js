const pool = require('../db');

// Ensures certain product text columns are not artificially length limited.
// If an older schema used VARCHAR(n) for image or description, upgrade them to TEXT.
module.exports = async function ensureUnboundedTextColumns(){
  // check image column
  const cols = await pool.query(`SELECT column_name, data_type, character_maximum_length
                                 FROM information_schema.columns
                                 WHERE table_name='products' AND column_name IN ('image','description')`);
  for (const c of cols.rows){
    if (c.character_maximum_length){
      // alter to TEXT (unbounded)
      await pool.query(`ALTER TABLE products ALTER COLUMN ${c.column_name} TYPE TEXT`);
    }
  }
};
