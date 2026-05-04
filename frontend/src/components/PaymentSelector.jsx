import React, { useState, useEffect } from 'react'
import { Banknote, Check, CreditCard, Loader2, Smartphone, AlertCircle, X, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import QRCodeDisplay from './QRCodeDisplay'
import { buildApiUrl, paymentAPI } from '../services/api'

const PaymentSelector = ({
  selectedMethod,
  onMethodChange,
  amount,
  upiId: externalUpiId,
  qrCode: externalQrCode,
  upiUrl: externalUpiUrl,
  paymentId: externalPaymentId,
  isLoading: externalLoading,
  onGenerateQR,
  paymentStatus,
  onPaymentStatusChange
}) => {
  const [internalQrCode, setInternalQrCode] = useState(null)
  const [internalUpiUrl, setInternalUpiUrl] = useState(null)
  const [internalLoading, setInternalLoading] = useState(false)
  const [paymentId, setPaymentId] = useState(null)
  const [expiryTime, setExpiryTime] = useState(null)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(false)
  // Define derived variables before useEffect hooks
  const qrCode = externalQrCode || internalQrCode
  const upiUrl = externalUpiUrl || internalUpiUrl
  const isLoading = externalLoading || internalLoading
  const activePaymentId = externalPaymentId || paymentId

  // Define all functions before useEffect hooks
  const checkPaymentStatus = async (silent = false) => {
    if (!silent) {
      setCheckingPayment(true)
    }
    
    try {
      if (!activePaymentId) {
        if (!silent) {
          toast.error('Payment reference missing hai. QR dubara generate karein.\nPayment reference missing. Please regenerate QR.')
        }
        return
      }

      const response = await paymentAPI.verify(activePaymentId)
      const status = response.data?.status?.toLowerCase()
      
      if (status === 'verified' || status === 'success' || response.data?.success) {
        onPaymentStatusChange?.('success')
        if (!silent) {
          toast.success('✅ Payment सफलतापूर्वक verify हो गया!\nPayment verified successfully!', {
            icon: '✅',
            style: {
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              padding: '16px',
              fontSize: '14px',
            },
            duration: 4000,
          })
        }
      } else if (status === 'failed' || status === 'cancelled') {
        onPaymentStatusChange?.('failed')
        if (!silent) {
          toast.error('❌ Payment failed या cancelled हो गया।\nPayment failed or cancelled.', {
            icon: '❌',
            style: {
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#fff',
              padding: '16px',
              fontSize: '14px',
            },
            duration: 5000,
          })
        }
      } else {
        // Still pending
        onPaymentStatusChange?.('pending')
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
      onPaymentStatusChange?.('failed')
      if (!silent) {
        toast.error('❌ Payment status check में error आई।\nError checking payment status.', {
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
      }
    } finally {
      if (!silent) {
        setCheckingPayment(false)
      }
    }
  }

  // Auto-check payment status when QR is generated
  useEffect(() => {
    if (qrCode && activePaymentId && (paymentStatus === 'pending' || !paymentStatus)) {
      setAutoCheckEnabled(true)
      const interval = setInterval(() => {
        checkPaymentStatus(true) // Silent check
      }, 5000) // Check every 5 seconds
      
      return () => {
        clearInterval(interval)
        setAutoCheckEnabled(false)
      }
    }
  }, [qrCode, activePaymentId, paymentStatus])

  // Stop auto-check when payment is verified or failed
  useEffect(() => {
    if (paymentStatus === 'success' || paymentStatus === 'failed') {
      setAutoCheckEnabled(false)
    }
  }, [paymentStatus])

  const paymentMethods = [
    {
      id: 'cash',
      name: 'Cash Payment',
      icon: Banknote,
      description: 'Pay with cash to conductor',
      color: 'bg-green-500'
    },
    {
      id: 'upi',
      name: 'UPI Payment',
      icon: Smartphone,
      description: 'Pay using UPI apps',
      color: 'bg-blue-500'
    },
    {
      id: 'online',
      name: 'Online Payment',
      icon: CreditCard,
      description: 'Pay with credit/debit card',
      color: 'bg-purple-500'
    }
  ]

  const handleMethodSelect = (method) => {
    onMethodChange(method)
    setInternalQrCode(null)
    setInternalUpiUrl(null)
    setPaymentId(null)
    setExpiryTime(null)
  }

  const generateQRCode = async (paymentMethod) => {
    if (onGenerateQR) {
      onGenerateQR()
      return
    }

    setInternalLoading(true)
    try {
      const targetUpiId = externalUpiId || 'test@upi'
      const response = await fetch(buildApiUrl('/payment/create'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_amount: amount,
          payment_method: paymentMethod === 'upi' ? 'UPI' : 'Online',
          upi_id: paymentMethod === 'upi' ? targetUpiId : null
        })
      })

      if (response.ok) {
        const data = await response.json()
        setInternalQrCode(data.qr_code_data || null)
        setInternalUpiUrl(data.upi_url || data.payment_url || null)
        setPaymentId(data.payment_id || null)
        setExpiryTime(data.expires_at || null)
      } else {
        toast.error('QR generate nahi ho paaya.')
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast.error('QR generate nahi ho paaya.')
    } finally {
      setInternalLoading(false)
    }
  }

  const handleGenerateQR = () => {
    if (selectedMethod === 'upi' || selectedMethod === 'online') {
      generateQRCode(selectedMethod)
    }
  }

  const handleRefreshQR = () => {
    if (selectedMethod === 'upi' || selectedMethod === 'online') {
      setInternalQrCode(null)
      setInternalUpiUrl(null)
      setPaymentId(null)
      setExpiryTime(null)
      generateQRCode(selectedMethod)
    }
  }

  const getPaymentStatusDisplay = () => {
    switch (paymentStatus) {
      case 'success':
        return {
          icon: <Check className="h-5 w-5 text-green-600" />,
          title: '✅ Payment Verified',
          subtitle: 'भुगतान सफलतापूर्वक verify हो गया',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        }
      case 'failed':
        return {
          icon: <X className="h-5 w-5 text-red-600" />,
          title: '❌ Payment Failed',
          subtitle: 'भुगतान असफल रहा',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        }
      case 'pending':
      default:
        return {
          icon: <Clock className="h-5 w-5 text-yellow-600" />,
          title: '⏳ Payment Pending',
          subtitle: autoCheckEnabled ? 'भुगतान status check हो रहा है...' : 'भुगतान प्रतीक्षारत',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800'
        }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 font-medium text-gray-900">Select Payment Method</h3>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon
            return (
              <div
                key={method.id}
                onClick={() => handleMethodSelect(method.id)}
                className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                  selectedMethod === method.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${method.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  {selectedMethod === method.id && <Check className="h-5 w-5 text-primary-600" />}
                </div>
                <h4 className="font-medium text-gray-900">{method.name}</h4>
                <p className="text-sm text-gray-600">{method.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl bg-gray-50 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-lg font-medium text-gray-900">Total Amount</span>
          <span className="text-2xl font-bold text-primary-600">Rs. {amount}</span>
        </div>
      </div>

      {selectedMethod === 'cash' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">
            <strong>Cash Payment:</strong> Please pay Rs. {amount} to the conductor.
          </p>
          <p className="mt-1 text-sm text-green-700">
            The conductor will confirm payment and generate your ticket.
          </p>
        </div>
      )}

      {selectedMethod === 'upi' && (
        <div className="space-y-4">
          {!qrCode ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  <strong>UPI Payment:</strong> {onGenerateQR ? 'Enter UPI ID and generate QR below.' : 'Click below to generate your payment QR code.'}
                </p>
              </div>
              <button
                onClick={handleGenerateQR}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating QR Code...
                  </>
                ) : (
                  <>
                    <Smartphone className="h-5 w-5" />
                    Generate UPI Payment QR
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              <QRCodeDisplay
                qrData={qrCode}
                upiUrl={upiUrl}
                type="upi-payment"
                title="UPI Payment QR Code"
                subtitle={activePaymentId ? `Payment ID: ${activePaymentId}` : 'Scan to Pay'}
                showDownload={true}
                showRefresh={!externalQrCode}
                onRefresh={handleRefreshQR}
                status={!expiryTime || new Date(expiryTime) > new Date() ? 'active' : 'expired'}
                expiryTime={expiryTime}
              />

              <div className="mt-4">
                {(() => {
                  const statusDisplay = getPaymentStatusDisplay()
                  return (
                    <div className={`rounded-lg border ${statusDisplay.borderColor} ${statusDisplay.bgColor} p-4`}>
                      <div className="flex items-center gap-3">
                        {statusDisplay.icon}
                        <div className="flex-1">
                          <p className={`font-medium ${statusDisplay.textColor}`}>{statusDisplay.title}</p>
                          <p className={`text-sm ${statusDisplay.textColor} opacity-80`}>{statusDisplay.subtitle}</p>
                          {activePaymentId && (
                            <p className="text-xs opacity-60 mt-1">Payment ID: {activePaymentId}</p>
                          )}
                        </div>
                      </div>
                      
                      {paymentStatus === 'success' && (
                        <div className="mt-3 rounded-lg bg-green-100 p-3">
                          <p className="text-sm font-medium text-green-800">
                            ✅ Ready for Booking Completion
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            अब आप booking complete कर सकते हैं।
                          </p>
                        </div>
                      )}
                      
                      {paymentStatus === 'failed' && (
                        <div className="mt-3">
                          <button
                            onClick={() => {
                              setInternalQrCode(null)
                              setInternalUpiUrl(null)
                              setPaymentId(null)
                              setExpiryTime(null)
                              onPaymentStatusChange?.('pending')
                            }}
                            className="w-full rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200"
                          >
                            🔄 Try Payment Again
                          </button>
                        </div>
                      )}
                      
                      {(paymentStatus === 'pending' || !paymentStatus) && (
                        <div className="mt-3 space-y-3">
                          <div className="rounded-lg bg-yellow-100 p-3">
                            <p className="text-sm font-medium text-yellow-800">
                              {autoCheckEnabled ? '⏳ Auto-checking payment status...' : '📱 Scan QR & Complete Payment'}
                            </p>
                            <p className="text-xs text-yellow-700 mt-1">
                              {autoCheckEnabled 
                                ? 'हम automatically payment status check कर रहे हैं।'
                                : 'QR code scan करके payment complete करें।'
                              }
                            </p>
                          </div>

                          <button
                            onClick={() => checkPaymentStatus(false)}
                            disabled={checkingPayment}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {checkingPayment ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Checking Status...
                              </>
                            ) : (
                              <>
                                <Check className="h-5 w-5" />
                                🔄 Check Payment Status
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </>
          )}
        </div>
      )}

      {selectedMethod === 'online' && (
        <div className="space-y-4">
          {!qrCode ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <p className="text-sm text-purple-800">
                  <strong>Online Payment:</strong> Click below to generate your payment QR code.
                </p>
              </div>
              <button
                onClick={handleGenerateQR}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-4 py-3 text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating QR Code...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Generate Payment QR Code
                  </>
                )}
              </button>
            </div>
          ) : (
            <QRCodeDisplay
              qrData={qrCode}
              type="online-payment"
              title="Online Payment QR Code"
              subtitle={activePaymentId ? `Payment ID: ${activePaymentId}` : 'Scan to Pay'}
              showDownload={true}
              showRefresh={!externalQrCode}
              onRefresh={handleRefreshQR}
              status={!expiryTime || new Date(expiryTime) > new Date() ? 'active' : 'expired'}
              expiryTime={expiryTime}
            />
          )}
        </div>
      )}

      <div className="text-center text-xs text-gray-500">
        <p>Secured by 256-bit SSL encryption</p>
        <p>All transactions are safe and secure</p>
      </div>
    </div>
  )
}

export default PaymentSelector
