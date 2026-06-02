import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import api from '../../api/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/api/analytics')
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Layout><div className="p-8 text-center text-gray-500">Loading Dashboard...</div></Layout>
  if (!data) return <Layout><div className="p-8 text-center text-red-500">Failed to load analytics</div></Layout>

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Overview Dashboard</h1>
          <p className="text-gray-500 mt-1">High-level view of your contracts, inventory, and alerts.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active POs</p>
              <h3 className="text-3xl font-bold text-gray-900">{data.stats.totalPOs}</h3>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="bg-green-100 p-4 rounded-xl text-green-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sites</p>
              <h3 className="text-3xl font-bold text-gray-900">{data.stats.totalSites}</h3>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="bg-red-100 p-4 rounded-xl text-red-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Items in Shortage</p>
              <h3 className="text-3xl font-bold text-red-600">{data.stats.shortageCount}</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* PO Health Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">PO Health (Allocated vs Estimated)</h3>
            <div className="h-80 w-full">
              {data.poHealth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.poHealth} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" />
                    <Bar dataKey="allocated" name="Allocated" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="used" name="Estimated" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">No PO data available</div>
              )}
            </div>
          </div>

          {/* Site Status Donut */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Site Completion Status</h3>
            <div className="h-64 w-full relative">
              {data.stats.totalSites > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.siteCompletion}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.siteCompletion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">No site data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Top Shortages List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Critical Shortages</h3>
          {data.topShortages.length > 0 ? (
            <div className="space-y-4">
              {data.topShortages.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-red-50/50 rounded-xl border border-red-100">
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500 max-w-xl truncate">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">Short by</p>
                    <p className="text-xl font-bold text-red-700">{item.shortage.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl">
              No material shortages reported.
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}
