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
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">StayEase</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Create Your Account</h1>
            <p className="mt-2 text-sm text-slate-500">Join as a guest or host in under a minute.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleRoleSelect('guest')}
                className={`cursor-pointer rounded-xl border-2 p-5 text-left transition-all duration-200 ${
                  guestSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-base font-semibold ${guestSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                      I want to book stays
                    </p>
                    <p className={`mt-1 text-sm ${guestSelected ? 'text-blue-700/80' : 'text-gray-500'}`}>
                      Discover and reserve amazing places.
                    </p>
                  </div>
                  <span
                    className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-xs font-bold ${
                      guestSelected
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-gray-300 bg-white text-transparent'
                    }`}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('host')}
                className={`cursor-pointer rounded-xl border-2 p-5 text-left transition-all duration-200 ${
                  hostSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-base font-semibold ${hostSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                      I want to list my property
                    </p>
                    <p className={`mt-1 text-sm ${hostSelected ? 'text-blue-700/80' : 'text-gray-500'}`}>
                      Host guests and grow your income.
                    </p>
                  </div>
                  <span
                    className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-xs font-bold ${
                      hostSelected
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-gray-300 bg-white text-transparent'
                    }`}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                </div>
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="name">
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
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
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
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                placeholder="Create a secure password"
              />
            </div>

            {error ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-sky-700 hover:text-sky-800">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
