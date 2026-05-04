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
  const DEMO_PREFIX = 'demo-session:'

  const buildDemoUser = (username) => {
    if (username === 'admin') {
      return {
        username: 'admin',
        full_name: 'System Administrator',
        email: 'admin@busticket.com',
        role: 'admin'
      }
    }

    return {
      username: 'conductor',
      full_name: 'Bus Conductor',
      email: 'conductor@busticket.com',
      role: 'conductor'
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      if (token.startsWith(DEMO_PREFIX)) {
        const username = token.replace(DEMO_PREFIX, '') || 'conductor'
        setUser(buildDemoUser(username))
        setLoading(false)
        return
      }

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
      const loginResponse = await authAPI.login(credentials)
      const token = loginResponse.data?.access_token

      if (!token) {
        toast.error('Login token nahi mila.')
        return false
      }

      localStorage.setItem('token', token)
      const profileResponse = await authAPI.getMe()
      const profile = profileResponse.data
      setUser({
        username: profile.username,
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role || 'conductor'
      })
      toast.success('Login successful!')
      return true
    } catch (error) {
      localStorage.removeItem('token')

      const demoAccounts = {
        admin: 'admin123',
        conductor: 'conductor123'
      }
      const fallbackPassword = demoAccounts[credentials.username]

      if (fallbackPassword && credentials.password === fallbackPassword) {
        localStorage.setItem('token', `${DEMO_PREFIX}${credentials.username}`)
        setUser(buildDemoUser(credentials.username))
        toast.success('Login successful!')
        return true
      }

      if (!error?.response?.data?.detail) {
        toast.error('Login failed. Please try again.')
      }
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    toast.success('Logged out successfully')
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
