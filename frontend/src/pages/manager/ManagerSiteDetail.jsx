import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'
import Layout from '../../components/layout/Layout'

export default function ManagerSiteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [siteData, setSiteData] = useState(null)
  const [estimates, setEstimates] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchSiteDetails() {
      try {
        const res = await api.get(`/api/estimates/${id}`)
        setSiteData(res.data)
        
        // Initialize estimates state
        const initialEsts = {}
        res.data.items.forEach(item => {
          initialEsts[item.po_schedule_b_item_id] = item.estimated_qty || 0
        })
        setEstimates(initialEsts)
      } catch (err) {
        console.error(err)
        setError("Failed to load site details. " + (err.response?.data?.detail || ""))
      } finally {
        setLoading(false)
      }
    }
    fetchSiteDetails()
  }, [id])

  const handleQtyChange = (itemId, val) => {
    setEstimates(prev => ({
      ...prev,
      [itemId]: val
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = Object.entries(estimates).map(([itemId, qty]) => ({
        po_schedule_b_item_id: itemId,
        estimated_qty: parseFloat(qty) || 0
      }))
      
      await api.put(`/api/estimates/${id}`, { estimates: payload })
      alert("Estimates saved successfully!")
    } catch (err) {
      console.error(err)
      alert("Error saving estimates: " + (err.response?.data?.detail || ""))
    } finally {
      setSaving(false)
    }
  }

  const handleMarkComplete = async () => {
    if (!window.confirm("Are you sure? This will lock the form and submit it to Admin for verification.")) return
    
    // Save first just in case
    await handleSave()
    
    try {
      await api.patch(`/api/sites/${id}/mark-complete`)
      alert("Site submitted for verification!")
      navigate('/manager')
    } catch (err) {
      console.error(err)
      alert("Error marking complete: " + (err.response?.data?.detail || ""))
    }
  }

  if (loading) return <Layout><div className="p-8">Loading...</div></Layout>
  if (error) return <Layout><div className="p-8 text-red-600">{error}</div></Layout>
  if (!siteData) return <Layout><div className="p-8">Not found</div></Layout>

  const isLocked = siteData.status !== 'active' || siteData.is_locked

  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Site {siteData.site_no}</h1>
            <p className="text-gray-500 mt-1">Status: {siteData.status.replace('_', ' ').toUpperCase()}</p>
          </div>
          <button onClick={() => navigate('/manager')} className="text-blue-600 hover:underline">
            &larr; Back to My Sites
          </button>
        </div>

        {isLocked && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6">
            This site is currently locked and cannot be edited. It is either completed or pending admin verification.
          </div>
        )}

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Estimated Qty</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {siteData.items.map((item) => (
                <tr key={item.po_schedule_b_item_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.item_code}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      className="w-24 text-right border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={estimates[item.po_schedule_b_item_id] !== undefined ? estimates[item.po_schedule_b_item_id] : ''}
                      onChange={(e) => handleQtyChange(item.po_schedule_b_item_id, e.target.value)}
                      disabled={isLocked}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLocked && (
          <div className="flex justify-between items-center">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={handleMarkComplete}
              disabled={saving}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Mark as Complete
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
