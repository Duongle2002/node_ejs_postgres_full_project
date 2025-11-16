const pool = require('../db');

const STATUSES = ['pending','paid','processing','shipped','cancelled','refunded'];

async function gatherStats(range) {
  const { from, to } = range;
  const params = [];
  let dateFilter = '';
  if (from && to) {
    params.push(from, to);
    dateFilter = ` AND created_at::date BETWEEN $${params.length-1} AND $${params.length}`;
  }
  const stats = {
    range_from: from || null,
    range_to: to || null,
    products: 0,
    users: 0,
    orders: 0,
    revenue_total: 0,
    top_products: [],
    low_stock: [],
    status_counts: {},
    daily: [] // {day, revenue, orders}
  };
  try { const p = await pool.query('SELECT COUNT(*) FROM products'); stats.products = parseInt(p.rows[0].count,10)||0; } catch {}
  try { const u = await pool.query('SELECT COUNT(*) FROM users'); stats.users = parseInt(u.rows[0].count,10)||0; } catch {}
  try { const o = await pool.query('SELECT COUNT(*) FROM orders'); stats.orders = parseInt(o.rows[0].count,10)||0; } catch {}
  try {
    const r = await pool.query(`SELECT COALESCE(SUM(total),0) AS sum FROM orders WHERE status <> 'cancelled'${dateFilter}`, params);
    stats.revenue_total = parseFloat(r.rows[0].sum)||0;
  } catch {}
  // dynamic daily revenue & orders (default last 7 days if no range)
  try {
    let dailyQuery;
    if (from && to) {
      dailyQuery = `SELECT to_char(d,'YYYY-MM-DD') AS day,
        COALESCE(SUM(o.total),0) AS revenue,
        COUNT(o.id) AS orders
        FROM generate_series($1::date, $2::date, '1 day') d
        LEFT JOIN orders o ON o.created_at::date = d::date AND o.status <> 'cancelled'
        GROUP BY d ORDER BY d`;
      const rd = await pool.query(dailyQuery, [from, to]);
      stats.daily = rd.rows;
    } else {
      dailyQuery = `SELECT to_char(day,'YYYY-MM-DD') AS day, sum_total AS revenue, orders_count AS orders FROM (
        SELECT date_trunc('day', created_at) AS day,
          COALESCE(SUM(total),0) AS sum_total,
          COUNT(id) AS orders_count
        FROM orders WHERE status <> 'cancelled' AND created_at >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY day
      ) t ORDER BY day ASC`;
      const rd = await pool.query(dailyQuery);
      stats.daily = rd.rows;
    }
  } catch {}
  // top products within range (or last 30 days if none)
  try {
    let tpQuery, tpParams;
    if (from && to) {
      tpQuery = `SELECT products.id, products.name, COALESCE(SUM(oi.quantity),0) AS qty
        FROM products
        LEFT JOIN order_items oi ON oi.product_id = products.id
        LEFT JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelled' AND o.created_at::date BETWEEN $1 AND $2
        GROUP BY products.id
        ORDER BY qty DESC
        LIMIT 5`;
      tpParams = [from, to];
    } else {
      tpQuery = `SELECT products.id, products.name, COALESCE(SUM(oi.quantity),0) AS qty
        FROM products
        LEFT JOIN order_items oi ON oi.product_id = products.id
        LEFT JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelled' AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY products.id
        ORDER BY qty DESC
        LIMIT 5`;
      tpParams = [];
    }
    const tp = await pool.query(tpQuery, tpParams);
    stats.top_products = tp.rows;
  } catch {}
  try { const ls = await pool.query('SELECT id, name, stock FROM products WHERE stock IS NOT NULL AND stock < 5 ORDER BY stock ASC LIMIT 10'); stats.low_stock = ls.rows; } catch {}
  try {
    const sc = await pool.query('SELECT status, COUNT(*) FROM orders GROUP BY status');
    STATUSES.forEach(s => { stats.status_counts[s] = 0; });
    sc.rows.forEach(r => { stats.status_counts[r.status||'unknown'] = parseInt(r.count,10)||0; });
  } catch {}
  return stats;
}

function normalizeDate(str){
  const d = new Date(str); if (isNaN(d.getTime())) return null; return d.toISOString().slice(0,10);
}

exports.dashboard = async (req, res) => {
  const from = normalizeDate(req.query.from);
  const to = normalizeDate(req.query.to);
  let range = { from, to };
  if (from && to && from > to) range = { from: to, to: from }; // swap if reversed
  const stats = await gatherStats(range);
  res.render('admin/dashboard', { title: 'Bảng điều khiển', stats, user: req.user });
};

exports.statsJson = async (req, res) => {
  const from = normalizeDate(req.query.from);
  const to = normalizeDate(req.query.to);
  try { const stats = await gatherStats({ from, to }); res.json(stats); } catch (e){ res.status(500).json({ error: 'Không thể tải thống kê' }); }
};

exports.statsCsv = async (req, res) => {
  const from = normalizeDate(req.query.from);
  const to = normalizeDate(req.query.to);
  try {
    const stats = await gatherStats({ from, to });
    const headerStatuses = STATUSES.map(s => `status_${s}`);
    const header = ['day','revenue_usd','orders'].concat(headerStatuses).join(',');
    const lines = [header];
    // create mapping of status counts per day (aggregate queries could be added; using overall counts repeated)
    stats.daily.forEach(d => {
      const row = [d.day, d.revenue, d.orders].concat(STATUSES.map(s => stats.status_counts[s]||0));
      lines.push(row.join(','));
    });
    const csv = lines.join('\n');
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition',`attachment; filename=stats_${from||'last7'}_${to||'current'}.csv`);
    res.send(csv);
  } catch (e){ res.status(500).send('Lỗi xuất CSV'); }
};
