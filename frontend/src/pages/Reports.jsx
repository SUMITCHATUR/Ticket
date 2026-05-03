import React, { useEffect, useState } from 'react'
import { BarChart3, Download, IndianRupee, Sparkles, Zap } from 'lucide-react'
import { reportAPI } from '../services/api'

const Reports = () => {
  const [reportData, setReportData] = useState({
    paymentSummary: [],
    revenueByRoute: [],
    totalRevenue: 0,
    totalTickets: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('payment')

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const [paymentRes, revenueRes] = await Promise.all([
        reportAPI.getPaymentSummary(),
        reportAPI.getRevenueByRoute()
      ])

      const paymentSummary = Array.isArray(paymentRes.data) ? paymentRes.data : []
      const revenueByRoute = Array.isArray(revenueRes.data) ? revenueRes.data : []

      const totalRevenue = paymentSummary.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0)
      const totalTickets = paymentSummary.reduce((sum, p) => sum + (Number(p.total_transactions) || 0), 0)

      setReportData({
        paymentSummary,
        revenueByRoute,
        totalRevenue,
        totalTickets
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = (type) => {
    let data = []
    let filename = ''

    switch (type) {
      case 'payment':
        data = reportData.paymentSummary
        filename = 'payment-summary.csv'
        break
      case 'revenue':
        data = reportData.revenueByRoute
        filename = 'revenue-by-route.csv'
        break
      default:
        return
    }

    if (data.length === 0) return

    const csvContent = [Object.keys(data[0]).join(','), ...data.map((row) => Object.values(row).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner h-8 w-8"></div>
      </div>
    )
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <section className="rounded-[28px] bg-gradient-to-br from-slate-950 via-emerald-900 to-cyan-900 px-5 py-6 text-white shadow-xl shadow-emerald-950/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
              Reports
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Revenue and payment insights</h1>
            <p className="mt-2 max-w-2xl text-sm text-emerald-50/85">
              Clean summary reports for route earnings, transaction mix and quick CSV exports.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium backdrop-blur">
            <Sparkles className="h-4 w-4" />
            Business snapshot
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-200/60 backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Revenue</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">Rs. {reportData.totalRevenue.toLocaleString()}</p>
              <p className="mt-2 text-xs text-slate-500">From {reportData.totalTickets} transactions</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-emerald-100 text-emerald-700">
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-200/60 backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Bookings</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{reportData.totalTickets}</p>
              <p className="mt-2 text-xs text-slate-500">
                Average: Rs. {reportData.totalTickets > 0 ? (reportData.totalRevenue / reportData.totalTickets).toFixed(0) : 0}
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-sky-100 text-sky-700">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/70 bg-white/90 shadow-lg shadow-slate-200/60 backdrop-blur">
        <div className="border-b border-slate-200 px-4 sm:px-5 lg:px-6">
          <div className="flex gap-3 overflow-x-auto py-3">
            <button
              onClick={() => setSelectedTab('payment')}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                selectedTab === 'payment' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Payment Methods
            </button>
            <button
              onClick={() => setSelectedTab('revenue')}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                selectedTab === 'revenue' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Revenue by Route
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 lg:p-6">
          {selectedTab === 'payment' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-semibold text-slate-950">Payment Methods Breakdown</h3>
                <button
                  onClick={() => exportReport('payment')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-200"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>

              {reportData.paymentSummary.length > 0 ? (
                <div className="space-y-3">
                  {reportData.paymentSummary.map((payment, idx) => (
                    <div key={idx} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold capitalize text-slate-900">{payment.payment_method}</p>
                          <p className="mt-1 text-sm text-slate-500">{payment.total_transactions} transactions</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:w-auto">
                          <div className="rounded-2xl bg-white px-3 py-2 text-center">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Amount</p>
                            <p className="mt-1 font-semibold text-emerald-700">Rs. {payment.total_amount.toLocaleString()}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2 text-center">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Average</p>
                            <p className="mt-1 font-semibold text-slate-900">Rs. {payment.average_amount.toFixed(0)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Zap className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                  <p className="text-slate-500">No payment data available</p>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'revenue' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-semibold text-slate-950">Revenue by Route</h3>
                <button
                  onClick={() => exportReport('revenue')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-200"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>

              {reportData.revenueByRoute.length > 0 ? (
                <div className="space-y-3">
                  {reportData.revenueByRoute.map((route) => (
                    <div key={route.route_id} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{route.route_name}</p>
                          <p className="mt-1 text-sm text-slate-500">{route.source_city} to {route.destination_city}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-white px-3 py-2 text-center">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Tickets</p>
                            <p className="mt-1 font-semibold text-slate-900">{route.total_tickets}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2 text-center">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Revenue</p>
                            <p className="mt-1 font-semibold text-emerald-700">Rs. {route.total_revenue.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Zap className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                  <p className="text-slate-500">No route data available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reports
