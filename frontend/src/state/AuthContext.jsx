import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    api.get('/auth/me').then(r => {
      if (mounted && r.data?.ok) setUser(r.data.user)
    }).catch(() => {}).finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  const login = async (email, password) => {
    await api.post('/auth/login', { email, password })
    const r = await api.get('/auth/me')
    if (r.data?.ok) setUser(r.data.user)
  }

  const register = async (name, email, password) => {
    await api.post('/auth/register', { name, email, password })
  }

  const logout = async () => {
    await api.post('/auth/logout')
    setUser(null)
  }

  const value = { user, loading, login, register, logout }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() { return useContext(AuthCtx) }
