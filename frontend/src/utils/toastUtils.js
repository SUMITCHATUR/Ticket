import toast from 'react-hot-toast'
import { TOAST_MESSAGES } from './constants'

export const showToast = (messageKey, customMessage = null) => {
  const messageConfig = TOAST_MESSAGES[messageKey]
  
  if (!messageConfig) {
    // Fallback for unknown message keys
    return toast.error(customMessage || 'Unknown message')
  }

  const fullMessage = customMessage || 
    `${messageConfig.message}\n${messageConfig.englishMessage}`

  if (messageConfig.detail) {
    const fullDetail = `${messageConfig.detail}\n${messageConfig.englishDetail}`
    return toast.error(`${fullMessage}\n\n${fullDetail}`, {
      icon: messageConfig.icon,
      style: messageConfig.style,
      duration: messageConfig.duration,
    })
  }

  return toast[messageKey.includes('ERROR') || messageKey.includes('FAILED') ? 'error' : 'success'](
    fullMessage,
    {
      icon: messageConfig.icon,
      style: messageConfig.style,
      duration: messageConfig.duration,
    }
  )
}

export const showSuccessToast = (messageKey, customMessage = null) => {
  const messageConfig = TOAST_MESSAGES[messageKey]
  const fullMessage = customMessage || 
    `${messageConfig.message}\n${messageConfig.englishMessage}`

  return toast.success(fullMessage, {
    icon: messageConfig.icon,
    style: messageConfig.style,
    duration: messageConfig.duration,
  })
}

export const showErrorToast = (messageKey, customMessage = null) => {
  const messageConfig = TOAST_MESSAGES[messageKey]
  const fullMessage = customMessage || 
    `${messageConfig.message}\n${messageConfig.englishMessage}`

  if (messageConfig.detail) {
    const fullDetail = `${messageConfig.detail}\n${messageConfig.englishDetail}`
    return toast.error(`${fullMessage}\n\n${fullDetail}`, {
      icon: messageConfig.icon,
      style: messageConfig.style,
      duration: messageConfig.duration,
    })
  }

  return toast.error(fullMessage, {
    icon: messageConfig.icon,
    style: messageConfig.style,
    duration: messageConfig.duration,
  })
}

export const showWarningToast = (messageKey, customMessage = null) => {
  const messageConfig = TOAST_MESSAGES[messageKey]
  const fullMessage = customMessage || 
    `${messageConfig.message}\n${messageConfig.englishMessage}`

  return toast(fullMessage, {
    icon: messageConfig.icon,
    style: messageConfig.style,
    duration: messageConfig.duration,
  })
}

export const showLoadingToast = (message) => {
  return toast.loading(message, {
    style: {
      borderRadius: '10px',
      background: '#3b82f6',
      color: '#fff',
    },
  })
}

export const dismissAllToasts = () => {
  toast.dismiss()
}

// Custom toast for specific scenarios
export const showSeatTakenToast = (seatNumber) => {
  const message = `💺 Seat ${seatNumber} अभी अभी बुक हो गया है!\nकृपया कोई और seat select करें।\n\nSeat ${seatNumber} was just booked!\nPlease select another seat.`
  
  return toast.error(message, {
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

export const showTicketCancelToast = (ticketNumber, passengerName) => {
  const message = `🎫 टिकट सफलतापूर्वक कैंसल हो गया!\nTicket #${ticketNumber} (${passengerName})\n\nTicket cancelled successfully!`
  
  return toast.success(message, {
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

export const showPaymentStatusToast = (status, paymentId = null) => {
  const statusMessages = {
    verified: {
      icon: '✅',
      message: '✅ Payment सफलतापूर्वक verify हो गया!',
      englishMessage: 'Payment verified successfully!',
      style: {
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: '#fff',
        padding: '16px',
        fontSize: '14px',
      },
      duration: 4000,
    },
    failed: {
      icon: '❌',
      message: '❌ Payment failed या cancelled हो गया।',
      englishMessage: 'Payment failed or cancelled.',
      style: {
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: '#fff',
        padding: '16px',
        fontSize: '14px',
      },
      duration: 5000,
    },
    checking: {
      icon: '⏳',
      message: '⏳ Payment status check हो रहा है...',
      englishMessage: 'Checking payment status...',
      style: {
        borderRadius: '10px',
        background: '#3b82f6',
        color: '#fff',
      },
      duration: 2000,
    }
  }

  const config = statusMessages[status] || statusMessages.checking
  const fullMessage = `${config.message}\n${config.englishMessage}`
  
  if (paymentId) {
    return toast(`${fullMessage}\n\nPayment ID: ${paymentId}`, {
      icon: config.icon,
      style: config.style,
      duration: config.duration,
    })
  }

  return toast(fullMessage, {
    icon: config.icon,
    style: config.style,
    duration: config.duration,
  })
}

// Form validation helper
export const showValidationError = (errorType, customMessage = null) => {
  const validationErrors = TOAST_MESSAGES.VALATION_ERRORS
  const message = customMessage || validationErrors[errorType]
  
  return toast.error(message, {
    icon: '⚠️',
    style: {
      borderRadius: '10px',
      background: '#f59e0b',
      color: '#fff',
    },
    duration: 3000,
  })
}
