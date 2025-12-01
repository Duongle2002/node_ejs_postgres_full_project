import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'
import AdminLayout from '../../components/AdminLayout'
import { useToast } from '../../state/ToastContext'

export default function AdminProductForm({ mode }) {
  const { id } = useParams()
  const nav = useNavigate()
  const isEdit = mode === 'edit'
  const [product, setProduct] = useState({ name:'', slug:'', price:0, stock:0, short_description:'', description:'', image:'' })
  const { addToast } = useToast()
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (isEdit && id) {
      api.get(`/products/${id}`).then(r => { if (r.data?.ok) setProduct(r.data.product) })
    }
  }, [isEdit, id])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (uploading) { addToast('Đang tải ảnh, vui lòng chờ...', { type: 'info' }); return }
    const body = { slug: product.slug, name: product.name, price: Number(product.price)||0, stock: Number(product.stock)||0, short_description: product.short_description, description: product.description, image: product.image }
    if (isEdit) await api.put(`/products/${id}`, body)
    else await api.post('/products', body)
    nav('/admin/products')
  }

  const set = (k,v)=> setProduct(p=>({...p,[k]:v}))

  // handle file upload
  const handleFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    // client-side validation
    if (!f.type.startsWith('image/')) { addToast('Vui lòng chọn file ảnh (jpg/png/gif)', { type: 'error' }); return; }
    const MAX = 5 * 1024 * 1024; // 5MB
    if (f.size > MAX) { addToast('Kích thước file quá lớn (tối đa 5MB)', { type: 'error' }); return; }
    const fd = new FormData(); fd.append('file', f);
    setUploading(true);
    try {
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data && res.data.ok) set('image', res.data.url);
      else addToast('Upload thất bại', { type: 'error' });
    } catch (err) {
      console.error('upload', err); addToast('Upload thất bại', { type: 'error' });
    } finally {
      setUploading(false);
    }
  }

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
        <label>Upload Image
          <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
          {uploading && <div className="muted-small" style={{marginTop:8}}>Đang tải ảnh...</div>}
          {product.image && !uploading && (
            <div style={{marginTop:8}}>
              <img src={product.image} alt="preview" style={{maxWidth:140, maxHeight:140, borderRadius:8, border:'1px solid rgba(0,0,0,0.1)'}} />
            </div>
          )}
        </label>
        <label>Mô tả đầy đủ
          <textarea rows={6} value={product.description||''} onChange={e=>set('description', e.target.value)} />
        </label>
        <div className="admin-actions">
          <button className="btn" type="submit" disabled={uploading}>
            {uploading ? (
              <>
                <span className="spinner-inline" style={{width:14,height:14,display:'inline-block',verticalAlign:'middle',marginRight:8}}></span>
                Đang tải...
              </>
            ) : 'Lưu'}
          </button>
          <button type="button" className="btn secondary" onClick={()=>nav('/admin/products')}>Hủy</button>
        </div>
      </form>
    </AdminLayout>
  )
}
