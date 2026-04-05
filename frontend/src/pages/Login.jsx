import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { login, user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (user) {
    return <Navigate to={user.role === 'host' ? '/dashboard' : '/'} replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const loggedInUser = await login(formData.email.trim(), formData.password)
      navigate(loggedInUser.role === 'host' ? '/dashboard' : '/', { replace: true })
    } catch (err) {
      const message = err?.response?.data?.detail || 'Login failed. Please check your credentials.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf7f5] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[36px] bg-white shadow-[0_24px_70px_rgba(34,34,34,0.12)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#FF385C] via-[#ff546f] to-[#E61E4D] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_25%)]" />
            <div className="relative">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-white/85">StayEase</p>
              <h1 className="mt-6 max-w-md text-5xl font-extrabold tracking-[-0.05em]">Welcome to StayEase</h1>
              <p className="mt-5 max-w-sm text-lg leading-8 text-white/90">
                Sign in to manage trips, hosts, and bookings with a clean Airbnb-inspired experience.
              </p>
            </div>

            <div className="relative space-y-4">
              <div className="rounded-[28px] bg-white/12 p-5 backdrop-blur-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Fast access</p>
                <p className="mt-2 text-2xl font-bold">Bookings, hosting, and messages in one place.</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="text-center lg:text-left">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#ff385c]">StayEase</p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-[#222222] sm:text-4xl">
                Sign in
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#6a6a6a]">Log in to continue your stay planning.</p>
            </div>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#ececec]" />
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a8a8a]">or</span>
              <div className="h-px flex-1 bg-[#ececec]" />
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#222222]" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#d8d8d8] bg-white px-4 py-3 text-[#222222] outline-none transition placeholder:text-[#9a9a9a] focus:border-[#FF385C] focus:ring-4 focus:ring-[#ff385c]/15"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#222222]" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#d8d8d8] bg-white px-4 py-3 pr-12 text-[#222222] outline-none transition placeholder:text-[#9a9a9a] focus:border-[#FF385C] focus:ring-4 focus:ring-[#ff385c]/15"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-[#7a7a7a] transition hover:text-[#222222]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3l18 18" />
                        <path d="M10.58 10.58A2 2 0 0 0 13.42 13.42" />
                        <path d="M9.88 5.07A10.5 10.5 0 0 1 12 4.75c5.5 0 9.5 7.25 9.5 7.25a19.4 19.4 0 0 1-4.34 5.14" />
                        <path d="M6.61 6.61A19.4 19.4 0 0 0 2.5 12S6.5 19.25 12 19.25c1.04 0 2.06-.14 3.01-.41" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 12s3.75-7.25 10-7.25S22 12 22 12s-3.75 7.25-10 7.25S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full rounded-xl bg-[#FF385C] px-4 py-3.5 text-sm font-bold text-white transition duration-200 hover:bg-[#e62e53] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Signing in...' : 'Continue'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#6a6a6a] lg:text-left">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-semibold text-[#FF385C] transition hover:text-[#e62e53]">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
