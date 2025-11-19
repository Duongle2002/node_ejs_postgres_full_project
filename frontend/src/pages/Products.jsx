import { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useToast } from '../state/ToastContext'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState({ page:1, limit:20, total:0 })
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') || ''
  const page = Number(sp.get('page') || 1)

  useEffect(() => {
    setLoading(true)
    api.get('/products', { params: { q, page, limit: 20 } }).then(r => {
      if (r.data?.ok) { setProducts(r.data.products); setMeta(r.data.meta) }
    }).finally(() => setLoading(false))
  }, [q, page])

  const next = () => setSp({ q, page: String(page+1) })
  const prev = () => setSp({ q, page: String(Math.max(1,page-1)) })
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

  return (
    <div>
      <h1>Products</h1>
      <form className="form" onSubmit={e=>{e.preventDefault(); setSp({ q: e.currentTarget.q.value, page:'1' })}}>
        <input name="q" defaultValue={q} placeholder="Search" />
        <div><button className="btn" type="submit">Search</button></div>
      </form>
      {loading ? <div>Loading...</div> : (
        <>
          <div className="grid" style={{marginTop:12}}>
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
          <div style={{marginTop:12, display:'flex', gap:8, alignItems:'center'}}>
            <button className="btn secondary" onClick={prev} disabled={meta.page<=1}>Prev</button>
            <span className="muted">Page {meta.page} / {Math.max(1, Math.ceil(meta.total/(meta.limit||20)))}</span>
            <button className="btn secondary" onClick={next} disabled={meta.page >= Math.ceil(meta.total/(meta.limit||20))}>Next</button>
          </div>
        </>
      )}
    </div>
  )
}
