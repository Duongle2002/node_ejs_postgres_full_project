import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/client'

export default function AdminBanners(){
  const [banners, setBanners] = useState([])
  const nav = useNavigate()
  const load = () => api.get('/banners').then(r=>{ if(r.data?.ok) setBanners(r.data.banners)})
  useEffect(()=>{ load() }, [])

  const remove = async (id) => { if(!confirm('Delete banner?')) return; await api.delete(`/banners/${id}`); load() }

  return (
    <div>
      <h1>Banners</h1>
      <div style={{marginBottom:8}}>
        <button className="btn" onClick={()=>nav('/admin/banners/new')}>Add Banner</button>
      </div>
      <table>
        <thead><tr><th>ID</th><th>Type</th><th>Title</th><th>Image</th><th></th></tr></thead>
        <tbody>
          {banners.map(b=> (
            <tr key={b.id}>
              <td>{b.id}</td>
              <td>{b.type}</td>
              <td>{b.title}</td>
              <td>{b.image_url ? <img src={b.image_url} alt={b.title} style={{height:48}}/> : '-'}</td>
              <td><Link to={`/admin/banners/${b.id}`}>Edit</Link> {' '} <button className="btn secondary" onClick={()=>remove(b.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
