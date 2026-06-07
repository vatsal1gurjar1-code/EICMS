import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'
import Layout from '../../components/layout/Layout'

export default function AdminInventory() {
  const { user } = useAuth()
  const [pos, setPos] = useState([])
  const [selectedPo, setSelectedPo] = useState('')
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPOs() {
      try {
        const res = await api.get('/api/contracts')
        setPos(res.data)
        if (res.data.length > 0) {
          setSelectedPo(res.data[0].id)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchPOs()
  }, [])

  useEffect(() => {
    async function fetchInventory() {
      if (!selectedPo) return
      setLoading(true)
      try {
        const res = await api.get(`/api/inventory/${selectedPo}`)
        setInventory(res.data.items || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchInventory()
  }, [selectedPo])

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Overview</h1>
          
          <div className="flex gap-4">
            <select 
              className="border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-4 py-2"
              value={selectedPo}
              onChange={(e) => setSelectedPo(e.target.value)}
            >
              <option value="" disabled>Select Purchase Order</option>
              {pos.map(po => (
                <option key={po.id} value={po.id}>{po.po_number}</option>
              ))}
            </select>
            
            <button 
              onClick={async () => {
                try {
                  const response = await api.get('/api/export/inventory', { responseType: 'blob' })
                  const url = window.URL.createObjectURL(new Blob([response.data]))
                  const link = document.createElement('a')
                  link.href = url
                  link.setAttribute('download', 'Inventory_Report.xlsx')
                  document.body.appendChild(link)
                  link.click()
                } catch (err) {
                  alert('Error downloading report')
                }
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 font-medium text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export to Excel
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading inventory data...</p>
        ) : inventory.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
            No items found for this Purchase Order.
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Allocated</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Est. Used</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Remaining</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.map((item) => {
                  const status = item.remaining < 0 ? 'Shortage' : (item.remaining > 0 ? 'Surplus' : 'OK')
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.item_code}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">{item.allocated_qty}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">{item.total_estimated_qty}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${item.remaining < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.remaining}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status === 'Shortage' ? 'bg-red-100 text-red-800' :
                          status === 'Surplus' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
