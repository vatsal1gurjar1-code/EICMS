import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '../../components/layout/Layout'
import api from '../../api/client'

export default function PurchaseOrderDetail() {
  const { id } = useParams()
  const [po, setPo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // UI State
  const [activeTab, setActiveTab] = useState('releases')
  
  // Modals
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false)
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // Forms
  const [releaseForm, setReleaseForm] = useState({ release_no: '', description: '' })
  const [siteForm, setSiteForm] = useState({ site_no: '', release_id: '', area: '', status: 'active' })
  const [csvFile, setCsvFile] = useState(null)

  useEffect(() => {
    fetchContract()
  }, [id])

  const fetchContract = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/api/contracts/${id}`)
      setPo(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load contract details')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRelease = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/api/contracts/${id}/releases`, releaseForm)
      setIsReleaseModalOpen(false)
      setReleaseForm({ release_no: '', description: '' })
      fetchContract()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error creating release')
    }
  }

  const handleCreateSite = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/api/contracts/${id}/releases/${siteForm.release_id}/sites`, {
        site_no: siteForm.site_no,
        area: siteForm.area || null
      })
      setIsSiteModalOpen(false)
      setSiteForm({ site_no: '', release_id: '', area: '', status: 'active' })
      fetchContract()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error creating site')
    }
  }

  const handleUploadScheduleB = async (e) => {
    e.preventDefault()
    if (!csvFile) return alert('Please select a file')
    
    const formData = new FormData()
    formData.append('file', csvFile)
    
    try {
      await api.post(`/api/contracts/${id}/schedule-b/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setIsUploadModalOpen(false)
      setCsvFile(null)
      fetchContract()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error uploading file')
    }
  }

  if (loading) return <Layout><div className="p-8 text-center text-gray-500">Loading...</div></Layout>
  if (error || !po) return <Layout><div className="p-8 text-red-500">{error || 'Contract not found'}</div></Layout>

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/admin/purchase-orders" className="text-blue-600 hover:underline text-sm mb-4 inline-block">&larr; Back to Purchase Orders</Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{po.po_number}</h1>
              <p className="text-gray-500 mt-1">Tender ID: {po.tender_id || 'N/A'}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">₹ {parseFloat(po.order_value || 0).toLocaleString()}</div>
              <span className={`inline-flex mt-2 items-center px-2.5 py-1 rounded-full text-xs font-medium ${po.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {po.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button onClick={() => setActiveTab('releases')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'releases' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              Releases & Sites
            </button>
            <button onClick={() => setActiveTab('schedule')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'schedule' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              Schedule B Items
            </button>
          </nav>
        </div>

        {/* Content - Releases & Sites */}
        {activeTab === 'releases' && (
          <div>
            <div className="flex gap-4 mb-6">
              <button onClick={() => setIsReleaseModalOpen(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 font-medium text-sm">
                + Add Release No.
              </button>
              <button onClick={() => setIsSiteModalOpen(true)} className="bg-blue-600 border border-transparent text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 font-medium text-sm">
                + Add Site
              </button>
            </div>

            {po.release_numbers?.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100 text-gray-500">
                No releases added yet.
              </div>
            ) : (
              <div className="space-y-6">
                {po.release_numbers?.map(release => (
                  <div key={release.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900">Release: {release.release_no}</h3>
                      <span className="text-sm text-gray-500">{release.description}</span>
                    </div>
                    
                    <div className="p-0">
                      {release.sites?.length === 0 ? (
                        <div className="p-6 text-sm text-gray-500 text-center">No sites assigned to this release.</div>
                      ) : (
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Site ID</th>
                              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Area</th>
                              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {release.sites.map(site => (
                              <tr key={site.id} className="hover:bg-gray-50/30">
                                <td className="px-6 py-4 font-medium text-gray-900">{site.site_no}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{site.area || '-'}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${site.status === 'completed' ? 'bg-green-100 text-green-800' : site.status === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {site.status.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <Link to={`/admin/site/${site.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Manage Site</Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content - Schedule B */}
        {activeTab === 'schedule' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Schedule B Items</h2>
              <button onClick={() => setIsUploadModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 font-medium text-sm">
                Upload CSV
              </button>
            </div>

            {po.schedule_b_items?.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100 text-gray-500">
                No items loaded. Upload a CSV to populate Schedule B.
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Code</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Allocated</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {po.schedule_b_items.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-medium text-gray-900">{item.item_code}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate" title={item.description}>{item.description}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.unit}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{parseFloat(item.allocated_qty).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">₹{parseFloat(item.locked_rate).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Release Modal */}
      {isReleaseModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Release Number</h3>
            <form onSubmit={handleCreateRelease}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Release Number</label>
                <input required type="text" value={releaseForm.release_no} onChange={e => setReleaseForm({...releaseForm, release_no: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={releaseForm.description} onChange={e => setReleaseForm({...releaseForm, description: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsReleaseModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">Add Release</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Site Modal */}
      {isSiteModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Site</h3>
            <form onSubmit={handleCreateSite}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Release</label>
                <select required value={siteForm.release_id} onChange={e => setSiteForm({...siteForm, release_id: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border">
                  <option value="">-- Choose Release --</option>
                  {po.release_numbers?.map(r => <option key={r.id} value={r.id}>{r.release_no}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Site ID</label>
                <input required type="text" value={siteForm.site_no} onChange={e => setSiteForm({...siteForm, site_no: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Area / Location (Optional)</label>
                <input type="text" value={siteForm.area} onChange={e => setSiteForm({...siteForm, area: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 border" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsSiteModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">Add Site</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload CSV Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Upload Schedule B</h3>
            <p className="text-sm text-gray-500 mb-4">Upload a CSV file containing: item_code, description, unit, allocated_qty, locked_rate.</p>
            <form onSubmit={handleUploadScheduleB}>
              <div className="mb-6">
                <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files[0])} className="w-full border p-2 rounded-lg" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </Layout>
  )
}
