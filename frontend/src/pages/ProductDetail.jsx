import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import { useToast } from '../state/ToastContext'
import { useTranslation } from 'react-i18next'

function formatCurrency(n){
  try { return new Intl.NumberFormat(undefined, {style:'currency',currency:'USD'}).format(Number(n)) }
  catch { return `$${Number(n).toFixed(2)}` }
}

export default function ProductDetail(){
  const { id } = useParams()
  const navigate = useNavigate()
  const mountedRef = useRef(true)
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const { addToast } = useToast()
  const [activeImage, setActiveImage] = useState(0)
  const [related, setRelated] = useState([])
  const mainImageRef = useRef(null)
  const [zoomEnabled, setZoomEnabled] = useState(false)
  const [zoomScale, setZoomScale] = useState(1)
  const [zoomOrigin, setZoomOrigin] = useState({ x: '50%', y: '50%' })

  const { t } = useTranslation()

  useEffect(()=>{
    mountedRef.current = true
    setLoading(true)
    api.get(`/products/${id}`).then(r=>{
      if (!mountedRef.current) return
      if (r.data?.ok) setProduct(r.data.product)
    }).catch(()=>{}).finally(()=> mountedRef.current && setLoading(false))

    // load a few related products for visual context
    api.get('/products', { params: { limit: 6 } }).then(r=>{
      if (!mountedRef.current) return
      if (r.data?.ok) setRelated((r.data.products||[]).filter(p=>String(p.id)!==String(id)).slice(0,4))
    }).catch(()=>{})

    return ()=> { mountedRef.current = false }
  }, [id])

  // Scroll to top when navigating between products (e.g., related products)
  useEffect(()=>{
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id])

  useEffect(()=>{
    // reset image when product changes
    setActiveImage(0)
    setQty(1)
    setZoomEnabled(false)
    setZoomScale(1)
    setZoomOrigin({ x: '50%', y: '50%' })
  }, [product])

  // wheel zoom handler: when zoom enabled, listen for wheel events on the image container
  useEffect(()=>{
    const el = mainImageRef.current
    if (!el) return

    const handleWheel = (ev) => {
      if (!zoomEnabled) return
      ev.preventDefault()
      const rect = el.getBoundingClientRect()
      const x = ((ev.clientX - rect.left) / rect.width) * 100
      const y = ((ev.clientY - rect.top) / rect.height) * 100
      setZoomOrigin({ x: `${x}%`, y: `${y}%` })
      setZoomScale(s => {
        let next = s - ev.deltaY * 0.0015
        if (next < 1) next = 1
        if (next > 4) next = 4
        return Number(next.toFixed(3))
      })
    }

    if (zoomEnabled) el.addEventListener('wheel', handleWheel, { passive: false })
    return () => { el.removeEventListener('wheel', handleWheel) }
  }, [zoomEnabled])

  const images = product ? (Array.isArray(product.images) && product.images.length ? product.images : (product.image ? [product.image] : [])) : []

  const addToCart = async () => {
    if (!product) return
    if (Number(product.stock) <= 0) { addToast(t('product.outOfStock'), { type: 'error' }); return }
    try{
      await api.post('/cart/add', { product_id: Number(id), qty: Number(qty) })
      addToast(t('cart.added'), { type: 'success' })
    }catch(err){
      if (err.response && err.response.status === 401) return navigate('/login')
      console.error('addToCart', err)
      addToast(t('cart.error'), { type: 'error' })
    }
  }

  if (loading) return (
    <div className="product-detail">
      <div className="gallery">
        <div className="skeleton" style={{height:360,borderRadius:12,background:'linear-gradient(90deg,#0b1220, #071026)'}}></div>
      </div>
      <div className="details">
        <div style={{height:36,background:'linear-gradient(90deg,#0b1220,#071026)',borderRadius:6,width:'60%'}}></div>
        <div style={{height:22,background:'linear-gradient(90deg,#0b1220,#071026)',borderRadius:6,width:'30%',marginTop:12}}></div>
      </div>
    </div>
  )

  if (!product) return <div>{t('productPage.notFound')}</div>

  // Hover-based handlers: enable zoom on enter, update origin on move, disable on leave
  const handleImageEnter = (e) => {
    if (!mainImageRef.current) return
    const rect = mainImageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomOrigin({ x: `${x}%`, y: `${y}%` })
    setZoomScale(1.5)
    setZoomEnabled(true)
  }

  const handleImageMove = (e) => {
    if (!zoomEnabled || !mainImageRef.current) return
    const rect = mainImageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomOrigin({ x: `${x}%`, y: `${y}%` })
  }

  const handleImageLeave = () => {
    setZoomEnabled(false)
    setZoomScale(1)
    setZoomOrigin({ x: '50%', y: '50%' })
  }

  return (
    <div className="product-page">
      <nav className="breadcrumbs-top" aria-label="Breadcrumb">
        <Link to="/">{t('breadcrumbs.home')}</Link>
        <span>/</span>
        <Link to="/products">{t('breadcrumbs.products')}</Link>
        <span>/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <article className={`product-detail`} aria-labelledby="product-title">
      <figure className={`gallery ${zoomEnabled ? 'zoomed' : ''}`}>
        <div ref={mainImageRef} className="main-image" role="img" aria-label={product.name} onMouseEnter={handleImageEnter} onMouseMove={handleImageMove} onMouseLeave={handleImageLeave}>
          {images[activeImage] ? (
            <img src={images[activeImage]} alt={product.name} style={{ transform: `scale(${zoomScale})`, transformOrigin: `${zoomOrigin.x} ${zoomOrigin.y}` }} />
          ) : (
            <div className="placeholder">{t('products.noImage')}</div>
          )}
        </div>

        {images.length > 1 && (
          <div className="thumbs" role="list">
            {images.map((src,i)=> (
              <button key={i} role="listitem" aria-pressed={i===activeImage} className={`thumb ${i===activeImage? 'active':''}`} onClick={()=>setActiveImage(i)}>
                <img src={src} alt={`${product.name} ${i+1}`} />
              </button>
            ))}
          </div>
        )}
      </figure>

      <section className="details">
        <div className="action-card" aria-labelledby="product-title">
          <h1 id="product-title">{product.name}</h1>
          <div className="price" aria-hidden>{formatCurrency(product.price)}</div>
          <div className={`stock ${Number(product.stock) > 0 ? 'in-stock' : 'out-of-stock'}`} aria-live="polite" style={{marginTop:6}}>
            {Number(product.stock) > 0 ? t('products.inStockCount', { count: product.stock }) : t('product.outOfStock')}
          </div>

            <div className="actions" style={{marginTop:12}}>
            <label style={{display:'block',color:'var(--muted)',fontSize:13}}>{t('productPage.quantity')}</label>
            <div className="qty-control" style={{display:'flex',gap:8,alignItems:'center',marginTop:8}}>
              <button className="btn secondary" aria-label="Decrease quantity" onClick={()=> setQty(Math.max(1, Number(qty)-1))}>-</button>
              <input aria-label="Quantity" className="qty-input" type="number" min={1} value={qty} onChange={e=>setQty(Math.max(1, Number(e.target.value)||1))} />
              <button className="btn secondary" aria-label="Increase quantity" onClick={()=> setQty(Number(qty)+1)}>+</button>
              <button className="btn" onClick={addToCart} disabled={Number(product.stock) <= 0} aria-disabled={Number(product.stock) <= 0}>{t('productPage.addToCart')}</button>
            </div>
            
          </div>
        </div>
      </section>
    </article>
    
      {/* full width product info below the two-column grid */}
        <div className="product-info">
        <div className="description" style={{marginTop:18}}>
          <h3>{t('productPage.details')}</h3>
          <div style={{whiteSpace:'pre-wrap',color:'var(--text)'}}>{product.description}</div>
        </div>

        {related.length > 0 && (
          <div className="related" style={{marginTop:20}}>
            <h3>{t('productPage.related')}</h3>
            <div className="grid" style={{marginTop:12}}>
              {related.map(rp => (
                <div key={rp.id} className="product-card" onClick={()=> navigate(`/products/${rp.id}`)} style={{cursor:'pointer'}}>
                  {rp.image && <div style={{height:120,overflow:'hidden',borderRadius:8,marginBottom:8}}><img src={rp.image} alt={rp.name} style={{width:'100%',objectFit:'cover'}}/></div>}
                  <h4 style={{margin:'4px 0'}}>{rp.name}</h4>
                  <div className="price">{formatCurrency(rp.price)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
