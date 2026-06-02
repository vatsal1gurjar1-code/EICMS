import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: ''
  })
  
  const [orgData, setOrgData] = useState({ 
    name: '',
    admin_name: '',
    admin_email: '',
    admin_password: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/orgs/users')
      setUsers(res.data)
    } catch (err) {
      console.error(err)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateManager = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/api/orgs/users', formData)
      setIsModalOpen(false)
      setFormData({ email: '', full_name: '', password: '' })
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error creating user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateOrg = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/api/orgs', orgData)
      setIsOrgModalOpen(false)
      setOrgData({ name: '', admin_name: '', admin_email: '', admin_password: '' })
      alert('Organisation created successfully! You can now log into it.')
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error creating organization')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.patch(`/api/orgs/users/${userId}`, { is_active: !currentStatus })
      fetchUsers()
    } catch (err) {
      alert('Failed to update user status')
    }
  }

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">User Management</h1>
            <p className="text-gray-500 mt-1">Manage Field Managers and their access to the system.</p>
          </div>
          <div className="flex gap-4">
            {currentUser?.role === 'super_admin' && (
              <button 
                onClick={() => setIsOrgModalOpen(true)}
                className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg shadow-sm hover:bg-gray-50 transition-all font-medium flex items-center gap-2"
              >
                + New Tenant Org
              </button>
            )}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:opacity-90 transition-all font-medium flex items-center gap-2"
            >
              + Create Manager
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading users...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  {currentUser?.role === 'super_admin' && (
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Organisation</th>
                  )}
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{u.full_name || '-'}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{u.email}</td>
                    {currentUser?.role === 'super_admin' && (
                      <td className="px-6 py-4 text-gray-500 text-sm font-medium">{u.org_name || '-'}</td>
                    )}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.is_active ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.id !== currentUser?.id && (
                        <button 
                          onClick={() => toggleUserStatus(u.id, u.is_active)}
                          className={`text-sm font-medium ${u.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Manager Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Create Field Manager</h3>
            <form onSubmit={handleCreateManager}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border" />
              </div>
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Password</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Org Modal (Super Admin only) */}
      {isOrgModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Create New Tenant</h3>
            <p className="text-sm text-gray-500 mb-6">This creates a completely isolated workspace for a new contractor company.</p>
            <form onSubmit={handleCreateOrg}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Organisation Name</label>
                <input required type="text" value={orgData.name} onChange={e => setOrgData({...orgData, name: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border" placeholder="e.g. Acme Electricals" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Full Name</label>
                <input required type="text" value={orgData.admin_name} onChange={e => setOrgData({...orgData, admin_name: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border" placeholder="e.g. John Doe" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email Address</label>
                <input required type="email" value={orgData.admin_email} onChange={e => setOrgData({...orgData, admin_email: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border" placeholder="admin@acme.com" />
              </div>
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Initial Password</label>
                <input required type="password" value={orgData.admin_password} onChange={e => setOrgData({...orgData, admin_password: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsOrgModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-purple-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors">
                  {submitting ? 'Creating...' : 'Create Organisation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
