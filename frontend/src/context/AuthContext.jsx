/**
 * AuthContext.jsx
 * ───────────────
 * React Context that stores the logged-in user's info and JWT token.
 * Any component can call useAuth() to get the current user or log out.
 *
 * The token is saved in localStorage so the user stays logged in
 * after refreshing the page.
 */

import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)   // True while checking if already logged in

  // On page load: check if there's a saved token and fetch current user
  useEffect(() => {
    const token = localStorage.getItem('eicms_token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      api.get('/api/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          // Token is invalid or expired — clear it
          localStorage.removeItem('eicms_token')
          delete api.defaults.headers.common['Authorization']
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    // FastAPI's OAuth2 endpoint expects form data, not JSON
    const formData = new FormData()
    formData.append('username', email)
    formData.append('password', password)

    const res = await api.post('/api/auth/login', formData)
    const { access_token, user: userData } = res.data

    // Save token and set it on all future requests
    localStorage.setItem('eicms_token', access_token)
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('eicms_token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
