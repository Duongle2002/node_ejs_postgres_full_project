import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useToast } from '../state/ToastContext'

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [banners, setBanners] = useState([])

  useEffect(() => {
    let mounted = true
    Promise.all([
      api.get('/products?limit=12'),
      api.get('/banners')
    ]).then(([rp, rb]) => {
      if (!mounted) return
      if (rp.data?.ok) setProducts(rp.data.products)
      if (rb.data?.ok) setBanners(rb.data.banners)
    }).catch(()=>{}).finally(()=> mounted && setLoading(false))
    return ()=> mounted = false
  }, [])
  const navigate = useNavigate()
  const { addToast } = useToast()
  const addToCart = async (e, product) => {
    e.stopPropagation()
    try {
      await api.post('/cart/add', { product_id: product.id, qty: 1 })
      addToast('Added to cart', { type: 'success' })
    } catch (err) {
      if (err.response && err.response.status === 401) return navigate('/login')
      console.error('addToCart', err)
      addToast('Could not add to cart', { type: 'error' })
    }
  }

  if (loading) return <div>Loading...</div>
  const hero = banners.find(b => b.type === 'hero') || null

  return (
    <div>
      {hero ? (
        <div className="hero" style={{background: hero.accent ? `linear-gradient(90deg, ${hero.accent}18, rgba(255,255,255,0.02))` : undefined}}>
          <div className="left">
            <h2>{hero.title}</h2>
            <p>{hero.subtitle}</p>
            <div className="cta">
              <Link to={hero.link || '/products'} className="btn">Shop Now</Link>
              <Link to="/products" className="btn secondary">See More</Link>
            </div>
          </div>
          {hero.image_url && <img src={hero.image_url} alt={hero.title} />}
        </div>
      ) : (
        <div className="hero">
          <div className="left">
            <h2>Upgrade your setup with top electronics</h2>
            <p>Exclusive deals on laptops, phones, accessories and more. Free shipping for orders over $99.</p>
            <div className="cta">
              <Link to="/products" className="btn">Shop Deals</Link>
              <Link to="/products" className="btn secondary">New Arrivals</Link>
            </div>
          </div>
          <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder" alt="hero"/>
        </div>
      )}

      <div className="promo-row">
        {banners.filter(b=>b.type==='promo').map(b=> (
          <div className="promo" key={b.id}>
            {b.image_url && <img src={b.image_url} alt={b.title} />}
            <div className="info">
              {b.accent && <div className="tag" style={{background:b.accent}}>{b.title}</div>}
              {!b.accent && <div className="tag">Promo</div>}
              <h4>{b.title}</h4>
              <p className="muted">{b.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{marginTop:6}}>Featured Products</h2>
      <div className="grid">
        {products.map(p => (
          <div key={p.id} className="product-card" onClick={()=> navigate(`/products/${p.id}`)} style={{cursor:'pointer'}}>
            {p.image && <div style={{height:140,overflow:'hidden',borderRadius:8,marginBottom:8}}><img src={p.image} alt={p.name} style={{width:'100%',objectFit:'cover'}}/></div>}
            <h3>{p.name}</h3>
            <div className="meta-row">
              <div className="meta-left">
                <div className="price">${Number(p.price).toFixed(2)}</div>
                <div className="muted">Stock: {p.stock}</div>
              </div>
              <div className="card-actions">
                <button className="btn" onClick={(e)=> addToCart(e, p)}>Add to cart</button>
              </div>
            </div>
            <p>{p.short_description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
