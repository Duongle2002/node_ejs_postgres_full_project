const pool = require('../db');

exports.listJson = async (req, res) => {
  const user_id = req.user.id;
  const r = await pool.query('SELECT * FROM addresses WHERE user_id=$1 ORDER BY is_default DESC, id DESC', [user_id]);
  res.json({ addresses: r.rows });
};

exports.add = async (req, res) => {
  const user_id = req.user.id;
  let { full_name, phone, line1, line2, city, state, postal_code, country, is_default } = req.body;
  full_name = String(full_name||'').trim();
  line1 = String(line1||'').trim();
  country = (country || 'VN').toUpperCase();
  is_default = String(is_default||'').toLowerCase() === 'true' || is_default === true || is_default === 'on';

  if (!full_name || !line1) {
    const msg = 'Vui lòng nhập đầy đủ họ tên và địa chỉ dòng 1';
    return wantsJson(req) ? res.status(400).json({ ok:false, error: msg }) : res.send(msg);
  }

  try {
    if (is_default) await pool.query('UPDATE addresses SET is_default=false WHERE user_id=$1', [user_id]);
    const r = await pool.query(
      `INSERT INTO addresses(user_id, full_name, phone, line1, line2, city, state, postal_code, country, is_default)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [user_id, full_name, phone||null, line1, line2||null, city||null, state||null, postal_code||null, country, is_default]
    );
    const addr = r.rows[0];
    return wantsJson(req) ? res.json({ ok:true, address: addr }) : res.redirect(req.get('referer') || '/order/checkout');
  } catch (e) {
    console.error(e);
    return wantsJson(req) ? res.status(500).json({ ok:false }) : res.redirect('/order/checkout');
  }
};

exports.setDefault = async (req, res) => {
  const user_id = req.user.id;
  const id = req.params.id;
  try {
    const r = await pool.query('SELECT id FROM addresses WHERE id=$1 AND user_id=$2', [id, user_id]);
    if (!r.rows.length) return wantsJson(req) ? res.status(404).json({ ok:false }) : res.redirect('/order/checkout');
    await pool.query('UPDATE addresses SET is_default=false WHERE user_id=$1', [user_id]);
    await pool.query('UPDATE addresses SET is_default=true WHERE id=$1', [id]);
    return wantsJson(req) ? res.json({ ok:true }) : res.redirect('/order/checkout');
  } catch (e) {
    console.error(e);
    return wantsJson(req) ? res.status(500).json({ ok:false }) : res.redirect('/order/checkout');
  }
};

function wantsJson(req){
  const accept = (req.headers.accept||'').toLowerCase();
  const ct = (req.headers['content-type']||'').toLowerCase();
  return accept.includes('application/json') || ct.includes('application/json');
}
