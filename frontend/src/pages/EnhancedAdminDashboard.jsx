import React, { useEffect, useState } from 'react'
import { useSQLMonitor } from '../context/SQLContext'
import { 
  BarChart3, 
  Users, 
  Route as RouteIcon, 
  TrendingUp, 
  IndianRupee,
  Bus,
  Ticket,
  Calendar,
  RefreshCw,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { reportAPI, ticketAPI, routeAPI, busAPI } from '../services/api'
import toast from 'react-hot-toast'

const EnhancedAdminDashboard = () => {
  const { addQuery } = useSQLMonitor()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [recentTickets, setRecentTickets] = useState([])
  const [routePerformance, setRoutePerformance] = useState([])
  const [paymentStats, setPaymentStats] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch real data from APIs
      const [ticketsResponse, routesResponse, busesResponse, paymentSummaryResponse] = await Promise.all([
        ticketAPI.getAll(),
        routeAPI.getAll(),
        busAPI.getAll(),
        reportAPI.getPaymentSummary()
      ])

      const tickets = Array.isArray(ticketsResponse.data) ? ticketsResponse.data : []
      const routes = Array.isArray(routesResponse.data) ? routesResponse.data : []
      const buses = Array.isArray(busesResponse.data) ? busesResponse.data : []
      const paymentData = paymentSummaryResponse.data || {}

      // Calculate real stats
      const today = new Date().toISOString().split('T')[0]
      const todayTickets = tickets.filter(t => t.booking_date === today)
      const totalRevenue = tickets.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
      const todayRevenue = todayTickets.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
      
      const confirmedTickets = tickets.filter(t => t.status?.toLowerCase() === 'confirmed')
      const cancelledTickets = tickets.filter(t => t.status?.toLowerCase() === 'cancelled')
      const completedTickets = tickets.filter(t => t.status?.toLowerCase() === 'completed')

      // Route performance
      const routeStats = routes.map(route => {
        const routeTickets = tickets.filter(t => t.route?.includes(route.source_city) && t.route?.includes(route.destination_city))
        return {
          routeName: `${route.source_city} → ${route.destination_city}`,
          ticketsSold: routeTickets.length,
          revenue: routeTickets.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0),
          activeBuses: buses.filter(b => b.status === 'ACTIVE').length
        }
      }).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

      // Recent tickets
      const recent = tickets
        .sort((a, b) => new Date(b.booking_date + ' ' + (b.booking_time || '')) - new Date(a.booking_date + ' ' + (a.booking_time || '')))
        .slice(0, 5)

      setStats({
        totalTickets: tickets.length,
        todayTickets: todayTickets.length,
        totalRevenue: totalRevenue,
        todayRevenue: todayRevenue,
        activeRoutes: routes.filter(r => r.status === 'ACTIVE').length,
        activeBuses: buses.filter(b => b.status === 'ACTIVE').length,
        confirmedTickets: confirmedTickets.length,
        cancelledTickets: cancelledTickets.length,
        completedTickets: completedTickets.length
      })

      setRecentTickets(recent)
      setRoutePerformance(routeStats)
      setPaymentStats(paymentData)

      // Add SQL monitoring query
      addQuery('Dashboard Real-time Stats', `
        SELECT 
          COUNT(t.id) as total_tickets,
          COUNT(CASE WHEN t.created_at >= CURRENT_DATE THEN 1 END) as today_tickets,
          COALESCE(SUM(p.amount), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN t.created_at >= CURRENT_DATE THEN p.amount END), 0) as today_revenue,
          COUNT(CASE WHEN t.status = 'confirmed' THEN 1 END) as confirmed_tickets,
          COUNT(CASE WHEN t.status = 'cancelled' THEN 1 END) as cancelled_tickets,
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tickets
        FROM tickets t
        LEFT JOIN payments p ON t.payment_id = p.id;
      `)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('डैशबोर्ड डेटा लोड करने में असफल।\nFailed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchDashboardData()
      toast.success('✅ डैशबोर्ड अपडेट हो गया!\nDashboard updated successfully!', {
        icon: '🔄',
        style: {
          borderRadius: '10px',
          background: '#10b981',
          color: '#fff',
        },
      })
    } catch (error) {
      toast.error('रिफ्रेश करने में असफल।\nFailed to refresh.')
    } finally {
      setRefreshing(false)
    }
  }

  const loadRoutePerformance = () => {
    addQuery('Route Performance Analysis', `SELECT 
      r.source, 
      r.destination, 
      COUNT(t.id) as tickets_sold,
      SUM(p.amount) as revenue
    FROM routes r
    JOIN tickets t ON r.id = t.route_id
    JOIN payments p ON t.payment_id = p.id
    GROUP BY r.source, r.destination
    ORDER BY revenue DESC
    LIMIT 5;`)
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-sky-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-amber-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner h-8 w-8"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[28px] bg-gradient-to-br from-slate-950 via-sky-950 to-cyan-900 px-5 py-6 text-white shadow-xl shadow-sky-950/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
              Admin Dashboard
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Real-time Bus Ticket Management</h1>
            <p className="mt-2 max-w-2xl text-sm text-cyan-50/85">
              Live statistics, route performance, and comprehensive booking analytics for Maharashtra State Transport.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </section>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-emerald-50 to-green-50 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Today's Revenue</p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">₹{stats?.todayRevenue?.toFixed(2) || '0'}</p>
              <p className="mt-1 text-xs text-emerald-600">{stats?.todayTickets || 0} tickets today</p>
            </div>
            <div className="rounded-full bg-emerald-100 p-3">
              <IndianRupee className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Tickets</p>
              <p className="mt-2 text-3xl font-bold text-blue-700">{stats?.totalTickets || 0}</p>
              <p className="mt-1 text-xs text-blue-600">All time bookings</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Ticket className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">Active Routes</p>
              <p className="mt-2 text-3xl font-bold text-amber-700">{stats?.activeRoutes || 0}</p>
              <p className="mt-1 text-xs text-amber-600">{stats?.activeBuses || 0} buses active</p>
            </div>
            <div className="rounded-full bg-amber-100 p-3">
              <RouteIcon className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Success Rate</p>
              <p className="mt-2 text-3xl font-bold text-purple-700">
                {stats?.totalTickets > 0 
                  ? ((stats.confirmedTickets / stats.totalTickets) * 100).toFixed(1) 
                  : '0'}%
              </p>
              <p className="mt-1 text-xs text-purple-600">{stats?.confirmedTickets || 0} confirmed</p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Tickets */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Recent Bookings</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                Last 5 tickets
              </span>
            </div>
            
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{ticket.ticket_number}</span>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(ticket.status)}
                          <span className="text-sm text-slate-600">{ticket.status}</span>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {ticket.passenger_name} • {ticket.route} • Seat {ticket.seat_number}
                      </p>
                      <p className="text-xs text-slate-500">
                        {ticket.booking_date} {ticket.booking_time && `at ${ticket.booking_time}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-700">₹{ticket.amount}</p>
                      <p className="text-xs text-slate-500">{ticket.payment_method}</p>
                    </div>
                  </div>
                </div>
              ))}

              {recentTickets.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Ticket className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p>No recent bookings found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-slate-100"
                onClick={loadRoutePerformance}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Route Performance</div>
                    <div className="text-sm text-slate-600">View revenue by route</div>
                  </div>
                </div>
              </button>

              <button 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-slate-100"
                onClick={() => {
                  addQuery('Conductor Status', `SELECT c.name, c.shift_status, b.bus_number
                  FROM conductors c
                  LEFT JOIN bus_assignments ba ON c.id = ba.conductor_id
                  LEFT JOIN buses b ON ba.bus_id = b.id
                  WHERE c.status = 'ACTIVE';`)
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-100 p-2">
                    <Users className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Active Conductors</div>
                    <div className="text-sm text-slate-600">Live tracking</div>
                  </div>
                </div>
              </button>

              <button 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-slate-100"
                onClick={() => {
                  addQuery('Payment Status Summary', `SELECT 
                    payment_method,
                    COUNT(*) as total_transactions,
                    SUM(amount) as total_amount,
                    AVG(amount) as avg_amount
                  FROM payments 
                  WHERE created_at >= CURRENT_DATE
                  GROUP BY payment_method;`)
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2">
                    <IndianRupee className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Payment Summary</div>
                    <div className="text-sm text-slate-600">Today's transactions</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Status Summary */}
          <div className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Ticket Status</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-slate-700">Confirmed</span>
                </div>
                <span className="font-semibold text-emerald-700">{stats?.confirmedTickets || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-sky-600" />
                  <span className="text-sm text-slate-700">Completed</span>
                </div>
                <span className="font-semibold text-sky-700">{stats?.completedTickets || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-slate-700">Cancelled</span>
                </div>
                <span className="font-semibold text-red-700">{stats?.cancelledTickets || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Route Performance */}
      {routePerformance.length > 0 && (
        <div className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Performing Routes</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Route</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-700">Tickets Sold</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-700">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {routePerformance.map((route, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                          #{index + 1}
                        </div>
                        <span className="font-medium text-slate-900">{route.routeName}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="font-medium text-slate-900">{route.ticketsSold}</span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="font-semibold text-emerald-700">₹{route.revenue.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedAdminDashboard
