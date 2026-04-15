import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const initialFormState = {
  title: '',
  description: '',
  price_per_night: '',
  location: '',
}

const propertyFallbackImage =
  'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop'

function HostDashboard() {
  const { user } = useAuth()
  const [properties, setProperties] = useState([])
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_per_night: '',
    location: '',
  })
  const [photoFiles, setPhotoFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [cardImageIndexByProperty, setCardImageIndexByProperty] = useState({})
  const fileInputRef = useRef(null)

  const getPropertyPhotos = (property) => {
    const galleryPhotos = Array.isArray(property?.photos)
      ? property.photos
        .map((photo) => (typeof photo === 'string' ? photo : photo?.photo_url || photo?.url))
        .filter(Boolean)
      : []

    if (galleryPhotos.length > 0) {
      return galleryPhotos
    }

    return property?.photo_url ? [property.photo_url] : [propertyFallbackImage]
  }

  const getCardImageIndex = (propertyId, photoCount) => {
    const currentIndex = cardImageIndexByProperty[propertyId] ?? 0
    if (photoCount <= 0) return 0
    return Math.min(currentIndex, photoCount - 1)
  }

  const showPreviousCardPhoto = (propertyId, photoCount) => {
    if (photoCount <= 1) return
    setCardImageIndexByProperty((prev) => {
      const current = prev[propertyId] ?? 0
      return {
        ...prev,
        [propertyId]: current === 0 ? photoCount - 1 : current - 1,
      }
    })
  }

  const showNextCardPhoto = (propertyId, photoCount) => {
    if (photoCount <= 1) return
    setCardImageIndexByProperty((prev) => {
      const current = prev[propertyId] ?? 0
      return {
        ...prev,
        [propertyId]: current === photoCount - 1 ? 0 : current + 1,
      }
    })
  }

  const loadProperties = async () => {
    const propertiesResponse = await api.get('/api/properties')
    const baseProperties = propertiesResponse.data

    if (!user) {
      setProperties(baseProperties)
      return
    }

    const hostOwned = baseProperties.filter((property) => property.host_id === user.id)
    const detailedHostProperties = await Promise.all(
      hostOwned.map(async (property) => {
        try {
          const detailResponse = await api.get(`/api/properties/${property.id}`)
          return detailResponse.data
        } catch {
          return property
        }
      })
    )

    const detailedById = new Map(detailedHostProperties.map((property) => [property.id, property]))
    setProperties(baseProperties.map((property) => detailedById.get(property.id) || property))
  }

  useEffect(() => {
    if (!user) return

    const fetchDashboardData = async () => {
      try {
        await loadProperties()
        try {
          const bookingsResponse = await api.get('/api/bookings/host/recent')
          setBookings(bookingsResponse.data)
        } catch {
          setBookings([])
        }
      } catch (err) {
        const message = err?.response?.data?.detail || 'Could not load dashboard data.'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  const hostProperties = useMemo(() => {
    if (!user) {
      return []
    }

    return properties.filter((property) => property.host_id === user.id)
  }, [properties, user])

  const activeBookingPropertyIds = useMemo(() => {
    const activeStatuses = new Set(['cancelled', 'completed'])
    const ids = new Set()

    bookings.forEach((booking) => {
      const normalizedStatus = String(booking.status || '').toLowerCase()
      if (!activeStatuses.has(normalizedStatus) && booking.property_id) {
        ids.add(String(booking.property_id))
      }
    })

    return ids
  }, [bookings])

  const availableNowCount = useMemo(
    () => hostProperties.filter((property) => property.is_available && !activeBookingPropertyIds.has(String(property.id))).length,
    [activeBookingPropertyIds, hostProperties]
  )

  const activeBookingsCount = useMemo(
    () => bookings.filter((booking) => String(booking.status || '').toLowerCase() !== 'cancelled').length,
    [bookings]
  )

  const metrics = useMemo(
    () => [
      {
        label: 'Properties listed',
        value: hostProperties.length,
        icon: '🏠',
      },
      {
        label: 'Total bookings',
        value: activeBookingsCount,
        icon: '🧳',
      },
      {
        label: 'Properties available',
        value: availableNowCount,
        icon: '✓',
      },
    ],
    [activeBookingsCount, availableNowCount, hostProperties.length]
  )

  const recentBookings = useMemo(() => bookings.slice(0, 8), [bookings])

  const formatDateRange = (checkinDate, checkoutDate) => {
    const start = new Date(checkinDate)
    const end = new Date(checkoutDate)
    const formatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })
    return `${formatter.format(start)} → ${formatter.format(end)}`
  }

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

  const getInitials = (name = '') =>
    name
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'SE'
  const openDrawer = () => {
    setEditingProperty(null)
    setFormData({
      title: '',
      description: '',
      price_per_night: '',
      location: '',
    })
    setPhotoFiles([])
    setFormError('')
    setIsDrawerOpen(true)
  }

  const closeDrawer = () => {
    setIsDrawerOpen(false)
    setEditingProperty(null)
    setFormData({
      title: '',
      description: '',
      price_per_night: '',
      location: '',
    })
    setPhotoFiles([])
    setFormError('')
  }

  const openEditDrawer = (property) => {
    setEditingProperty(property)
    setFormData({
      title: property.title || '',
      description: property.description || '',
      price_per_night: String(property.price_per_night ?? ''),
      location: property.location || '',
    })
    setPhotoFiles([])
    setFormError('')
    setIsDrawerOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        price_per_night: parseFloat(formData.price_per_night),
        location: formData.location,
      }

      if (editingProperty) {
        await api.patch(`/api/properties/${editingProperty.id}`, payload)
        for (const photoFile of photoFiles) {
          const fd = new FormData()
          fd.append('photo', photoFile)
          await api.post(`/api/properties/${editingProperty.id}/photos`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        }
      } else {
        const res = await api.post('/api/properties', payload)
        const newProperty = res.data
        for (const photoFile of photoFiles) {
          const fd = new FormData()
          fd.append('photo', photoFile)
          await api.post(`/api/properties/${newProperty.id}/photos`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        }
      }

      await loadProperties()
      closeDrawer()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save listing')
    } finally {
      setSubmitting(false)
    }
  }


  const triggerPhotoPicker = () => {
    fileInputRef.current?.click()
  }

  const handleDeleteProperty = async (propertyId) => {
    const shouldDelete = window.confirm('Delete this listing? This cannot be undone.')
    if (!shouldDelete) {
      return
    }

    setDeletingId(propertyId)

    try {
      await api.delete(`/api/properties/${propertyId}`)
      setProperties((prev) => prev.filter((property) => property.id !== propertyId))
    } catch (err) {
      alert('Could not delete property.')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="min-h-screen bg-white overflow-visible">
      <Navbar />

      <main className="mx-auto w-full max-w-[1440px] px-6 py-8 lg:px-10 lg:py-10">
        <section className="relative -mx-2 overflow-hidden rounded-[32px] bg-gradient-to-br from-[#FFDEE6] via-[#ffd3de] to-[#ffc2d1] px-8 py-9 sm:mx-0 lg:px-12 lg:py-11">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.2),transparent_28%)]" />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div>
              <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-[#E61E4D]">Host Dashboard</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[#b31942]">
                Manage your listings, review activity, and stay on top of guest demand.
              </p>
            </div>
            <Link
              to="/"
              className="rounded-full bg-[#FF385C] px-5 py-3 text-sm font-bold text-white transition duration-200 hover:bg-[#e62e53]"
            >
              Browse all properties
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-[28px] border border-[#ececec] bg-white/95 p-6 shadow-[0_12px_32px_rgba(34,34,34,0.08)] backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1f4] text-xl">
                    {metric.icon}
                  </div>
                  <p className="mt-5 text-4xl font-bold tracking-[-0.04em] text-[#222222]">{metric.value}</p>
                  <p className="mt-2 text-sm font-medium text-[#6a6a6a]">{metric.label}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#222222]">Your listings</h2>
            </div>
            <button
              type="button"
              onClick={openDrawer}
              className="cursor-pointer rounded-full border border-[#FF385C] px-5 py-3 text-sm font-bold text-[#FF385C] transition duration-200 hover:bg-[#fff1f4] active:scale-95"
            >
              Add new listing
            </button>
          </div>

          {error ? (
            <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
          ) : null}

          {isLoading ? <p className="mt-6 text-[#6a6a6a]">Loading your listings...</p> : null}

          {!isLoading && !error && hostProperties.length === 0 ? (
            <div className="mt-6 rounded-[32px] border border-[#ececec] bg-white/95 px-6 py-14 text-center shadow-[0_12px_32px_rgba(34,34,34,0.08)] backdrop-blur">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1f4] text-2xl text-[#ff385c]">
                🏡
              </div>
              <h3 className="mt-5 text-2xl font-bold tracking-[-0.03em] text-[#222222]">No listings yet</h3>
              <p className="mt-3 text-[#6a6a6a]">Add your first stay to start hosting guests.</p>
              <button
                type="button"
                onClick={openDrawer}
                className="mt-8 rounded-full bg-[#FF385C] px-5 py-3 text-sm font-bold text-white transition duration-200 hover:bg-[#e62e53]"
              >
                Add new listing
              </button>
            </div>
          ) : null}

          {hostProperties.length > 0 ? (
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {hostProperties.map((property) => (
                (() => {
                  const propertyPhotos = getPropertyPhotos(property)
                  const currentCardPhotoIndex = getCardImageIndex(property.id, propertyPhotos.length)
                  return (
                    <article
                      key={property.id}
                      className="group overflow-hidden rounded-[24px] border border-[#ececec] bg-white/95 shadow-[0_10px_28px_rgba(34,34,34,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(34,34,34,0.12)]"
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <div className="relative block h-full w-full">
                          <img
                            src={propertyPhotos[currentCardPhotoIndex] || propertyFallbackImage}
                            alt={`${property.title} image ${currentCardPhotoIndex + 1}`}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                          <span className="absolute bottom-3 left-3 rounded-full bg-[#222222]/70 px-3 py-1 text-xs font-semibold text-white">
                            {propertyPhotos.length > 1
                              ? `${currentCardPhotoIndex + 1}/${propertyPhotos.length}`
                              : 'View photo'}
                          </span>
                        </div>

                        {propertyPhotos.length > 1 ? (
                          <>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault()
                                event.stopPropagation()
                                showPreviousCardPhoto(property.id, propertyPhotos.length)
                              }}
                              className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg text-[#222222] shadow-sm transition hover:bg-white"
                              aria-label={`Previous image for ${property.title}`}
                            >
                              ‹
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault()
                                event.stopPropagation()
                                showNextCardPhoto(property.id, propertyPhotos.length)
                              }}
                              className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg text-[#222222] shadow-sm transition hover:bg-white"
                              aria-label={`Next image for ${property.title}`}
                            >
                              ›
                            </button>
                          </>
                        ) : null}
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        {/* Title + Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-[#222222] truncate">{property.location}</p>
                            <p className="text-xs text-[#6a6a6a] truncate mt-0.5">{property.title}</p>
                          </div>
                          <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${!property.is_available
                            ? 'bg-rose-50 text-rose-600'
                            : activeBookingPropertyIds.has(String(property.id))
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-emerald-50 text-emerald-600'
                            }`}>
                            {!property.is_available ? 'Hidden' : activeBookingPropertyIds.has(String(property.id)) ? 'Booked' : 'Available'}
                          </span>
                        </div>

                        {/* Price */}
                        <p className="text-sm font-bold text-[#222222]">
                          <span className="text-[#FF385C]">${property.price_per_night}</span>
                          <span className="font-normal text-[#6a6a6a] text-xs"> / night</span>
                        </p>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => openEditDrawer(property)}
                            className="flex-1 rounded-xl border border-[#e0e0e0] py-2 text-xs font-semibold text-[#444] transition hover:bg-[#f5f5f5]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProperty(property.id)}
                            disabled={deletingId === property.id}
                            className="flex-1 rounded-xl border border-[#FF385C] py-2 text-xs font-semibold text-[#FF385C] transition hover:bg-[#fff1f4] disabled:opacity-60"
                          >
                            {deletingId === property.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })()
              ))}
            </div>
          ) : null}
        </section>

        <section className="mt-12 rounded-[32px] border border-[#ececec] bg-white/95 p-6 shadow-[0_12px_32px_rgba(34,34,34,0.08)] backdrop-blur lg:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#222222]">Recent bookings</h2>
            </div>
            <p className="text-sm text-[#6a6a6a]">Latest guest activity across your listings</p>
          </div>

          {isLoading ? <p className="mt-6 text-[#6a6a6a]">Loading bookings...</p> : null}

          {!isLoading && recentBookings.length > 0 ? (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-[#ececec]">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-[#faf7f5] text-xs font-bold uppercase tracking-[0.18em] text-[#6a6a6a]">
                  <tr>
                    <th className="px-4 py-4">Guest name</th>
                    <th className="px-4 py-4">Property</th>
                    <th className="px-4 py-4">Dates</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking, index) => (
                    <tr key={booking.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                      <td className="px-4 py-4 text-sm font-medium text-[#222222]">{booking.guest_name}</td>
                      <td className="px-4 py-4 text-sm text-[#5e5e5e]">{booking.property_title}</td>
                      <td className="px-4 py-4 text-sm text-[#5e5e5e]">
                        {formatDateRange(booking.checkin_date, booking.checkout_date)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${getStatusStyles(booking.status)}`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-bold text-[#222222]">
                        ${Number(booking.total_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {!isLoading && recentBookings.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-[#ececec] bg-[#faf7f5] px-4 py-8 text-center text-[#6a6a6a]">
              No recent bookings yet.
            </div>
          ) : null}
        </section>
      </main>

      {isDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.currentTarget === e.target) {
              closeDrawer()
            }
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '28px',
              border: '1px solid #ececec',
              padding: '32px',
              width: '100%',
              maxWidth: '512px',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: '0 20px 48px rgba(34,34,34,0.16)'
            }}
          >
            <button
              type="button"
              onClick={closeDrawer}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer"
              aria-label="Close modal"
            >
              ×
            </button>

            <div className="pr-6 mb-6">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#ff385c]">
                {editingProperty ? 'Edit listing' : 'Add new listing'}
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#222222]">
                {editingProperty ? 'Update your stay' : 'Publish a new stay'}
              </h2>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#222222]" htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full rounded-xl border border-[#d8d8d8] px-4 py-3 text-[#222222] outline-none transition placeholder:text-[#9a9a9a] focus:border-[#FF385C] focus:ring-4 focus:ring-[#ff385c]/15"
                  placeholder="Beachfront villa"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#222222]" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-[#d8d8d8] px-4 py-3 text-[#222222] outline-none transition placeholder:text-[#9a9a9a] focus:border-[#FF385C] focus:ring-4 focus:ring-[#ff385c]/15"
                  placeholder="Describe your property"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#222222]" htmlFor="price_per_night">
                    Price per night
                  </label>
                  <input
                    id="price_per_night"
                    name="price_per_night"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_per_night}
                    onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                    required
                    className="w-full rounded-xl border border-[#d8d8d8] px-4 py-3 text-[#222222] outline-none transition placeholder:text-[#9a9a9a] focus:border-[#FF385C] focus:ring-4 focus:ring-[#ff385c]/15"
                    placeholder="150.00"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#222222]" htmlFor="location">
                    Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    className="w-full rounded-xl border border-[#d8d8d8] px-4 py-3 text-[#222222] outline-none transition placeholder:text-[#9a9a9a] focus:border-[#FF385C] focus:ring-4 focus:ring-[#ff385c]/15"
                    placeholder="Miami Beach"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-[#222222]">Property photo</p>
                <div
                  role="button"
                  tabIndex="0"
                  onClick={triggerPhotoPicker}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      triggerPhotoPicker()
                    }
                  }}
                  className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d8d8d8] bg-[#faf7f5] px-5 py-8 text-center transition hover:border-[#FF385C] hover:bg-[#fff7f9]"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-[#FF385C] shadow-sm">
                    ⬆
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[#222222]">
                    Drag and drop your photo here or click to upload
                  </p>
                  <p className="mt-2 text-xs text-[#6a6a6a]">JPG, PNG, WEBP, or AVIF up to 5MB</p>
                  {photoFiles.length > 0 ? (
                    <div className="mt-3 space-y-1 text-sm font-medium text-[#ff385c]">
                      <p>{photoFiles.length} file(s) selected</p>
                      <p className="text-xs text-[#6a6a6a]">
                        {photoFiles.map((file) => file.name).join(', ')}
                      </p>
                    </div>
                  ) : null}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,.avif"
                  multiple
                  className="hidden"
                  onChange={(event) => setPhotoFiles(Array.from(event.target.files || []))}
                />
              </div>

              {formError ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#FF385C] px-4 py-3.5 text-base font-bold text-white transition duration-200 hover:bg-[#e62e53] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Saving...' : editingProperty ? 'Save Changes' : 'Publish Listing'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default HostDashboard
