import React, { useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { BarChart3, Home, List, Ticket } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Sidebar = () => {
  const location = useLocation()
  const { user } = useAuth()

  const menuItems = useMemo(() => {
    const items = [
      {
        name: 'Dashboard',
        shortName: 'Home',
        path: '/',
        icon: Home,
        description: 'Overview and stats'
      },
      {
        name: 'Book Ticket',
        shortName: 'Book',
        path: '/book-ticket',
        icon: Ticket,
        description: 'Create new tickets'
      },
      {
        name: 'View Tickets',
        shortName: 'Tickets',
        path: '/view-tickets',
        icon: List,
        description: 'Ticket history'
      }
    ]

    if (user?.role === 'admin') {
      items.push({
        name: 'Reports',
        shortName: 'Reports',
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
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/70 bg-white/95 px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div
          className={`mx-auto grid max-w-md gap-2 rounded-[28px] bg-slate-100/90 p-2 ${
            menuItems.length > 3 ? 'grid-cols-4' : 'grid-cols-3'
          }`}
        >
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-2.5 text-[11px] font-semibold transition ${
                  active
                    ? 'bg-gradient-to-br from-sky-600 to-blue-700 text-white shadow-lg shadow-sky-200/80'
                    : 'bg-transparent text-slate-500 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{item.shortName}</span>
              </NavLink>
            )
          })}
        </div>
      </div>

      <aside className="hidden lg:block lg:w-72">
        <div className="sticky top-24 rounded-[32px] border border-slate-200/80 bg-white/95 shadow-lg shadow-slate-200/60 backdrop-blur">
          <div className="p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Navigation
            </h2>

            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center rounded-2xl px-3 py-3.5 text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'border border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-50 text-sky-800 shadow-sm'
                        : 'border border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        active ? 'text-sky-700' : 'text-slate-400 group-hover:text-slate-500'
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

          <div className="border-t border-slate-200/80 p-5">
            <div className="rounded-2xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
              Signed in as {user?.role || 'conductor'}. Data shown in the app is loaded from backend APIs.
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
