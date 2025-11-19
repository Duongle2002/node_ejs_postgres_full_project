import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { useToast } from '../../state/ToastContext'
import AdminLayout from '../../components/AdminLayout'

export default function AdminUserDetail() {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()
  const nav = useNavigate()

  useEffect(() => { api.get(`/users/${id}`).then(r => { if (r.data?.ok) setUser(r.data.user) }) }, [id])

  const onSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setSaving(true)
    await api.put(`/users/${id}`, { name: fd.get('name'), email: fd.get('email'), role: fd.get('role') })
    setSaving(false)
    addToast('Saved', { type: 'success' })
  }

  const delUser = async () => {
    if (!confirm('Xóa người dùng này?')) return
    await api.delete(`/users/${id}`)
    addToast('Đã xóa người dùng', { type:'success' })
    nav('/admin/users')
  }

  if (!user) return <AdminLayout title="Người dùng"><div>Đang tải...</div></AdminLayout>
  return (
    <AdminLayout title={`Người dùng #${user.id}`}>
      <form onSubmit={onSubmit} className="admin-form" style={{maxWidth:480}}>
        <label>Tên<input name="name" defaultValue={user.name || ''} /></label>
        <label>Email<input name="email" defaultValue={user.email || ''} /></label>
        <label>Role<select name="role" defaultValue={user.role || 'user'}>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select></label>
        <div className="admin-actions">
          <button disabled={saving} className="btn" type="submit">Lưu</button>
          <button type="button" className="btn secondary" onClick={()=>nav('/admin/users')}>Quay lại</button>
          <button type="button" className="btn secondary" onClick={delUser}>Xóa</button>
        </div>
      </form>
    </AdminLayout>
  )
}
