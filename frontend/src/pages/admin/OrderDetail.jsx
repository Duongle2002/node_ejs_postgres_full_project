import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/client'
import AdminLayout from '../../components/AdminLayout'

export default function AdminOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [address, setAddress] = useState(null)
  const [products, setProducts] = useState([])
  const [status, setStatus] = useState('')

  const load = () => api.get(`/orders/${id}`).then(r => { if (r.data?.ok) { setOrder(r.data.order); setItems(r.data.items); setAddress(r.data.address||null); setStatus(r.data.order.status) } })
  useEffect(() => { load(); api.get('/products').then(r=>{ if(r.data?.ok) setProducts(r.data.products) }) }, [id])

  const save = async () => { await api.put(`/orders/admin/${id}`, { status }); load() }

  const rate = 25000
  const fmtBoth = (usd) => { const n=Number(usd||0); const v=Math.round(n*rate).toLocaleString('vi-VN')+'₫'; return v+' / $'+n.toFixed(2) }
  const productIndex = Object.fromEntries(products.map(p=>[p.id,p]))
  if (!order) return <AdminLayout title="Đơn hàng"><div>Đang tải...</div></AdminLayout>
  return (
    <AdminLayout title={`Đơn hàng #${order.id}`}>
      <div style={{display:'grid',gap:18}}>
        <div className="admin-card" style={{display:'grid',gap:10}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16}}>
            <div style={{display:'grid',gap:6}}>
              <div><strong>Tên khách hàng:</strong> {(address && address.full_name) || order.customer || 'N/A'}</div>
              <div><strong>Email:</strong> {order.email || 'N/A'}</div>
              {address && <div><strong>SĐT:</strong> {address.phone || 'N/A'}</div>}
              {address && (
                <div>
                  <strong>Địa chỉ:</strong>{' '}
                  {[address.line1, address.line2, address.city, address.state, address.postal_code, address.country]
                    .filter(Boolean)
                    .join(', ') || 'N/A'}
                </div>
              )}
              <div><strong>Ngày tạo:</strong> {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}</div>
            </div>
            <div style={{display:'flex',gap:18,alignItems:'center'}}>
              <div><strong>Tổng:</strong> {fmtBoth(order.total)}</div>
              <div className="admin-inline-actions">
                <label style={{display:'flex',flexDirection:'column',gap:6,fontSize:13,color:'var(--muted)'}}>Trạng thái
                  <select value={status} onChange={e=>setStatus(e.target.value)}>
                    {['pending','paid','processing','shipped','cancelled','refunded'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <button onClick={save} className="btn secondary" style={{padding:'8px 14px'}}>Cập nhật</button>
              </div>
            </div>
          </div>
          <div>
            <Link to="/admin/orders" className="btn secondary" style={{padding:'6px 10px',fontSize:12}}>← Quay lại</Link>
          </div>
        </div>
        <div className="admin-card" style={{display:'flex',flexDirection:'column',gap:14}}>
          <h3 style={{margin:'0 0 4px'}}>Sản phẩm</h3>
          {!items.length && <div className="muted">Đơn hàng không có sản phẩm.</div>}
          {!!items.length && (
            <table className="admin-table" style={{margin:0}}>
              <thead><tr><th>Hình</th><th>Tên</th><th>Giá</th><th>SL</th><th>Tạm tính</th></tr></thead>
              <tbody>
                {items.map(it => {
                  const p = productIndex[it.product_id] || {}
                  const img = it.image || p.image
                  const subtotalUsd = Number(it.price)*Number(it.quantity)
                  return (
                    <tr key={it.id}>
                      <td>{img ? <img src={img} alt="thumb" style={{width:54,height:40,objectFit:'cover',borderRadius:6}}/> : <span className="muted-small">no img</span>}</td>
                      <td>{it.name || ('#'+it.product_id)}</td>
                      <td>{fmtBoth(it.price)}</td>
                      <td>{it.quantity}</td>
                      <td>{fmtBoth(subtotalUsd)}</td>
                    </tr>
                  )
                })}
                <tr>
                  <td colSpan={4} style={{textAlign:'right',fontWeight:600}}>Tổng cộng</td>
                  <td style={{fontWeight:700}}>{fmtBoth(order.total)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
