import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'
import Layout from '../../components/layout/Layout'

export default function ManagerMySites() {
  const { user } = useAuth()
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSites() {
      try {
        const res = await api.get('/api/sites/my-sites')
        setSites(res.data)
      } catch (err) {
        console.error('Error fetching sites:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSites()
  }, [])

  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Assigned Sites</h1>
        
        {loading ? (
          <p className="text-gray-500">Loading your sites...</p>
        ) : sites.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
            You do not have any sites assigned to you currently.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map(site => (
              <div key={site.id} className="bg-white rounded-xl shadow-sm border p-6 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{site.site_no}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    site.status === 'completed' ? 'bg-green-100 text-green-800' :
                    site.status === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {site.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div className="text-gray-600 mb-6 flex-grow">
                  <p className="text-sm"><span className="font-medium text-gray-500">Location:</span> {site.location || 'N/A'}</p>
                </div>
                
                <Link
                  to={`/manager/site/${site.id}`}
                  className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
                >
                  View Details & Estimate
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
