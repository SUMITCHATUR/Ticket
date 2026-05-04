import React, { useEffect, useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const SeatGridFixed = ({ seats, selectedSeat, onSeatSelect, loading, routeId }) => {
  const [refreshing, setRefreshing] = useState(false)

  // Simple seat selection without complex checks
  const handleSeatSelect = (seat) => {
    console.log('Seat clicked:', {
      id: seat.id,
      number: seat.number,
      status: seat.status
    })
    
    // Don't allow selection of booked seats
    if (seat.status === 'booked' || seat.status === 'unavailable') {
      toast.error(`💺 Seat ${seat.number} already booked!\nPlease choose another seat.`, {
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
    
    // Allow selection of available seats
    onSeatSelect(seat)
  }

  const handleRefreshSeats = async () => {
    if (!routeId || refreshing) return
    
    setRefreshing(true)
    try {
      // Simulate refresh - in real app, this would call API
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Seats refreshed!', {
        icon: '✅',
        style: {
          borderRadius: '8px',
          background: '#10b981',
          color: '#fff',
        },
        duration: 2000,
      })
    } catch (error) {
      toast.error('Failed to refresh seats')
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

  const getSeatClass = (seat) => {
    if (seat.status === 'booked' || seat.status === 'unavailable') return 'seat-booked'
    if (selectedSeat?.id === seat.id) return 'seat-selected'
    return 'seat-available'
  }

  const getSeatIcon = (seat) => {
    if (seat.status === 'booked' || seat.status === 'unavailable') return 'X'
    if (selectedSeat?.id === seat.id) return '✓'
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
      {/* Header */}
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
            Last updated: {new Date().toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefreshSeats}
            disabled={refreshing || !routeId}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Bus Layout */}
      <div className="rounded-[24px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4">
        {/* Driver Seat */}
        <div className="mb-4 text-center">
          <div className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-700 px-4 text-sm font-semibold text-white">
            Driver
          </div>
        </div>

        {/* Seats Grid */}
        <div className="space-y-3">
          {Object.keys(rows).map(row => (
            <div key={row} className="rounded-2xl bg-white/80 px-3 py-3">
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
                      disabled={seat.status === 'booked' || seat.status === 'unavailable'}
                      className={`${getSeatClass(seat)} transition-all duration-200 ${
                        seat.status === 'booked' || seat.status === 'unavailable' 
                          ? 'cursor-not-allowed' 
                          : 'hover:scale-105 active:scale-95'
                      }`}
                      title={`Seat ${seat.number} - ${seat.type}`}
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
        <div className="rounded-[22px] border border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50 p-4">
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
        </div>
      )}
    </div>
  )
}

export default SeatGridFixed
