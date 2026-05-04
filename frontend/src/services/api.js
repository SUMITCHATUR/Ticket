import axios from 'axios'
import toast from 'react-hot-toast'

const RENDER_ORIGIN = 'https://ticket-backend-yvyi.onrender.com'

const resolveApiOrigin = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  const host = window.location.hostname.toLowerCase()

  if (host.includes('localhost') || host === '127.0.0.1') {
    return ''
  }

  if (host.endsWith('vercel.app')) {
    return RENDER_ORIGIN
  }

  return ''
}

export const apiOrigin = resolveApiOrigin()
export const buildApiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return apiOrigin ? `${apiOrigin}/api${normalizedPath}` : `/api${normalizedPath}`
}

const api = axios.create({
  baseURL: apiOrigin ? `${apiOrigin}/api` : '/api',
  timeout: 20000, // Increased timeout for mobile connections
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
  login: (credentials) => api.post(buildApiUrl('/auth/login'), credentials),
  getMe: () => api.get(buildApiUrl('/auth/me')),
  logout: () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }
}

export const conductorAPI = {
  getAll: (params = {}) => api.get(buildApiUrl('/conductors/'), { params }),
  create: (data) => api.post(buildApiUrl('/conductors/'), data),
  update: (id, data) => api.put(buildApiUrl(`/conductors/${id}`), data),
  delete: (id) => api.delete(buildApiUrl(`/conductors/${id}`)),
}

export const busAPI = {
  getAll: (params = {}) => api.get(buildApiUrl('/buses/'), { params }),
  create: (data) => api.post(buildApiUrl('/buses/'), data),
  update: (id, data) => api.put(buildApiUrl(`/buses/${id}`), data),
}

export const routeAPI = {
  getAll: (params = {}) => api.get(buildApiUrl('/routes/'), { params }),
  create: (data) => api.post(buildApiUrl('/routes/'), data),
  getById: (id) => api.get(buildApiUrl(`/routes/${id}`)),
  getAvailableSeats: (routeId) => api.get(buildApiUrl(`/routes/${routeId}/available-seats`)),
}

export const ticketAPI = {
  getAll: (params = {}) => api.get(buildApiUrl('/tickets/'), { params }),
  book: (bookingData, paymentData) => api.post(buildApiUrl('/tickets/book-with-payment'), {
    booking_request: bookingData,
    payment_request: paymentData
  }),
  getHistory: (ticketId) => api.get(buildApiUrl(`/payment/history/${ticketId}`)),
  cancel: (ticketId) => api.post(buildApiUrl(`/tickets/${ticketId}/cancel`)),
}

export const paymentAPI = {
  create: (data) => api.post(buildApiUrl('/payment/create'), data),
  generateUPIQR: (data) => api.post(buildApiUrl('/payment/upi/generate-qr'), data),
  verify: (paymentId) => api.post(buildApiUrl(`/payment/verify/${paymentId}`)),
  complete: (paymentId) => api.post(buildApiUrl(`/payment/complete/${paymentId}`)),
  refund: (paymentId, amount, reason) => api.post(buildApiUrl(`/payment/refund/${paymentId}`), {
    amount,
    reason
  }),
}

export const reportAPI = {
  getPaymentSummary: () => api.get(buildApiUrl('/payments/summary')),
  getRevenueByRoute: () => api.get(buildApiUrl('/revenue/by-route')),
  getDashboardStats: () => api.get(buildApiUrl('/dashboard/stats')),
}

export const systemAPI = {
  getHealth: () => api.get(buildApiUrl('/health')),
  getInfo: () => api.get(buildApiUrl('/system/info')),
}

export default api
