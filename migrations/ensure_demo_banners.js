const pool = require('../db');

module.exports = async function ensureDemoBanners(){
  try {
    const r = await pool.query('SELECT COUNT(*) FROM banners');
    const cnt = parseInt(r.rows[0].count, 10);
    if (cnt > 0) {
      console.log('ensure_demo_banners: banners already present');
      return;
    }

    console.log('ensure_demo_banners: inserting demo banners');
    await pool.query(
      `INSERT INTO banners (title, subtitle, image_url, link, type, accent, priority)
       VALUES
       ($1,$2,$3,$4,'hero',$5,10),
       ($6,$7,$8,$9,'promo',$10,5),
       ($11,$12,$13,$14,'promo',$15,4)`,
      [
        'Big Savings on Laptops',
        'Get up to 30% off selected laptops this week',
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder',
        '/products',
        '#ff6a00',

        'Smartphone Week',
        'Top models at discounted prices.',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder',
        '/products',
        '#00b4d8',

        'Accessories Clearance',
        'Chargers, cables and cases at low prices.',
        'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder',
        '/products',
        '#ff8a3d'
      ]
    );
  } catch (err) {
    console.error('ensure_demo_banners failed', err && err.message);
  }
}
