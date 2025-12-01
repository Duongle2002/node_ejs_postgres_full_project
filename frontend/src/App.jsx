import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Register from './pages/Register'
import Success from './pages/Success'
import UserProfile from './pages/UserProfile'
import OrderHistory from './pages/OrderHistory'
import OrderDetail from './pages/OrderDetail'

import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminUserDetail from './pages/admin/UserDetail'
import AdminProducts from './pages/admin/Products'
import AdminProductForm from './pages/admin/ProductForm'
import AdminOrders from './pages/admin/Orders'
import AdminOrderDetail from './pages/admin/OrderDetail'
import AdminBanners from './pages/admin/Banners'
import AdminBannerForm from './pages/admin/BannerForm'
import { useAuth } from './state/AuthContext'
import { useTranslation } from 'react-i18next'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const { t } = useTranslation()
  if (loading) return <div>{t('loading')}</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth()
  const { t } = useTranslation()
  if (loading) return <div>{t('loading')}</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
        <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/success" element={<Success />} />
        <Route path="/user/profile" element={<RequireAuth><UserProfile /></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><OrderHistory /></RequireAuth>} />
        <Route path="/orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />

        <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
        <Route path="/admin/users/:id" element={<RequireAdmin><AdminUserDetail /></RequireAdmin>} />
        <Route path="/admin/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
        <Route path="/admin/products/new" element={<RequireAdmin><AdminProductForm mode="create" /></RequireAdmin>} />
        <Route path="/admin/products/:id" element={<RequireAdmin><AdminProductForm mode="edit" /></RequireAdmin>} />
        <Route path="/admin/banners" element={<RequireAdmin><AdminBanners /></RequireAdmin>} />
        <Route path="/admin/banners/new" element={<RequireAdmin><AdminBannerForm /></RequireAdmin>} />
        <Route path="/admin/banners/:id" element={<RequireAdmin><AdminBannerForm /></RequireAdmin>} />
        <Route path="/admin/orders" element={<RequireAdmin><AdminOrders /></RequireAdmin>} />
        <Route path="/admin/orders/:id" element={<RequireAdmin><AdminOrderDetail /></RequireAdmin>} />
      </Routes>
    </Layout>
  )
}
