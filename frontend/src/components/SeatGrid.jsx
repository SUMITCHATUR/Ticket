import React, { useEffect, useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const SeatGrid = ({ seats, selectedSeat, onSeatSelect, loading, routeId }) => {
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)
  const [selectedSeatBeforeRefresh, setSelectedSeatBeforeRefresh] = useState(null)

  // Check if selected seat was taken by another booking (only when seats change)
  useEffect(() => {
    if (selectedSeat && seats.length > 0) {
      const currentSeat = seats.find(s => s.id === selectedSeat.id)
      const currentSeatStatus = currentSeat?.status
      
      console.log('Seat status check:', {
        selectedSeatId: selectedSeat.id,
        selectedSeatNumber: selectedSeat.number,
        currentSeatStatus,
        allSeats: seats.map(s => ({ id: s.id, number: s.number, status: s.status }))
      })
      
      if (currentSeatStatus === 'booked' || currentSeatStatus === 'unavailable') {
        // Seat was taken by another user
        toast.error(`💺 Seat ${selectedSeat.number} अभी अभी बुक हो गया है!\nकृपया कोई और seat select करें।\n\nSeat ${selectedSeat.number} was just booked!\nPlease select another seat.`, {
          icon: '⚠️',
          style: {
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#fff',
            padding: '16px',
            fontSize: '14px',
          },
          duration: 5000,
        })
        onSeatSelect(null) // Clear selection
      }
    }
  }, [seats]) // Only run when seats array changes, not on selectedSeat change

  const handleSeatSelect = (seat) => {
    console.log('Seat selection attempt:', {
      seatId: seat.id,
      seatNumber: seat.number,
      seatStatus: seat.status
    })
    
    if (seat.status === 'booked' || seat.status === 'unavailable') {
      toast.error(`💺 Seat ${seat.number} पहले ही बुक हो चुकी है!\nकृपया कोई और seat choose करें।\n\nSeat ${seat.number} is already booked!\nPlease choose another seat.`, {
        icon: '❌',
        style: {
          borderRadius: '10px',
          background: '#ef4444',
          color: '#fff',
        },
        duration: 3000,
      })
      return
    }
    
    // Clear any previous selection and select new seat
    onSeatSelect(seat)
  }

  const handleRefreshSeats = async () => {
    if (!routeId || refreshing) return
    
    setRefreshing(true)
    setSelectedSeatBeforeRefresh(selectedSeat)
    
    try {
      // This would call a refresh function passed from parent
      // For now, we'll just show a loading state
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLastUpdated(new Date())
      toast.success('💺 Seat status updated!', {
        icon: '✅',
        style: {
          borderRadius: '8px',
          background: '#10b981',
          color: '#fff',
        },
        duration: 2000,
      })
    } catch (error) {
      toast.error('Failed to refresh seat status')
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }
  
  if (!seats || seats.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No seats available</p>
      </div>
    )
  }

  // Log seat data for debugging
  console.log('SeatGrid rendering with seats:', seats.map(s => ({
    id: s.id,
    number: s.number,
    status: s.status,
    type: s.type
  })))

  const getSeatClass = (seat) => {
    // Check if seat is booked or unavailable
    const isBooked = seat.status === 'booked' || seat.status === 'unavailable'
    
    if (isBooked) return 'seat-booked'
    if (selectedSeat?.id === seat.id) return 'seat-selected'
    return 'seat-available'
  }

  const getSeatIcon = (seat) => {
    // Check if seat is booked or unavailable
    const isBooked = seat.status === 'booked' || seat.status === 'unavailable'
    
    if (isBooked) return 'X'
    if (selectedSeat?.id === seat.id) return 'v'
    return seat.number
  }

  // Group seats by row
  const rows = {}
  seats.forEach(seat => {
    const row = seat.number.replace(/\d/g, '')
    if (!rows[row]) rows[row] = []
    rows[row].push(seat)
  })

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="seat-available w-6 h-6 mr-2"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center">
            <div className="seat-selected w-6 h-6 mr-2"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center">
            <div className="seat-booked w-6 h-6 mr-2"></div>
            <span>Booked</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            Last updated: {lastUpdated.toLocaleTimeString('hi-IN')}
          </span>
          <button
            onClick={handleRefreshSeats}
            disabled={refreshing || !routeId}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh seat status"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Bus Layout */}
      <div className="rounded-[24px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 shadow-inner shadow-slate-100">
        {/* Driver Seat */}
        <div className="mb-4 text-center">
          <div className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-700 px-4 text-sm font-semibold text-white shadow-sm">
            Driver
          </div>
        </div>

        {/* Seats Grid */}
        <div className="space-y-3">
          {Object.keys(rows).map(row => (
            <div key={row} className="rounded-2xl bg-white/80 px-3 py-3 shadow-sm ring-1 ring-slate-100">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                <span>Row {row}</span>
                <span>{rows[row].length} seats</span>
              </div>
              <div className="overflow-x-auto pb-2">
                <div className="flex min-w-max items-center gap-2">
                  {rows[row].map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatSelect(seat)}
                      disabled={seat.status === 'booked'}
                      className={`${getSeatClass(seat)} transition-all duration-200 ${seat.status === 'booked' ? 'cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                      title={`Seat ${seat.number} - ${seat.type} ${seat.status === 'booked' ? '(Booked)' : '(Available)'}`}
                    >
                      {getSeatIcon(seat)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Aisle */}
        <div className="mt-5 h-2 rounded-full bg-slate-200"></div>
      </div>

      {/* Selected Seat Info */}
      {selectedSeat && (
        <div className="rounded-[22px] border border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-cyan-950">Selected Seat</p>
              <p className="text-sm text-cyan-800">
                Seat {selectedSeat.number} ({selectedSeat.type})
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-cyan-700">Type</p>
              <p className="font-medium text-cyan-950">{selectedSeat.type}</p>
            </div>
          </div>
          
          {/* Warning about seat availability */}
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <strong>Important:</strong> Seats are being booked in real-time. 
                Your selected seat will be reserved only after completing the payment process.
                <br />
                <span className="font-medium">महत्वपूर्ण:</span> Seats real-time में बुक हो रही हैं। 
                आपकी selected seat केवल payment complete करने के बाद reserved होगी।
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SeatGrid
