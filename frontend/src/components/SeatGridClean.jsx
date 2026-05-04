import React from 'react'
import { RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const SeatGridClean = ({ seats, selectedSeat, onSeatSelect, loading, routeId }) => {
  const handleSeatSelect = (seat) => {
    // Only prevent selection if seat is explicitly booked
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
    
    // Allow selection of any other seat
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

  // Group seats by row (A, B, C, etc.)
  const groupSeatsByRow = (seats) => {
    const rows = {}
    seats.forEach(seat => {
      const rowLetter = seat.number.replace(/[0-9]/g, '')
      if (!rows[rowLetter]) {
        rows[rowLetter] = []
      }
      rows[rowLetter].push(seat)
    })
    return rows
  }

  const seatRows = groupSeatsByRow(seats || [])

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 rounded"></div>
            <span className="text-green-700">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 rounded"></div>
            <span className="text-blue-700">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 rounded"></div>
            <span className="text-red-700">Booked</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Total Seats: {seats?.length || 0}
          </span>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Bus Layout */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Driver Seat */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-10 rounded-lg bg-gray-800 px-4 text-sm font-semibold text-white">
            Driver
          </div>
        </div>

        {/* Seats Grid */}
        <div className="space-y-4">
          {Object.keys(seatRows).map(rowLetter => (
            <div key={rowLetter} className="bg-gray-50 rounded-lg p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600 uppercase">
                  Row {rowLetter}
                </span>
                <span className="text-xs text-gray-500">
                  {seatRows[rowLetter]?.length || 0} seats
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {seatRows[rowLetter]?.map((seat) => (
                  <button
                    key={seat.id}
                    onClick={() => handleSeatSelect(seat)}
                    disabled={seat.status === 'booked'}
                    className={`w-12 h-12 rounded-lg border-2 font-bold transition-all duration-200 flex items-center justify-center ${
                      seat.status === 'booked' 
                        ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' 
                        : selectedSeat?.id === seat.id 
                          ? 'bg-blue-500 text-white border-blue-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50 hover:border-green-500'
                    }`}
                    title={`Seat ${seat.number} - ${seat.type || 'Standard'}`}
                  >
                    {seat.status === 'booked' ? '✗' : selectedSeat?.id === seat.id ? '✓' : seat.number}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Aisle */}
        <div className="mt-4 h-2 bg-gray-300 rounded-full"></div>
      </div>

      {/* Selected Seat Info */}
      {selectedSeat && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Selected Seat</h3>
              <p className="text-sm text-blue-800">
                Seat {selectedSeat.number} ({selectedSeat.type || 'Standard'})
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-700">Type</p>
              <p className="font-semibold text-blue-900">{selectedSeat.type || 'Standard'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SeatGridClean
