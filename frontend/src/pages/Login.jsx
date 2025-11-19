import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      nav('/')
    } catch {
      setError('Invalid credentials')
    }
  }

  return (
    <div>
      <h1>Login</h1>
      {error && <div style={{color:'tomato'}}>{error}</div>}
      <form className="form" onSubmit={onSubmit} style={{maxWidth:360}}>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <div><button className="btn" type="submit">Login</button></div>
      </form>
      <div style={{marginTop:8}}>No account? <Link to="/register">Register</Link></div>
    </div>
  )
}
