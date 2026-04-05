import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Register() {
  const { register, user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'guest',
  })
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

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const createdUser = await register(
        formData.name.trim(),
        formData.email.trim(),
        formData.password,
        formData.role
      )
      navigate(createdUser.role === 'host' ? '/dashboard' : '/', { replace: true })
    } catch (err) {
      const message = err?.response?.data?.detail || 'Registration failed. Please try again.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const guestSelected = formData.role === 'guest'
  const hostSelected = formData.role === 'host'

  return (
    <div className="min-h-screen bg-[#faf7f5] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <div className="w-full rounded-[32px] bg-white px-6 py-8 shadow-[0_18px_45px_rgba(34,34,34,0.08)] sm:px-8 sm:py-10">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#ff385c]">StayEase</p>
            <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-[#222222] sm:text-4xl">
              Create your account
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#6a6a6a]">Join as a guest or host and start in minutes.</p>
          </div>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#ececec]" />
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a8a8a]">or</span>
            <div className="h-px flex-1 bg-[#ececec]" />
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleRoleSelect('guest')}
                className={`rounded-2xl border p-4 text-left transition duration-200 ${
                  guestSelected
                    ? 'border-[#FF385C] bg-[#fff1f4] shadow-sm'
                    : 'border-[#d8d8d8] bg-white hover:border-[#bfbfbf] hover:bg-[#fafafa]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full ${guestSelected ? 'bg-white text-[#FF385C]' : 'bg-[#fafafa] text-[#666666]'}`}>
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21v-7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v7" />
                      <path d="M7 10V7a5 5 0 0 1 10 0v3" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-[#222222]">I&apos;m a Guest</p>
                    <p className="mt-1 text-sm leading-5 text-[#6a6a6a]">Book amazing stays</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('host')}
                className={`rounded-2xl border p-4 text-left transition duration-200 ${
                  hostSelected
                    ? 'border-[#FF385C] bg-[#fff1f4] shadow-sm'
                    : 'border-[#d8d8d8] bg-white hover:border-[#bfbfbf] hover:bg-[#fafafa]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full ${hostSelected ? 'bg-white text-[#FF385C]' : 'bg-[#fafafa] text-[#666666]'}`}>
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 11.5 12 4l9 7.5" />
                      <path d="M5 10.5V20h14v-9.5" />
                      <path d="M9 20v-6h6v6" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-[#222222]">I&apos;m a Host</p>
                    <p className="mt-1 text-sm leading-5 text-[#6a6a6a]">List your property</p>
                  </div>
                </div>
              </button>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#222222]" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#d8d8d8] bg-white px-4 py-3 text-[#222222] outline-none transition placeholder:text-[#9a9a9a] focus:border-[#FF385C] focus:ring-4 focus:ring-[#ff385c]/15"
                placeholder="Your name"
              />
            </div>

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
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#d8d8d8] bg-white px-4 py-3 pr-12 text-[#222222] outline-none transition placeholder:text-[#9a9a9a] focus:border-[#FF385C] focus:ring-4 focus:ring-[#ff385c]/15"
                  placeholder="Create a secure password"
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
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6a6a6a]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#FF385C] transition hover:text-[#e62e53]">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
