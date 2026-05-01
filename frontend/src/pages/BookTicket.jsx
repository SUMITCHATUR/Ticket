import React, { useState, useEffect } from 'react'
import { 
  Search, 
  MapPin, 
  Users, 
  Calendar,
  IndianRupee,
  CreditCard,
  Smartphone,
  Banknote,
  QrCode,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import SeatGrid from '../components/SeatGrid'
import PaymentSelector from '../components/PaymentSelector'
import TicketDisplay from '../components/TicketDisplay'
import { routeAPI, ticketAPI, paymentAPI } from '../services/api'
import toast from 'react-hot-toast'
import { MAHARASHTRA_CITIES } from '../data/maharashtraCities'

const BookTicket = () => {
  const [step, setStep] = useState(1) // 1: Route, 2: Seats, 3: Passenger, 4: Payment, 5: Confirmation
  const [loading, setLoading] = useState(false)
  const [routeQuery, setRouteQuery] = useState({
    from: '',
    to: ''
  })
  const [showFromSuggestions, setShowFromSuggestions] = useState(false)
  const [showToSuggestions, setShowToSuggestions] = useState(false)
  
  // Form data
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [passengerData, setPassengerData] = useState({
    name: '',
    age: '',
    gender: '',
    idType: 'Aadhar',
    idNumber: ''
  })
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [upiId, setUpiId] = useState('')
  const [generatedTicket, setGeneratedTicket] = useState(null)
  const [customQrFile, setCustomQrFile] = useState(null)
  const [customQrUrl, setCustomQrUrl] = useState('')
  const [upiPreviewQr, setUpiPreviewQr] = useState('')
  const [upiPreviewUrl, setUpiPreviewUrl] = useState('')
  const [upiPreviewLoading, setUpiPreviewLoading] = useState(false)

  // API data
  const [routes, setRoutes] = useState([])
  const [availableSeats, setAvailableSeats] = useState([])

  useEffect(() => {
    fetchRoutes()
  }, [])

  useEffect(() => {
    // When user types From/To, fetch matching routes (and backend can auto-generate)
    const timer = setTimeout(() => {
      fetchRoutes(routeQuery)
    }, 250)
    return () => clearTimeout(timer)
  }, [routeQuery.from, routeQuery.to])

  useEffect(() => {
    if (selectedRoute) {
      fetchAvailableSeats(selectedRoute.route_id)
    }
  }, [selectedRoute])

  useEffect(() => {
    if (paymentMethod !== 'upi') {
      setUpiPreviewQr('')
      setUpiPreviewUrl('')
    }
  }, [paymentMethod])

  const fetchRoutes = async (query = null) => {
    try {
      const params = query
        ? {
            from: query.from || undefined,
            to: query.to || undefined,
          }
        : {}

      const response = await routeAPI.getAll(params)
      setRoutes(response.data)
    } catch (error) {
      // Use demo routes if API fails
      const demoRoutes = [
        {
          route_id: 1,
          source_city: 'Mumbai',
          destination_city: 'Pune',
          departure_time: '08:00',
          arrival_time: '10:30',
          base_fare: 500,
          bus_type: 'AC Sleeper',
          available_seats: 40
        },
        {
          route_id: 2,
          source_city: 'Pune',
          destination_city: 'Mumbai',
          departure_time: '14:00',
          arrival_time: '16:30',
          base_fare: 500,
          bus_type: 'AC Sleeper',
          available_seats: 38
        },
        {
          route_id: 3,
          source_city: 'Mumbai',
          destination_city: 'Nashik',
          departure_time: '06:00',
          arrival_time: '09:00',
          base_fare: 600,
          bus_type: 'AC Seater',
          available_seats: 45
        }
      ]
      
      // Filter routes based on query if provided
      let filteredRoutes = demoRoutes
      if (query) {
        if (query.from) {
          filteredRoutes = filteredRoutes.filter(r => 
            r.source_city.toLowerCase().includes(query.from.toLowerCase())
          )
        }
        if (query.to) {
          filteredRoutes = filteredRoutes.filter(r => 
            r.destination_city.toLowerCase().includes(query.to.toLowerCase())
          )
        }
      }
      
      setRoutes(filteredRoutes)
    }
  }

  const fetchAvailableSeats = async (routeId) => {
    console.log('fetchAvailableSeats called with routeId:', routeId)
    try {
      setLoading(true)
      const response = await routeAPI.getAvailableSeats(routeId)
      console.log('Seat API response:', response)
      const list = Array.isArray(response.data) ? response.data : []
      console.log('Seats list:', list)
      const mappedSeats = list.map((s) => ({
        id: s.seat_id,
        number: s.seat_number,
        type: s.seat_type,
        status: (s.status || 'available').toLowerCase()
      }))
      console.log('Mapped seats:', mappedSeats)
      setAvailableSeats(mappedSeats)
    } catch (error) {
      toast.error('Failed to fetch seats')
      console.error('Seat fetch error:', error)
      // Use demo seats as fallback
      const demoSeats = []
      for (let i = 1; i <= 20; i++) {
        demoSeats.push({
          id: i,
          number: `A${i}`,
          type: 'sleeper',
          status: i <= 15 ? 'available' : 'booked'
        })
      }
      for (let i = 1; i <= 20; i++) {
        demoSeats.push({
          id: i + 20,
          number: `B${i}`,
          type: 'sleeper',
          status: i <= 12 ? 'available' : 'booked'
        })
      }
      console.log('Using demo seats:', demoSeats)
      setAvailableSeats(demoSeats)
    } finally {
      setLoading(false)
    }
  }

  const handleRouteSelect = async (route) => {
    setSelectedRoute(route)
    setSelectedSeat(null)
    // Fetch seats first, then go to step 2
    await fetchAvailableSeats(route.route_id)
    setStep(2)
  }

  const generateUpiPreview = async () => {
    if (!upiId.trim()) {
      toast.error('Please enter UPI ID to generate QR')
      return
    }
    if (!selectedRoute) {
      toast.error('Please select a route first')
      return
    }
    setUpiPreviewLoading(true)
    try {
      const response = await paymentAPI.generateUPIQR({
        upi_id: upiId.trim(),
        amount: selectedRoute.base_fare || 500,
        merchant_name: 'Bus Ticket System',
        transaction_note: `Bus Ticket ${selectedRoute.source_city}-${selectedRoute.destination_city}`
      })
      if (response.data.success) {
        setUpiPreviewQr(response.data.qr_code_data)
        setUpiPreviewUrl(response.data.upi_url)
        toast.success('UPI payment QR generated. Scan to pay the exact amount.')
      }
    } catch (error) {
      toast.error('Unable to generate UPI QR. Check UPI ID and try again.')
    } finally {
      setUpiPreviewLoading(false)
    }
  }

  const normalizeText = (s) =>
    String(s || '')
      .toLowerCase()
      .trim()
      .replace(/[\s\-_]+/g, '')

  const normalizedIncludes = (value, q) => {
    const v = normalizeText(value)
    const query = normalizeText(q)
    if (!query) return true
    return v.includes(query)
  }

  const allCities = Array.from(
    new Set(
      [
        ...MAHARASHTRA_CITIES,
        ...routes.flatMap((r) => [r.source_city, r.destination_city]),
      ]
        .filter(Boolean)
        .map((c) => String(c).trim())
    )
  ).sort((a, b) => a.localeCompare(b))

  const citySuggestions = (q) => {
    const query = normalizeText(q)
    if (!query) return allCities.slice(0, 12)

    const scored = allCities
      .map((city) => {
        const norm = normalizeText(city)
        const starts = norm.startsWith(query)
        const includes = norm.includes(query)
        return { city, score: starts ? 2 : includes ? 1 : 0 }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.city.localeCompare(b.city))
      .slice(0, 12)
      .map((x) => x.city)

    return scored
  }

  const filteredRoutes = routes.filter((route) => {
    const fromOk = normalizedIncludes(route.source_city, routeQuery.from)
    const toOk = normalizedIncludes(route.destination_city, routeQuery.to)
    return fromOk && toOk
  })

  const handleSeatSelect = (seat) => {
    if (String(seat.status).toLowerCase() === 'available') {
      setSelectedSeat(seat)
    }
  }

  const handlePassengerChange = (field, value) => {
    setPassengerData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validatePassengerData = () => {
    if (!passengerData.name.trim()) {
      toast.error('Please enter passenger name')
      return false
    }
    if (!passengerData.age || passengerData.age < 1 || passengerData.age > 120) {
      toast.error('Please enter valid age')
      return false
    }
    if (!passengerData.gender) {
      toast.error('Please select gender')
      return false
    }
    if (!passengerData.idNumber.trim()) {
      toast.error('Please enter ID number')
      return false
    }
    return true
  }

  const handleNextStep = () => {
    if (step === 1 && !selectedRoute) {
      toast.error('Please select a route')
      return
    }
    if (step === 2 && !selectedSeat) {
      toast.error('Please select a seat')
      return
    }
    if (step === 3 && !validatePassengerData()) {
      return
    }
    if (step < 5) {
      setStep(step + 1)
    }
  }

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleBooking = async () => {
    try {
      setLoading(true)
      
      const bookingData = {
        passenger: {
          passenger_name: passengerData.name,
          contact_number: '9876543210',
          age: parseInt(passengerData.age),
          gender: passengerData.gender,
          id_type: passengerData.idType,
          id_number: passengerData.idNumber
        },
        bus_route_id: selectedRoute.route_id,
        seat_id: selectedSeat.id,
        conductor_id: 1,
        ticket_price: selectedRoute.base_fare || 500,
        payment_method: paymentMethod === 'upi' ? 'UPI' : paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)
      }

      if (paymentMethod === 'upi' && !upiId.trim()) {
        toast.error('Please enter UPI ID for UPI payment')
        setLoading(false)
        return
      }
      if (paymentMethod === 'upi' && !upiPreviewQr) {
        toast.error('Please generate the UPI payment QR before completing booking')
        setLoading(false)
        return
      }

      const paymentData = {
        payment_amount: selectedRoute.base_fare || 500,
        payment_method: paymentMethod === 'upi' ? 'UPI' : paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1),
        upi_id: paymentMethod === 'upi' ? upiId.trim() : null
      }

      const response = await ticketAPI.book(bookingData, paymentData)
      
      if (response.data.success) {
        setGeneratedTicket({
          ...response.data.ticket,
          passenger: passengerData.name,
          seat: selectedSeat.number,
          route: `${selectedRoute.source_city} to ${selectedRoute.destination_city}`,
          bus: response.data.ticket?.bus || '-',
          amount: selectedRoute.base_fare || 500,
          paymentMethod: paymentMethod,
          paymentQr: response.data.payment?.qr_code_data || '',
          upiUrl: response.data.payment?.upi_url || '',
          paymentTransaction: response.data.payment?.transaction_id || response.data.payment?.payment_id,
          paymentStatus: response.data.payment?.payment_status || 'Pending',
          customQrUrl: customQrUrl
        })
        setStep(5)
        toast.success('Ticket booked successfully!')
      } else {
        toast.error('Failed to book ticket')
      }
    } catch (error) {
      toast.error('Booking failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetBooking = () => {
    if (customQrUrl) {
      URL.revokeObjectURL(customQrUrl)
    }
    setStep(1)
    setSelectedRoute(null)
    setSelectedSeat(null)
    setPassengerData({
      name: '',
      age: '',
      gender: '',
      idType: 'Aadhar',
      idNumber: ''
    })
    setPaymentMethod('cash')
    setCustomQrFile(null)
    setCustomQrUrl('')
    setUpiPreviewQr('')
    setUpiPreviewUrl('')
    setGeneratedTicket(null)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Book New Ticket</h1>
        <p className="text-gray-600">Complete your ticket booking in few simple steps</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { step: 1, name: 'Select Route', icon: MapPin },
            { step: 2, name: 'Choose Seat', icon: Users },
            { step: 3, name: 'Passenger Info', icon: Calendar },
            { step: 4, name: 'Payment', icon: CreditCard },
            { step: 5, name: 'Confirmation', icon: CheckCircle }
          ].map((item, index) => (
            <div key={item.step} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${step >= item.step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}
              `}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="ml-2 hidden sm:block">
                <p className={`text-sm font-medium ${step >= item.step ? 'text-primary-600' : 'text-gray-600'}`}>
                  {item.name}
                </p>
              </div>
              {index < 4 && (
                <div className={`w-full h-0.5 mx-4 ${step > item.step ? 'bg-primary-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="card p-6">
        {/* Step 1: Route Selection */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Route</h2>

            {/* Search Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Stop (From City)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={routeQuery.from}
                    onChange={(e) => setRouteQuery((p) => ({ ...p, from: e.target.value }))}
                    onFocus={() => setShowFromSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowFromSuggestions(false), 120)}
                    className="input pl-9"
                    placeholder="e.g. Pune"
                  />
                </div>

                {showFromSuggestions && (
                  <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    {citySuggestions(routeQuery.from).map((city) => (
                      <button
                        key={`from-${city}`}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setRouteQuery((p) => ({ ...p, from: city }))}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        {city}
                      </button>
                    ))}
                    {citySuggestions(routeQuery.from).length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">No city found</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Stop (To City)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={routeQuery.to}
                    onChange={(e) => setRouteQuery((p) => ({ ...p, to: e.target.value }))}
                    onFocus={() => setShowToSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowToSuggestions(false), 120)}
                    className="input pl-9"
                    placeholder="e.g. Chhatrapati Sambhajinagar"
                  />
                </div>

                {showToSuggestions && (
                  <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    {citySuggestions(routeQuery.to).map((city) => (
                      <button
                        key={`to-${city}`}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setRouteQuery((p) => ({ ...p, to: city }))}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        {city}
                      </button>
                    ))}
                    {citySuggestions(routeQuery.to).length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">No city found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRoutes.map((route) => (
                <div
                  key={route.route_id}
                  onClick={() => handleRouteSelect(route)}
                  className={`
                    p-4 border rounded-lg cursor-pointer transition-all
                    ${selectedRoute?.route_id === route.route_id 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{route.route_name}</h3>
                    <IndianRupee className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    {route.source_city} to {route.destination_city}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">{route.distance_km} km</span>
                    <span className="font-medium text-primary-600">Rs. {route.base_fare}</span>
                  </div>
                </div>
              ))}
            </div>

            {filteredRoutes.length === 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                No routes found for the selected cities. Try changing Start/End stop names.
              </div>
            )}
          </div>
        )}

        {/* Step 2: Seat Selection */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Seat</h2>
            <SeatGrid
              seats={availableSeats}
              selectedSeat={selectedSeat}
              onSeatSelect={handleSeatSelect}
              loading={loading}
            />
          </div>
        )}

        {/* Step 3: Passenger Information */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Passenger Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={passengerData.name}
                  onChange={(e) => handlePassengerChange('name', e.target.value)}
                  className="input"
                  placeholder="Enter passenger name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age *
                </label>
                <input
                  type="number"
                  value={passengerData.age}
                  onChange={(e) => handlePassengerChange('age', e.target.value)}
                  className="input"
                  placeholder="Enter age"
                  min="1"
                  max="120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <select
                  value={passengerData.gender}
                  onChange={(e) => handlePassengerChange('gender', e.target.value)}
                  className="input"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Type *
                </label>
                <select
                  value={passengerData.idType}
                  onChange={(e) => handlePassengerChange('idType', e.target.value)}
                  className="input"
                >
                  <option value="Aadhar">Aadhar</option>
                  <option value="PAN">PAN</option>
                  <option value="Passport">Passport</option>
                  <option value="DL">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Number *
                </label>
                <input
                  type="text"
                  value={passengerData.idNumber}
                  onChange={(e) => handlePassengerChange('idNumber', e.target.value)}
                  className="input"
                  placeholder="Enter ID number"
                />
              </div>
            </div>

            {/* Booking Summary */}
            {(selectedRoute && selectedSeat) && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Booking Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Route:</span>
                    <span className="font-medium">{selectedRoute.source_city} to {selectedRoute.destination_city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seat:</span>
                    <span className="font-medium">{selectedSeat.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fare:</span>
                    <span className="font-medium text-primary-600">Rs. {selectedRoute.base_fare || 500}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Payment */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
            <PaymentSelector
              selectedMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
              amount={selectedRoute?.base_fare || 500}
              upiId={upiId}
              qrCode={upiPreviewQr}
              upiUrl={upiPreviewUrl}
              isLoading={upiPreviewLoading}
              onGenerateQR={paymentMethod === 'upi' ? generateUpiPreview : null}
            />

            {paymentMethod === 'upi' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verify UPI ID
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="input w-full"
                  placeholder="Enter your UPI ID (e.g. example@upi)"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 5: Confirmation */}
        {step === 5 && generatedTicket && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Confirmed!</h2>
            <TicketDisplay ticket={generatedTicket} />
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 5 && (
          <div className="flex justify-between mt-6">
            <button
              onClick={handlePrevStep}
              disabled={step === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={step === 4 ? handleBooking : handleNextStep}
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="spinner w-4 h-4 mr-2"></div>
                  Processing...
                </div>
              ) : (
                step === 4 ? 'Complete Booking' : 'Next'
              )}
            </button>
          </div>
        )}

        {/* Reset Button */}
        {step === 5 && (
          <div className="flex justify-center mt-6">
            <button onClick={resetBooking} className="btn-primary">
              Book Another Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookTicket
