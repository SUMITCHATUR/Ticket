import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  IndianRupee,
  MapPin,
  Search,
  Users
} from 'lucide-react'
import SeatGrid from '../components/SeatGrid'
import PaymentSelector from '../components/PaymentSelector'
import TicketDisplay from '../components/TicketDisplay'
import { paymentAPI, routeAPI, ticketAPI } from '../services/api'
import toast from 'react-hot-toast'
import { MAHARASHTRA_CITIES } from '../data/maharashtraCities'

const INITIAL_PASSENGER = {
  passenger_name: '',
  contact_number: '',
  age: '',
  gender: 'Male',
  id_type: 'Aadhar',
  id_number: ''
}

const BookTicket = () => {
  const [routes, setRoutes] = useState([])
  const [loadingRoutes, setLoadingRoutes] = useState(true)
  const [loadingSeats, setLoadingSeats] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [seats, setSeats] = useState([])
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState('cash')
  const [passenger, setPassenger] = useState(INITIAL_PASSENGER)
  const [sourceFilter, setSourceFilter] = useState('')
  const [destinationFilter, setDestinationFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [upiId, setUpiId] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [upiUrl, setUpiUrl] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [creatingQR, setCreatingQR] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [bookedTicket, setBookedTicket] = useState(null)

  useEffect(() => {
    fetchRoutes()
  }, [])

  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      const matchesSearch = searchTerm
        ? `${route.route_name} ${route.source_city} ${route.destination_city}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        : true
      const matchesSource = sourceFilter ? route.source_city === sourceFilter : true
      const matchesDestination = destinationFilter ? route.destination_city === destinationFilter : true
      return matchesSearch && matchesSource && matchesDestination
    })
  }, [destinationFilter, routes, searchTerm, sourceFilter])

  const cityOptions = useMemo(() => {
    return Array.from(
      new Set([
        ...MAHARASHTRA_CITIES,
        ...routes.flatMap((route) => [route.source_city, route.destination_city])
      ].filter(Boolean))
    ).sort((a, b) => a.localeCompare(b))
  }, [routes])

  const fareAmount = selectedRoute ? Number(selectedRoute.base_fare || 0) : 0

  const fetchRoutes = async () => {
    try {
      setLoadingRoutes(true)
      const response = await routeAPI.getAll()
      setRoutes(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching routes:', error)
      toast.error('Routes load nahi ho paayi. Backend check karein.')
    } finally {
      setLoadingRoutes(false)
    }
  }

  const fetchSeats = async (route) => {
    try {
      setLoadingSeats(true)
      setSelectedSeat(null)
      setSeats([])
      const response = await routeAPI.getAvailableSeats(route.route_id)
      const normalizedSeats = (Array.isArray(response.data) ? response.data : []).map((seat) => ({
        id: seat.seat_id,
        number: seat.seat_number,
        type: seat.seat_type,
        bus_number: seat.bus_number,
        status: (seat.status || 'available').toLowerCase()
      }))
      setSeats(normalizedSeats)
    } catch (error) {
      console.error('Error fetching seats:', error)
      toast.error('Seats load nahi ho paayi.')
    } finally {
      setLoadingSeats(false)
    }
  }

  const handleRouteSelect = (route) => {
    setSelectedRoute(route)
    setSelectedMethod('cash')
    setQrCode('')
    setUpiUrl('')
    setPaymentStatus('pending')
    setBookedTicket(null)
    fetchSeats(route)
  }

  const handlePassengerChange = (field, value) => {
    setPassenger((current) => ({
      ...current,
      [field]: value
    }))
  }

  const handlePaymentMethodChange = (method) => {
    setSelectedMethod(method)
    setQrCode('')
    setUpiUrl('')
    setPaymentStatus('pending')
  }

  const handleGenerateQR = async () => {
    if (!selectedRoute) {
      toast.error('Pehle route select karein.')
      return
    }

    if (selectedMethod === 'upi' && !upiId.trim()) {
      toast.error('UPI ID enter karein.')
      return
    }

    try {
      setCreatingQR(true)
      setPaymentStatus('pending')

      if (selectedMethod === 'upi') {
        const response = await paymentAPI.generateUPIQR({
          upi_id: upiId.trim(),
          amount: fareAmount,
          merchant_name: 'Bus Ticket System',
          transaction_note: `${selectedRoute.route_name} booking`
        })
        setQrCode(response.data.qr_code_data || '')
        setUpiUrl(response.data.upi_url || '')
      } else if (selectedMethod === 'online') {
        const response = await paymentAPI.create({
          payment_amount: fareAmount,
          payment_method: 'Online'
        })
        setQrCode(response.data.qr_code_data || '')
        setUpiUrl(response.data.payment_url || '')
      }
    } catch (error) {
      console.error('Error generating QR:', error)
      setQrCode('')
      setUpiUrl('')
      toast.error('Payment QR generate nahi ho paaya.')
    } finally {
      setCreatingQR(false)
    }
  }

  const validateBooking = () => {
    if (!selectedRoute) return 'Route select karein.'
    if (!selectedSeat) return 'Seat select karein.'
    if (!passenger.passenger_name.trim()) return 'Passenger name enter karein.'
    if (!/^\d{10}$/.test(passenger.contact_number)) return 'Valid 10 digit mobile number enter karein.'
    if (!passenger.id_number.trim()) return 'ID number enter karein.'
    if (selectedMethod === 'upi' && paymentStatus !== 'success') return 'UPI payment verify karein.'
    return ''
  }

  const handleBookTicket = async () => {
    const errorMessage = validateBooking()
    if (errorMessage) {
      toast.error(errorMessage)
      return
    }

    try {
      setSubmitting(true)
      const bookingPayload = {
        passenger: {
          passenger_name: passenger.passenger_name.trim(),
          contact_number: passenger.contact_number.trim(),
          age: passenger.age ? Number(passenger.age) : null,
          gender: passenger.gender,
          id_type: passenger.id_type,
          id_number: passenger.id_number.trim()
        },
        bus_route_id: selectedRoute.route_id,
        seat_id: selectedSeat.id,
        conductor_id: 1,
        payment_method: selectedMethod,
        ticket_price: fareAmount
      }

      const paymentPayload = {
        payment_amount: fareAmount,
        payment_method: selectedMethod,
        upi_id: selectedMethod === 'upi' ? upiId.trim() : null
      }

      const response = await ticketAPI.book(bookingPayload, paymentPayload)
      const data = response.data
      const ticketData = {
        ticket_id: data.ticket?.ticket_id,
        ticket_number: data.ticket?.ticket_number,
        passenger: data.ticket?.passenger_name || passenger.passenger_name,
        route: `${selectedRoute.source_city} - ${selectedRoute.destination_city}`,
        bus: selectedSeat.bus_number,
        seat: data.ticket?.seat_number || selectedSeat.number,
        amount: fareAmount,
        paymentMethod: selectedMethod,
        paymentStatus: selectedMethod === 'upi' ? 'Success' : 'Pending',
        paymentTransaction: data.payment?.transaction_id,
        paymentQr: data.payment?.qr_code_data || qrCode
      }

      setBookedTicket(ticketData)
      toast.success('Ticket successfully book ho gaya.')
      fetchSeats(selectedRoute)
    } catch (error) {
      console.error('Error booking ticket:', error)
      toast.error('Ticket booking failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_24%),linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_42%,_#f8fafc_100%)]" />
      <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-sky-950 via-cyan-900 to-emerald-800 px-4 py-5 text-white shadow-xl shadow-cyan-950/20 sm:px-5 sm:py-6 lg:rounded-[28px] lg:px-6 lg:py-7">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 left-10 h-44 w-44 rounded-full bg-emerald-300/10" />
        <div className="relative grid gap-5 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
              Maharashtra Route Booking
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Start Route aur End Route select karke fares instantly dekho
              </h1>
              <p className="max-w-2xl text-sm text-cyan-50/85 sm:text-[15px] lg:text-base">
                Maharashtra ke multiple city pairs ke routes, ticket price, departure timing aur seat availability ek hi screen par.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100/75">Live Routes</p>
              <p className="mt-2 text-xl font-bold sm:text-2xl">{routes.length}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100/75">Filtered</p>
              <p className="mt-2 text-xl font-bold sm:text-2xl">{filteredRoutes.length}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100/75">Selected Fare</p>
              <p className="mt-2 text-xl font-bold sm:text-2xl">Rs. {fareAmount || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100/75">Seat</p>
              <p className="mt-2 text-xl font-bold sm:text-2xl">{selectedSeat?.number || '--'}</p>
            </div>
          </div>
        </div>
      </section>

      {bookedTicket && <TicketDisplay ticket={bookedTicket} />}

      <div className="card overflow-hidden border-0 shadow-lg shadow-slate-200/70">
        <div className="border-b border-slate-100 bg-gradient-to-r from-white via-slate-50 to-cyan-50 px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Route Finder</h2>
              <p className="text-sm text-slate-600">Source aur destination choose kijiye, matching ticket prices niche aa jayenge.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              {sourceFilter && (
                <span className="rounded-full bg-slate-900 px-3 py-1 text-white">{sourceFilter}</span>
              )}
              {destinationFilter && (
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-white">{destinationFilter}</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4 sm:gap-4 sm:p-5 md:grid-cols-3 lg:p-6">
          <div className="relative md:col-span-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Route, source ya destination search karein"
              className="input h-12 rounded-2xl border-slate-200 bg-slate-50 pl-10 shadow-inner shadow-slate-100"
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="input h-12 rounded-2xl border-slate-200 bg-white"
          >
            <option value="">Start Route</option>
            {cityOptions.map((city) => (
              <option key={`src-${city}`} value={city}>{city}</option>
            ))}
          </select>

          <select
            value={destinationFilter}
            onChange={(e) => setDestinationFilter(e.target.value)}
            className="input h-12 rounded-2xl border-slate-200 bg-white"
          >
            <option value="">End Route</option>
            {cityOptions.map((city) => (
              <option key={`dst-${city}`} value={city}>{city}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearchTerm('')
              setSourceFilter('')
              setDestinationFilter('')
            }}
            className="h-12 rounded-2xl bg-slate-100 px-4 font-medium text-slate-700 transition hover:bg-slate-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:gap-6 2xl:grid-cols-[minmax(420px,0.92fr)_minmax(560px,1.08fr)]">
        <div className="card overflow-hidden border border-white/70 bg-white/90 shadow-lg shadow-slate-200/70">
          <div className="border-b border-slate-100 bg-white px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Available Routes</h2>
                <p className="text-sm text-slate-600">Matching routes aur unke prices yahan se compare kijiye.</p>
              </div>
              <div className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
                {filteredRoutes.length}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 lg:p-6">
          {sourceFilter && destinationFilter && (
            <div className="mb-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-900">
              {sourceFilter} se {destinationFilter} ke sab matching routes aur unka price niche dikh raha hai.
            </div>
          )}

          {loadingRoutes ? (
            <div className="flex items-center justify-center h-48">
              <div className="spinner w-8 h-8"></div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 lg:max-h-[38rem] lg:overflow-y-auto lg:pr-1">
              {filteredRoutes.map((route) => {
                const active = selectedRoute?.route_id === route.route_id
                return (
                  <button
                    key={route.route_id}
                    type="button"
                    onClick={() => handleRouteSelect(route)}
                    className={`group w-full text-left rounded-[24px] border p-4 sm:p-5 transition-all ${
                      active
                        ? 'border-cyan-500 bg-gradient-to-r from-cyan-50 to-emerald-50 shadow-md shadow-cyan-100'
                        : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md hover:shadow-slate-200/70'
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{route.route_name}</p>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {route.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin className="w-4 h-4" />
                          <span>{route.source_city}</span>
                          <span className="text-slate-300">•</span>
                          <span>{route.destination_city}</span>
                        </div>
                        <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                          <div className="rounded-2xl bg-slate-50 px-3 py-2">
                            <span className="block text-[11px] uppercase tracking-[0.18em] text-slate-400">Travel Date</span>
                            <span className="font-medium text-slate-800">{route.travel_date}</span>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-3 py-2">
                            <span className="block text-[11px] uppercase tracking-[0.18em] text-slate-400">Timing</span>
                            <span className="font-medium text-slate-800">{route.departure_time} - {route.arrival_time}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="w-4 h-4" />
                          <span>{Number(route.distance_km || 0)} km • {route.estimated_time_hours} hrs</span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-sm text-slate-500">Fare</p>
                        <p className="text-2xl font-bold text-cyan-700">Rs. {Number(route.base_fare)}</p>
                        <p className="mt-2 text-xs font-medium text-slate-400 group-hover:text-cyan-600">
                          {active ? 'Selected' : 'Tap to view seats'}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}

              {filteredRoutes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <AlertCircle className="w-10 h-10 text-gray-400 mb-3" />
                  <p className="text-gray-600">Koi matching route nahi mila.</p>
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card border border-white/70 bg-white/92 p-4 shadow-lg shadow-slate-200/70 sm:p-5 lg:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Seat Selection</h2>
              {selectedRoute && (
                <span className="max-w-full rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                  {selectedRoute.source_city} to {selectedRoute.destination_city}
                </span>
              )}
            </div>
            {selectedRoute ? (
              <SeatGrid
                seats={seats}
                selectedSeat={selectedSeat}
                onSeatSelect={setSelectedSeat}
                loading={loadingSeats}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                Pahle route select karein.
              </div>
            )}
          </div>

          <div className="card space-y-4 border border-white/70 bg-white/92 p-4 shadow-lg shadow-slate-200/70 sm:p-5 lg:p-6">
            <h2 className="text-lg font-semibold text-gray-900">Passenger Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Passenger name"
                value={passenger.passenger_name}
                onChange={(e) => handlePassengerChange('passenger_name', e.target.value)}
                className="input rounded-2xl border-slate-200 bg-slate-50"
              />
              <input
                type="tel"
                placeholder="10 digit mobile number"
                value={passenger.contact_number}
                onChange={(e) => handlePassengerChange('contact_number', e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="input rounded-2xl border-slate-200 bg-slate-50"
              />
              <input
                type="number"
                placeholder="Age"
                value={passenger.age}
                onChange={(e) => handlePassengerChange('age', e.target.value)}
                className="input rounded-2xl border-slate-200 bg-slate-50"
              />
              <select
                value={passenger.gender}
                onChange={(e) => handlePassengerChange('gender', e.target.value)}
                className="input rounded-2xl border-slate-200 bg-slate-50"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <select
                value={passenger.id_type}
                onChange={(e) => handlePassengerChange('id_type', e.target.value)}
                className="input rounded-2xl border-slate-200 bg-slate-50"
              >
                <option value="Aadhar">Aadhar</option>
                <option value="PAN">PAN</option>
                <option value="Passport">Passport</option>
                <option value="DL">DL</option>
                <option value="Voter ID">Voter ID</option>
              </select>
              <input
                type="text"
                placeholder="ID number"
                value={passenger.id_number}
                onChange={(e) => handlePassengerChange('id_number', e.target.value)}
                className="input rounded-2xl border-slate-200 bg-slate-50"
              />
            </div>
          </div>

          <div className="card space-y-4 border border-white/70 bg-white/92 p-4 shadow-lg shadow-slate-200/70 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
              <div className="flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-cyan-700 font-semibold">
                <IndianRupee className="w-4 h-4" />
                <span>{fareAmount || 0}</span>
              </div>
            </div>

            {selectedMethod === 'upi' && (
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="Enter UPI ID"
                className="input rounded-2xl border-slate-200 bg-slate-50"
              />
            )}

            <PaymentSelector
              selectedMethod={selectedMethod}
              onMethodChange={handlePaymentMethodChange}
              amount={fareAmount}
              upiId={upiId}
              qrCode={qrCode}
              upiUrl={upiUrl}
              isLoading={creatingQR}
              onGenerateQR={handleGenerateQR}
              paymentStatus={paymentStatus}
              onPaymentStatusChange={setPaymentStatus}
            />
          </div>

          <div className="card border border-white/70 bg-white/92 p-4 shadow-lg shadow-slate-200/70 sm:p-5 lg:p-6">
            <div className="mb-4 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-gray-500">Route</p>
                <p className="font-medium text-gray-900">{selectedRoute ? `${selectedRoute.source_city} - ${selectedRoute.destination_city}` : '-'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-gray-500">Seat</p>
                <p className="font-medium text-gray-900">{selectedSeat ? selectedSeat.number : '-'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-gray-500">Passengers</p>
                <p className="font-medium text-gray-900 flex items-center gap-2"><Users className="w-4 h-4" /> 1</p>
              </div>
            </div>

            {selectedMethod === 'upi' && paymentStatus === 'success' && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 mb-4 text-green-800">
                <CheckCircle className="w-4 h-4" />
                <span>UPI payment verified. Ab booking complete kar sakte hain.</span>
              </div>
            )}

            <button
              onClick={handleBookTicket}
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? 'Booking...' : 'Complete Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookTicket
