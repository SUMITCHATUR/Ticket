// Toast message constants for consistent messaging
export const TOAST_MESSAGES = {
  // Success Messages
  TICKET_BOOKED: {
    icon: '🎉',
    message: 'बधाई हो! आपका ticket successfully book हो गया है!',
    englishMessage: 'Congratulations! Your ticket has been booked successfully!',
    style: {
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: '#fff',
      padding: '16px',
      fontSize: '14px',
    },
    duration: 5000,
  },
  PAYMENT_VERIFIED: {
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
  TICKET_CANCELLED: {
    icon: '✅',
    message: `🎫 टिकट सफलतापूर्वक कैंसल हो गया!`,
    englishMessage: 'Ticket cancelled successfully!',
    style: {
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: '#fff',
      padding: '16px',
      fontSize: '14px',
    },
    duration: 4000,
  },
  SEAT_STATUS_UPDATED: {
    icon: '✅',
    message: '💺 Seat status updated!',
    englishMessage: 'Seat status updated!',
    style: {
      borderRadius: '8px',
      background: '#10b981',
      color: '#fff',
    },
    duration: 2000,
  },

  // Error Messages
  ROUTE_LOAD_ERROR: {
    icon: '⚠️',
    message: '⚠️ Routes load करने में issue आ रहा है!',
    englishMessage: 'Issue loading routes!',
    detail: 'कृपया backend check करें।',
    englishDetail: 'Please check backend.',
    style: {
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      color: '#fff',
      padding: '16px',
      fontSize: '14px',
    },
    duration: 5000,
  },
  SEAT_LOAD_ERROR: {
    icon: '❌',
    message: '💺 Seats load नहीं हो पाई!',
    englishMessage: 'Failed to load seats!',
    detail: 'कृपया फिर से try करें।',
    englishDetail: 'Please try again.',
    style: {
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: '#fff',
      padding: '16px',
      fontSize: '14px',
    },
    duration: 4000,
  },
  PAYMENT_QR_ERROR: {
    icon: '❌',
    message: '❌ Payment QR generate नहीं हो पाया!',
    englishMessage: 'Failed to generate payment QR!',
    detail: 'कृपया फिर से try करें।',
    englishDetail: 'Please try again.',
    style: {
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: '#fff',
      padding: '16px',
      fontSize: '14px',
    },
    duration: 5000,
  },
  BOOKING_FAILED: {
    icon: '❌',
    message: '❌ Ticket booking failed!',
    englishMessage: 'Booking failed!',
    detail: 'कृपया फिर से try करें।',
    englishDetail: 'Please try again.',
    style: {
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: '#fff',
      padding: '16px',
      fontSize: '14px',
    },
    duration: 5000,
  },
  PAYMENT_FAILED: {
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
  PAYMENT_STATUS_ERROR: {
    icon: '⚠️',
    message: '❌ Payment status check में error आई।',
    englishMessage: 'Error checking payment status.',
    style: {
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      color: '#fff',
      padding: '16px',
      fontSize: '14px',
    },
    duration: 5000,
  },

  // Warning Messages
  SELECT_ROUTE: {
    icon: '⚠️',
    message: '🎫 कृपया पहले route select करें!',
    englishMessage: 'Please select a route first!',
    style: {
      borderRadius: '10px',
      background: '#f59e0b',
      color: '#fff',
    },
    duration: 3000,
  },
  ENTER_UPI_ID: {
    icon: '⚠️',
    message: '💳 कृपया UPI ID enter करें!',
    englishMessage: 'Please enter UPI ID!',
    style: {
      borderRadius: '10px',
      background: '#f59e0b',
      color: '#fff',
    },
    duration: 3000,
  },
  SEAT_TAKEN: {
    icon: '⚠️',
    message: `💺 Seat अभी अभी बुक हो गया है!`,
    englishMessage: 'Seat was just booked!',
    detail: 'कृपया कोई और seat select करें।',
    englishDetail: 'Please select another seat.',
    style: {
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      color: '#fff',
      padding: '16px',
      fontSize: '14px',
    },
    duration: 5000,
  },
  SEAT_ALREADY_BOOKED: {
    icon: '❌',
    message: `💺 Seat पहले ही बुक हो चुकी है!`,
    englishMessage: 'Seat is already booked!',
    detail: 'कृपया कोई और seat choose करें।',
    englishDetail: 'Please choose another seat.',
    style: {
      borderRadius: '10px',
      background: '#ef4444',
      color: '#fff',
    },
    duration: 3000,
  },
  SELECT_TICKET: {
    icon: '⚠️',
    message: 'कृपया पहले एक टिकट select करें।',
    englishMessage: 'Please select a ticket first!',
    style: {
      borderRadius: '10px',
      background: '#f59e0b',
      color: '#fff',
    },
    duration: 3000,
  },

  // Validation Messages
  VALIDATION_ERRORS: {
    NO_ROUTE: '🎫 Kripya pehle route select karein.',
    NO_SEAT: '💺 Kripya seat select karein.',
    NO_PASSENGER_NAME: '👤 Passenger name enter karein.',
    INVALID_MOBILE: '📱 Valid 10 digit mobile number enter karein.',
    NO_ID_NUMBER: '🆔 ID number enter karein.',
    PAYMENT_NOT_VERIFIED: '💳 Kripya pehle UPI payment verify karein.',
  }
}

// Payment status configurations
export const PAYMENT_STATUS = {
  PENDING: {
    icon: '⏳',
    title: '⏳ Payment Pending',
    subtitle: 'भुगतान प्रतीक्षारत',
    englishSubtitle: 'Payment pending',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
  },
  SUCCESS: {
    icon: '✅',
    title: '✅ Payment Verified',
    subtitle: 'भुगतान सफलतापूर्वक verify हो गया',
    englishSubtitle: 'Payment verified successfully',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
  },
  FAILED: {
    icon: '❌',
    title: '❌ Payment Failed',
    subtitle: 'भुगतान असफल रहा',
    englishSubtitle: 'Payment failed',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
  }
}

// API endpoints and configurations
export const API_CONFIG = {
  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
  AUTO_CHECK_INTERVAL: 5000, // 5 seconds
  AUTO_CHECK_TIMEOUT: 300000, // 5 minutes
}

// UI Constants
export const UI_CONSTANTS = {
  LOADING_SKELETON_COUNT: 3,
  TOAST_DEFAULT_DURATION: 4000,
  MODAL_BACKDROP_BLUR: 'backdrop-blur-sm',
  BORDER_RADIUS: {
    SMALL: '8px',
    MEDIUM: '12px',
    LARGE: '16px',
    XLARGE: '24px',
  },
  SPACING: {
    SMALL: '0.5rem',
    MEDIUM: '1rem',
    LARGE: '1.5rem',
    XLARGE: '2rem',
  }
}
