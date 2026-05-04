import React, { useMemo, useState } from 'react'
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
  const generatedDate = useMemo(() => new Date(), [])

  const ticketSummary = {
    passenger: ticket.passenger || 'Passenger',
    ticketNumber: ticket.ticket_number || 'TKT',
    route: ticket.route || 'Route not available',
    bus: ticket.bus || 'Bus not assigned',
    seat: ticket.seat || '--',
    amount: ticket.amount || 0,
    paymentMethod: ticket.paymentMethod || 'cash',
    journey: ticket.boardingDate || 'Scheduled trip',
    timing: `${ticket.departureTime || '--'} - ${ticket.arrivalTime || '--'}`
  }

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      if (!src) {
        resolve(null)
        return
      }

      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Image load failed'))
      image.src = src
    })

  const downloadTicket = async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1600

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#0f172a')
    gradient.addColorStop(0.45, '#155e75')
    gradient.addColorStop(1, '#ecfeff')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#ffffff'
    const cardX = 60
    const cardY = 60
    const cardW = 960
    const cardH = 1480
    ctx.beginPath()
    ctx.roundRect(cardX, cardY, cardW, cardH, 42)
    ctx.fill()

    const headerGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + 320)
    headerGradient.addColorStop(0, '#0369a1')
    headerGradient.addColorStop(1, '#1d4ed8')
    ctx.fillStyle = headerGradient
    ctx.beginPath()
    ctx.roundRect(cardX, cardY, cardW, 320, 42)
    ctx.fill()

    ctx.fillStyle = '#dbeafe'
    ctx.font = '700 34px Inter, sans-serif'
    ctx.fillText('BUS TICKET', cardX + 56, cardY + 76)

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 64px Inter, sans-serif'
    ctx.fillText('Ticket Confirmed', cardX + 56, cardY + 162)

    ctx.fillStyle = 'rgba(255,255,255,0.88)'
    ctx.font = '500 28px Inter, sans-serif'
    ctx.fillText(ticketSummary.route, cardX + 56, cardY + 224)
    ctx.fillText(`Seat ${ticketSummary.seat}  •  Rs. ${ticketSummary.amount}`, cardX + 56, cardY + 270)

    const drawLabelValue = (label, value, x, y, w) => {
      ctx.fillStyle = '#64748b'
      ctx.font = '600 24px Inter, sans-serif'
      ctx.fillText(label.toUpperCase(), x, y)
      ctx.fillStyle = '#0f172a'
      ctx.font = '700 34px Inter, sans-serif'
      const lines = String(value).match(new RegExp(`.{1,${Math.max(12, Math.floor(w / 18))}}`, 'g')) || ['--']
      lines.slice(0, 2).forEach((line, index) => {
        ctx.fillText(line, x, y + 48 + index * 38)
      })
    }

    drawLabelValue('Passenger', ticketSummary.passenger, cardX + 56, cardY + 390, 380)
    drawLabelValue('Ticket Number', ticketSummary.ticketNumber, cardX + 520, cardY + 390, 380)
    drawLabelValue('Bus', ticketSummary.bus, cardX + 56, cardY + 560, 380)
    drawLabelValue('Journey', ticketSummary.journey, cardX + 520, cardY + 560, 380)
    drawLabelValue('Timing', ticketSummary.timing, cardX + 56, cardY + 730, 380)
    drawLabelValue('Payment', ticketSummary.paymentMethod, cardX + 520, cardY + 730, 380)

    ctx.fillStyle = '#f8fafc'
    ctx.beginPath()
    ctx.roundRect(cardX + 56, cardY + 900, 848, 250, 30)
    ctx.fill()

    ctx.fillStyle = '#0f172a'
    ctx.font = '700 34px Inter, sans-serif'
    ctx.fillText('Travel Status', cardX + 96, cardY + 970)
    ctx.fillStyle = '#059669'
    ctx.font = '700 56px Inter, sans-serif'
    ctx.fillText('CONFIRMED', cardX + 96, cardY + 1055)
    ctx.fillStyle = '#475569'
    ctx.font = '500 26px Inter, sans-serif'
    ctx.fillText(`Generated ${generatedDate.toLocaleDateString()} at ${generatedDate.toLocaleTimeString()}`, cardX + 96, cardY + 1110)

    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 4
    ctx.strokeRoundRect?.(cardX + 688, cardY + 930, 180, 180, 24)
    if (!ctx.strokeRoundRect) {
      ctx.beginPath()
      ctx.roundRect(cardX + 688, cardY + 930, 180, 180, 24)
      ctx.stroke()
    }

    try {
      const qrImage = await loadImage(ticket.customQrUrl || ticket.paymentQr)
      if (qrImage) {
        ctx.drawImage(qrImage, cardX + 700, cardY + 942, 156, 156)
      } else {
        ctx.fillStyle = '#1d4ed8'
        ctx.font = '700 24px Inter, sans-serif'
        ctx.fillText('SCAN', cardX + 740, cardY + 1004)
        ctx.font = '600 18px Inter, sans-serif'
        ctx.fillText('AT BOARDING', cardX + 714, cardY + 1040)
      }
    } catch (error) {
      ctx.fillStyle = '#1d4ed8'
      ctx.font = '700 24px Inter, sans-serif'
      ctx.fillText('SHOW ID', cardX + 726, cardY + 1004)
      ctx.font = '600 18px Inter, sans-serif'
      ctx.fillText(ticketSummary.seat, cardX + 753, cardY + 1040)
    }

    ctx.fillStyle = '#64748b'
    ctx.font = '500 22px Inter, sans-serif'
    ctx.fillText('Carry this ticket and valid ID proof during travel.', cardX + 56, cardY + 1245)
    ctx.fillText('Thank you for choosing our bus service.', cardX + 56, cardY + 1295)

    canvas.toBlob((blob) => {
      if (!blob) {
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ticket-${ticketSummary.ticketNumber}.png`
      link.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
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
    const printWindow = window.open('', '_blank', 'width=900,height=1200')
    if (!printWindow) {
      return
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${ticketSummary.ticketNumber}</title>
          <style>
            body {
              margin: 0;
              padding: 24px;
              background: #f4f7fb;
              font-family: Inter, Arial, sans-serif;
              color: #0f172a;
            }
            .ticket {
              max-width: 760px;
              margin: 0 auto;
              background: white;
              border-radius: 28px;
              overflow: hidden;
              box-shadow: 0 18px 50px rgba(15, 23, 42, 0.12);
            }
            .hero {
              padding: 28px 32px;
              color: white;
              background: linear-gradient(135deg, #0369a1, #1d4ed8);
            }
            .hero h1 {
              margin: 10px 0 8px;
              font-size: 34px;
            }
            .hero p, .muted {
              color: rgba(255,255,255,0.88);
            }
            .content {
              padding: 28px 32px 32px;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 16px;
            }
            .card {
              background: #f8fafc;
              border-radius: 18px;
              padding: 16px;
            }
            .label {
              color: #64748b;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }
            .value {
              margin-top: 10px;
              font-size: 20px;
              font-weight: 700;
              color: #0f172a;
            }
            .footer {
              margin-top: 20px;
              padding: 18px 20px;
              border-radius: 18px;
              background: #ecfeff;
              color: #155e75;
              font-size: 14px;
            }
            @media print {
              body {
                padding: 0;
                background: white;
              }
              .ticket {
                box-shadow: none;
                max-width: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="hero">
              <div class="label muted">Bus Ticket</div>
              <h1>Ticket Confirmed</h1>
              <p>${ticketSummary.route}</p>
              <p>Seat ${ticketSummary.seat} • Rs. ${ticketSummary.amount}</p>
            </div>
            <div class="content">
              <div class="grid">
                <div class="card"><div class="label">Passenger</div><div class="value">${ticketSummary.passenger}</div></div>
                <div class="card"><div class="label">Ticket Number</div><div class="value">${ticketSummary.ticketNumber}</div></div>
                <div class="card"><div class="label">Bus</div><div class="value">${ticketSummary.bus}</div></div>
                <div class="card"><div class="label">Journey</div><div class="value">${ticketSummary.journey}</div></div>
                <div class="card"><div class="label">Timing</div><div class="value">${ticketSummary.timing}</div></div>
                <div class="card"><div class="label">Payment</div><div class="value">${ticketSummary.paymentMethod}</div></div>
              </div>
              <div class="footer">
                Carry this ticket and valid ID proof during travel. Generated on ${generatedDate.toLocaleDateString()} at ${generatedDate.toLocaleTimeString()}.
              </div>
            </div>
          </div>
          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
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
