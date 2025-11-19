import { Link, NavLink } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../state/AuthContext'
import { useToast } from '../state/ToastContext'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { addToast } = useToast()
  const headerRef = useRef(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [scrolledBeyondHeader, setScrolledBeyondHeader] = useState(false)
  const [pageShort, setPageShort] = useState(false)

  useEffect(() => {
    const el = headerRef.current
    const measure = () => setHeaderHeight(el ? el.offsetHeight : 0)
    const checkShort = () => {
      const doc = document.documentElement
      setPageShort(doc.scrollHeight <= window.innerHeight + 8)
    }
    const checkScroll = () => {
      setScrolledBeyondHeader(window.scrollY >= Math.max(0, headerHeight - 2))
    }
    measure(); checkShort(); checkScroll()
    window.addEventListener('resize', () => { measure(); checkShort(); checkScroll() })
    window.addEventListener('scroll', checkScroll)
    const t = setTimeout(() => { measure(); checkShort(); checkScroll() }, 60)
    return () => {
      window.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', () => { measure(); checkShort(); checkScroll() })
      clearTimeout(t)
    }
  }, [headerHeight])

  const showMinibar = scrolledBeyondHeader || pageShort
  return (
    <div>
      <header ref={headerRef} className="site-header">
        <div className="site-container">
          <div className="nav">
            <div className="brand"><Link to="/">ElectroShop</Link></div>
            {user?.role === 'admin' ? (
              <>
                <NavLink to="/admin">Dashboard</NavLink>
                <NavLink to="/admin/products">Products</NavLink>
                <NavLink to="/admin/orders">Orders</NavLink>
                <NavLink to="/admin/users">Users</NavLink>
                <NavLink to="/admin/banners">Banners</NavLink>
                <div className="spacer" />
              </>
            ) : (
              <>
                <NavLink to="/">Home</NavLink>
                <NavLink to="/products">Products</NavLink>
                <div className="spacer" />
                {user && <NavLink to="/cart">Cart</NavLink>}
                {user && <NavLink to="/orders">Orders</NavLink>}
                {user && <NavLink to="/user/profile">Profile</NavLink>}
                {!user && <NavLink to="/login">Login</NavLink>}
                {!user && <NavLink to="/register">Register</NavLink>}
              </>
            )}
            {user && <button className="btn" onClick={logout} style={{marginLeft:8}}>Logout</button>}
          </div>
        </div>
      </header>
      <main className="site-container" style={{ paddingBottom: showMinibar ? 60 : 0 }}>
        {children}
      </main>
      {/* Mini bar nav (hover to expand) */}
      <div className={`footer-minibar ${showMinibar ? 'visible' : ''}`} role="navigation" aria-label="Quick navigation">
        <div className="minibar-inner">
          <nav className="quick-links" aria-label="Quick links">
            {user?.role === 'admin' ? (
              <>
                <Link to="/admin">Dash</Link>
                <Link to="/admin/products">Products</Link>
                <Link to="/admin/orders">Orders</Link>
                <Link to="/admin/users">Users</Link>
              </>
            ) : (
              <>
                <Link to="/">Home</Link>
                <Link to="/products">Products</Link>
                {user && <Link to="/cart">Cart</Link>}
                {user && <Link to="/orders">Orders</Link>}
              </>
            )}
          </nav>
        </div>
      </div>
      <footer className="site-footer footer">
        <div className="site-container footer-grid">
          <div className="col">
            <div className="brand">ElectroShop</div>
            <p className="muted">We sell quality electronic devices and accessories with fast shipping and reliable support.</p>
          </div>
          <div className="col">
            <h4>Quick Links</h4>
            <div><a href="/products">Products</a></div>
            <div><a href="/cart">Cart</a></div>
            <div><a href="/orders">Orders</a></div>
          </div>
          <div className="col">
            <h4>Support</h4>
            <div><a href="#">Help Center</a></div>
            <div><a href="#">Returns</a></div>
            <div><a href="#">Contact Us</a></div>
          </div>
          <div className="col newsletter">
            <h4>Newsletter</h4>
            <p className="muted">Get deals and product announcements.</p>
            <form onSubmit={(e)=>{e.preventDefault(); addToast('Subscribed!', { type: 'success' })}}>
              <input type="email" placeholder="you@example.com" />
              <div><button className="btn" type="submit">Subscribe</button></div>
            </form>
          </div>
        </div>
        <div style={{textAlign:'center',padding:'12px 0',borderTop:'1px solid rgba(255,255,255,0.02)'}}>© {new Date().getFullYear()} ElectroShop</div>
      </footer>
    </div>
  )
}
