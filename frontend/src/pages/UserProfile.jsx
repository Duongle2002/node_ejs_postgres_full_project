import { useEffect, useState } from 'react'
import api from '../api/client'
import { useToast } from '../state/ToastContext'
import { useTranslation } from 'react-i18next'

export default function UserProfile() {
  const [profile, setProfile] = useState(null)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()
  const { t } = useTranslation()

  useEffect(() => {
    api.get('/users/me').then(r => { if (r.data?.ok) setProfile(r.data.user) })
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    await api.put('/users/me', { name: fd.get('name'), email: fd.get('email') })
    setSaving(false)
  addToast(t('form.saved'), { type: 'success' })
  }

  if (!profile) return <div>{t('loading')}</div>
  return (
    <div>
      <h1>{t('user.profile')}</h1>
      <form className="form" onSubmit={onSubmit} style={{maxWidth:420}}>
        <label>{t('auth.name')}<input name="name" defaultValue={profile.name || ''} /></label>
        <label>{t('auth.email')}<input name="email" defaultValue={profile.email || ''} /></label>
        <div><button className="btn" disabled={saving} type="submit">{t('form.save')}</button></div>
      </form>
    </div>
  )
}
