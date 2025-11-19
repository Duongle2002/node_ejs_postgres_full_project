import { useEffect, useState } from 'react'
import api from '../api/client'
import { useToast } from '../state/ToastContext'

export default function UserProfile() {
  const [profile, setProfile] = useState(null)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    api.get('/users/me').then(r => { if (r.data?.ok) setProfile(r.data.user) })
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    await api.put('/users/me', { name: fd.get('name'), email: fd.get('email') })
    setSaving(false)
    addToast('Saved', { type: 'success' })
  }

  if (!profile) return <div>Loading...</div>
  return (
    <div>
      <h1>User Profile</h1>
      <form className="form" onSubmit={onSubmit} style={{maxWidth:420}}>
        <label>Name<input name="name" defaultValue={profile.name || ''} /></label>
        <label>Email<input name="email" defaultValue={profile.email || ''} /></label>
        <div><button className="btn" disabled={saving} type="submit">Save</button></div>
      </form>
    </div>
  )
}
