import React, { useEffect, useState } from 'react'
import { CheckCircle, Clock, Download, Eye, Search, Ticket, X, XCircle, Printer, XOctagon } from 'lucide-react'
import { ticketAPI } from '../services/api'
import toast from 'react-hot-toast'
import { printTicket, downloadTicketPDF } from '../utils/ticketPrint'
import { TicketSkeleton, CardSkeleton } from '../components/SkeletonLoader'

const ViewTickets = () => {
  const [tickets, setTickets] = useState([])
  const [filteredTickets, setFilteredTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [mobileSearch, setMobileSearch] = useState('')
  const [ticketNumberSearch, setTicketNumberSearch] = useState('')

  useEffect(() => {
    fetchTickets()
  }, [])

  useEffect(() => {
    filterTickets()
  }, [tickets, searchTerm, filterStatus, filterDate, mobileSearch, ticketNumberSearch])

  const fetchTickets = async () => {
    try {
      const response = await ticketAPI.getAll()
      const list = Array.isArray(response.data) ? response.data : []
      setTickets(list)
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast.error('Failed to load tickets. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelTicket = async (ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId)
    const ticketInfo = ticket ? `Ticket #${ticket.ticket_number} (${ticket.passenger_name})` : 'this ticket'
    
    if (!window.confirm(`क्या आप वाकई ${ticketInfo} को कैंसल करना चाहते हैं?\n\nयह action को वापस नहीं लिया जा सकता।\n\nAre you sure you want to cancel ${ticketInfo}?\nThis action cannot be undone.`)) {
      return
    }

    try {
      const response = await ticketAPI.cancel(ticketId)
      
      // Show success message with details
      toast.success(`🎫 टिकट सफलतापूर्वक कैंसल हो गया!\nTicket #${ticket?.ticket_number || ticketId}`, {
        icon: '✅',
        style: {
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#fff',
          padding: '16px',
          fontSize: '14px',
        },
        duration: 4000,
      })
      
      // Refresh tickets
      await fetchTickets()
      
      // Update selected ticket if it's the one being cancelled
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ 
          ...selectedTicket, 
          status: 'Cancelled',
          cancelled_at: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error cancelling ticket:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error'
      
      toast.error(`❌ टिकट कैंसल करने में असफल!\n${errorMessage}\n\nFailed to cancel ticket.`, {
        icon: '❌',
        style: {
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#fff',
          padding: '16px',
          fontSize: '14px',
        },
        duration: 5000,
      })
    }
  }

  const handlePrint = () => {
    if (selectedTicket) {
      printTicket(selectedTicket)
    } else {
      toast.error('कृपया पहले एक टिकट select करें।\nPlease select a ticket first.')
    }
  }

  const handleDownloadPDF = () => {
    if (selectedTicket) {
      downloadTicketPDF(selectedTicket)
    } else {
      toast.error('कृपया पहले एक टिकट select करें।\nPlease select a ticket first.')
    }
  }

  const filterTickets = () => {
    let filtered = tickets

    // Mobile number search (priority search)
    if (mobileSearch) {
      filtered = filtered.filter((ticket) =>
        ticket.contact_number && ticket.contact_number.includes(mobileSearch.replace(/\D/g, ''))
      )
    }
    
    // Ticket number search (exact match)
    if (ticketNumberSearch) {
      filtered = filtered.filter((ticket) =>
        ticket.ticket_number.toLowerCase() === ticketNumberSearch.toLowerCase()
      )
    }
    
    // General search term
    if (searchTerm) {
      filtered = filtered.filter((ticket) =>
        ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.contact_number && ticket.contact_number.includes(searchTerm.replace(/\D/g, '')))
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((ticket) => ticket.status.toLowerCase() === filterStatus)
    }

    if (filterDate) {
      filtered = filtered.filter((ticket) => ticket.booking_date === filterDate)
    }

    setFilteredTickets(filtered)
  }

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
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

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-700'
      case 'completed':
        return 'bg-sky-100 text-sky-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-amber-100 text-amber-700'
    }
  }

  const exportTickets = () => {
    const csvContent = [
      ['Ticket Number', 'Passenger', 'Route', 'Bus', 'Seat', 'Amount', 'Payment Method', 'Status', 'Booking Date'],
      ...filteredTickets.map((ticket) => [
        ticket.ticket_number,
        ticket.passenger_name,
        ticket.route,
        ticket.bus_number,
        ticket.seat_number,
        ticket.amount,
        ticket.payment_method,
        ticket.status,
        ticket.booking_date
      ])
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tickets-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <TicketSkeleton key={index} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <section className="rounded-[28px] bg-gradient-to-br from-slate-950 via-sky-950 to-cyan-900 px-5 py-6 text-white shadow-xl shadow-sky-950/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
              Ticket archive
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">View and manage issued tickets</h1>
            <p className="mt-2 max-w-2xl text-sm text-cyan-50/85">
              Search, filter and export booking history with a cleaner card-first layout for mobile and desktop.
            </p>
          </div>

          <button
            onClick={exportTickets}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </section>

      <div className="rounded-[28px] border border-white/70 bg-white/88 p-4 shadow-lg shadow-slate-200/60 backdrop-blur sm:p-5 lg:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Quick Search</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                placeholder="📱 Search by mobile number"
                value={mobileSearch}
                onChange={(e) => setMobileSearch(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="input rounded-2xl border-slate-200 bg-slate-50 pl-10"
                maxLength={10}
              />
            </div>
            <div className="relative">
              <Ticket className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="🎫 Search by ticket number"
                value={ticketNumberSearch}
                onChange={(e) => setTicketNumberSearch(e.target.value)}
                className="input rounded-2xl border-slate-200 bg-slate-50 pl-10"
              />
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Advanced Filters</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="General search (name, route, ticket)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input rounded-2xl border-slate-200 bg-slate-50 pl-10"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input rounded-2xl border-slate-200 bg-slate-50"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="input rounded-2xl border-slate-200 bg-slate-50"
            />
          </div>
        </div>

        <button
          onClick={() => {
            setSearchTerm('')
            setMobileSearch('')
            setTicketNumberSearch('')
            setFilterStatus('all')
            setFilterDate('')
          }}
          className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
        >
          Clear All Filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-lg shadow-slate-200/60 backdrop-blur sm:p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-950">{ticket.ticket_number}</p>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {getStatusIcon(ticket.status)}
                    {ticket.status}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Passenger</p>
                    <p className="mt-1 font-medium text-slate-900">{ticket.passenger_name}</p>
                    {ticket.contact_number && (
                      <p className="text-xs text-slate-500 mt-1">📱 {ticket.contact_number}</p>
                    )}
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Route</p>
                    <p className="mt-1 font-medium text-slate-900">{ticket.route}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Seat & Bus</p>
                    <p className="mt-1 font-medium text-slate-900">Seat {ticket.seat_number}</p>
                    <p className="text-xs text-slate-500">{ticket.bus_number}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Amount</p>
                    <p className="mt-1 font-medium text-emerald-700">Rs. {ticket.amount}</p>
                    <p className="text-xs text-slate-500 capitalize">{ticket.payment_method}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 lg:block lg:text-right">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Booked</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{ticket.booking_date}</p>
                  <p className="text-xs text-slate-500">{ticket.booking_time}</p>
                </div>
                <button
                  onClick={() => setSelectedTicket(ticket)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  <Eye className="h-4 w-4" />
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredTickets.length === 0 && (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
            <Ticket className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <p className="text-slate-600 font-medium">कोई tickets नहीं मिले</p>
            <p className="text-slate-600">No tickets found</p>
            <p className="mt-2 text-sm text-slate-400">
              कृपया अपनी search या filters adjust करें।
              <br />
              Try adjusting your search or date filters
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setMobileSearch('')
                  setTicketNumberSearch('')
                  setFilterStatus('all')
                  setFilterDate('')
                }}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                🔄 Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-white/70 bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Ticket Details</h3>
                <p className="text-sm text-slate-500">Complete booking information</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">Ticket Number</p>
                <p className="font-medium text-slate-900">{selectedTicket.ticket_number}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">Passenger</p>
                <p className="font-medium text-slate-900">{selectedTicket.passenger_name}</p>
                {selectedTicket.contact_number && (
                  <p className="text-sm text-slate-500 mt-1">📱 {selectedTicket.contact_number}</p>
                )}
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">Route</p>
                <p className="font-medium text-slate-900">{selectedTicket.route}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">Bus Number</p>
                <p className="font-medium text-slate-900">{selectedTicket.bus_number}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">Seat</p>
                <p className="font-medium text-slate-900">{selectedTicket.seat_number}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">Amount</p>
                <p className="font-medium text-emerald-700">Rs. {selectedTicket.amount}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">Payment Method</p>
                <p className="font-medium capitalize text-slate-900">{selectedTicket.payment_method}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">Status</p>
                <div className="mt-1 flex items-center gap-2">
                  {getStatusIcon(selectedTicket.status)}
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">Booking Date</p>
                <p className="font-medium text-slate-900">{selectedTicket.booking_date} {selectedTicket.booking_time ? `at ${selectedTicket.booking_time}` : ''}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">Journey Date</p>
                <p className="font-medium text-slate-900">{selectedTicket.journey_date || 'N/A'} {selectedTicket.departure_time ? `at ${selectedTicket.departure_time}` : ''}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5 print:hidden">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-100 px-4 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-200"
              >
                <Printer className="h-4 w-4" />
                🖨️ Print Ticket
              </button>
              
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-100 px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-200"
              >
                <Download className="h-4 w-4" />
                📄 Download PDF
              </button>
              
              {selectedTicket.status && selectedTicket.status.toLowerCase() !== 'cancelled' && (
                <button
                  onClick={() => handleCancelTicket(selectedTicket.id)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-red-100 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-200"
                >
                  <XOctagon className="h-4 w-4" />
                  ❌ Cancel Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewTickets
