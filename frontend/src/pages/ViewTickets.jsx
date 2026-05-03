import React, { useEffect, useState } from 'react'
import { CheckCircle, Clock, Download, Eye, Search, Ticket, X, XCircle } from 'lucide-react'
import { ticketAPI } from '../services/api'

const ViewTickets = () => {
  const [tickets, setTickets] = useState([])
  const [filteredTickets, setFilteredTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)

  useEffect(() => {
    fetchTickets()
  }, [])

  useEffect(() => {
    filterTickets()
  }, [tickets, searchTerm, filterStatus, filterDate])

  const fetchTickets = async () => {
    try {
      const response = await ticketAPI.getAll()
      const list = Array.isArray(response.data) ? response.data : []
      setTickets(list)
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTickets = () => {
    let filtered = tickets

    if (searchTerm) {
      filtered = filtered.filter((ticket) =>
        ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.route.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex h-64 items-center justify-center">
        <div className="spinner h-8 w-8"></div>
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ticket, passenger or route"
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

        <button
          onClick={() => {
            setSearchTerm('')
            setFilterStatus('all')
            setFilterDate('')
          }}
          className="mt-3 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
        >
          Clear Filters
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
            <p className="text-slate-600">No tickets found</p>
            <p className="mt-1 text-sm text-slate-400">Try adjusting your search or date filters</p>
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
                <p className="font-medium text-slate-900">{selectedTicket.booking_date} at {selectedTicket.booking_time}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">Journey Date</p>
                <p className="font-medium text-slate-900">{selectedTicket.journey_date} at {selectedTicket.departure_time}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewTickets
