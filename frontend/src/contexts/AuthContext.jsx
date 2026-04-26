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
      return true
    } catch (error) {
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
