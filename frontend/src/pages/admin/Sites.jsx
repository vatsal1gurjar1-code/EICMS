import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import api from '../../api/client'

export default function Sites() {
  const [sites, setSites] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [selectedPo, setSelectedPo] = useState(null)
  
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Form State
  const [siteForm, setSiteForm] = useState({
    po_id: '',
    release_id: '',
    site_no: '',
    area: '',
  })
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchSites()
    fetchPurchaseOrders()
  }, [])

  const fetchSites = async () => {
    try {
      const res = await api.get('/api/sites')
      setSites(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchaseOrders = async () => {
    try {
      const res = await api.get('/api/contracts')
      setPurchaseOrders(res.data)
    } catch (err) {
      console.error("Failed to fetch purchase orders")
    }
  }

  const fetchPoDetails = async (poId) => {
    try {
      const res = await api.get(`/api/contracts/${poId}`)
      setSelectedPo(res.data)
    } catch (err) {
      console.error("Failed to fetch PO details")
    }
  }

  const handlePoChange = (e) => {
    const poId = e.target.value
    setSiteForm({ ...siteForm, po_id: poId, release_id: '' })
    if (poId) {
      fetchPoDetails(poId)
    } else {
      setSelectedPo(null)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    
    if (!siteForm.po_id || !siteForm.release_id) {
      setError("Please select a Purchase Order and a Release Number.")
      setSubmitting(false)
      return
    }

    try {
      await api.post(`/api/contracts/${siteForm.po_id}/releases/${siteForm.release_id}/sites`, {
        site_no: siteForm.site_no,
        area: siteForm.area || null,
      })
      setIsModalOpen(false)
      setSiteForm({ po_id: '', release_id: '', site_no: '', area: '' })
      setSelectedPo(null)
      fetchSites()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create site')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Sites</h1>
            <p className="text-gray-500 mt-1">Manage physical work locations assigned to POs.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:opacity-90 transition-all font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Site
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading sites...</div>
        ) : sites.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">No sites yet</h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">Get started by creating your first site under a Purchase Order.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-6 text-blue-600 font-medium hover:text-blue-700"
            >
              + Create your first site
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Site Number</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Purchase Order</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Release</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Area</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sites.map(site => (
                  <tr key={site.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{site.site_no}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm font-medium">{site.po_number}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{site.release_no}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{site.area || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        site.status === 'completed' ? 'bg-green-100 text-green-800' :
                        site.status === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {site.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/admin/site/${site.id}`} 
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
              <h3 className="text-lg font-bold text-gray-900">Create New Site</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6">
              {error && <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
              
              <div className="grid grid-cols-1 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Order *</label>
                  <select 
                    required 
                    value={siteForm.po_id} 
                    onChange={handlePoChange} 
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border"
                  >
                    <option value="">-- Select a Purchase Order --</option>
                    {purchaseOrders.map(po => (
                      <option key={po.id} value={po.id}>{po.po_number}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Release Number *</label>
                  <select 
                    required 
                    value={siteForm.release_id} 
                    onChange={e => setSiteForm({...siteForm, release_id: e.target.value})} 
                    disabled={!selectedPo || !selectedPo.release_numbers?.length}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border disabled:bg-gray-100"
                  >
                    <option value="">-- Select a Release --</option>
                    {selectedPo?.release_numbers?.map(r => (
                      <option key={r.id} value={r.id}>{r.release_no}</option>
                    ))}
                  </select>
                  {selectedPo && selectedPo.release_numbers?.length === 0 && (
                    <p className="mt-1 text-xs text-red-500">This PO has no releases. Add a release first.</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Number / ID *</label>
                  <input required type="text" value={siteForm.site_no} onChange={e => setSiteForm({...siteForm, site_no: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border" placeholder="e.g. SITE-001" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area / Location (Optional)</label>
                  <input type="text" value={siteForm.area} onChange={e => setSiteForm({...siteForm, area: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border" />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {submitting ? 'Creating...' : 'Create Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
