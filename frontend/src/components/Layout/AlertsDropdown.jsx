import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'

export default function AlertsDropdown() {
  const [alerts, setAlerts] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await api.get('/api/alerts')
        if (Array.isArray(res.data)) {
          setAlerts(res.data)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchAlerts()
    
    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const safeAlerts = Array.isArray(alerts) ? alerts : []
  const unreadCount = safeAlerts.filter(a => !a.is_read).length

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/api/alerts/read-all')
      setAlerts(alerts.map(a => ({ ...a, is_read: true })))
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/api/alerts/${id}/read`)
      setAlerts(alerts.map(a => a.id === id ? { ...a, is_read: true } : a))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] text-white font-bold items-center justify-center">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-700">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {safeAlerts.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                No new notifications
              </div>
            ) : (
              safeAlerts.map(alert => (
                <div 
                  key={alert.id} 
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${!alert.is_read ? 'bg-blue-50/30' : ''}`}
                  onClick={() => handleMarkRead(alert.id)}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      alert.alert_type === 'shortage' ? 'bg-red-100 text-red-800' :
                      alert.alert_type === 'surplus' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {alert.alert_type.toUpperCase()}
                    </span>
                    {!alert.is_read && <span className="h-2 w-2 bg-blue-600 rounded-full"></span>}
                  </div>
                  <p className={`text-sm mt-2 ${!alert.is_read ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t text-center">
            <Link to="/admin/alerts" className="text-xs text-blue-600 hover:text-blue-800 font-medium" onClick={() => setIsOpen(false)}>
              View all alerts
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
