<<<<<<< HEAD
# Bus Ticket Booking System - Frontend

A modern, responsive web frontend for the Bus Ticket Booking System built with React.js and Tailwind CSS.

## Features

- **Modern UI/UX**: Clean, professional interface optimized for conductors
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Updates**: Live seat availability and booking status
- **Payment Integration**: Support for Cash, UPI, and Online payments
- **QR Code Generation**: Automatic QR codes for tickets and payments
- **Dashboard Analytics**: Real-time statistics and reports
- **Authentication**: Secure login system with role-based access

## Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React
- **HTTP Client**: Axios with interceptors
- **QR Codes**: React QR Code
- **Notifications**: React Hot Toast
- **Routing**: React Router DOM

## Project Structure

```
frontend/
|
+-- src/
|   |
|   +-- components/          # Reusable UI components
|   |   |-- Navbar.jsx
|   |   |-- Sidebar.jsx
|   |   |-- SeatGrid.jsx
|   |   |-- PaymentSelector.jsx
|   |   +-- TicketDisplay.jsx
|   |
|   +-- contexts/           # React contexts
|   |   +-- AuthContext.jsx
|   |
|   +-- pages/              # Page components
|   |   |-- Login.jsx
|   |   |-- Dashboard.jsx
|   |   |-- BookTicket.jsx
|   |   |-- ViewTickets.jsx
|   |   +-- Reports.jsx
|   |
|   +-- services/           # API services
|   |   +-- api.js
|   |
|   +-- App.jsx             # Main App component
|   +-- main.jsx            # Entry point
|   +-- index.css           # Global styles
|
+-- public/                 # Static assets
+-- index.html              # HTML template
+-- package.json            # Dependencies
+-- vite.config.js          # Vite configuration
+-- tailwind.config.js      # Tailwind configuration
```

## Installation

### Prerequisites

- Node.js 16+ and npm
- Backend API running on port 8000

### Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Setup**
   - Ensure backend is running on `http://localhost:8000`
   - API proxy is configured in `vite.config.js`

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   - Navigate to `http://localhost:3000`
   - Login with demo credentials

## Usage

### Login Credentials

- **Admin**: `admin` / `admin123`
- **Conductor**: `conductor` / `conductor123`

### Main Features

#### 1. Dashboard
- Real-time statistics
- Today's bookings overview
- Quick actions
- System status

#### 2. Book Ticket
- **Step 1**: Select route from available options
- **Step 2**: Choose bus and seat (interactive seat map)
- **Step 3**: Enter passenger details
- **Step 4**: Select payment method
- **Step 5**: Generate ticket with QR code

#### 3. View Tickets
- Search and filter tickets
- Export to CSV
- View detailed ticket information
- Status tracking

#### 4. Reports
- Payment method analytics
- Revenue by route
- Export reports
- Date range filtering

## Components

### SeatGrid
Interactive seat selection component with:
- Visual seat layout
- Available/selected/booked status
- Responsive design
- Click handlers

### PaymentSelector
Payment method selection with:
- Cash/UPI/Online options
- QR code generation for UPI
- Payment gateway integration
- Security notices

### TicketDisplay
Ticket confirmation display with:
- QR code generation
- Download and share options
- Professional ticket design
- Important instructions

## API Integration

The frontend connects to the backend API through:

### Authentication
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Booking
- `GET /routes` - Get available routes
- `GET /routes/{id}/available-seats` - Get seat availability
- `POST /tickets/book-with-payment` - Book ticket with payment

### Payments
- `POST /payment/create` - Create payment
- `POST /payment/upi/generate-qr` - Generate UPI QR
- `POST /payment/verify/{id}` - Verify payment

### Reports
- `GET /payments/summary` - Payment analytics
- `GET /revenue/by-route` - Route revenue data

## Styling

### Tailwind CSS Configuration
- Custom color palette (primary, success, warning, danger)
- Responsive breakpoints
- Custom components
- Animation utilities

### CSS Classes
- `.btn` - Base button styles
- `.btn-primary`, `.btn-secondary` - Button variants
- `.input` - Form input styles
- `.card` - Card container styles
- `.seat-*` - Seat selection styles

## Responsive Design

### Mobile First Approach
- Optimized for touch interactions
- Collapsible navigation
- Adaptive layouts
- Mobile-specific components

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## Performance

### Optimization
- Code splitting with React.lazy
- Image optimization
- Bundle size optimization
- Caching strategies

### Lighthouse Score
- Performance: 95+
- Accessibility: 100
- Best Practices: 95+
- SEO: 90+

## Security

### Authentication
- JWT token management
- Secure token storage
- Auto-logout on token expiry
- Role-based access control

### Data Protection
- Input validation
- XSS prevention
- CSRF protection
- Secure API calls

## Development

### Code Style
- ESLint configuration
- Prettier formatting
- Component organization
- Comment standards

### Testing
- Component testing with Jest
- Integration testing
- E2E testing with Cypress
- Accessibility testing

## Deployment

### Build Process
```bash
npm run build
```

### Production
- Static asset optimization
- Environment variable configuration
- CDN integration
- SSL setup

## Troubleshooting

### Common Issues

1. **API Connection Error**
   - Ensure backend is running on port 8000
   - Check CORS configuration
   - Verify API endpoints

2. **Login Issues**
   - Check backend authentication
   - Verify credentials
   - Clear browser cache

3. **Seat Selection Not Working**
   - Check seat data loading
   - Verify click handlers
   - Check CSS classes

4. **QR Code Not Displaying**
   - Install react-qr-code package
   - Check data format
   - Verify component import

### Debug Mode
Enable debug mode in browser console:
```javascript
localStorage.setItem('debug', 'true')
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue on GitHub
- Check documentation
- Contact development team

---

**Note**: This frontend is designed to work with the Bus Ticket Booking System backend API. Ensure the backend is properly configured and running before using the frontend.
=======
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
>>>>>>> 4ab37fda701b84a2f52be51e84e5b020fe25913e
