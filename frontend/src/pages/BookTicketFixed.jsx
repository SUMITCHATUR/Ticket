import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  IndianRupee,
  MapPin,
  Receipt,
  Search,
  Users
} from 'lucide-react'
import SeatGridDirectBooking from '../components/SeatGridDirectBooking'
import PaymentSelector from '../components/PaymentSelector'
import TicketDisplay from '../components/TicketDisplay'
import { paymentAPI, routeAPI, ticketAPI } from '../services/api'
import toast from 'react-hot-toast'
import { MAHARASHTRA_CITIES } from '../data/maharashtraCities'
import { RouteSkeleton, SeatSkeleton, FormInputSkeleton } from '../components/SkeletonLoader'

const INITIAL_PASSENGER = {
  passenger_name: '',
  contact_number: '',
  age: '',
  gender: 'Male',
  id_type: 'Aadhaar Card',
  id_number: ''
}

const BookTicketFixed = () => {
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
  const [journeyDateFilter, setJourneyDateFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [upiId, setUpiId] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [upiUrl, setUpiUrl] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [creatingQR, setCreatingQR] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [bookedTicket, setBookedTicket] = useState(null)
  const [isBookingInProgress, setIsBookingInProgress] = useState(false)

  const fareAmount = selectedRoute ? selectedRoute.base_fare : 0

  useEffect(() => {
    fetchRoutes()
  }, [])

  const fetchRoutes = async () => {
    try {
      setLoadingRoutes(true)
      const response = await routeAPI.getAll()
      setRoutes(response.data)
    } catch (error) {
      console.error('Error fetching routes:', error)
      toast.error('Failed to load routes')
    } finally {
      setLoadingRoutes(false)
    }
  }

  const fetchSeats = async (route) => {
    if (!route) return

    try {
      setLoadingSeats(true)
      const response = await routeAPI.getAvailableSeats(route.route_id)
      console.log('Seats data:', response.data)
      setSeats(response.data)
      setSelectedSeat(null)
    } catch (error) {
      console.error('Error fetching seats:', error)
      toast.error('Failed to load seats')
      setSeats([])
    } finally {
      setLoadingSeats(false)
    }
  }

  const handleRouteSelect = (route) => {
    setSelectedRoute(route)
    fetchSeats(route)
  }

  const handleSeatSelect = (seat) => {
    if (isBookingInProgress) {
      toast.error('Please wait for current booking to complete')
      return
    }
    setSelectedSeat(seat)
  }

  const handlePassengerChange = (field, value) => {
    setPassenger(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePaymentMethodChange = (method) => {
    setSelectedMethod(method)
    setPaymentStatus('pending')
    setQrCode('')
    setUpiUrl('')
    setPaymentReference('')
  }

  const handleGenerateQR = async () => {
    if (!upiId.trim()) {
      toast.error('Please enter UPI ID')
      return
    }

    try {
      setCreatingQR(true)
      const response = await paymentAPI.generateUPIQR({
        upi_id: upiId.trim(),
        amount: fareAmount,
        description: `Bus Ticket - ${selectedRoute?.source_city} to ${selectedRoute?.destination_city}`
      })

      if (response.data.qr_code_data) {
        setQrCode(response.data.qr_code_data)
        setUpiUrl(response.data.upi_url)
        setPaymentReference(response.data.payment_id || response.data.transaction_id || '')
      }
    } catch (error) {
      console.error('Error generating QR:', error)
      setQrCode('')
      setUpiUrl('')
      setPaymentReference('')
      toast.error('Failed to generate payment QR')
    } finally {
      setCreatingQR(false)
    }
  }

  const validateBooking = () => {
    if (!selectedRoute) return 'Please select a route first'
    if (!selectedSeat) return 'Please select a seat'
    if (!passenger.passenger_name.trim()) return 'Please enter passenger name'
    if (!/^\d{10}$/.test(passenger.contact_number)) return 'Please enter valid 10 digit mobile number'
    if (!passenger.id_number.trim()) return 'Please enter ID number'
    return ''
  }

  const handleBookTicket = async () => {
    // Prevent duplicate calls
    if (isBookingInProgress || submitting) {
      console.log('Booking already in progress, ignoring duplicate call')
      return
    }

    const errorMessage = validateBooking()
    if (errorMessage) {
      toast.error(errorMessage)
      return
    }

    try {
      setIsBookingInProgress(true)
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

      console.log('Sending booking request:', { bookingPayload, paymentPayload })

      const response = await ticketAPI.book(bookingPayload, paymentPayload)
      const data = response.data

      console.log('Booking response:', data)

      const ticketData = {
        ticket_id: data.ticket?.ticket_id,
        ticket_number: data.ticket?.ticket_number,
        passenger: data.ticket?.passenger_name || passenger.passenger_name,
        route: `${selectedRoute.source_city} - ${selectedRoute.destination_city}`,
        bus: selectedSeat.bus_number,
        seat: data.ticket?.seat_number || selectedSeat.number,
        amount: fareAmount,
        paymentMethod: selectedMethod,
        paymentStatus: selectedMethod === 'cash' ? 'Success' : 'Verified',
        paymentTransaction: data.payment?.transaction_id || paymentReference,
        paymentQr: data.payment?.qr_code_data || qrCode,
        boardingDate: selectedRoute.travel_date,
        departureTime: selectedRoute.departure_time,
        arrivalTime: selectedRoute.arrival_time
      }

      setBookedTicket(ticketData)
      toast.success('🎉 Ticket booked successfully!', {
        icon: '🎉',
        style: {
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#fff',
          padding: '16px',
          fontSize: '14px',
        },
        duration: 5000,
      })
      
      // Refresh seats after successful booking
      fetchSeats(selectedRoute)
    } catch (error) {
      console.error('Error booking ticket:', error)
      
      // Handle specific error messages
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail
        if (detail.includes('already book') || detail.includes('already booked')) {
          toast.error('This seat is already booked. Please select another seat.')
          // Refresh seats to show current status
          fetchSeats(selectedRoute)
        } else {
          toast.error(detail)
        }
      } else {
        toast.error('Booking failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
      setIsBookingInProgress(false)
    }
  }

  const filteredRoutes = useMemo(() => {
    return routes.filter(route => {
      const matchesSource = !sourceFilter || route.source_city.toLowerCase().includes(sourceFilter.toLowerCase())
      const matchesDestination = !destinationFilter || route.destination_city.toLowerCase().includes(destinationFilter.toLowerCase())
      const matchesDate = !journeyDateFilter || route.travel_date === journeyDateFilter
      const matchesSearch = !searchTerm || 
        route.route_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.source_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.destination_city.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSource && matchesDestination && matchesDate && matchesSearch
    })
  }, [routes, sourceFilter, destinationFilter, journeyDateFilter, searchTerm])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Book Ticket</h1>
          <p className="text-gray-600">Select route and book your bus ticket</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Route Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Route</h2>
              
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Source city"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Destination city"
                  value={destinationFilter}
                  onChange={(e) => setDestinationFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={journeyDateFilter}
                  onChange={(e) => setJourneyDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Search routes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {loadingRoutes ? (
                <RouteSkeleton />
              ) : (
                <div className="space-y-3">
                  {filteredRoutes.map(route => (
                    <div
                      key={route.route_id}
                      onClick={() => handleRouteSelect(route)}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedRoute?.route_id === route.route_id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{route.route_name}</h3>
                          <p className="text-gray-600">{route.source_city} → {route.destination_city}</p>
                          <p className="text-sm text-gray-500">Distance: {route.distance_km} km</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">₹{route.base_fare}</p>
                          <p className="text-sm text-gray-500">{route.departure_time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seat Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Seat</h2>
              {loadingSeats ? (
                <SeatSkeleton />
              ) : (
                <SeatGridDirectBooking
                  seats={seats}
                  selectedSeat={selectedSeat}
                  onSeatSelect={handleSeatSelect}
                  loading={loadingSeats}
                  routeId={selectedRoute?.route_id}
                />
              )}
            </div>

            {/* Passenger Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Passenger Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passenger Name</label>
                  <input
                    type="text"
                    value={passenger.passenger_name}
                    onChange={(e) => handlePassengerChange('passenger_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter passenger name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={passenger.contact_number}
                    onChange={(e) => handlePassengerChange('contact_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={passenger.age}
                    onChange={(e) => handlePassengerChange('age', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Age"
                    min="1"
                    max="120"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={passenger.gender}
                    onChange={(e) => handlePassengerChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
                  <select
                    value={passenger.id_type}
                    onChange={(e) => handlePassengerChange('id_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Passport">Passport</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                  <input
                    type="text"
                    value={passenger.id_number}
                    onChange={(e) => handlePassengerChange('id_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter ID number"
                  />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {['cash', 'upi', 'online'].map(method => (
                  <button
                    key={method}
                    onClick={() => handlePaymentMethodChange(method)}
                    className={`p-3 border rounded-lg capitalize ${
                      selectedMethod === method
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {method === 'cash' ? '💵 Cash' : method === 'upi' ? '📱 UPI' : '💳 Online'}
                  </button>
                ))}
              </div>

              {selectedMethod === 'upi' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="Enter UPI ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <button
                    onClick={handleGenerateQR}
                    disabled={creatingQR || !upiId.trim()}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingQR ? 'Generating QR...' : 'Generate QR Code'}
                  </button>
                  
                  {qrCode && (
                    <div className="text-center">
                      <img src={qrCode} alt="UPI QR Code" className="mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Scan QR to pay ₹{fareAmount}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Booking Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Route:</span>
                  <span className="font-medium">
                    {selectedRoute ? `${selectedRoute.source_city} → ${selectedRoute.destination_city}` : 'Not selected'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Seat:</span>
                  <span className="font-medium">
                    {selectedSeat ? `Seat ${selectedSeat.number}` : 'Not selected'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Passenger:</span>
                  <span className="font-medium">
                    {passenger.passenger_name || 'Not entered'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment:</span>
                  <span className="font-medium capitalize">{selectedMethod}</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-lg font-bold text-green-600">₹{fareAmount}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleBookTicket}
                disabled={submitting || isBookingInProgress || !selectedRoute || !selectedSeat || !passenger.passenger_name.trim()}
                className="w-full mt-6 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {submitting || isBookingInProgress ? (
                  <span className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Booking in Progress...
                  </span>
                ) : (
                  'Complete Booking'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Ticket Display */}
        {bookedTicket && (
          <div className="mt-6">
            <TicketDisplay ticket={bookedTicket} />
          </div>
        )}
      </div>
    </div>
  )
}

export default BookTicketFixed
