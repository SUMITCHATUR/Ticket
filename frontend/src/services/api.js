import axios from 'axios'
import toast from 'react-hot-toast'

const resolveApiBaseUrl = () => {
  const envUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : ''
  if (envUrl) return envUrl.replace(/\/$/, '')

  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return '/api'
    }
  }

  return 'https://ticket-backend-yvyi.onrender.com'
}

export const buildApiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

const API_BASE_URL = resolveApiBaseUrl()

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Remove authentication completely for now
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    
    if (status === 401) {
      // Only clear and redirect if we're not on the login page already
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    } else if (status === 500) {
      toast.error('Server error. Please try again later.')
    } else if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      // Network errors are common on mobile
      console.error('Network Error:', error)
    }
    
    return Promise.reject(error)
  }
)

// API service methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  logout: () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }
}

export const conductorAPI = {
  getAll: (params = {}) => api.get('/conductors/', { params }),
  create: (data) => api.post('/conductors/', data),
  update: (id, data) => api.put(`/conductors/${id}`, data),
  delete: (id) => api.delete(`/conductors/${id}`),
}

export const busAPI = {
  getAll: (params = {}) => api.get('/buses/', { params }),
  create: (data) => api.post('/buses/', data),
  update: (id, data) => api.put(`/buses/${id}`, data),
}

export const routeAPI = {
  getAll: (params = {}) => api.get('/routes/', { params }),
  create: (data) => api.post('/routes/', data),
  getById: (id) => api.get(`/routes/${id}`),
  getAvailableSeats: (routeId) => api.get(`/routes/${routeId}/available-seats`),
}

export const ticketAPI = {
  getAll: (params = {}) => api.get('/tickets/', { params }),
  book: (bookingData, paymentData) => api.post('/tickets/book-with-payment', {
    booking_request: bookingData,
    payment_request: paymentData
  }),
  getHistory: (ticketId) => api.get(`/payment/history/${ticketId}`),
  cancel: (ticketId) => api.post(`/tickets/${ticketId}/cancel`),
}

export const paymentAPI = {
  create: (data) => api.post('/payment/create', data),
  generateUPIQR: (data) => api.post('/payment/upi/generate-qr', data),
  verify: (paymentId) => api.post(`/payment/verify/${paymentId}`),
  complete: (paymentId) => api.post(`/payment/complete/${paymentId}`),
  refund: (paymentId, amount, reason) => api.post(`/payment/refund/${paymentId}`, {
    amount,
    reason
  }),
}

export const reportAPI = {
  getPaymentSummary: () => api.get('/payments/summary'),
  getRevenueByRoute: () => api.get('/revenue/by-route'),
  getDashboardStats: () => api.get('/dashboard/stats'),
}

export const systemAPI = {
  getHealth: () => api.get('/health'),
  getInfo: () => api.get('/system/info'),
}

export default api
