import React, { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { BarChart3, Home, List, Menu, Ticket, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Sidebar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()

  const menuItems = useMemo(() => {
    const items = [
      {
        name: 'Dashboard',
        path: '/',
        icon: Home,
        description: 'Overview and stats'
      },
      {
        name: 'Book Ticket',
        path: '/book-ticket',
        icon: Ticket,
        description: 'Create new tickets'
      },
      {
        name: 'View Tickets',
        path: '/view-tickets',
        icon: List,
        description: 'Ticket history'
      }
    ]

    if (user?.role === 'admin') {
      items.push({
        name: 'Reports',
        path: '/reports',
        icon: BarChart3,
        description: 'Revenue and summaries'
      })
    }

    return items
  }, [user])

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-600 to-blue-700 text-white shadow-xl shadow-sky-300/50 lg:hidden"
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[18rem] border-r border-slate-700/70 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white shadow-2xl shadow-slate-950/50
          transform transition-transform duration-300 ease-in-out lg:static lg:w-72 lg:translate-x-0 lg:rounded-[32px] lg:border lg:shadow-lg lg:shadow-slate-200/60
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="p-4 lg:p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-sky-200/80">
              Navigation
            </h2>

            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      group flex items-center rounded-2xl px-3 py-3.5 text-sm font-medium transition-all duration-200
                      ${
                        isActive(item.path)
                          ? 'border border-cyan-300/30 bg-gradient-to-r from-cyan-500/20 to-sky-500/20 text-white shadow-lg shadow-cyan-950/30'
                          : 'border border-transparent text-slate-200 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive(item.path) ? 'text-cyan-200' : 'text-slate-400 group-hover:text-cyan-200'
                      }`}
                    />

                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-slate-300/80">{item.description}</div>
                    </div>
                  </NavLink>
                )
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-white/10 p-4 lg:p-5">
            <div className="rounded-2xl bg-white/10 px-3 py-3 text-xs text-slate-200/90">
              Signed in as {user?.role || 'conductor'}. Data shown in the app is loaded from backend APIs.
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
