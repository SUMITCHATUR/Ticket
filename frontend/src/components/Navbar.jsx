import React from 'react'
import { Bus, LogOut, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()

  return (
    <nav className="sticky top-0 z-30 border-b border-white/70 bg-white/80 shadow-sm shadow-slate-200/40 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
        <div className="flex min-h-[4.5rem] items-center justify-between gap-3 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-white shadow-lg shadow-sky-200">
              <Bus className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">Bus Ticket System</h1>
              <p className="truncate text-[11px] font-medium uppercase tracking-[0.16em] text-sky-700">
                Conductor Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100">
                <User className="h-4 w-4 text-sky-700" />
              </div>
              <div className="hidden text-right sm:block">
                <p className="max-w-[160px] truncate text-sm font-medium text-slate-900">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                  Conductor
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
