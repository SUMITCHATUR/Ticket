import axios from 'axios'
import toast from 'react-hot-toast'

// Create axios instance
// VITE_API_URL should be your backend root (e.g. https://your-backend.onrender.com)
// On Render: set VITE_API_URL in Environment Variables of the frontend service
const rawBase = '' // Demo mode - no backend dependency
const originBase = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : ''
const baseRoot = rawBase ? rawBase.replace(/\/$/, '') : originBase
const baseURL = baseRoot
  ? `${baseRoot.replace(/\/api\/?$/, '')}/api`
  : '/api'

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
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
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token')
      window.location.href = '/login'
    } else if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.')
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.')
    } else if (error.response?.data?.detail) {
      const detail = error.response.data.detail
      if (Array.isArray(detail)) {
        toast.error(`Validation Error: ${detail.map(d => `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg}`).join(', ')}`)
      } else {
        toast.error(detail)
      }
    }
    return Promise.reject(error)
  }
)

// API service methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
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
  getAvailableSeats: (routeId) => api.get(`/routes/${routeId}/available-seats`),
}

export const ticketAPI = {
  getAll: (params = {}) => api.get('/tickets/', { params }),
  book: (bookingData, paymentData) => api.post('/tickets/book-with-payment', {
    booking_request: bookingData,
    payment_request: paymentData
  }),
  getHistory: (ticketId) => api.get(`/payment/history/${ticketId}`),
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
}

export const systemAPI = {
  getHealth: () => api.get('/health'),
  getInfo: () => api.get('/system/info'),
}

export default api
