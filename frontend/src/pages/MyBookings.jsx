import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import api from '../services/api'

function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
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

  const getStatusStyles = (status) => {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'cancelled') {
      return 'bg-rose-50 text-rose-700 border border-rose-100'
    }
    if (normalized === 'completed') {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-100'
    }
    return 'bg-sky-50 text-sky-700 border border-sky-100'
  }

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
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-slate-900">My Bookings</h1>
        <p className="mt-2 text-slate-600">Track your upcoming stays and reservation status.</p>

        <div className="mt-8 space-y-4">
          {isLoading ? <p className="text-slate-600">Loading bookings...</p> : null}
          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
          ) : null}
          {actionError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{actionError}</p>
          ) : null}
          {actionSuccess ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{actionSuccess}</p>
          ) : null}

          {!isLoading && !error && bookings.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-slate-600">
              You do not have any bookings yet.
            </div>
          ) : null}

          {bookings.map((booking) => (
            <article key={booking.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{booking.property?.title || 'Property booking'}</h2>
                  <p className="text-sm text-slate-600">{booking.property?.location || 'Location unavailable'}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusStyles(booking.status)}`}>
                  {booking.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
                <p>
                  <span className="font-medium">Check-in:</span> {booking.checkin_date}
                </p>
                <p>
                  <span className="font-medium">Check-out:</span> {booking.checkout_date}
                </p>
                <p>
                  <span className="font-medium">Total:</span> ${booking.total_price}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCancelBooking(booking.id)}
                  disabled={booking.status === 'cancelled' || isCancellingId === booking.id}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                </button>

                <button
                  type="button"
                  onClick={() => openReviewModal(booking)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Leave Review
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

      {reviewModalBooking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-900">Review your stay</h2>
            <p className="mt-1 text-sm text-slate-600">
              {reviewModalBooking.property?.title || 'Property'}
            </p>

            <form className="mt-5 space-y-4" onSubmit={submitReview}>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Your rating</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl transition ${rating >= star ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="review-comment">
                  Comment (optional)
                </label>
                <textarea
                  id="review-comment"
                  rows="4"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  placeholder="Tell others what you liked about your stay"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
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
