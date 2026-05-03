import React, { useState } from 'react'
import { Banknote, Check, CreditCard, Loader2, Smartphone } from 'lucide-react'
import toast from 'react-hot-toast'
import QRCodeDisplay from './QRCodeDisplay'
import { paymentAPI } from '../services/api'

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
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const qrCode = externalQrCode || internalQrCode
  const upiUrl = externalUpiUrl || internalUpiUrl
  const isLoading = externalLoading || internalLoading
  const activePaymentId = externalPaymentId || paymentId

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
      const response = await fetch(`${baseUrl}/api/payment/create`, {
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

  const checkPaymentStatus = async () => {
    setCheckingPayment(true)
    try {
      if (!activePaymentId) {
        toast.error('Payment reference missing hai. QR dubara generate karein.')
        return
      }

      const response = await paymentAPI.verify(activePaymentId)
      if (response.data?.success) {
        onPaymentStatusChange?.('success')
        toast.success('Payment verified successfully.')
      } else {
        onPaymentStatusChange?.('failed')
        toast.error('Payment verify nahi ho paaya.')
      }
    } catch (error) {
      onPaymentStatusChange?.('failed')
      toast.error('Error checking payment status. Please try again.')
    } finally {
      setCheckingPayment(false)
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
                {paymentStatus === 'success' ? (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <p className="text-sm font-medium text-green-800">Payment verified successfully.</p>
                    </div>
                    <p className="mt-1 text-sm text-green-700">You can now complete your booking.</p>
                    <div className="mt-3 rounded-lg bg-green-100 p-3">
                      <p className="text-sm font-medium text-green-800">Ready for Booking Completion</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Payment Status:</strong> Waiting for payment completion
                      </p>
                      <p className="mt-1 text-sm text-yellow-700">
                        Scan the QR code above and complete the payment using your UPI app.
                      </p>
                    </div>

                    <button
                      onClick={checkPaymentStatus}
                      disabled={checkingPayment}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {checkingPayment ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Checking Payment Status...
                        </>
                      ) : (
                        <>
                          <Check className="h-5 w-5" />
                          I&apos;ve Paid - Verify Payment
                        </>
                      )}
                    </button>
                  </div>
                )}
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
