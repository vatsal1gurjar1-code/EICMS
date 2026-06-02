import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'
import Layout from '../../components/layout/Layout'

export default function AdminSiteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [siteData, setSiteData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchSiteDetails() {
      try {
        const res = await api.get(`/api/estimates/${id}`)
        setSiteData(res.data)
      } catch (err) {
        console.error(err)
        setError("Failed to load site details.")
      } finally {
        setLoading(false)
      }
    }
    fetchSiteDetails()
  }, [id])

  const handleVerify = async () => {
    try {
      await api.patch(`/api/sites/${id}/verify`)
      alert("Site verified and closed successfully!")
      navigate('/admin')
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || "Failed to verify site"))
    }
  }

  const handleReject = async () => {
    try {
      await api.patch(`/api/sites/${id}/reject`)
      alert("Site rejected and returned to active.")
      navigate('/admin')
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || "Failed to reject site"))
    }
  }

  if (loading) return <Layout><div className="p-8">Loading...</div></Layout>
  if (error) return <Layout><div className="p-8 text-red-600">{error}</div></Layout>
  if (!siteData) return <Layout><div className="p-8">Not found</div></Layout>

  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Site {siteData.site_no} (Review)</h1>
            <p className="text-gray-500 mt-1">Status: {siteData.status.replace('_', ' ').toUpperCase()}</p>
          </div>
          <button onClick={() => navigate('/admin')} className="text-blue-600 hover:underline">
            &larr; Back to Dashboard
          </button>
        </div>

        {siteData.status === 'pending_verification' && (
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-blue-900">Manager has submitted this site for review</h3>
              <p className="text-blue-700">Please review the estimates below and either verify to close the site, or reject it to allow the manager to make further edits.</p>
            </div>
            <div className="flex gap-4">
              <button onClick={handleReject} className="px-4 py-2 bg-white text-red-600 border border-red-600 rounded-lg hover:bg-red-50 font-medium">Reject</button>
              <button onClick={handleVerify} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Verify & Close</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Submitted Qty</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {siteData.items.map((item) => (
                <tr key={item.po_schedule_b_item_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.item_code}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">{item.estimated_qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
