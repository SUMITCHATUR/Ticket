import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, List, Menu, Ticket, X } from 'lucide-react'

const Sidebar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  const menuItems = [
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
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[17rem] border-r border-white/70 bg-white/92 shadow-2xl shadow-slate-300/40 backdrop-blur-xl
          transform transition-transform duration-300 ease-in-out lg:static lg:w-72 lg:translate-x-0 lg:rounded-[32px] lg:border lg:shadow-lg lg:shadow-slate-200/60
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="p-4 lg:p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
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
                          ? 'border border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-50 text-sky-800 shadow-sm'
                          : 'border border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive(item.path) ? 'text-sky-700' : 'text-slate-400 group-hover:text-slate-500'
                      }`}
                    />

                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.description}</div>
                    </div>
                  </NavLink>
                )
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-slate-200/80 p-4 lg:p-5">
            <div className="rounded-2xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
              Data shown in the app is loaded from backend APIs.
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
