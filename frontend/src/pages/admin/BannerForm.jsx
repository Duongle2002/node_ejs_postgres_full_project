import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'

export default function AdminBannerForm(){
  const { id } = useParams()
  const isEdit = !!id
  const [banner, setBanner] = useState({ title:'', subtitle:'', image_url:'', link:'', type:'promo', accent:'', priority:0 })
  const { t } = useTranslation()
  const nav = useNavigate()

  useEffect(()=>{
    if(isEdit){ api.get('/banners').then(r=>{ if(r.data?.ok){ const b = r.data.banners.find(x=>String(x.id)===String(id)); if(b) setBanner(b) } }) }
  },[id, isEdit])

  const set = (k,v)=> setBanner(prev=>({...prev,[k]:v}))

  const submit = async (e) =>{
    e.preventDefault()
    if(isEdit) await api.put(`/banners/${id}`, banner)
    else await api.post('/banners', banner)
    nav('/admin/banners')
  }

  return (
    <div>
      <h1>{isEdit? 'Edit':'Add'} Banner</h1>
      <form className="form" onSubmit={submit} style={{maxWidth:600}}>
        <label>Type<select value={banner.type} onChange={e=>set('type', e.target.value)}>
          <option value="promo">{t('promo')}</option>
          <option value="hero">Hero</option>
        </select></label>
        <label>Title<input value={banner.title||''} onChange={e=>set('title', e.target.value)} /></label>
        <label>Subtitle<textarea value={banner.subtitle||''} onChange={e=>set('subtitle', e.target.value)} /></label>
        <label>Image URL<input value={banner.image_url||''} onChange={e=>set('image_url', e.target.value)} /></label>
        <label>Link<input value={banner.link||''} onChange={e=>set('link', e.target.value)} /></label>
        <label>Accent color<input placeholder="#ff6a00" value={banner.accent||''} onChange={e=>set('accent', e.target.value)} /></label>
        <label>Priority<input type="number" value={banner.priority||0} onChange={e=>set('priority', Number(e.target.value))} /></label>
        <div><button className="btn" type="submit">Save</button></div>
      </form>
    </div>
  )
}
