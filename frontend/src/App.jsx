import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminContracts from './pages/admin/Contracts'
import AdminContractDetail from './pages/admin/ContractDetail'
import AdminInventory from './pages/admin/Inventory'
import AdminAlerts from './pages/admin/Alerts'
import AdminUsers from './pages/admin/Users'
import AdminSiteDetail from './pages/admin/AdminSiteDetail'
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

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['org_admin', 'super_admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/contracts" element={
          <ProtectedRoute allowedRoles={['org_admin', 'super_admin']}>
            <AdminContracts />
          </ProtectedRoute>
        } />
        <Route path="/admin/contracts/:id" element={
          <ProtectedRoute allowedRoles={['org_admin', 'super_admin']}>
            <AdminContractDetail />
          </ProtectedRoute>
        } />
        <Route path="/admin/inventory" element={
          <ProtectedRoute allowedRoles={['org_admin', 'super_admin']}>
            <AdminInventory />
          </ProtectedRoute>
        } />
        <Route path="/admin/alerts" element={
          <ProtectedRoute allowedRoles={['org_admin', 'super_admin']}>
            <AdminAlerts />
          </ProtectedRoute>
        } />
        <Route path="/admin/site/:id" element={
          <ProtectedRoute allowedRoles={['org_admin', 'super_admin']}>
            <AdminSiteDetail />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['org_admin', 'super_admin']}>
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
  return <Navigate to="/admin" replace />
}
