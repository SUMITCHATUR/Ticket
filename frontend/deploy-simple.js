const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = process.env.PORT || 3000;

// Backend URL — set BACKEND_URL env variable in Render dashboard
// e.g. https://ticket-backend-xxxx.onrender.com
const BACKEND_URL = process.env.BACKEND_URL || null;

// If BACKEND_URL is set, proxy /api/* to the backend
if (BACKEND_URL) {
  app.use('/api', createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    // Backend expects paths WITHOUT /api prefix (it has its own /api routes too)
    // so we keep the /api prefix so backend's @app.get("/api/...") routes work
    pathRewrite: { '^/api': '/api' },
    on: {
      error: (err, req, res) => {
        console.error('Proxy error:', err.message);
        res.status(502).json({ error: 'Backend unavailable', detail: err.message });
      }
    }
  }));
  console.log(`Proxying /api/* → ${BACKEND_URL}/api/*`);
} else {
  console.warn('BACKEND_URL not set — API calls will fail in production!');
  console.warn('Set BACKEND_URL in Render Environment Variables for the frontend service.');
}

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname)));

// For any route, serve the index.html file (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
