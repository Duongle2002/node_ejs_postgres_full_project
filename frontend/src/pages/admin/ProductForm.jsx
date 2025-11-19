import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'
import AdminLayout from '../../components/AdminLayout'
import { useToast } from '../../state/ToastContext'

export default function AdminProductForm({ mode }) {
  const { id } = useParams()
  const nav = useNavigate()
  const isEdit = mode === 'edit'
  const [product, setProduct] = useState({ name:'', slug:'', price:0, stock:0, short_description:'', description:'' })
  const { addToast } = useToast()

  useEffect(() => {
    if (isEdit && id) {
      api.get(`/products/${id}`).then(r => { if (r.data?.ok) setProduct(r.data.product) })
    }
  }, [isEdit, id])

  const onSubmit = async (e) => {
    e.preventDefault()
    const body = { slug: product.slug, name: product.name, price: Number(product.price)||0, stock: Number(product.stock)||0, short_description: product.short_description, description: product.description }
    if (isEdit) await api.put(`/products/${id}`, body)
    else await api.post('/products', body)
    nav('/admin/products')
  }

  const set = (k,v)=> setProduct(p=>({...p,[k]:v}))

  const rate = 25000
  const vndPreview = Math.round(Number(product.price||0)*rate).toLocaleString('vi-VN')+'₫'
  return (
    <AdminLayout title={isEdit? 'Sửa sản phẩm':'Thêm sản phẩm'}>
      <form className="admin-form" onSubmit={onSubmit}>
        <label>Slug
          <input value={product.slug||''} onChange={e=>set('slug', e.target.value)} />
        </label>
        <label>Tên
          <input value={product.name||''} onChange={e=>set('name', e.target.value)} />
        </label>
        <label>Giá (USD)
          <input type="number" step="0.01" value={product.price||0} onChange={e=>set('price', e.target.value)} />
          <div className="muted-small">≈ {vndPreview}</div>
        </label>
        <label>Tồn kho
          <input type="number" value={product.stock||0} onChange={e=>set('stock', e.target.value)} />
        </label>
        <label>Mô tả ngắn
          <textarea value={product.short_description||''} onChange={e=>set('short_description', e.target.value)} />
        </label>
        <label>Image URL
          <input value={product.image||''} onChange={e=>set('image', e.target.value)} />
        </label>
        <label>Mô tả đầy đủ
          <textarea rows={6} value={product.description||''} onChange={e=>set('description', e.target.value)} />
        </label>
        <div className="admin-actions">
          <button className="btn" type="submit">Lưu</button>
          <button type="button" className="btn secondary" onClick={()=>nav('/admin/products')}>Hủy</button>
        </div>
      </form>
    </AdminLayout>
  )
}
