import React, { useState } from 'react'
import QRCode from 'react-qr-code'
import {
  CalendarDays,
  CheckCircle,
  Clock3,
  Download,
  MapPin,
  Printer,
  Share2,
  Ticket
} from 'lucide-react'
import { paymentAPI } from '../services/api'

const TicketDisplay = ({ ticket }) => {
  const [paymentStatus, setPaymentStatus] = useState(ticket.paymentStatus || 'Pending')
  const [isProcessing, setIsProcessing] = useState(false)

  const downloadTicket = () => {
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
      navigator.clipboard.writeText(`Ticket ${ticket.ticket_number} - ${ticket.route}`)
    }
  }

  const printTicket = () => {
    window.print()
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
    <div className="mx-auto max-w-3xl">
      <div className="rounded-[32px] bg-gradient-to-br from-sky-600 via-blue-700 to-cyan-900 p-[1px] shadow-2xl shadow-sky-200/60">
        <div className="overflow-hidden rounded-[31px] bg-white">
          <div className="relative overflow-hidden bg-gradient-to-br from-sky-950 via-cyan-900 to-emerald-800 px-5 py-6 text-white sm:px-6">
            <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 left-6 h-28 w-28 rounded-full bg-emerald-300/10 blur-2xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                  Booking success
                </div>
                <h2 className="mt-3 text-3xl font-bold text-white">Ticket Confirmed</h2>
                <p className="mt-2 text-sm text-cyan-50/85">
                  Passenger booking complete ho gayi hai. Ticket ab travel ke liye ready hai.
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/15">
                <CheckCircle className="h-8 w-8 text-emerald-200" />
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Passenger</p>
                <p className="mt-2 font-semibold text-slate-900">{ticket.passenger}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Seat</p>
                <p className="mt-2 font-semibold text-slate-900">{ticket.seat}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Amount</p>
                <p className="mt-2 font-semibold text-emerald-700">Rs. {ticket.amount}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Payment</p>
                <p className="mt-2 font-semibold capitalize text-slate-900">{ticket.paymentMethod}</p>
              </div>
            </div>

            <div className="mb-6 rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 sm:p-5 lg:p-6">
              <div className="mb-5 flex flex-col gap-3 border-b border-dashed border-slate-300 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                    <Ticket className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ticket Number</p>
                    <p className="font-mono text-lg font-bold text-slate-950">{ticket.ticket_number}</p>
                  </div>
                </div>
                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  Ready to board
                </span>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_220px] lg:items-center">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-sm text-slate-500">Route</p>
                    <p className="mt-1 font-medium text-slate-900">{ticket.route}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-sm text-slate-500">Bus Number</p>
                    <p className="mt-1 font-medium text-slate-900">{ticket.bus}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-sm text-slate-500">Journey</p>
                    <p className="mt-1 font-medium text-slate-900">{ticket.boardingDate || 'Scheduled trip'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-sm text-slate-500">Timing</p>
                    <p className="mt-1 font-medium text-slate-900">{ticket.departureTime || '--'} - {ticket.arrivalTime || '--'}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center rounded-[26px] border border-slate-200 bg-white p-4">
                  {ticket.customQrUrl ? (
                    <img
                      src={ticket.customQrUrl}
                      alt="Custom QR Code"
                      className="h-40 w-40 object-contain"
                    />
                  ) : ticket.paymentQr ? (
                    <img
                      src={ticket.paymentQr}
                      alt="Payment QR Code"
                      className="h-40 w-40 object-contain"
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
                      size={150}
                      level="H"
                      includeMargin={true}
                    />
                  )}
                  <p className="mt-3 text-center text-xs text-slate-500">
                    {ticket.paymentMethod === 'upi' ? 'Payment verified ticket QR' : 'Show this code at boarding'}
                  </p>
                </div>
              </div>

              {ticket.paymentMethod === 'upi' && (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-sm font-medium text-emerald-800">
                    Payment status:{' '}
                    <span className={paymentStatus === 'Success' ? 'text-emerald-700' : paymentStatus === 'Failed' ? 'text-red-600' : 'text-amber-600'}>
                      {paymentStatus}
                    </span>
                  </p>
                  {ticket.paymentTransaction && (
                    <p className="mt-1 text-xs text-emerald-700/80">Reference: {ticket.paymentTransaction}</p>
                  )}
                  {paymentStatus === 'Pending' && ticket.paymentTransaction && (
                    <button
                      onClick={confirmPayment}
                      disabled={isProcessing}
                      className="mt-3 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                    >
                      {isProcessing ? 'Verifying...' : 'Confirm Payment'}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-sm">Generated on</span>
                </div>
                <p className="mt-2 font-medium text-slate-900">{new Date().toLocaleDateString()}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock3 className="h-4 w-4" />
                  <span className="text-sm">Generated at</span>
                </div>
                <p className="mt-2 font-medium text-slate-900">{new Date().toLocaleTimeString()}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">Travel status</span>
                </div>
                <p className="mt-2 font-medium text-slate-900">Confirmed</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={downloadTicket}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-800"
              >
                <Download className="h-4 w-4" />
                Download Ticket
              </button>
              <button
                onClick={printTicket}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-slate-700 transition hover:bg-slate-200"
              >
                <Printer className="h-4 w-4" />
                Print Ticket
              </button>
              <button
                onClick={shareTicket}
                className="flex items-center justify-center gap-2 rounded-2xl bg-sky-50 px-4 py-3 text-sky-700 transition hover:bg-sky-100"
              >
                <Share2 className="h-4 w-4" />
                Share Ticket
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <h4 className="mb-2 font-medium text-amber-800">Important Instructions</h4>
              <ul className="space-y-1 text-sm text-yellow-700">
                <li>Please arrive at boarding point 15 minutes before departure</li>
                <li>Carry a valid ID proof for verification</li>
                <li>Show this ticket (printed or digital) at boarding</li>
                <li>This ticket is non-transferable</li>
                <li>No refund will be provided after booking confirmation</li>
              </ul>
            </div>

            <div className="mt-4 text-center text-xs text-gray-500">
              <p>For any queries, contact: support@busticket.com | 1800-123-4567</p>
              <p>Thank you for choosing our bus service!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketDisplay
