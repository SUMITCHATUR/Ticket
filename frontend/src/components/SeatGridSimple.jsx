import React from 'react'
import { RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const SeatGridSimple = ({ seats, selectedSeat, onSeatSelect, loading, routeId }) => {
  const handleSeatSelect = (seat) => {
    console.log('Seat clicked:', seat)
    
    // Simple check - don't allow booked seats
    if (seat.status === 'booked') {
      toast.error(`Seat ${seat.number} is already booked!`, {
        icon: '❌',
        style: {
          borderRadius: '8px',
          background: '#ef4444',
          color: '#fff',
        },
        duration: 2000,
      })
      return
    }
    
    // Allow selection of available seats
    onSeatSelect(seat)
  }

  const handleRefresh = () => {
    toast.success('Seats refreshed!', {
      icon: '✅',
      style: {
        borderRadius: '8px',
        background: '#10b981',
        color: '#fff',
      },
      duration: 2000,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading seats...</div>
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
            <div className="w-6 h-6 bg-green-100 rounded mr-2"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-100 rounded mr-2"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-red-100 rounded mr-2"></div>
            <span>Booked</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            Total Seats: {seats.length}
          </span>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Bus Layout */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        {/* Driver Seat */}
        <div className="mb-4 text-center">
          <div className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-700 px-4 text-sm font-semibold text-white">
            Driver
          </div>
        </div>

        {/* Seats Grid */}
        <div className="space-y-3">
          {Object.keys(rows).map(row => (
            <div key={row} className="rounded-lg bg-gray-50 p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-600">
                <span>Row {row}</span>
                <span>{rows[row].length} seats</span>
              </div>
              <div className="flex gap-2">
                {rows[row].map((seat) => (
                  <button
                    key={seat.id}
                    onClick={() => handleSeatSelect(seat)}
                    disabled={seat.status === 'booked'}
                    className={`w-10 h-10 rounded border-2 font-medium transition-all ${
                      seat.status === 'booked' 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300' 
                        : selectedSeat?.id === seat.id 
                          ? 'bg-blue-500 text-white border-blue-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50 hover:border-green-500'
                    }`}
                    title={`Seat ${seat.number} - ${seat.type}`}
                  >
                    {seat.status === 'booked' ? 'X' : selectedSeat?.id === seat.id ? '✓' : seat.number}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Aisle */}
        <div className="mt-5 h-2 rounded-full bg-gray-200"></div>
      </div>

      {/* Selected Seat Info */}
      {selectedSeat && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900">Selected Seat</p>
              <p className="text-sm text-blue-800">
                Seat {selectedSeat.number} ({selectedSeat.type})
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-700">Type</p>
              <p className="font-medium text-blue-900">{selectedSeat.type}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SeatGridSimple
