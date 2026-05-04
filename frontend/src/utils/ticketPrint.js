import toast from 'react-hot-toast'

export const printTicket = (ticketData) => {
  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    
    if (!printWindow) {
      toast.error('Popup blocked! Please allow popups for printing.')
      return
    }

    const printContent = `
      <!DOCTYPE html>
      <html lang="hi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket - ${ticketData.ticket_number}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: white;
            color: #1e293b;
            line-height: 1.6;
          }
          
          .ticket-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
          }
          
          .ticket-header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 3px solid #0ea5e9;
            margin-bottom: 30px;
          }
          
          .ticket-header h1 {
            font-size: 28px;
            color: #0c4a6e;
            margin-bottom: 8px;
            font-weight: 700;
          }
          
          .ticket-header p {
            color: #64748b;
            font-size: 14px;
          }
          
          .ticket-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          
          .info-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
          }
          
          .info-section h3 {
            color: #0ea5e9;
            font-size: 16px;
            margin-bottom: 15px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .info-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          
          .info-label {
            font-weight: 600;
            color: #475569;
            font-size: 14px;
          }
          
          .info-value {
            color: #1e293b;
            font-weight: 500;
            font-size: 14px;
            text-align: right;
          }
          
          .important-notice {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
          }
          
          .important-notice h4 {
            color: #92400e;
            font-size: 16px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .important-notice p {
            color: #78350f;
            font-size: 13px;
            margin-bottom: 8px;
          }
          
          .barcode-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #f0f9ff;
            border-radius: 12px;
            border: 1px solid #bae6fd;
          }
          
          .barcode-placeholder {
            width: 300px;
            height: 60px;
            background: repeating-linear-gradient(
              90deg,
              #000,
              #000 2px,
              #fff 2px,
              #fff 4px
            );
            margin: 0 auto 15px;
            border-radius: 4px;
          }
          
          .ticket-footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            color: #64748b;
            font-size: 12px;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            
            .ticket-container {
              margin: 0;
              padding: 15px;
            }
            
            .ticket-header h1 {
              font-size: 24px;
            }
            
            .ticket-info {
              grid-template-columns: 1fr;
              gap: 20px;
            }
            
            .important-notice {
              page-break-inside: avoid;
            }
          }
          
          @media screen and (max-width: 600px) {
            .ticket-info {
              grid-template-columns: 1fr;
              gap: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket-container">
          <div class="ticket-header">
            <h1>🎫 महाराष्ट्र बस टिकट</h1>
            <p> Maharashtra State Transport Ticket</p>
          </div>
          
          <div class="ticket-info">
            <div class="info-section">
              <h3>📋 टिकट जानकारी | Ticket Information</h3>
              <div class="info-row">
                <span class="info-label">टिकट नंबर | Ticket No:</span>
                <span class="info-value">${ticketData.ticket_number}</span>
              </div>
              <div class="info-row">
                <span class="info-label">स्थिति | Status:</span>
                <span class="info-value">${ticketData.status || 'Confirmed'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">बुकिंग तिथि | Booking Date:</span>
                <span class="info-value">${new Date().toLocaleDateString('hi-IN')}</span>
              </div>
            </div>
            
            <div class="info-section">
              <h3>👤 यात्री की जानकारी | Passenger Details</h3>
              <div class="info-row">
                <span class="info-label">नाम | Name:</span>
                <span class="info-value">${ticketData.passenger}</span>
              </div>
              <div class="info-row">
                <span class="info-label">संपर्क नंबर | Contact:</span>
                <span class="info-value">${ticketData.contact_number || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div class="ticket-info">
            <div class="info-section">
              <h3>🚌 यात्रा की जानकारी | Journey Details</h3>
              <div class="info-row">
                <span class="info-label">रूट | Route:</span>
                <span class="info-value">${ticketData.route}</span>
              </div>
              <div class="info-row">
                <span class="info-label">यात्रा तिथि | Journey Date:</span>
                <span class="info-value">${ticketData.boardingDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">समय | Time:</span>
                <span class="info-value">${ticketData.departureTime} - ${ticketData.arrivalTime}</span>
              </div>
              <div class="info-row">
                <span class="info-label">बस नंबर | Bus No:</span>
                <span class="info-value">${ticketData.bus}</span>
              </div>
              <div class="info-row">
                <span class="info-label">सीट | Seat:</span>
                <span class="info-value">${ticketData.seat}</span>
              </div>
            </div>
            
            <div class="info-section">
              <h3>💰 भुगतान की जानकारी | Payment Details</h3>
              <div class="info-row">
                <span class="info-label">किराया | Fare:</span>
                <span class="info-value">Rs. ${ticketData.amount}</span>
              </div>
              <div class="info-row">
                <span class="info-label">भुगतान विधि | Payment Method:</span>
                <span class="info-value">${ticketData.paymentMethod}</span>
              </div>
              <div class="info-row">
                <span class="info-label">भुगतान स्थिति | Payment Status:</span>
                <span class="info-value">${ticketData.paymentStatus}</span>
              </div>
              ${ticketData.paymentTransaction ? `
              <div class="info-row">
                <span class="info-label">लेनदेन ID | Transaction ID:</span>
                <span class="info-value">${ticketData.paymentTransaction}</span>
              </div>
              ` : ''}
            </div>
          </div>
          
          <div class="barcode-section">
            <div class="barcode-placeholder"></div>
            <p style="font-size: 12px; color: #64748b; margin-top: 10px;">
              ${ticketData.ticket_number}
            </p>
          </div>
          
          <div class="important-notice">
            <h4>⚠️ महत्वपूर्ण सूचना | Important Notice</h4>
            <p>• कृपया यात्रा से 15 मिनट पहले बस स्टॉप पर पहुंचें।</p>
            <p>• अपना टिकट और वैध ID प्रूफ साथ रखें।</p>
            <p>• टिकट कैंसल करने के नियम लागू होंगे।</p>
            <p>• Please arrive at bus stop 15 minutes before departure.</p>
            <p>• Keep your ticket and valid ID proof with you.</p>
            <p>• Cancellation rules will apply.</p>
          </div>
          
          <div class="ticket-footer">
            <p>© Maharashtra State Transport | Helpline: 1800-XXX-XXXX</p>
            <p>यह एक कंप्यूटर जनित टिकट है | This is a computer-generated ticket</p>
            <p>Generated on: ${new Date().toLocaleString('hi-IN')}</p>
          </div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
    
    toast.success('🖨️ Print window opened successfully!', {
      icon: '✅',
      style: {
        borderRadius: '10px',
        background: '#10b981',
        color: '#fff',
      },
    })
    
  } catch (error) {
    console.error('Error printing ticket:', error)
    toast.error('❌ Failed to open print window. Please check your browser settings.')
  }
}

export const downloadTicketPDF = (ticketData) => {
  toast.info('📄 PDF download feature coming soon! Please use Print for now.', {
    icon: '📋',
    style: {
      borderRadius: '10px',
      background: '#3b82f6',
      color: '#fff',
    },
  })
}
