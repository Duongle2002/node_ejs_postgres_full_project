const pool = require('../db');
(async ()=>{
  try {
    const r = await pool.query('SELECT id, name FROM products ORDER BY id DESC LIMIT 1');
    const first = (r.rows && r.rows[0]) ? r.rows[0].id : null;
    const out = { firstId: first };
    console.log(JSON.stringify(out));
    process.exit(0);
  } catch (e) {
    console.error(JSON.stringify({ error: (e.message || String(e)) }));
    process.exit(1);
  }
})();
