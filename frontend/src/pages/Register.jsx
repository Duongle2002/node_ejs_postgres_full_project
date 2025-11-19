import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const nav = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg('')
    try {
      await register(name, email, password)
      setMsg('Registered! Please login.')
      setTimeout(()=> nav('/login'), 800)
    } catch {
      setMsg('Register failed')
    }
  }

  return (
    <div>
      <h1>Register</h1>
      {msg && <div>{msg}</div>}
      <form className="form" onSubmit={onSubmit} style={{maxWidth:360}}>
        <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <div><button className="btn" type="submit">Register</button></div>
      </form>
      <div style={{marginTop:8}}>Already have an account? <Link to="/login">Login</Link></div>
    </div>
  )
}
