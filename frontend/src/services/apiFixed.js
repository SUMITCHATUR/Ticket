import axios from 'axios'
import toast from 'react-hot-toast'

// Fixed API configuration for localhost
const baseURL = 'http://localhost:8000/api'

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
    if (error.code === 'NETWORK_ERROR') {
      toast.error('Network error! Please check your connection.')
    } else if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
}

// Route API
export const routeAPI = {
  getAll: () => api.get('/routes/'),
  getById: (id) => api.get(`/routes/${id}`),
  getAvailableSeats: (routeId) => api.get(`/routes/${routeId}/available-seats`)
}

// Ticket API
export const ticketAPI = {
  getAll: () => api.get('/tickets/'),
  book: (bookingData, paymentData) => api.post('/tickets/book-with-payment', { booking: bookingData, payment: paymentData }),
  getHistory: () => api.get('/tickets/history'),
  cancel: (ticketId) => api.delete(`/tickets/${ticketId}`)
}

// Payment API
export const paymentAPI = {
  create: (paymentData) => api.post('/payment/create', paymentData),
  generateQR: (paymentData) => api.post('/payment/generate-qr', paymentData),
  verify: (paymentId) => api.get(`/payment/verify/${paymentId}`),
  complete: (paymentId) => api.post(`/payment/complete/${paymentId}`),
  refund: (paymentId) => api.post(`/payment/refund/${paymentId}`)
}

// Report API
export const reportAPI = {
  getDashboardStats: () => api.get('/reports/dashboard-stats'),
  getRoutePerformance: () => api.get('/reports/route-performance'),
  getRevenueReport: (params) => api.get('/reports/revenue', { params })
}

export default api
