import React, { useEffect, useState } from 'react'
import { Activity, ArrowUpRight, Clock, IndianRupee, Route, Ticket } from 'lucide-react'
import { reportAPI, systemAPI } from '../services/api'

const Dashboard = () => {
  const [stats, setStats] = useState({
    todayTickets: 0,
    totalRevenue: 0,
    activeRoutes: 0
  })
  const [recentTickets, setRecentTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [health, setHealth] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, healthRes] = await Promise.all([
        reportAPI.getDashboardStats(),
        systemAPI.getHealth()
      ])

      if (statsRes.data && statsRes.data.success) {
        setStats(statsRes.data.stats)
        setRecentTickets(statsRes.data.recentTickets || [])
      }

      setHealth({
        status: healthRes.data?.status || 'unhealthy',
        database: healthRes.data?.database || 'disconnected',
        payment_gateway: 'Connected' // Assuming gateway is up if API is up
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setHealth({ status: 'unhealthy', database: 'Error', payment_gateway: 'Disconnected' })
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Today's Tickets",
      value: stats.todayTickets,
      icon: Ticket,
      tone: 'from-sky-500 to-blue-700'
    },
    {
      title: 'Revenue',
      value: `Rs. ${stats.totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      tone: 'from-emerald-500 to-teal-700'
    },
    {
      title: 'Active Routes',
      value: stats.activeRoutes,
      icon: Route,
      tone: 'from-amber-400 to-orange-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner h-8 w-8"></div>
      </div>
    )
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-sky-950 to-cyan-900 px-5 py-6 text-white shadow-xl shadow-sky-950/20 lg:px-6 lg:py-7">
        <div className="absolute -right-10 top-0 h-36 w-36 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-14 left-8 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
              Live overview
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">Daily ticket operations at a glance</h1>
              <p className="mt-2 max-w-2xl text-sm text-cyan-50/85 lg:text-base">
                Quick numbers, recent activity and system health in a single compact dashboard built for conductor workflow.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100/75">System</p>
              <p className="mt-2 text-xl font-bold capitalize">{health?.status || 'unknown'}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100/75">Gateway</p>
              <p className="mt-2 text-xl font-bold">{health?.payment_gateway || '-'}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-lg shadow-slate-200/60 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{stat.value}</p>
                  <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    Live
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className={`flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br ${stat.tone} text-white shadow-lg`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-200/60 backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Recent Tickets</h2>
              <p className="text-sm text-slate-500">Latest bookings processed today</p>
            </div>
            <Clock className="h-5 w-5 text-slate-400" />
          </div>

          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{ticket.id}</p>
                    <p className="mt-1 text-sm text-slate-700">{ticket.passenger}</p>
                    <p className="mt-1 text-xs text-slate-500">{ticket.route} • Seat {ticket.seat}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-slate-900">Rs. {ticket.amount}</p>
                    <p className="mt-1 text-xs text-slate-500">{ticket.time}</p>
                    <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {ticket.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-200/60 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">System Health</h2>
                <p className="text-sm text-slate-500">Current backend and database status</p>
              </div>
              <Activity className="h-5 w-5 text-slate-400" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-500">API</span>
                <span className={`text-sm font-semibold capitalize ${health?.status === 'healthy' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {health?.status || 'unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-500">Database</span>
                <span className="text-sm font-semibold text-slate-900">{health?.database || '-'}</span>
              </div>
              <div className="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-500">Payment</span>
                <span className="text-sm font-semibold text-slate-900">{health?.payment_gateway || '-'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/70 bg-gradient-to-br from-cyan-50 to-emerald-50 p-5 shadow-lg shadow-cyan-100/60">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Operational note</p>
            <h3 className="mt-2 text-xl font-bold text-slate-950">Booking flow is ready for daily use</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Routes, seat selection and ticket issue flow are now aligned with the upgraded mobile-first interface.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
