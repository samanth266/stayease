import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function PropertyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [property, setProperty] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkinDate, setCheckinDate] = useState('')
  const [checkoutDate, setCheckoutDate] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')
  const [isBooking, setIsBooking] = useState(false)

  const totalNights = useMemo(() => {
    if (!checkinDate || !checkoutDate) {
      return 0
    }
    const checkin = new Date(checkinDate)
    const checkout = new Date(checkoutDate)
    const millisecondsPerNight = 1000 * 60 * 60 * 24
    const diff = Math.round((checkout - checkin) / millisecondsPerNight)
    return diff > 0 ? diff : 0
  }, [checkinDate, checkoutDate])

  const totalPrice = useMemo(() => {
    if (!property || totalNights <= 0) {
      return 0
    }
    return totalNights * Number(property.price_per_night)
  }, [property, totalNights])

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await api.get(`/api/properties/${id}`)
        setProperty(response.data)
      } catch (err) {
        const message = err?.response?.data?.detail || 'Could not load property details.'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperty()
  }, [id])

  const handleBookingSubmit = async (event) => {
    event.preventDefault()
    setBookingError('')
    setBookingSuccess('')

    if (!checkinDate || !checkoutDate) {
      setBookingError('Please select both check-in and check-out dates.')
      return
    }

    if (new Date(checkoutDate) <= new Date(checkinDate)) {
      setBookingError('Check-out date must be after check-in date.')
      return
    }

    setIsBooking(true)
    try {
      await api.post('/api/bookings', {
        property_id: id,
        checkin_date: checkinDate,
        checkout_date: checkoutDate,
      })

      setBookingSuccess('Booking confirmed!')
      setTimeout(() => {
        navigate('/bookings')
      }, 2000)
    } catch (err) {
      const message = err?.response?.data?.detail || 'Booking failed. Please try again.'
      setBookingError(message)
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/" className="mb-6 inline-flex items-center text-sm font-medium text-sky-700 hover:text-sky-800">
          ← Back to listings
        </Link>

        {isLoading ? <p className="text-slate-600">Loading property...</p> : null}
        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : null}

        {!isLoading && property ? (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <img
              src={
                property.photo_url ||
                'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1600&auto=format&fit=crop'
              }
              alt={property.title}
              className="h-72 w-full object-cover sm:h-96"
            />

            <div className="space-y-6 p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-semibold text-slate-900">{property.title}</h1>
                  <p className="mt-2 text-slate-600">{property.location}</p>
                </div>
                <span className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                  ${property.price_per_night}/night
                </span>
              </div>

              <p className="leading-7 text-slate-700">{property.description || 'No description provided.'}</p>

              {!user ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 text-sm text-slate-600">Sign in to book this property.</p>
                  <Link
                    to="/login"
                    className="inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                  >
                    Login to Book
                  </Link>
                </div>
              ) : null}

              {user?.role === 'guest' ? (
                <form onSubmit={handleBookingSubmit} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h2 className="text-lg font-semibold text-slate-900">Book this stay</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="checkin-date">
                        Check-in
                      </label>
                      <input
                        id="checkin-date"
                        type="date"
                        value={checkinDate}
                        onChange={(event) => setCheckinDate(event.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="checkout-date">
                        Check-out
                      </label>
                      <input
                        id="checkout-date"
                        type="date"
                        value={checkoutDate}
                        onChange={(event) => setCheckoutDate(event.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                      />
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-slate-700">
                    Total: <span className="font-semibold">${totalPrice.toFixed(2)}</span>
                    {totalNights > 0 ? ` for ${totalNights} night${totalNights > 1 ? 's' : ''}` : ''}
                  </p>

                  {bookingError ? (
                    <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      {bookingError}
                    </p>
                  ) : null}
                  {bookingSuccess ? (
                    <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                      {bookingSuccess}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isBooking}
                    className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isBooking ? 'Booking...' : 'Book Now'}
                  </button>
                </form>
              ) : null}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  )
}

export default PropertyDetail
