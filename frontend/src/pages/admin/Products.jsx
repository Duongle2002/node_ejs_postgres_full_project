import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import AdminLayout from '../../components/AdminLayout'
import { useToast } from '../../state/ToastContext'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [q, setQ] = useState('')
  const [stockMax, setStockMax] = useState('')
  const nav = useNavigate()
  const { addToast } = useToast()
  const load = () => api.get('/products').then(r => { if (r.data?.ok) setProducts(r.data.products) })
  useEffect(() => { load() }, [])

  const remove = async (id) => {
    if (!confirm('Xóa sản phẩm?')) return
    await api.delete(`/products/${id}`)
    addToast('Đã xóa sản phẩm', { type:'success' })
    load()
  }

  const rate = 25000
  const fmtBoth = (usd) => {
    const n = Number(usd||0); const v = Math.round(n*rate).toLocaleString('vi-VN')+'₫'
    return v + ' / $' + n.toFixed(2)
  }

  const filtered = products.filter(p => {
    const textOk = !q || (p.name||'').toLowerCase().includes(q.toLowerCase()) || (p.slug||'').toLowerCase().includes(q.toLowerCase())
    const stockOk = !stockMax || (Number(p.stock)||0) <= Number(stockMax)
    return textOk && stockOk
  })

  return (
    <AdminLayout title="Sản phẩm">
      <div className="admin-card" style={{display:'grid',gap:12,marginBottom:12}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
          <label style={{display:'flex',flexDirection:'column',gap:6,fontSize:13,color:'var(--muted)'}}>Tìm kiếm
            <input placeholder="Tên hoặc slug" value={q} onChange={e=>setQ(e.target.value)} />
          </label>
          <label style={{display:'flex',flexDirection:'column',gap:6,fontSize:13,color:'var(--muted)'}}>Tồn kho tối đa
            <input type="number" placeholder="<=" value={stockMax} onChange={e=>setStockMax(e.target.value)} />
          </label>
        </div>
        <div className="admin-actions">
          <button className="btn" onClick={()=>nav('/admin/products/new')}>Thêm sản phẩm</button>
          {(q||stockMax) && <button className="btn secondary" onClick={()=>{setQ('');setStockMax('')}}>Xóa lọc</button>}
        </div>
      </div>
      <table className="admin-table">
        <thead><tr><th>ID</th><th>Tên</th><th>Giá (VND/USD)</th><th>Tồn kho</th><th>Hình</th><th>Hành động</th></tr></thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{fmtBoth(p.price)}</td>
              <td>{p.stock}</td>
              <td>{p.image ? <img src={p.image} alt="thumb" style={{width:46,height:34,objectFit:'cover',borderRadius:6}}/> : <span className="muted-small">(no img)</span>}</td>
              <td className="admin-inline-actions">
                <Link to={`/admin/products/${p.id}`} className="btn secondary" style={{padding:'6px 10px',fontSize:12}}>Sửa</Link>
                <button className="btn secondary" style={{padding:'6px 10px',fontSize:12}} onClick={()=>remove(p.id)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  )
}
