import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import AdminLayout from '../../components/AdminLayout'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  useEffect(() => { api.get('/orders/admin/all').then(r => { if (r.data?.ok) setOrders(r.data.orders) }) }, [])
  const rate = 25000
  const fmtBoth = (usd) => { const n=Number(usd||0); const v=Math.round(n*rate).toLocaleString('vi-VN')+'₫'; return v+' / $'+n.toFixed(2) }
  const chipClass = (s) => 'status-chip status-'+s
  const filtered = orders.filter(o => {
    const textOk = !q || String(o.id).includes(q) || String(o.user_id).includes(q)
    const statusOk = !status || o.status === status
    return textOk && statusOk
  })
  return (
    <AdminLayout title="Đơn hàng">
      <div className="admin-card" style={{display:'grid',gap:12,marginBottom:12}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
          <label style={{display:'flex',flexDirection:'column',gap:6,fontSize:13,color:'var(--muted)'}}>Tìm kiếm (ID hoặc User)
            <input placeholder="VD: 12" value={q} onChange={e=>setQ(e.target.value)} />
          </label>
          <label style={{display:'flex',flexDirection:'column',gap:6,fontSize:13,color:'var(--muted)'}}>Trạng thái
            <select value={status} onChange={e=>setStatus(e.target.value)}>
              <option value="">-- tất cả --</option>
              {['pending','paid','processing','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
        {(q||status) && <div className="admin-actions"><button className="btn secondary" onClick={()=>{setQ('');setStatus('')}}>Xóa lọc</button></div>}
      </div>
      <table className="admin-table">
        <thead><tr><th>ID</th><th>User</th><th>Trạng thái</th><th>Tổng (VND/USD)</th><th>Ngày</th><th>Hành động</th></tr></thead>
        <tbody>
          {filtered.map(o => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.user_id}</td>
              <td><span className={chipClass(o.status)}>{o.status}</span></td>
              <td>{fmtBoth(o.total)}</td>
              <td>{new Date(o.created_at).toLocaleString()}</td>
              <td className="admin-inline-actions"><Link className="btn secondary" style={{padding:'6px 10px',fontSize:12}} to={`/admin/orders/${o.id}`}>Xem</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  )
}
