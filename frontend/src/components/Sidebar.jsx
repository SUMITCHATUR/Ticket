import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  Home, 
  Ticket, 
  List, 
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

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
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Navigation
            </h2>
            
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200
                      ${isActive(item.path)
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className={`
                      mr-3 h-5 w-5 flex-shrink-0
                      ${isActive(item.path) ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'}
                    `} />
                    
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </NavLink>
                )
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Data shown in the app is loaded from backend APIs.
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
