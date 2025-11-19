import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import AdminLayout from '../../components/AdminLayout'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  useEffect(() => { api.get('/users').then(r => { if (r.data?.ok) setUsers(r.data.users) }) }, [])
  const filtered = users.filter(u => {
    const textOk = !q || (u.name||'').toLowerCase().includes(q.toLowerCase()) || (u.email||'').toLowerCase().includes(q.toLowerCase())
    const roleOk = !role || u.role === role
    return textOk && roleOk
  })
  return (
    <AdminLayout title="Người dùng">
      <div className="admin-card" style={{display:'grid',gap:12,marginBottom:12}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
          <label style={{display:'flex',flexDirection:'column',gap:6,fontSize:13,color:'var(--muted)'}}>Tìm kiếm
            <input placeholder="Tên hoặc email" value={q} onChange={e=>setQ(e.target.value)} />
          </label>
          <label style={{display:'flex',flexDirection:'column',gap:6,fontSize:13,color:'var(--muted)'}}>Role
            <select value={role} onChange={e=>setRole(e.target.value)}>
              <option value="">-- tất cả --</option>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </label>
        </div>
        {(q||role) && <div className="admin-actions"><button className="btn secondary" onClick={()=>{setQ('');setRole('')}}>Xóa lọc</button></div>}
      </div>
      <table className="admin-table">
        <thead><tr><th>ID</th><th>Tên</th><th>Email</th><th>Role</th><th>Hành động</th></tr></thead>
        <tbody>
          {filtered.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td className="admin-inline-actions">
                <Link to={`/admin/users/${u.id}`} className="btn secondary" style={{padding:'6px 10px',fontSize:12}}>Xem / Sửa</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  )
}
