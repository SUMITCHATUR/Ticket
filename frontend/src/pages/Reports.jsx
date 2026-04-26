import React, { useState, useEffect } from 'react'
import { 
  IndianRupee, 
  Download,
  BarChart3,
  Zap
} from 'lucide-react'
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

    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n')

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
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Summary Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Basic business summary data</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                Rs. {reportData.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                From {reportData.totalTickets} transactions
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {reportData.totalTickets}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Average: Rs. {reportData.totalTickets > 0 ? (reportData.totalRevenue / reportData.totalTickets).toFixed(0) : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200 px-6">
          <div className="flex space-x-6">
            <button
              onClick={() => setSelectedTab('payment')}
              className={`py-4 px-0 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'payment'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Payment Methods
            </button>
            <button
              onClick={() => setSelectedTab('revenue')}
              className={`py-4 px-0 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'revenue'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Revenue by Route
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Payment Methods Tab */}
          {selectedTab === 'payment' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Payment Methods Breakdown</h3>
                <button
                  onClick={() => exportReport('payment')}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>

              {reportData.paymentSummary.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Method</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Transactions</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Amount</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.paymentSummary.map((payment, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 capitalize font-medium text-gray-900">
                            {payment.payment_method}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {payment.total_transactions}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-green-600">
                            Rs. {payment.total_amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            Rs. {payment.average_amount.toFixed(0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Zap className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No payment data available</p>
                </div>
              )}
            </div>
          )}

          {/* Revenue by Route Tab */}
          {selectedTab === 'revenue' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Revenue by Route</h3>
                <button
                  onClick={() => exportReport('revenue')}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>

              {reportData.revenueByRoute.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Route</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Source → Dest</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Tickets</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.revenueByRoute.map((route) => (
                        <tr key={route.route_id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {route.route_name}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {route.source_city} → {route.destination_city}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {route.total_tickets}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-green-600">
                            Rs. {route.total_revenue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Zap className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No route data available</p>
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
