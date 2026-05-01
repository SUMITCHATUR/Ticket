import React, { useState, useEffect } from 'react'
import { CreditCard, Smartphone, Banknote, Check, Loader2 } from 'lucide-react'
import QRCodeDisplay from './QRCodeDisplay'

const PaymentSelector = ({ selectedMethod, onMethodChange, amount, upiId: externalUpiId, qrCode: externalQrCode, upiUrl: externalUpiUrl, isLoading: externalLoading, onGenerateQR, paymentStatus, onPaymentStatusChange }) => {
  const [internalQrCode, setInternalQrCode] = useState(null)
  const [internalUpiUrl, setInternalUpiUrl] = useState(null)
  const [internalLoading, setInternalLoading] = useState(false)
  const [paymentId, setPaymentId] = useState(null)
  const [expiryTime, setExpiryTime] = useState(null)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const BASE_URL = typeof window !== 'undefined' ? window.location.origin : ''

  const qrCode = externalQrCode || internalQrCode
  const upiUrl = externalUpiUrl || internalUpiUrl
  const isLoading = externalLoading || internalLoading

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
    // Reset internal QR code when method changes
    setInternalQrCode(null)
    setPaymentId(null)
    setExpiryTime(null)
  }

  const generateQRCode = async (paymentMethod) => {
    if (onGenerateQR) {
      onGenerateQR()
    } else {
      setInternalLoading(true)
      try {
        // Use external UPI ID if provided, otherwise fallback
        const targetUpiId = externalUpiId || 'test@upi'
        
        const response = await fetch(`${BASE_URL}/api/payment/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount,
            payment_amount: amount,
            payment_method: paymentMethod,
            upi_id: paymentMethod === 'upi' ? targetUpiId : null,
            description: `Bus Ticket Payment - Rs. ${amount}`
          })
        })

        if (response.ok) {
          const data = await response.json()
          setInternalQrCode(data.qr_code_data)
          setInternalUpiUrl(data.upi_url)
          setPaymentId(data.payment_id)
          setExpiryTime(data.expires_at)
        }
      } catch (error) {
        console.error('Error generating QR code:', error)
      } finally {
        setInternalLoading(false)
      }
    }
  }

  const generateMockQRCode = (paymentMethod) => {
    const mockQRData = {
      payment_id: `PAY_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_001`,
      transaction_id: `TXN_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}_001`,
      amount: amount,
      merchant_name: "Bus Ticket System",
      type: "payment",
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 15 * 60000).toISOString()
    }
    
    const qrString = `upi://pay?pa=${externalUpiId || 'test@upi'}&pn=${encodeURIComponent(mockQRData.merchant_name)}&am=${mockQRData.amount}&cu=INR&tr=${mockQRData.transaction_id}`
    
    setInternalQrCode(qrString)
    setInternalUpiUrl(qrString)
    setPaymentId(mockQRData.payment_id)
    setExpiryTime(mockQRData.expires_at)
  }

  const handleGenerateQR = () => {
    if (selectedMethod === 'upi' || selectedMethod === 'online') {
      generateQRCode(selectedMethod)
    }
  }

  const handleRefreshQR = () => {
    if (selectedMethod === 'upi' || selectedMethod === 'online') {
      setInternalQrCode(null)
      setPaymentId(null)
      setExpiryTime(null)
      generateQRCode(selectedMethod)
    }
  }

  return (
    <div className="space-y-6">
      {/* Payment Methods */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Select Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paymentMethods.map((method) => {
            const Icon = method.icon
            return (
              <div
                key={method.id}
                onClick={() => handleMethodSelect(method.id)}
                className={`
                  p-4 border rounded-lg cursor-pointer transition-all
                  ${selectedMethod === method.id 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-10 h-10 ${method.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  {selectedMethod === method.id && (
                    <Check className="w-5 h-5 text-primary-600" />
                  )}
                </div>
                <h4 className="font-medium text-gray-900">{method.name}</h4>
                <p className="text-sm text-gray-600">{method.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment Details */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-medium text-gray-900">Total Amount</span>
          <span className="text-2xl font-bold text-primary-600">Rs. {amount}</span>
        </div>
      </div>

      {/* Cash Payment Details */}
      {selectedMethod === 'cash' && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Cash Payment:</strong> Please pay Rs. {amount} to the conductor.
            </p>
            <p className="text-sm text-green-700 mt-1">
              The conductor will confirm payment and generate your ticket.
            </p>
          </div>
        </div>
      )}

      {selectedMethod === 'upi' && (
        <div className="space-y-4">
          {!qrCode ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>UPI Payment:</strong> {onGenerateQR ? 'Enter UPI ID and generate QR below.' : 'Click below to generate your payment QR code.'}
                </p>
              </div>
              {(onGenerateQR || !onGenerateQR) && (
                <button
                  onClick={handleGenerateQR}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating QR Code...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-5 h-5" />
                      {onGenerateQR ? 'Generate UPI Payment QR' : 'Generate UPI QR Code'}
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <>
              <QRCodeDisplay
                qrData={qrCode}
                upiUrl={upiUrl}
                type="upi-payment"
                title="UPI Payment QR Code"
                subtitle={paymentId ? `Payment ID: ${paymentId}` : "Scan to Pay"}
                showDownload={true}
                showRefresh={!externalQrCode}
                onRefresh={handleRefreshQR}
                status={!expiryTime || new Date(expiryTime) > new Date() ? 'active' : 'expired'}
                expiryTime={expiryTime}
              />
              
              <div className="mt-4">
              {paymentStatus === 'success' ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-800 font-medium">
                      🎉 Payment Successful! UPI payment received successfully.
                    </p>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    You can now complete your booking.
                  </p>
                  <div className="mt-3 p-3 bg-green-100 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">
                      ✅ Ready for Booking Completion
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Payment Status:</strong> Waiting for payment completion
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Scan the QR code above and complete the payment using your UPI app.
                    </p>
                  </div>
                  
                  <button
                    onClick={checkPaymentStatus}
                    disabled={checkingPayment}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkingPayment ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Checking Payment Status...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        I've Paid - Verify Payment
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
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>Online Payment:</strong> Click below to generate your payment QR code.
                </p>
              </div>
              <button
                onClick={handleGenerateQR}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating QR Code...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
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
              subtitle={paymentId ? `Payment ID: ${paymentId}` : "Scan to Pay"}
              showDownload={true}
              showRefresh={!externalQrCode}
              onRefresh={handleRefreshQR}
              status={!expiryTime || new Date(expiryTime) > new Date() ? 'active' : 'expired'}
              expiryTime={expiryTime}
            />
          )}
        </div>
      )}

      {/* Payment Security Notice */}
      <div className="text-center text-xs text-gray-500">
        <p>Secured by 256-bit SSL encryption</p>
        <p>All transactions are safe and secure</p>
      </div>
    </div>
  )
}

export default PaymentSelector
