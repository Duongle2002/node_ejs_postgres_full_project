import { Link, NavLink } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../state/AuthContext'
import { useToast } from '../state/ToastContext'
import { useTranslation } from 'react-i18next'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { addToast } = useToast()
  const { t } = useTranslation()
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
                <NavLink to="/admin">{t('nav.dashboard')}</NavLink>
                <NavLink to="/admin/products">{t('nav.products')}</NavLink>
                <NavLink to="/admin/orders">{t('nav.orders')}</NavLink>
                <NavLink to="/admin/users">{t('nav.users')}</NavLink>
                <NavLink to="/admin/banners">{t('nav.banners')}</NavLink>
                <div className="spacer" />
              </>
            ) : (
              <>
                <NavLink to="/">{t('nav.home')}</NavLink>
                <NavLink to="/products">{t('nav.products')}</NavLink>
                <div className="spacer" />
                {user && <NavLink to="/cart">{t('nav.cart')}</NavLink>}
                {user && <NavLink to="/orders">{t('nav.orders')}</NavLink>}
                {user && <NavLink to="/user/profile">{t('nav.profile')}</NavLink>}
                {!user && <NavLink to="/login">{t('nav.login')}</NavLink>}
                {!user && <NavLink to="/register">{t('nav.register')}</NavLink>}
              </>
            )}
            {user && <button className="btn" onClick={logout} style={{marginLeft:8}}>{t('nav.logout')}</button>}
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
                <Link to="/admin">{t('nav.dashboard')}</Link>
                <Link to="/admin/products">{t('nav.products')}</Link>
                <Link to="/admin/orders">{t('nav.orders')}</Link>
                <Link to="/admin/users">{t('nav.users')}</Link>
              </>
            ) : (
              <>
                <Link to="/">{t('nav.home')}</Link>
                <Link to="/products">{t('nav.products')}</Link>
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
            <h4>{t('footer.quickLinks')}</h4>
            <div><a href="/products">{t('nav.products')}</a></div>
            <div><a href="/cart">{t('nav.cart')}</a></div>
            <div><a href="/orders">{t('nav.orders')}</a></div>
          </div>
          <div className="col">
            <h4>{t('footer.support')}</h4>
            <div><a href="#">{t('footer.helpCenter')}</a></div>
            <div><a href="#">{t('footer.returns')}</a></div>
            <div><a href="#">{t('footer.contact')}</a></div>
          </div>
          <div className="col newsletter">
            <h4>{t('footer.newsletter')}</h4>
            <p className="muted">{t('footer.newsletterText')}</p>
            <form onSubmit={(e)=>{e.preventDefault(); addToast(t('footer.subscribed'), { type: 'success' })}}>
              <input type="email" placeholder="you@example.com" />
              <div><button className="btn" type="submit">{t('footer.subscribe')}</button></div>
            </form>
          </div>
        </div>
        <div style={{textAlign:'center',padding:'12px 0',borderTop:'1px solid rgba(255,255,255,0.02)'}}>© {new Date().getFullYear()} ElectroShop</div>
      </footer>
    </div>
  )
}
