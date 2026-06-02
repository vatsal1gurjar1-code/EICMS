/**
 * api/client.js
 * ─────────────
 * Axios HTTP client pre-configured with the backend base URL.
 * All API calls in the frontend should use this client, not plain fetch().
 *
 * It also handles 401 Unauthorized responses globally:
 * if the server says the token is expired, we log the user out automatically.
 */

import axios from 'axios'

const api = axios.create({
  baseURL: '/',      // Vite proxy routes /api/* → backend:8000
  timeout: 30000,    // 30 second timeout
})

// Intercept all responses — if we get a 401, token has expired
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Clear the token and redirect to login
      localStorage.removeItem('eicms_token')
      delete api.defaults.headers.common['Authorization']
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
