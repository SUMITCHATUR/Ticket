import React, { useState } from 'react'
import { Download, RefreshCw, CheckCircle, AlertCircle, Clock, Smartphone, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

const QRCodeDisplay = ({ 
  qrData, 
  type = 'payment', 
  title = 'QR Code', 
  subtitle = '',
  showDownload = true,
  showRefresh = false,
  onRefresh = null,
  status = 'active',
  expiryTime = null,
  upiUrl = null
}) => {
  const [imageError, setImageError] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (!qrData || isDownloading) return
    
    setIsDownloading(true)
    try {
      // Extract base64 data
      const base64Data = qrData.split(',')[1]
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${type}-qr-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'border-green-200 bg-green-50'
      case 'expired':
        return 'border-red-200 bg-red-50'
      case 'pending':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const formatExpiryTime = () => {
    if (!expiryTime) return null
    
    const expiry = new Date(expiryTime)
    const now = new Date()
    const diff = expiry - now
    
    if (diff <= 0) return 'Expired'
    
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    if (minutes > 0) {
      return `Expires in ${minutes}m ${seconds}s`
    } else {
      return `Expires in ${seconds}s`
    }
  }

  if (!qrData || imageError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">QR Code Not Available</p>
          <p className="text-sm text-gray-500 mt-1">
            {imageError ? 'Failed to load QR code' : 'No QR code generated yet'}
          </p>
          {showRefresh && onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>

      {/* QR Code Container */}
      <div className={`relative flex flex-col items-center mx-auto p-6 border-2 rounded-lg ${getStatusColor()}`}>
        {/* Status Badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-white rounded-full shadow-sm">
          {getStatusIcon()}
          <span className="text-xs font-medium capitalize">{status}</span>
        </div>

        {/* QR Code Image */}
        <div className="flex flex-col items-center">
          <img
            src={qrData}
            alt={`${type} QR Code`}
            className="w-64 h-64 object-contain"
            onError={() => setImageError(true)}
          />
          
          {/* Expiry Time */}
          {expiryTime && (
            <div className="mt-4 text-center">
              <p className="text-sm font-medium text-gray-700">
                {formatExpiryTime()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        {upiUrl && (
          <>
            <a
              href={upiUrl}
              onClick={(e) => {
                if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                  e.preventDefault();
                  alert("UPI Apps are only available on mobile devices. Please scan the QR code using your phone's UPI app (GPay, PhonePe, etc.)");
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              Open in UPI App
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(upiUrl)
                toast.success('UPI URL copied to clipboard')
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </button>
          </>
        )}
        
        {showDownload && (
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Downloading...' : 'Download QR'}
          </button>
        )}
        
        {showRefresh && onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-gray-600">
        <p>Scan this QR code with your mobile app</p>
        <p className="text-xs text-gray-500 mt-1">
          {type === 'payment' 
            ? 'Complete your payment by scanning with any UPI app' 
            : 'Show this QR code to the conductor for verification'
          }
        </p>
        {upiUrl && (
          <p className="text-[10px] text-primary-500 mt-2 italic">
            Note: "Open in UPI App" button works best on mobile devices.
          </p>
        )}
      </div>
    </div>
  )
}

export default QRCodeDisplay
