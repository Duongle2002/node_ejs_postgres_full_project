import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import axios from 'axios'
import { useToast } from '../state/ToastContext'

export default function Checkout(){
  const [cart, setCart] = useState([])
  const [addresses, setAddresses] = useState([])
  const [addressId, setAddressId] = useState('')
  const defaultAddress = useMemo(()=> addresses.find(a=>a.is_default), [addresses])
  const selectedAddress = useMemo(()=> addresses.find(a=> String(a.id)===String(addressId)), [addresses, addressId])
  const [shipMethod, setShipMethod] = useState('standard')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [placing, setPlacing] = useState(false)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [newAddress, setNewAddress] = useState({ name:'', address:'', city:'', phone:'', is_default:false })
  const { addToast } = useToast()
  const nav = useNavigate()

  useEffect(()=>{
    loadCart()
    loadAddresses()
  }, [])

  const loadCart = async () => {
    try{
      const r = await api.get('/cart')
      setCart(r.data.items || [])
    }catch(e){ setCart([]) }
  }

  const loadAddresses = async () => {
    try{
      const r = await api.get('/addresses')
      if (r.data?.ok){
        const list = r.data.addresses || []
        setAddresses(list)
        // auto-select default if no selection
        if (!addressId && list.length){
          const def = list.find(a=>a.is_default)
          if (def) setAddressId(String(def.id))
          else setAddressId(String(list[0].id))
        }
        return list
      }
      return []
    }catch(e){ setAddresses([]); return [] }
  }

  const itemsTotal = cart.reduce((s,it)=> s + Number(it.price)*Number(it.qty), 0)
  // currency conversion heuristic (frontend default) — backend displays properly in server-rendered views
  const USD_TO_VND = 25000
  const shippingVnd = shipMethod === 'express' ? 50000 : 25000
  const itemsTotalVnd = Math.round(itemsTotal * USD_TO_VND)
  const totalVnd = itemsTotalVnd + shippingVnd

  const createAddress = async () => {
    if (!newAddress.address || !newAddress.city) return addToast('Please fill address and city', { type: 'error' })
    try{
      const r = await api.post('/addresses', newAddress)
      if (r.data?.ok){
        addToast('Đã thêm địa chỉ', { type: 'success' })
        setNewAddress({ name:'', address:'', city:'', phone:'', is_default:false })
        // Select the newly created address immediately
        if (r.data.id){ setAddressId(String(r.data.id)) }
        await loadAddresses()
        setAddressModalOpen(false)
      }
    }catch(e){ addToast('Unable to add address', { type: 'error' }) }
  }

  const deleteAddress = async (id) => {
    const ok = window.confirm('Xóa địa chỉ này?')
    if (!ok) return
    try{
      const r = await api.delete(`/addresses/${id}`)
      if (r.data?.ok){
        addToast('Đã xóa địa chỉ', { type: 'success' })
        const list = await loadAddresses()
        // clear selection if it was deleted
        if (String(addressId) === String(id)){
          const def = (list||[]).find(a=>a.is_default)
          if (def) setAddressId(String(def.id))
          else if (list.length){ setAddressId(String(list[0].id)) }
          else setAddressId('')
        }
      }
    }catch(e){
      const code = e && e.response && e.response.data && e.response.data.error
      if (code === 'address_in_use') {
        addToast('Địa chỉ đã được dùng trong đơn hàng, không thể xóa.', { type: 'error' })
      } else {
        addToast('Không thể xóa', { type: 'error' })
      }
    }
  }

  const setDefaultAddress = async (a) => {
    try{
      const body = { full_name: a.full_name || a.name, phone: a.phone, line1: a.line1 || a.address, city: a.city, is_default: true }
      const r = await api.put(`/addresses/${a.id}`, body)
      if (r.data?.ok){
        addToast('Đã đặt làm mặc định', { type: 'success' })
        await loadAddresses()
        setAddressId(String(a.id))
      }
    }catch(e){ addToast('Không thể đặt mặc định', { type: 'error' }) }
  }

  const placeOrder = async () => {
    if (!addressId) return addToast('Please select a shipping address', { type: 'error' })
    setPlacing(true)
    try{
      const payload = { payment_method: paymentMethod, address_id: Number(addressId), ship_method: shipMethod, client: 'frontend' }
      const r = await api.post('/orders/create', payload)
      // PayPal returns PayPal order object (order.result) with approval link
      if (paymentMethod === 'paypal'){
        const links = (r.data && r.data.links) ? r.data.links : (r.data && r.data.result && r.data.result.links) ? r.data.result.links : null
        const approve = (links || []).find(l=>l.rel==='approve')
        if (approve && approve.href){
          // redirect browser to PayPal approval
          window.location.href = approve.href
          return
        }
        // fallback: if api returned orderId or redirect
        if (r.data?.orderId) { nav(`/orders/${r.data.orderId}`); return }
      }
      // COD and other methods: server returns redirect or orderId
      if (r.data && r.data.redirect) {
        nav(r.data.redirect)
        return
      }
      if (r.data && r.data.orderId){
        nav(`/orders/${r.data.orderId}`)
        return
      }
      addToast('Order placed', { type: 'success' })
      nav('/success')
    }catch(e){
      console.error('placeOrder', e)
      addToast('Failed to place order', { type: 'error' })
    } finally { setPlacing(false) }
  }

  const [qrImg, setQrImg] = useState(null)
  const [qrNote, setQrNote] = useState(null)
  const [qrTotal, setQrTotal] = useState(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  // Auto-generate VietQR when user selects the payment method and has chosen an address.
  useEffect(() => {
    if (paymentMethod === 'vietqr') {
      if (addressId && !qrImg && !qrLoading) {
        startVietQR();
      }
    } else {
      // Clear QR when switching away from VietQR to avoid stale state
      if (qrImg) {
        setQrImg(null); setQrNote(null); setQrTotal(null);
      }
    }
  }, [paymentMethod, addressId, qrImg, qrLoading]);

  const startVietQR = async () => {
    if (!addressId) return addToast('Vui lòng chọn địa chỉ giao hàng', { type: 'error' })
    setQrLoading(true)
    try{
      const payload = { payment_method: 'vietqr', address_id: Number(addressId), ship_method: shipMethod, client: 'frontend' }
      const r = await api.post('/orders/create', payload)
      if (r.data && r.data.imgUrl){
        setQrImg(r.data.imgUrl)
        setQrNote(r.data.note)
        setQrTotal(r.data.total)
        addToast('QR đã sẵn sàng. Quét để thanh toán.', { type: 'info' })
      } else if (r.data && r.data.error){
        addToast(r.data.error, { type: 'error' })
      } else {
        addToast('Không thể tạo QR', { type: 'error' })
      }
    }catch(e){
      console.error('startVietQR', e)
      addToast('Lỗi khi tạo QR', { type: 'error' })
    } finally { setQrLoading(false) }
  }

  const confirmVietQR = async () => {
    setConfirming(true)
    try{
      const r = await axios.post('/order/qr/confirm', {}, { withCredentials: true })
      if (r.data && r.data.ok && r.data.redirect){
        addToast('Thanh toán thành công', { type: 'success' })
        nav(r.data.redirect)
      } else {
        addToast('Xác nhận thất bại', { type: 'error' })
      }
    }catch(e){
      console.error('confirmVietQR', e)
      addToast('Lỗi khi xác nhận QR', { type: 'error' })
    } finally { setConfirming(false) }
  }
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h1>Thanh toán</h1>
        <a href="/cart" className="btn secondary">← Quay lại giỏ hàng</a>
      </div>

      {/* Top: Address block full-width */}
      <div style={{marginBottom:24}}>
        <h3>Địa chỉ nhận hàng</h3>
        {selectedAddress ? (
          <div className="action-card" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
            <div>
              <div style={{fontWeight:700}}>
                {selectedAddress.full_name || selectedAddress.name || 'Địa chỉ'} {selectedAddress.is_default ? <span className="muted" style={{fontWeight:400,marginLeft:6}}>(mặc định)</span> : null}
              </div>
              <div className="muted">{selectedAddress.line1 || selectedAddress.address}, {selectedAddress.city} {selectedAddress.phone? ' — '+selectedAddress.phone : ''}</div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn" onClick={()=>setAddressModalOpen(true)}>Thêm địa chỉ</button>
            </div>
          </div>
        ) : (
          <div className="action-card" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
            <div className="muted">Chưa có địa chỉ. Vui lòng thêm địa chỉ.</div>
            <button className="btn" onClick={()=>setAddressModalOpen(true)}>Thêm địa chỉ</button>
          </div>
        )}
      </div>

      {/* Bottom: Two columns - Products+Shipping | Payment */}
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:24,alignItems:'start'}}>
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
            <h3>Sản phẩm</h3>
            <div className="muted">Tạm tính: {itemsTotalVnd.toLocaleString('vi-VN')}₫</div>
          </div>

          <div className="action-card" style={{marginTop:12}}>
            {cart.map(it => (
              <div key={it.product_id} style={{display:'flex',gap:12,alignItems:'center',padding:'12px 0',borderBottom:'1px dashed rgba(255,255,255,0.02)'}}>
                {it.image && <img src={it.image} alt="" style={{width:80,height:60,objectFit:'cover',borderRadius:6}} />}
                <div style={{flex:1}}>
                  <div style={{fontWeight:700}}>{it.name}</div>
                  <div className="muted">Số lượng: {it.qty}</div>
                </div>
                <div style={{textAlign:'right'}}>{(Number(it.price)*Number(it.qty)*USD_TO_VND).toLocaleString('vi-VN')}₫</div>
              </div>
            ))}

            <div style={{marginTop:12,display:'grid',gap:8}}>
              <div style={{display:'flex',justifyContent:'space-between'}}><div className="muted">Tạm tính sản phẩm:</div><div>{itemsTotalVnd.toLocaleString('vi-VN')}₫</div></div>
              <div style={{display:'flex',justifyContent:'space-between'}}><div className="muted">Phí vận chuyển:</div><div>{shippingVnd.toLocaleString('vi-VN')}₫</div></div>
              <div style={{display:'flex',justifyContent:'space-between',fontWeight:800}}><div>Tổng cộng:</div><div>{totalVnd.toLocaleString('vi-VN')}₫</div></div>
            </div>
          </div>

          <div style={{marginTop:18}}>
            <h3>Phương thức vận chuyển</h3>
            <div className="pay-options" style={{marginTop:8, maxWidth:420}}>
              <button type="button" className={`pay-option ${shipMethod==='standard' ? 'selected' : ''}`} onClick={()=>setShipMethod('standard')}>
                <div className="label">Tiêu chuẩn</div>
                <div className="desc muted">(3-5 ngày) — 25.000₫</div>
              </button>
              <button type="button" className={`pay-option ${shipMethod==='express' ? 'selected' : ''}`} onClick={()=>setShipMethod('express')}>
                <div className="label">Nhanh</div>
                <div className="desc muted">(1-2 ngày) — 50.000₫</div>
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="action-card">
            <h3>Phương thức thanh toán</h3>
            <div className="pay-options" style={{marginTop:8}}>
              <button type="button" className={`pay-option ${paymentMethod==='paypal' ? 'selected' : ''}`} onClick={()=>setPaymentMethod('paypal')}>
                <div className="label">PayPal</div>
                <div className="desc muted">Thanh toán quốc tế qua PayPal</div>
              </button>
              <button type="button" className={`pay-option ${paymentMethod==='vietqr' ? 'selected' : ''}`} onClick={()=>setPaymentMethod('vietqr')}>
                <div className="label">Chuyển khoản (VietQR)</div>
                <div className="desc muted">Quét mã QR để chuyển khoản nhanh</div>
              </button>
              <button type="button" className={`pay-option ${paymentMethod==='cod' ? 'selected' : ''}`} onClick={()=>setPaymentMethod('cod')}>
                <div className="label">Thanh toán khi nhận hàng (COD)</div>
                <div className="desc muted">Trả tiền mặt cho shipper</div>
              </button>
            </div>

            <div style={{marginTop:16}}>
              {paymentMethod === 'vietqr' ? (
                qrImg ? (
                  <div style={{display:'grid',gap:8}}>
                    <div className="muted">Ghi chú: {qrNote}</div>
                    <div style={{display:'flex',justifyContent:'center'}}>
                      <img src={qrImg} alt="VietQR" style={{maxWidth:240,borderRadius:10}} />
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div className="muted">Tổng: {totalVnd.toLocaleString('vi-VN')}₫</div>
                      <div style={{display:'flex',gap:8}}>
                        <button className="btn success" disabled={confirming} onClick={confirmVietQR}>{confirming? 'Xác nhận...' : 'Tôi đã thanh toán'}</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="muted">
                    {qrLoading ? 'Đang tạo mã QR…' : (!addressId ? 'Chọn địa chỉ để tạo QR tự động.' : 'Đang chuẩn bị QR…')}
                  </div>
                )
              ) : (
                <button className="btn" disabled={placing} onClick={placeOrder}>{placing? 'Đang xử lý...' : 'Thanh toán'}</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address management modal */}
      {addressModalOpen && (
        <div className="confirm-overlay" onClick={(e)=>{ if (e.target===e.currentTarget) setAddressModalOpen(false) }}>
          <div className="confirm-dialog">
            <h3>Địa chỉ của tôi</h3>
            <p className="muted">Thêm mới, đặt mặc định hoặc xóa địa chỉ.</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginTop:12}}>
              <div>
                <h4>Danh sách</h4>
                <div style={{display:'grid',gap:8,maxHeight:260,overflow:'auto',paddingRight:6}}>
                  {addresses.map(a=> (
                    <div
                      key={a.id}
                      style={{
                        border:'1px solid rgba(255,255,255,0.06)',
                        borderRadius:8,
                        padding:10,
                        display:'grid',
                        gap:6,
                        outline: String(a.id)===String(addressId) ? '2px solid var(--accent)' : 'none'
                      }}
                    >
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div style={{fontWeight:700}}>
                          {a.full_name || a.name || 'Địa chỉ'}
                          {a.is_default && <span className="muted" style={{fontWeight:400,marginLeft:6}}>(mặc định)</span>}
                          {String(a.id)===String(addressId) && (
                            <span className="muted" style={{marginLeft:8,background:'rgba(255,255,255,0.06)',padding:'2px 6px',borderRadius:6,fontSize:12}}>đang chọn</span>
                          )}
                        </div>
                        <div style={{display:'flex',gap:6}}>
                          {!a.is_default && <button className="btn" onClick={()=>setDefaultAddress(a)}>Đặt mặc định</button>}
                          <button className="btn secondary" onClick={()=>deleteAddress(a.id)}>Xóa</button>
                        </div>
                      </div>
                      <div className="muted">{a.line1 || a.address}, {a.city} {a.phone? ' — '+a.phone : ''}</div>
                      <div>
                        {String(a.id)===String(addressId) ? (
                          <span className="muted" style={{fontWeight:600}}>Đang được chọn</span>
                        ) : (
                          <button className="btn secondary" onClick={()=>{ setAddressId(String(a.id)); setAddressModalOpen(false) }}>Chọn địa chỉ này</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {addresses.length===0 && <div className="muted">Chưa có địa chỉ.</div>}
                </div>
              </div>
              <div>
                <h4>Thêm địa chỉ mới</h4>
                <form className="form" onSubmit={e=>{ e.preventDefault(); createAddress() }}>
                  <label>Họ tên<input value={newAddress.name} onChange={e=>setNewAddress({...newAddress, name: e.target.value})} placeholder="Tên người nhận" /></label>
                  <label>Địa chỉ<input value={newAddress.address} onChange={e=>setNewAddress({...newAddress, address: e.target.value})} placeholder="Địa chỉ (số nhà, đường)" /></label>
                  <label>Thành phố<input value={newAddress.city} onChange={e=>setNewAddress({...newAddress, city: e.target.value})} placeholder="Thành phố" /></label>
                  <label>Điện thoại<input value={newAddress.phone} onChange={e=>setNewAddress({...newAddress, phone: e.target.value})} placeholder="Số điện thoại" /></label>
                  <label style={{display:'flex',alignItems:'center',gap:8}}>
                    <input type="checkbox" checked={newAddress.is_default} onChange={e=>setNewAddress({...newAddress, is_default: e.target.checked})} /> Đặt làm mặc định
                  </label>
                  <div style={{display:'flex',gap:8}}>
                    <button className="btn" type="submit">Lưu</button>
                    <button type="button" className="btn secondary" onClick={()=>setAddressModalOpen(false)}>Đóng</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
