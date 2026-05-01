import React from 'react'

const SeatGrid = ({ seats, selectedSeat, onSeatSelect, loading }) => {
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
    if (seat.status === 'booked') return 'seat-booked'
    if (selectedSeat?.id === seat.id) return 'seat-selected'
    return 'seat-available'
  }

  const getSeatIcon = (seat) => {
    if (seat.status === 'booked') return 'X'
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
      {/* Legend */}
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

      {/* Bus Layout */}
      <div className="bg-gray-100 p-4 rounded-lg">
        {/* Driver Seat */}
        <div className="mb-4 text-center">
          <div className="inline-block w-12 h-8 bg-gray-600 rounded flex items-center justify-center text-white text-xs">
            Driver
          </div>
        </div>

        {/* Seats Grid */}
        <div className="space-y-2">
          {Object.keys(rows).map(row => (
            <div key={row} className="flex items-center justify-center gap-2">
              {/* Row Label */}
              <div className="w-8 text-center font-medium text-gray-600">
                {row}
              </div>
              
              {/* Seats in Row */}
              <div className="flex gap-1">
                {rows[row].map((seat) => (
                  <button
                    key={seat.id}
                    onClick={() => onSeatSelect(seat)}
                    disabled={seat.status === 'booked'}
                    className={getSeatClass(seat)}
                    title={`Seat ${seat.number} - ${seat.type}`}
                  >
                    {getSeatIcon(seat)}
                  </button>
                ))}
              </div>

              {/* Row Label */}
              <div className="w-8 text-center font-medium text-gray-600">
                {row}
              </div>
            </div>
          ))}
        </div>

        {/* Aisle */}
        <div className="mt-4 h-2 bg-gray-300 rounded"></div>
      </div>

      {/* Selected Seat Info */}
      {selectedSeat && (
        <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-primary-900">Selected Seat</p>
              <p className="text-sm text-primary-700">
                Seat {selectedSeat.number} ({selectedSeat.type})
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-600">Type</p>
              <p className="font-medium text-primary-900">{selectedSeat.type}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SeatGrid
