import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token and get user info
      api.get('/auth/me')
        .then(response => {
          setUser({
            username: response.data.username,
            full_name: response.data.full_name,
            email: response.data.email,
            role: response.data.role || 'conductor'
          })
        })
        .catch(() => {
          localStorage.removeItem('token')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (credentials) => {
    console.log('Login attempt:', credentials.username)
    console.log('Current hostname:', window.location.hostname)
    
    // ONLY use real API if explicitly on localhost:3000
    const isLocalhostDev = window.location.hostname === 'localhost' && 
                          window.location.port === '3000'
    
    console.log('Is localhost dev:', isLocalhostDev)
    
    // Use demo mode for everything except explicit localhost:3000
    if (!isLocalhostDev) {
      console.log('Using demo mode')
      if (credentials.username === 'admin' && credentials.password === 'admin123') {
        const mockToken = 'mock-token-for-demo'
        localStorage.setItem('token', mockToken)
        setUser({
          username: 'admin',
          full_name: 'System Administrator',
          email: 'admin@busticket.com',
          role: 'admin'
        })
        toast.success('Demo login successful!')
        console.log('Demo admin login successful')
        return true
      } else if (credentials.username === 'conductor' && credentials.password === 'conductor123') {
        const mockToken = 'mock-token-for-demo'
        localStorage.setItem('token', mockToken)
        setUser({
          username: 'conductor',
          full_name: 'Bus Conductor',
          email: 'conductor@busticket.com',
          role: 'conductor'
        })
        toast.success('Demo login successful!')
        console.log('Demo conductor login successful')
        return true
      }
      // If credentials don't match demo, show error
      toast.error('Invalid credentials. Use admin/admin123 or conductor/conductor123')
      console.log('Demo login failed - invalid credentials')
      return false
    }

    // ONLY for localhost:3000 development, try real API
    console.log('Trying real API login')
    try {
      const response = await api.post('/auth/login', credentials)
      const { access_token } = response.data
      localStorage.setItem('token', access_token)
      
      // Get user info
      const userResponse = await api.get('/auth/me')
      setUser({
        username: userResponse.data.username,
        full_name: userResponse.data.full_name,
        email: userResponse.data.email,
        role: userResponse.data.role || 'conductor'
      })
      
      toast.success('Login successful!')
      console.log('Real API login successful')
      return true
    } catch (error) {
      console.error('Real API login failed:', error)
      toast.error(error.response?.data?.detail || 'Login failed')
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    toast.success('Logged out successfully')
  }

  const isAdmin = false // Removed - only conductor mode
  const isConductor = user?.role === 'conductor'

  const value = {
    user,
    login,
    logout,
    loading,
    isAdmin,
    isConductor
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
