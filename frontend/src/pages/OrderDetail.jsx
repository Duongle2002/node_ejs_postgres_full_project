import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client'

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [address, setAddress] = useState(null)

  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    ;(async () => {
      try {
        const r = await api.get(`/orders/${id}`)
        if (mounted && r.data?.ok) {
          setOrder(r.data.order)
          setItems(r.data.items || [])
          setAddress(r.data.address || null)
        }
      } catch (e) {
        console.error('Failed to load order', e)
      } finally {
        mounted && setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  const statusLabelMap = {
    pending: 'Chờ xác nhận',
    paid: 'Đã thanh toán',
    processing: 'Chờ lấy hàng',
    confirmed: 'Chờ lấy hàng',
    picked: 'Đang giao',
    shipped: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy'
  }
  const statusMap = { paid: 0, processing: 1, confirmed: 1, picked: 2, shipped: 2, delivered: 3 }
  const activeStep = useMemo(() => (statusMap[order?.status] !== undefined ? statusMap[order.status] : 0), [order?.status])
  const cancellable = ['paid','processing','confirmed']

  const doCancel = async () => {
    setSaving(true)
    try {
      const r = await api.post(`/orders/${order.id}/cancel`, { reason: cancelReason })
      if (r.data?.ok) {
        setOrder({ ...order, status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: cancelReason })
        setShowCancel(false)
      }
    } catch (e) {
      const code = e && e.response && e.response.data && e.response.data.error
      if (code === 'reason_required') alert('Vui lòng nhập lý do hủy')
      else if (code === 'cannot_cancel') alert('Không thể hủy đơn ở trạng thái hiện tại')
      else alert('Không thể hủy đơn')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!order) return <div>Not found</div>

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:12}}>
        <h1>Chi tiết đơn hàng #{order.id}</h1>
        <span className={`status-chip status-${String(order.status||'').toLowerCase()}`}>{statusLabelMap[order.status] || order.status}</span>
      </div>

      {/* Stepper */}
      <div className="action-card" style={{marginBottom:16}}>
        <div className="step-row">
          {['Chờ xác nhận','Chờ lấy hàng','Chờ giao hàng','Đã giao'].map((label, idx) => (
            <div key={idx} className="step-box">
              <div className={idx<=activeStep ? 'step--done' : ''}>
                <div className="step-circle">{idx+1}</div>
              </div>
              <div className={`step-label ${idx===activeStep ? 'step--active' : ''}`}>{label}</div>
              {idx < 3 && <div className={`step-bar ${idx<activeStep ? 'step--done' : ''}`}></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Cancel banner */}
      {order.status === 'cancelled' && (
        <div className="action-card cancel-banner" style={{marginBottom:16}}>
          <strong>Đơn hàng đã bị hủy</strong>
          {order.cancellation_reason && <div style={{marginTop:6}}>Lý do: {order.cancellation_reason}</div>}
          {order.cancelled_at && <div style={{marginTop:6}} className="muted">Thời gian: {new Date(order.cancelled_at).toLocaleString()}</div>}
        </div>
      )}

      {/* Payment + Address */}
      <div className="action-card" style={{marginBottom:16}}>
        <div className="muted">Phương thức thanh toán: <strong>{order.payment_method}</strong></div>
        <div style={{marginTop:8}}>
          <strong>{(address && (address.full_name)) || ''} <span className="muted">{address && address.phone ? `(${address.phone})` : '(—)'}</span></strong>
          {address && (
            <div className="muted" style={{marginTop:6}}>
              {address.line1}
              {address.line2 ? ", "+address.line2 : ''}, {address.city || ''} {address.state || ''} {address.postal_code || ''}, {address.country || ''}
            </div>
          )}
        </div>
      </div>

      {/* Products */}
      <div className="action-card" style={{marginBottom:16}}>
        <h3 style={{marginTop:0}}>Sản phẩm</h3>
        <div className="product-list">
          {items.map(it => (
            <div key={it.id || it.product_id} className="product-row">
              <div className="product-thumb">
                {(it.image || it.product_image)
                  ? (<img src={it.image || it.product_image} alt={it.name || ''} />)
                  : (<div className="muted">No image</div>)}
              </div>
              <div className="product-meta">
                <div>
                  <div className="title">{it.name}</div>
                  <div className="muted">Số lượng: {it.quantity}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div>${Number(it.price).toFixed(2)}</div>
                  <div style={{fontWeight:600}}>${(Number(it.price)*Number(it.quantity)).toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
          {items.length===0 && <div className="muted">Không có sản phẩm.</div>}
        </div>
      </div>

      {/* Actions + Totals */}
      <div className="action-card" style={{display:'flex', gap:12, alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap'}}>
        <div style={{flex:1, minWidth:200}}>
          <div className="order-actions">
            {cancellable.includes(order.status) && (
              <button className="btn secondary" onClick={()=> setShowCancel(true)}>Hủy đơn hàng</button>
            )}
            {order.status === 'delivered' && (
              <button className="btn secondary" onClick={()=> setShowCancel(true)}>Yêu cầu hủy đơn (Đã giao)</button>
            )}
            <a href="#" className="btn secondary">Nhắn tin với shop</a>
          </div>
        </div>
        <div className="totals-box">
          <h4 style={{margin:0, marginBottom:8}}>Tổng cộng</h4>
          <div className="row"><span>Tổng tiền hàng</span><strong>${(Number(order.total) - Number(order.shipping_fee||0)).toFixed(2)}</strong></div>
          <div className="row"><span>Phí vận chuyển</span><strong>${Number(order.shipping_fee||0).toFixed(2)}</strong></div>
          <div className="row" style={{fontSize:16}}><span>Tổng</span><strong>${Number(order.total).toFixed(2)}</strong></div>
        </div>
      </div>

      {/* Cancel modal */}
      {showCancel && (
        <div className="confirm-overlay" onClick={(e)=>{ if (e.target===e.currentTarget) setShowCancel(false) }}>
          <div className="confirm-dialog">
            <h3>Lý do hủy đơn</h3>
            <p className="muted">Vui lòng mô tả lý do bạn muốn hủy đơn.</p>
            <textarea style={{marginTop:8}} value={cancelReason} onChange={e=> setCancelReason(e.target.value)} />
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:10}}>
              <button className="btn secondary" onClick={()=> setShowCancel(false)}>Hủy</button>
              <button className="btn" disabled={saving} onClick={doCancel}>{saving? 'Đang gửi...' : 'Gửi yêu cầu hủy'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
