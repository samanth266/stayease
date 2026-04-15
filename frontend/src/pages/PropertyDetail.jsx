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
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkinDate, setCheckinDate] = useState('')
  const [checkoutDate, setCheckoutDate] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')
  const [isBooking, setIsBooking] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)

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

  const averageRating = useMemo(() => {
    if (typeof property?.average_rating === 'number') {
      return property.average_rating
    }

    if (reviews.length === 0) {
      return 0
    }

    const sum = reviews.reduce((total, review) => total + Number(review.rating || 0), 0)
    return sum / reviews.length
  }, [property?.average_rating, reviews])

  const propertyPhotos = useMemo(() => {
    const photosFromObjects = Array.isArray(property?.photos)
      ? property.photos
        .map((photo) => (typeof photo === 'string' ? photo : photo?.photo_url || photo?.url))
        .filter(Boolean)
      : []
    const photosFromLegacyArray = Array.isArray(property?.photo_urls)
      ? property.photo_urls.filter(Boolean)
      : []
    const candidatePhotos = [...photosFromObjects, ...photosFromLegacyArray]

    const resolvedPhotos = [...new Set(candidatePhotos)]

    if (resolvedPhotos.length > 0) {
      return resolvedPhotos
    }

    return property?.photo_url ? [property.photo_url] : []
  }, [property])

  const selectedPhoto =
    propertyPhotos[selectedPhotoIndex] ||
    propertyPhotos[0] ||
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1600&auto=format&fit=crop'

  const host = property?.host
  const isHostUser = user?.role === 'host'

  const formatDisplayDate = (value) => {
    if (!value) return 'Recently'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'Recently'
    return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(parsed)
  }

  const formatReviewDate = (value) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return ''
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed)
  }

  const getInitials = (name = '') =>
    name
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'SE'

  const renderStars = (rating, className = 'h-4 w-4') =>
    Array.from({ length: 5 }, (_, index) => (
      <svg
        key={index}
        viewBox="0 0 24 24"
        className={className}
        fill={index < Math.round(rating) ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2.75l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.8l-5.88 3.09 1.12-6.55-4.76-4.64 6.58-.96L12 2.75Z" />
      </svg>
    ))

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const [propertyResponse, reviewsResponse] = await Promise.all([
          api.get(`/api/properties/${id}`),
          api.get(`/api/reviews/property/${id}`),
        ])

        setProperty(propertyResponse.data)
        setReviews(reviewsResponse.data || [])
      } catch (err) {
        const message = err?.response?.data?.detail || 'Could not load property details.'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperty()
  }, [id])

  useEffect(() => {
    if (propertyPhotos.length === 0) {
      setSelectedPhotoIndex(0)
      return
    }

    if (selectedPhotoIndex > propertyPhotos.length - 1) {
      setSelectedPhotoIndex(0)
    }
  }, [propertyPhotos, selectedPhotoIndex])

  const showPreviousPhoto = () => {
    if (propertyPhotos.length <= 1) return
    setSelectedPhotoIndex((current) =>
      current === 0 ? propertyPhotos.length - 1 : current - 1
    )
  }

  const showNextPhoto = () => {
    if (propertyPhotos.length <= 1) return
    setSelectedPhotoIndex((current) =>
      current === propertyPhotos.length - 1 ? 0 : current + 1
    )
  }

  const handleBookingSubmit = async (event) => {
    event.preventDefault()
    setBookingError('')
    setBookingSuccess('')

    if (!user) {
      navigate('/login')
      return
    }

    if (user.role !== 'guest') {
      setBookingError('Only guests can reserve stays.')
      return
    }

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
    <div className="min-h-screen bg-[#faf7f5]">
      <Navbar />

      <main className="mx-auto w-full max-w-[1440px] px-6 pb-8 lg:px-10 lg:pb-10" style={{ paddingTop: '72px' }}>
        <Link to="/" className="inline-flex items-center text-sm font-semibold text-[#ff385c] transition hover:text-[#e62e53] mt-4 block">
          ← Back to listings
        </Link>

        {isLoading ? <p className="mt-8 text-[#6a6a6a]">Loading property...</p> : null}
        {error ? (
          <p className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : null}

        {!isLoading && property ? (
          <section className="mt-6 space-y-8">
            <div className="overflow-hidden rounded-[32px] bg-white p-4 shadow-[0_16px_50px_rgba(34,34,34,0.08)] lg:p-5">
              <div className="relative overflow-hidden rounded-[24px] bg-[#f6f6f6]">
                <div className="w-full overflow-hidden rounded-[20px]">
                  <div
                    className="group relative block h-[280px] w-full overflow-hidden sm:h-[360px] lg:h-[460px]"
                  >
                    <img
                      src={selectedPhoto}
                      alt={property.title}
                      className="h-full w-full bg-[#f3f4f6] object-contain"
                    />
                  </div>
                </div>

                {propertyPhotos.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousPhoto}
                      className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-[#222222] shadow-md transition hover:bg-white"
                      aria-label="Previous image"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={showNextPhoto}
                      className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-[#222222] shadow-md transition hover:bg-white"
                      aria-label="Next image"
                    >
                      ›
                    </button>
                    <div className="absolute bottom-3 right-3 rounded-full bg-[#222222]/75 px-3 py-1 text-xs font-semibold text-white">
                      {selectedPhotoIndex + 1} / {propertyPhotos.length}
                    </div>
                  </>
                ) : null}
              </div>

              {propertyPhotos.length > 1 ? (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {propertyPhotos.map((photo, index) => (
                    <button
                      key={`${photo}-${index}`}
                      type="button"
                      onClick={() => setSelectedPhotoIndex(index)}
                      className={`relative h-[120px] w-[120px] flex-none overflow-hidden rounded-xl border-2 transition ${index === selectedPhotoIndex
                        ? 'border-[#FF385C] shadow-sm'
                        : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img
                        src={photo}
                        alt={`${property.title} photo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,60%)_minmax(340px,40%)] lg:items-start">
              <div className="space-y-8">
                <section className="rounded-[32px] bg-white p-6 shadow-[0_16px_50px_rgba(34,34,34,0.08)] lg:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-[-0.03em] text-[#222222] lg:text-4xl">{property.title}</h1>
                      <div className="mt-3 flex items-center gap-2 text-[#6a6a6a]">
                        <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#ff385c]" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 21s6-4.8 6-11a6 6 0 1 0-12 0c0 6.2 6 11 6 11Z" />
                          <circle cx="12" cy="10" r="2.5" />
                        </svg>
                        <span className="text-sm font-medium">{property.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-full bg-[#fff1f4] px-4 py-2 text-[#ff385c]">
                      <div className="flex items-center gap-1">{renderStars(averageRating, 'h-4 w-4')}</div>
                      <span className="text-sm font-bold">
                        {averageRating ? averageRating.toFixed(1) : 'New'}
                      </span>
                      <span className="text-sm text-[#6a6a6a]">({reviews.length})</span>
                    </div>
                  </div>

                  <div className="my-8 h-px bg-[#ececec]" />

                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ff385c] text-lg font-bold text-white">
                      {getInitials(host?.name || 'StayEase')}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-[#222222]">
                        Hosted by {host?.name || 'StayEase Host'}
                      </p>
                      <p className="text-sm text-[#6a6a6a]">Joined {formatDisplayDate(host?.created_at)}</p>
                    </div>
                  </div>

                  <div className="my-8 h-px bg-[#ececec]" />

                  <div>
                    <h2 className="text-lg font-semibold text-[#222222]">About this stay</h2>
                    <p className="mt-4 whitespace-pre-line leading-8 text-[#5e5e5e]">
                      {property.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="my-8 h-px bg-[#ececec]" />

                  <section>
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#ff385c]">Reviews</p>
                        <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#222222]">
                          Guest feedback
                        </h2>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold tracking-[-0.04em] text-[#222222]">
                          {averageRating ? averageRating.toFixed(1) : '0.0'}
                        </div>
                        <div className="mt-1 flex items-center justify-end gap-1 text-[#ff385c]">
                          {renderStars(averageRating, 'h-4 w-4')}
                        </div>
                      </div>
                    </div>

                    {reviews.length > 0 ? (
                      <div className="mt-6 space-y-4">
                        {reviews.map((review) => (
                          <article key={review.id} className="rounded-2xl bg-[#faf7f5] p-5">
                            <div className="flex items-start gap-4">
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white font-bold text-[#ff385c] shadow-sm">
                                {getInitials(review.reviewer_name)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <p className="font-semibold text-[#222222]">{review.reviewer_name}</p>
                                    <p className="text-sm text-[#6a6a6a]">{formatReviewDate(review.created_at)}</p>
                                  </div>
                                  <div className="flex items-center gap-1 text-[#ff385c]">
                                    {renderStars(review.rating, 'h-4 w-4')}
                                  </div>
                                </div>
                                <p className="mt-3 leading-7 text-[#5e5e5e]">
                                  {review.comment || 'No written comment provided.'}
                                </p>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-5 rounded-2xl border border-[#ececec] bg-white px-4 py-6 text-sm text-[#6a6a6a] shadow-sm">
                        No reviews yet. Be the first guest to share feedback.
                      </p>
                    )}
                  </section>
                </section>
              </div>

              <aside className="lg:sticky lg:top-28">
                <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_45px_rgba(34,34,34,0.1)]">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-3xl font-bold tracking-[-0.03em] text-[#222222]">
                        ${Number(property.price_per_night).toFixed(0)}
                        <span className="text-base font-normal text-[#6a6a6a]"> / night</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-[#ff385c]">
                      {renderStars(averageRating, 'h-4 w-4')}
                      <span>{averageRating ? averageRating.toFixed(1) : 'New'}</span>
                    </div>
                  </div>

                  {isHostUser ? (
                    <div className="mt-6 rounded-2xl border border-[#ececec] bg-[#faf7f5] px-4 py-6 text-sm text-[#5e5e5e]">
                      Hosts cannot reserve stays. Switch to a guest account to book this property.
                    </div>
                  ) : (
                    <form onSubmit={handleBookingSubmit} className="mt-6 space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#6a6a6a]">
                            Check in
                          </span>
                          <input
                            type="date"
                            value={checkinDate}
                            onChange={(event) => setCheckinDate(event.target.value)}
                            className="w-full rounded-xl border border-[#d8d8d8] bg-white px-4 py-3 text-[#222222] outline-none transition focus:border-[#FF385C] focus:ring-4 focus:ring-[#ff385c]/15"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#6a6a6a]">
                            Check out
                          </span>
                          <input
                            type="date"
                            value={checkoutDate}
                            onChange={(event) => setCheckoutDate(event.target.value)}
                            className="w-full rounded-xl border border-[#d8d8d8] bg-white px-4 py-3 text-[#222222] outline-none transition focus:border-[#FF385C] focus:ring-4 focus:ring-[#ff385c]/15"
                          />
                        </label>
                      </div>

                      <div className="space-y-3 rounded-2xl bg-[#faf7f5] p-4">
                        <div className="flex items-center justify-between text-sm text-[#6a6a6a]">
                          <span>Price</span>
                          <span>${Number(property.price_per_night).toFixed(0)} x {totalNights || 0} nights</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-[#6a6a6a]">
                          <span>Nights</span>
                          <span>{totalNights || 0}</span>
                        </div>
                        <div className="h-px bg-[#e7e7e7]" />
                        <div className="flex items-center justify-between text-base font-semibold text-[#222222]">
                          <span>Total</span>
                          <span>${totalPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      {bookingError ? (
                        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                          {bookingError}
                        </p>
                      ) : null}
                      {bookingSuccess ? (
                        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                          {bookingSuccess}
                        </p>
                      ) : null}

                      <button
                        type="submit"
                        disabled={isBooking}
                        className="w-full rounded-xl bg-[#FF385C] px-4 py-3.5 text-base font-bold text-white transition duration-200 hover:bg-[#e62e53] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBooking ? 'Reserving...' : 'Reserve'}
                      </button>

                      <p className="text-center text-sm text-[#6a6a6a]">You won&apos;t be charged yet</p>
                    </form>
                  )}
                </div>
              </aside>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  )
}

export default PropertyDetail
