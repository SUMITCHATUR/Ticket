import React, { createContext, useContext, useState, useEffect } from 'react'
import api, { authAPI } from '../services/api'
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
      console.log('Attempting login with:', credentials)
      
      // Direct API call to avoid authAPI issues
      const response = await api.post('/auth/login', credentials)
      console.log('Login response:', response.data)
      
      const token = response.data?.access_token

      if (!token) {
        toast.error('Login token nahi mila.')
        return false
      }

      localStorage.setItem('token', token)
      
      // Get user profile
      const profileResponse = await api.get('/auth/me')
      console.log('Profile response:', profileResponse.data)
      
      const profile = profileResponse.data
      setUser({
        username: profile.username,
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role || 'conductor'
      })
      
      toast.success('✅ Login successful!\nआप सफलतापूर्वक लॉग इन हो गए हैं!')
      return true
    } catch (error) {
      console.error('Login error:', error)
      localStorage.removeItem('token')
      
      // Handle different error types
      if (error.response?.status === 401) {
        toast.error('❌ Invalid username or password!\nगलत यूजरनेम या पासवर्ड!')
      } else if (error.response?.status === 400) {
        toast.error('❌ Please enter valid credentials!\nकृपया सही क्रेडेंशियल्स दर्ज करें!')
      } else if (error.code === 'NETWORK_ERROR') {
        toast.error('❌ Network error! Please check connection.\nनेटवर्क त्रुटि! कनेक्शन जांचें।')
      } else {
        const errorMsg = error.message || 'Unknown error';
        const errorStatus = error.response?.status || 'No status';
        console.error('Login detailed error:', { message: errorMsg, status: errorStatus, data: error.response?.data });
        toast.error(`❌ Login failed: ${errorMsg} (${errorStatus})\nकृपया फिर से कोशिश करें।`);
      }
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    toast.success('✅ Logged out successfully!\nसफलतापूर्वक लॉग आउट हो गए!')
  }

  const isAdmin = user?.role === 'admin'
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
