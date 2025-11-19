import { Link, useLocation } from 'react-router-dom'
import '../admin.css'

export default function AdminLayout({ title, children }) {
  // Sidebar removed per request; top-level navigation handled by global Layout for admin role.
  return (
    <div className="admin-shell no-sidebar">
      <main className="admin-main">
        {title && <div className="admin-page-head"><h1>{title}</h1></div>}
        {children}
      </main>
    </div>
  )
}
