import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import BookTicket from './pages/BookTicket'
import ViewTickets from './pages/ViewTickets'
import Reports from './pages/Reports'
import Login from './pages/Login'
import { useAuth } from './contexts/AuthContext'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-4 h-12 w-12"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="mx-auto flex w-full max-w-[1600px] xl:px-4">
        <Sidebar />
        <main className="min-w-0 flex-1 px-3 pb-24 pt-3 sm:px-4 sm:pt-4 lg:px-6 lg:pb-6 lg:pt-6">
          <div className="mx-auto w-full max-w-[460px] lg:max-w-none">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/book-ticket" element={<BookTicket />} />
              <Route path="/view-tickets" element={<ViewTickets />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
