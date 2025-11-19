import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

export default function OrderHistory() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    api.get('/orders').then(r => { if (r.data?.ok) setOrders(r.data.orders) })
  }, [])

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:12}}>
        <h1>Đơn hàng của tôi</h1>
        <div className="muted">Tổng: {orders.length}</div>
      </div>

      <div className="action-card">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Trạng thái</th>
              <th>Tổng tiền</th>
              <th>Ngày tạo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>
                  <span className={`status-chip status-${String(o.status||'').toLowerCase()}`}>{o.status}</span>
                </td>
                <td>${Number(o.total).toFixed(2)}</td>
                <td>{new Date(o.created_at).toLocaleString()}</td>
                <td style={{textAlign:'right'}}>
                  <Link className="btn secondary" to={`/orders/${o.id}`}>Xem</Link>
                </td>
              </tr>
            ))}
            {orders.length===0 && (
              <tr><td colSpan={5} className="muted">Chưa có đơn hàng.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
