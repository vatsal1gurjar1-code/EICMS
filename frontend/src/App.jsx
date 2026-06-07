import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import PurchaseOrders from './pages/admin/PurchaseOrders'
import PurchaseOrderDetail from './pages/admin/PurchaseOrderDetail'
import Sites from './pages/admin/Sites'
import AdminInventory from './pages/admin/Inventory'
import AdminAlerts from './pages/admin/Alerts'
import AdminUsers from './pages/admin/Users'
import AdminSiteDetail from './pages/admin/AdminSiteDetail'
import Tenants from './pages/super-admin/Tenants'
import ManagerMySites from './pages/manager/MySites'
import ManagerSiteDetail from './pages/manager/ManagerSiteDetail'

// Protected route wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Super Admin routes */}
        <Route path="/super-admin/tenants" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <Tenants />
          </ProtectedRoute>
        } />
        <Route path="/super-admin/users" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminUsers />
          </ProtectedRoute>
        } />

        {/* Org Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['org_admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/purchase-orders" element={
          <ProtectedRoute allowedRoles={['org_admin']}>
            <PurchaseOrders />
          </ProtectedRoute>
        } />
        <Route path="/admin/purchase-orders/:id" element={
          <ProtectedRoute allowedRoles={['org_admin']}>
            <PurchaseOrderDetail />
          </ProtectedRoute>
        } />
        <Route path="/admin/sites" element={
          <ProtectedRoute allowedRoles={['org_admin']}>
            <Sites />
          </ProtectedRoute>
        } />
        <Route path="/admin/inventory" element={
          <ProtectedRoute allowedRoles={['org_admin']}>
            <AdminInventory />
          </ProtectedRoute>
        } />
        <Route path="/admin/alerts" element={
          <ProtectedRoute allowedRoles={['org_admin']}>
            <AdminAlerts />
          </ProtectedRoute>
        } />
        <Route path="/admin/site/:id" element={
          <ProtectedRoute allowedRoles={['org_admin']}>
            <AdminSiteDetail />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['org_admin']}>
            <AdminUsers />
          </ProtectedRoute>
        } />

        {/* Manager routes */}
        <Route path="/manager" element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerMySites />
          </ProtectedRoute>
        } />
        <Route path="/manager/site/:id" element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerSiteDetail />
          </ProtectedRoute>
        } />

        {/* Default redirect based on role */}
        <Route path="/" element={<RoleRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

function RoleRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'manager') return <Navigate to="/manager" replace />
  if (user.role === 'super_admin') return <Navigate to="/super-admin/tenants" replace />
  return <Navigate to="/admin" replace />
}
