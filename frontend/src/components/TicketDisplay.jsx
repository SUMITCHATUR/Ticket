import React, { useState } from 'react'
import QRCode from 'react-qr-code'
import { Ticket, Download, Share2, CheckCircle } from 'lucide-react'
import { paymentAPI } from '../services/api'

const TicketDisplay = ({ ticket }) => {
  const [paymentStatus, setPaymentStatus] = useState(ticket.paymentStatus || 'Pending')
  const [isProcessing, setIsProcessing] = useState(false)

  const downloadTicket = () => {
    // Mock download functionality
    const ticketData = JSON.stringify(ticket, null, 2)
    const blob = new Blob([ticketData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ticket-${ticket.ticket_number}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const shareTicket = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bus Ticket',
          text: `My bus ticket from ${ticket.route}`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(`Ticket ${ticket.ticket_number} - ${ticket.route}`)
    }
  }

  const confirmPayment = async () => {
    if (!ticket.paymentTransaction) {
      return
    }
    setIsProcessing(true)
    try {
      const response = await paymentAPI.complete(ticket.paymentTransaction)
      if (response.data.success) {
        setPaymentStatus('Success')
      } else {
        setPaymentStatus('Failed')
      }
    } catch (error) {
      setPaymentStatus('Failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-1">
        <div className="bg-white rounded-xl p-8">
          {/* Success Message */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600">Your ticket has been generated successfully</p>
          </div>

          {/* Ticket Design */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6">
            {/* Ticket Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center">
                <Ticket className="w-6 h-6 text-primary-600 mr-2" />
                <span className="font-bold text-gray-900">Bus Ticket</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Ticket Number</p>
                <p className="font-mono font-bold text-primary-600">{ticket.ticket_number}</p>
              </div>
            </div>

            {/* Ticket Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left Column */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Passenger</p>
                  <p className="font-medium text-gray-900">{ticket.passenger}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Route</p>
                  <p className="font-medium text-gray-900">{ticket.route}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bus Number</p>
                  <p className="font-medium text-gray-900">{ticket.bus}</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Seat Number</p>
                  <p className="font-medium text-gray-900">{ticket.seat}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount Paid</p>
                  <p className="font-medium text-green-600">Rs. {ticket.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium text-gray-900 capitalize">{ticket.paymentMethod}</p>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="flex flex-col items-center">
              <p className="text-sm text-gray-500 mb-3">
                {ticket.paymentMethod === 'upi' ? 'Scan this UPI QR to pay the exact amount' : 'Scan for Boarding'}
              </p>
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                {ticket.customQrUrl ? (
                  <img
                    src={ticket.customQrUrl}
                    alt="Custom QR Code"
                    className="w-48 h-48 object-contain"
                  />
                ) : ticket.paymentQr ? (
                  <img
                    src={ticket.paymentQr}
                    alt="Payment QR Code"
                    className="w-48 h-48 object-contain"
                  />
                ) : (
                  <QRCode
                    value={JSON.stringify({
                      ticketId: ticket.ticket_id,
                      ticketNumber: ticket.ticket_number,
                      passenger: ticket.passenger,
                      seat: ticket.seat,
                      route: ticket.route,
                      amount: ticket.amount,
                      timestamp: new Date().toISOString()
                    })}
                    size={128}
                    level="H"
                    includeMargin={true}
                  />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {ticket.paymentMethod === 'upi'
                  ? `Pay Rs. ${ticket.amount} using the UPI QR above, then confirm payment.`
                  : 'Show this QR code at boarding'}
              </p>

              {ticket.paymentMethod === 'upi' && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Payment Status:{' '}
                    <span className={`font-semibold ${paymentStatus === 'Success' ? 'text-green-600' : paymentStatus === 'Failed' ? 'text-red-600' : 'text-yellow-600'}`}>
                      {paymentStatus}
                    </span>
                  </p>
                  {ticket.paymentTransaction && (
                    <p className="text-xs text-gray-500 mb-3">
                      Payment reference: {ticket.paymentTransaction}
                    </p>
                  )}
                  {paymentStatus === 'Pending' && ticket.paymentTransaction && (
                    <button
                      onClick={confirmPayment}
                      disabled={isProcessing}
                      className="btn-primary px-4 py-2"
                    >
                      {isProcessing ? 'Verifying...' : 'Confirm Payment'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Ticket Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div>
                  <p>Generated on: {new Date().toLocaleDateString()}</p>
                  <p>Time: {new Date().toLocaleTimeString()}</p>
                </div>
                <div className="text-right">
                  <p>Valid for: Today</p>
                  <p>Status: Confirmed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={downloadTicket}
              className="btn-primary flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Ticket
            </button>
            <button
              onClick={shareTicket}
              className="btn-secondary flex items-center justify-center"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Ticket
            </button>
          </div>

          {/* Important Instructions */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Important Instructions:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>Please arrive at boarding point 15 minutes before departure</li>
              <li>Carry a valid ID proof for verification</li>
              <li>Show this ticket (printed or digital) at boarding</li>
              <li>This ticket is non-transferable</li>
              <li>No refund will be provided after booking confirmation</li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>For any queries, contact: support@busticket.com | 1800-123-4567</p>
            <p>Thank you for choosing our bus service!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketDisplay
