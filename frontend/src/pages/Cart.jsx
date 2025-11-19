import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../state/ToastContext'

export default function Cart() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()
  const { addToast } = useToast()
  const [confirm, setConfirm] = useState({ open: false })

  const load = () => {
    setLoading(true)
    api.get('/cart').then(r => {
      if (r.data?.ok) setItems(r.data.items || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const updateQty = async (product_id, qty) => {
    // optimistic update: update local UI immediately, call API in background
    const prev = items
    setItems(cur => cur.map(it => it.product_id === product_id ? { ...it, qty } : it))
    try {
      await api.post('/cart/update', { product_id, qty })
    } catch (err) {
      // revert and notify
      setItems(prev)
      addToast('Unable to update quantity', { type: 'error' })
    }
  }

  const removeItem = async (product_id) => {
    const prev = items
    setItems(cur => cur.filter(i => i.product_id !== product_id))
    try {
      await api.post('/cart/remove', { product_id })
      addToast('Removed from cart', { type: 'info' })
    } catch (err) {
      setItems(prev)
      addToast('Unable to remove item', { type: 'error' })
    }
  }

  const clear = async () => {
    const prev = items
    setItems([])
    try {
      await api.post('/cart/clear')
      addToast('Cart cleared', { type: 'info' })
    } catch (err) {
      setItems(prev)
      addToast('Unable to clear cart', { type: 'error' })
    }
  }

  const openConfirmRemove = (product_id, name) => {
    setConfirm({ open: true, action: 'remove', product_id, message: `Remove "${name}" from cart?` })
  }

  const openConfirmClear = () => {
    setConfirm({ open: true, action: 'clear', message: 'Clear the entire cart? This cannot be undone.' })
  }

  const handleConfirm = async () => {
    if (confirm.action === 'remove') {
      await removeItem(confirm.product_id)
    } else if (confirm.action === 'clear') {
      await clear()
    }
    setConfirm({ open: false })
  }

  const handleCancel = () => setConfirm({ open: false })

  const total = items.reduce((s,it)=> s + Number(it.price)*Number(it.qty), 0)

  return (
    <div>
      <h1>Cart</h1>
      {loading ? <div>Loading...</div> : (
        items.length === 0 ? (
          <div>Cart is empty. <Link to="/products">Shop now</Link></div>
        ) : (
          <>
            <table>
              <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.product_id}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        {it.image && (
                          <div style={{width:56,height:56,overflow:'hidden',borderRadius:8,flex:'0 0 auto',background:'rgba(0,0,0,0.06)'}}>
                            <img src={it.image} alt={it.name||`Product ${it.product_id}`} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                          </div>
                        )}
                        <div style={{display:'flex',flexDirection:'column'}}>
                          <Link to={`/products/${it.product_id}`} style={{textDecoration:'none'}}>{it.name || it.product_id}</Link>
                          {/* Optional: show slug or short meta here if desired */}
                        </div>
                      </div>
                    </td>
                    <td>${Number(it.price).toFixed(2)}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <button className="btn secondary" onClick={() => {
                          // if qty is 1, confirm removal
                          if (Number(it.qty) <= 1) return openConfirmRemove(it.product_id, it.name)
                          updateQty(it.product_id, Number(it.qty) - 1)
                        }}>-</button>
                        <div style={{minWidth:48,textAlign:'center'}}>{it.qty}</div>
                        <button className="btn secondary" onClick={() => updateQty(it.product_id, Number(it.qty) + 1)}>+</button>
                      </div>
                    </td>
                    <td>${(Number(it.price)*Number(it.qty)).toFixed(2)}</td>
                    <td><button className="btn secondary" onClick={()=>openConfirmRemove(it.product_id, it.name)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12}}>
              <button className="btn secondary" onClick={openConfirmClear}>Clear</button>
              <div style={{display:'flex', alignItems:'center', gap:12}}>
                <div className="price">Total: ${total.toFixed(2)}</div>
                <button className="btn" onClick={()=>nav('/checkout')}>Proceed to Checkout</button>
              </div>
            </div>
          </>
        )
      )}
        <ConfirmDialog open={confirm.open} title="Confirm" message={confirm.message} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  )
}
