import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // Log error to monitoring service (you can integrate with your logging service)
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
          <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-6 shadow-2xl shadow-red-100/20">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              
              <h1 className="mb-2 text-2xl font-bold text-slate-900">
                कुछ गलती हो गई
              </h1>
              <h2 className="mb-4 text-lg text-slate-700">
                Something went wrong
              </h2>
              
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
                <p className="text-sm text-amber-800 mb-2">
                  <strong>क्या करें:</strong>
                </p>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• पेज refresh करें</li>
                  <li>• ब्राउज़र cache clear करें</li>
                  <li>• कुछ देर बाद try करें</li>
                </ul>
                
                <p className="text-sm text-amber-800 mt-3 mb-2">
                  <strong>What to do:</strong>
                </p>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Refresh the page</li>
                  <li>• Clear browser cache</li>
                  <li>• Try again in a few moments</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  पेज रीसेट करें
                  <br />
                  <span className="text-xs text-slate-500">Reset Page</span>
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  पेज reload करें
                  <br />
                  <span className="text-xs text-blue-100">Reload Page</span>
                </button>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-800">
                    डेवलपर error देखें (Show Error Details)
                  </summary>
                  <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-mono text-slate-700 mb-2">
                      <strong>Error:</strong> {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <p className="text-xs font-mono text-slate-700">
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap break-all">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </p>
                    )}
                  </div>
                </details>
              )}
              
              <div className="mt-6 text-center">
                <p className="text-xs text-slate-500">
                  अगर समस्या बनी रहे तो कृपया संपर्क करें:
                  <br />
                  If problem persists, please contact:
                </p>
                <p className="text-sm font-medium text-slate-700">
                  📞 Helpline: 1800-XXX-XXXX
                  <br />
                  📧 support@maharashtrabus.gov.in
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
