import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../services/api'

function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [navbarOffset, setNavbarOffset] = useState(96)
  const [activeTab, setActiveTab] = useState('Upcoming')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [isCancellingId, setIsCancellingId] = useState('')
  const [reviewModalBooking, setReviewModalBooking] = useState(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const fetchBookings = async () => {
    try {
      const response = await api.get('/api/bookings/my')
      setBookings(response.data)
    } catch (err) {
      const message = err?.response?.data?.detail || 'Could not load your bookings.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    const updateNavbarOffset = () => {
      const navbar = document.getElementById('main-navbar')
      const height = navbar?.offsetHeight ?? 0
      setNavbarOffset(height + 16)
    }

    updateNavbarOffset()
    window.addEventListener('resize', updateNavbarOffset)

    return () => {
      window.removeEventListener('resize', updateNavbarOffset)
    }
  }, [])

  const today = useMemo(() => new Date(), [])

  const formatDateRange = (checkinDate, checkoutDate) => {
    const start = new Date(checkinDate)
    const end = new Date(checkoutDate)
    const formatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })
    return `${formatter.format(start)} → ${formatter.format(end)}`
  }

  const getBookingViewStatus = (booking) => {
    const normalized = String(booking.status || '').toLowerCase()
    if (normalized === 'cancelled') {
      return 'Cancelled'
    }

    const checkout = new Date(booking.checkout_date)
    const isPast = checkout < new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return isPast ? 'Completed' : 'Upcoming'
  }

  const filteredBookings = useMemo(() => {
    return bookings
      .filter((booking) => getBookingViewStatus(booking) === activeTab)
      .sort((a, b) => {
        const firstDate = new Date(a.checkin_date).getTime()
        const secondDate = new Date(b.checkin_date).getTime()
        return activeTab === 'Completed' ? secondDate - firstDate : firstDate - secondDate
      })
  }, [activeTab, bookings, today])

  const tabs = ['Upcoming', 'Completed', 'Cancelled']

  const getStatusStyles = (status) => {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'cancelled') {
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
    }
    if (normalized === 'completed') {
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    }
    return 'bg-[#fff1f4] text-[#ff385c] ring-1 ring-[#ffd1da]'
  }

  const getPropertyPhoto = (booking) =>
    booking.property?.photo_url ||
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop'

  const handleCancelBooking = async (bookingId) => {
    setActionError('')
    setActionSuccess('')
    setIsCancellingId(bookingId)

    try {
      await api.delete(`/api/bookings/${bookingId}`)
      await fetchBookings()
      setActionSuccess('Booking cancelled successfully.')
    } catch (err) {
      const message = err?.response?.data?.detail || 'Could not cancel this booking.'
      setActionError(message)
    } finally {
      setIsCancellingId('')
    }
  }

  const openReviewModal = (booking) => {
    setActionError('')
    setActionSuccess('')
    setReviewModalBooking(booking)
    setRating(0)
    setComment('')
  }

  const closeReviewModal = () => {
    setReviewModalBooking(null)
    setRating(0)
    setComment('')
  }

  const submitReview = async (event) => {
    event.preventDefault()
    if (!reviewModalBooking) {
      return
    }

    if (rating < 1 || rating > 5) {
      setActionError('Please select a star rating from 1 to 5.')
      return
    }

    setActionError('')
    setActionSuccess('')
    setIsSubmittingReview(true)
    try {
      await api.post('/api/reviews', {
        property_id: reviewModalBooking.property_id,
        rating,
        comment: comment.trim() || null,
      })
      await fetchBookings()
      closeReviewModal()
      setActionSuccess('Review submitted successfully.')
    } catch (err) {
      const message = err?.response?.data?.detail || 'Could not submit review.'
      setActionError(message)
    } finally {
      setIsSubmittingReview(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf7f5]" style={{ paddingTop: `${navbarOffset}px` }}>
      <Navbar />

      <main className="mx-auto w-full max-w-[1280px] px-6 pb-8 pt-4 lg:px-10 lg:pb-10 lg:pt-6">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-[-0.04em] text-[#222222]">Trips</h1>
          <p className="mt-3 text-base leading-7 text-[#6a6a6a]">
            Track your upcoming stays, completed trips, and cancellations in one place.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition duration-200 ${
                activeTab === tab
                  ? 'bg-[#FF385C] text-white shadow-sm'
                  : 'bg-white text-[#444444] shadow-sm ring-1 ring-[#ececec] hover:text-[#ff385c]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          {isLoading ? <p className="text-[#6a6a6a]">Loading trips...</p> : null}
          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
          ) : null}
          {actionError ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{actionError}</p>
          ) : null}
          {actionSuccess ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{actionSuccess}</p>
          ) : null}

          {!isLoading && !error && filteredBookings.length === 0 ? (
            <div className="rounded-[32px] bg-white px-6 py-14 text-center shadow-[0_16px_50px_rgba(34,34,34,0.08)]">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff1f4] text-3xl text-[#ff385c]">
                ✈
              </div>
              <h2 className="mt-6 text-2xl font-bold tracking-[-0.03em] text-[#222222]">No trips yet</h2>
              <p className="mt-3 text-[#6a6a6a]">Start exploring and book your next getaway.</p>
              <Link
                to="/"
                className="mt-8 inline-flex rounded-full bg-[#FF385C] px-5 py-3 text-sm font-bold text-white transition duration-200 hover:bg-[#e62e53]"
              >
                Start exploring
              </Link>
            </div>
          ) : null}

          {filteredBookings.map((booking) => {
            const statusLabel = getBookingViewStatus(booking)
            const isUpcoming = statusLabel === 'Upcoming'
            const isCompleted = statusLabel === 'Completed'

            return (
              <article
                key={booking.id}
                className="overflow-hidden rounded-[28px] bg-white shadow-[0_14px_40px_rgba(34,34,34,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(34,34,34,0.12)]"
              >
                <div className="flex flex-col gap-0 md:flex-row">
                  <div className="h-[220px] w-full md:h-auto md:w-[160px] md:flex-none">
                    <img
                      src={getPropertyPhoto(booking)}
                      alt={booking.property?.title || 'Property'}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-5 md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-xl font-bold tracking-[-0.02em] text-[#222222]">
                          {booking.property?.title || 'Property booking'}
                        </h2>
                        <div className="mt-2 flex items-center gap-2 text-[#6a6a6a]">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#ff385c]" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 21s6-4.8 6-11a6 6 0 1 0-12 0c0 6.2 6 11 6 11Z" />
                            <circle cx="12" cy="10" r="2.5" />
                          </svg>
                          <p className="text-sm font-medium">{booking.property?.location || 'Location unavailable'}</p>
                        </div>
                      </div>

                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${getStatusStyles(booking.status)}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-[#5e5e5e]">
                      <span>{formatDateRange(booking.checkin_date, booking.checkout_date)}</span>
                      <span className="text-[#c7c7c7]">•</span>
                      <span>${Number(booking.total_price).toFixed(2)}</span>
                    </div>

                    <div className="mt-4 flex flex-1 items-end justify-end gap-2">
                      {isUpcoming ? (
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={isCancellingId === booking.id}
                          className="rounded-full border border-[#ff385c] px-4 py-2.5 text-sm font-semibold text-[#ff385c] transition duration-200 hover:bg-[#fff1f4] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isCancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      ) : null}

                      {isCompleted ? (
                        <button
                          type="button"
                          onClick={() => openReviewModal(booking)}
                          className="rounded-full border border-[#d8d8d8] px-4 py-2.5 text-sm font-semibold text-[#222222] transition duration-200 hover:bg-[#fafafa]"
                        >
                          Review
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </main>

      {reviewModalBooking ? (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(34,34,34,0.55)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(event) => {
            if (event.currentTarget === event.target) {
              closeReviewModal()
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: 'white',
              borderRadius: '28px',
              padding: '24px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
            }}
          >
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#222222]">Review your stay</h2>
            <p className="mt-1 text-sm text-[#6a6a6a]">
              {reviewModalBooking.property?.title || 'Property'}
            </p>

            <form className="mt-5 space-y-4" onSubmit={submitReview}>
              <div>
                <p className="mb-3 text-sm font-medium text-[#222222]">Your rating</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-4xl transition duration-200 ${rating >= star ? 'text-[#FF385C]' : 'text-[#d8d8d8] hover:text-[#ff9eb0]'}`}
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#222222]" htmlFor="review-comment">
                  Comment (optional)
                </label>
                <textarea
                  id="review-comment"
                  rows="4"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  className="w-full rounded-xl border border-[#d8d8d8] px-4 py-3 text-[#222222] outline-none transition placeholder:text-[#9a9a9a] focus:border-[#FF385C] focus:ring-4 focus:ring-[#ff385c]/15"
                  placeholder="Tell others what you liked about your stay"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="rounded-xl border border-[#d8d8d8] bg-white px-4 py-2.5 text-sm font-semibold text-[#222222] transition duration-200 hover:bg-[#fafafa]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="rounded-xl bg-[#FF385C] px-4 py-2.5 text-sm font-bold text-white transition duration-200 hover:bg-[#e62e53] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default MyBookings
