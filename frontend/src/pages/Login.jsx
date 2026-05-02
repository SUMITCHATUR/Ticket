import React, { useState } from 'react'
import { ArrowRight, Bus, Eye, EyeOff, ShieldCheck, Ticket } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const success = await login(formData)
    if (!success) {
      setLoading(false)
    }
  }

  const autofill = (username, password) => {
    setFormData({ username, password })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_45%,_#f8fafc_100%)] px-4 py-8 sm:px-6">
      <div className="absolute left-[-4rem] top-20 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="absolute bottom-12 right-[-3rem] h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:block">
          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-800 backdrop-blur">
              Maharashtra Bus Ticketing
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-bold leading-tight text-slate-950">
                Book, manage and verify tickets with a cleaner conductor workflow.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-600">
                Fast route selection, mobile-ready booking screens, live fares and ticket management in one modern console.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-lg shadow-slate-200/60 backdrop-blur">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <Ticket className="h-6 w-6" />
                </div>
                <p className="text-lg font-semibold text-slate-900">Smart Ticket Flow</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Route, seat and payment journey designed to feel quick on mobile.
                </p>
              </div>

              <div className="rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-lg shadow-slate-200/60 backdrop-blur">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <p className="text-lg font-semibold text-slate-900">Secure Access</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Dedicated conductor login with simple daily operations and clean status views.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-2xl shadow-slate-200/70 backdrop-blur-xl sm:p-7">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-sky-500 to-blue-700 text-white shadow-lg shadow-sky-200">
                <Bus className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-bold text-slate-950">Sign in</h2>
              <p className="mt-2 text-sm text-slate-600">Conductor portal access for live booking and ticket handling</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-700">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="input rounded-2xl border-slate-200 bg-slate-50 py-3"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="input rounded-2xl border-slate-200 bg-slate-50 py-3 pr-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-sky-200 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="spinner h-5 w-5"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 rounded-[24px] border border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-800">Conductor Demo Access</p>
              <div className="space-y-1 text-sm text-sky-700">
                <div><strong>Username:</strong> conductor</div>
                <div><strong>Password:</strong> conductor123</div>
              </div>
              <button
                onClick={() => autofill('conductor', 'conductor123')}
                className="mt-3 w-full rounded-2xl bg-sky-700 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-sky-800"
              >
                Auto-fill Credentials
              </button>
            </div>

            <div className="mt-5 text-center text-xs text-slate-500">
              <p>Bus Ticket Booking System</p>
              <p className="mt-1">Optimized for mobile route and ticket operations</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Login
