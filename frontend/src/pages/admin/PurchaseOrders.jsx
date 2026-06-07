import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import api from '../../api/client'

export default function PurchaseOrders() {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    po_number: '',
    tender_id: '',
    description: '',
    order_value: '',
    start_date: '',
    end_date: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    try {
      // Assuming backend still uses /api/contracts endpoint for POs for now
      const res = await api.get('/api/contracts')
      setContracts(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        po_number: formData.po_number,
        tender_id: formData.tender_id || null,
        description: formData.description || null,
        order_value: formData.order_value ? parseFloat(formData.order_value) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      }
      await api.post('/api/contracts', payload)
      setIsModalOpen(false)
      setFormData({ po_number: '', tender_id: '', description: '', order_value: '', start_date: '', end_date: '' })
      fetchContracts()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create purchase order')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Purchase Orders</h1>
            <p className="text-gray-500 mt-1">Manage all government purchase orders and releases.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:opacity-90 transition-all font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Purchase Order
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading purchase orders...</div>
        ) : contracts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">No purchase orders yet</h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">Get started by creating your first Purchase Order to begin managing sites and inventory.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-6 text-blue-600 font-medium hover:text-blue-700"
            >
              + Create your first purchase order
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">PO Number</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tender ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contracts.map(contract => (
                  <tr key={contract.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{contract.po_number}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{contract.tender_id || '-'}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">₹ {parseFloat(contract.order_value).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        contract.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {contract.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* For now we will keep linking to the old contract detail page or we can make a PurchaseOrderDetail later */}
                      <Link 
                        to={`/admin/purchase-orders/${contract.id}`} 
                        className="text-blue-600 hover:text-blue-900 font-medium text-sm transition-colors"
                      >
                        Manage &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Create New Purchase Order</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6">
              {error && <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
              
              <div className="grid grid-cols-2 gap-5 mb-5">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">PO Number *</label>
                  <input required type="text" value={formData.po_number} onChange={e => setFormData({...formData, po_number: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border" placeholder="e.g. PO-2026-001" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tender ID</label>
                  <input type="text" value={formData.tender_id} onChange={e => setFormData({...formData, tender_id: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Value (₹)</label>
                  <input type="number" step="0.01" value={formData.order_value} onChange={e => setFormData({...formData, order_value: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border"></textarea>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {submitting ? 'Creating...' : 'Create Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
