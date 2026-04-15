import { useEffect, useMemo, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import PropertyCard from '../components/PropertyCard'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Home() {
  const { user } = useAuth()
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchError, setSearchError] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [appliedLocationQuery, setAppliedLocationQuery] = useState('')
  const [appliedCheckIn, setAppliedCheckIn] = useState('')
  const [appliedCheckOut, setAppliedCheckOut] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const browseSectionRef = useRef(null)

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await api.get('/api/properties')
        setProperties(response.data)
      } catch (err) {
        const message = err?.response?.data?.detail || 'Could not load properties right now.'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperties()
  }, [])

  const categories = ['All', 'Beach', 'Mountain', 'City', 'Countryside']

  const isPropertyAvailableForDates = (property) => {
    if (!appliedCheckIn || !appliedCheckOut) {
      return true
    }

    const requestedCheckIn = new Date(appliedCheckIn)
    const requestedCheckOut = new Date(appliedCheckOut)
    const blockedStatuses = new Set(['cancelled', 'completed'])
    const bookings = Array.isArray(property.bookings) ? property.bookings : []

    return bookings.every((booking) => {
      const status = String(booking.status || '').toLowerCase()
      if (blockedStatuses.has(status)) {
        return true
      }

      const bookingCheckIn = new Date(booking.checkin_date)
      const bookingCheckOut = new Date(booking.checkout_date)
      return requestedCheckOut <= bookingCheckIn || requestedCheckIn >= bookingCheckOut
    })
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    setSearchError('')

    if ((checkIn && !checkOut) || (!checkIn && checkOut)) {
      setSearchError('Please choose both check-in and check-out dates.')
      return
    }

    if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
      setSearchError('Check-out must be after check-in.')
      return
    }

    setAppliedLocationQuery(locationQuery.trim())
    setAppliedCheckIn(checkIn)
    setAppliedCheckOut(checkOut)
    browseSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleClearFilters = () => {
    setSearchError('')
    setLocationQuery('')
    setAppliedLocationQuery('')
    setCheckIn('')
    setCheckOut('')
    setSelectedCategory('All')
    setAppliedCheckIn('')
    setAppliedCheckOut('')
  }

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const locationText = `${property.location || ''} ${property.title || ''} ${property.description || ''}`.toLowerCase()
      const categoryMatch =
        selectedCategory === 'All' || locationText.includes(selectedCategory.toLowerCase())
      const queryMatch = !appliedLocationQuery || locationText.includes(appliedLocationQuery.toLowerCase())
      const dateMatch = isPropertyAvailableForDates(property)
      return categoryMatch && queryMatch && dateMatch
    })
  }, [appliedCheckIn, appliedCheckOut, appliedLocationQuery, properties, selectedCategory])

  const recommendedProperties = useMemo(() => {
    return filteredProperties.slice(0, 8)
  }, [filteredProperties])

  const hasAppliedFilters = Boolean(appliedLocationQuery || appliedCheckIn || appliedCheckOut || selectedCategory !== 'All')

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        <section className="relative bg-gradient-to-br from-[#FFDEE6] via-[#ffd3de] to-[#ffc2d1] py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.2),transparent_28%)]" />
          <div className="relative mx-auto flex h-full w-full max-w-[1440px] flex-col justify-center gap-6 px-6 py-12 lg:px-10 lg:py-16">
            <div className="w-full max-w-5xl overflow-hidden rounded-[36px] border border-[#ececec] bg-white/95 p-5 shadow-[0_12px_36px_rgba(34,34,34,0.12)] backdrop-blur sm:p-6 lg:p-7">
              <div className="max-w-3xl">
                <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-[#E61E4D] sm:text-4xl lg:text-5xl">
                  Find your perfect stay
                </h1>
                <p className="mt-2 max-w-2xl text-base leading-7 text-[#b31942] lg:text-lg">
                  Discover amazing places to stay
                </p>
              </div>

              <form
                onSubmit={handleSearchSubmit}
                className="mt-5 w-full rounded-[28px] border border-[#ececec] bg-white p-3 shadow-[0_8px_20px_rgba(34,34,34,0.06)] lg:p-4"
              >
                <div className="grid gap-3 lg:grid-cols-[1.3fr_0.9fr_0.9fr_auto_auto] lg:gap-0">
                  <label className="flex flex-col rounded-2xl bg-white px-4 py-3 transition lg:border-r lg:border-[#ececec]">
                    <span className="text-xs font-bold uppercase leading-5 tracking-[0.18em] text-[#6a6a6a]">Location</span>
                    <input
                      type="text"
                      value={locationQuery}
                      onChange={(event) => setLocationQuery(event.target.value)}
                      placeholder="Where are you going?"
                      className="mt-1 border-none bg-transparent text-base font-medium text-[#222222] outline-none placeholder:text-[#9a9a9a]"
                    />
                  </label>

                  <label className="flex flex-col rounded-2xl bg-white px-4 py-3 transition lg:border-r lg:border-[#ececec]">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#6a6a6a]">Check in</span>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(event) => setCheckIn(event.target.value)}
                      className="mt-1 border-none bg-transparent text-base font-medium text-[#222222] outline-none"
                    />
                  </label>

                  <label className="flex flex-col rounded-2xl bg-white px-4 py-3 transition">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#6a6a6a]">Check out</span>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(event) => setCheckOut(event.target.value)}
                      className="mt-1 border-none bg-transparent text-base font-medium text-[#222222] outline-none"
                    />
                  </label>

                  <button
                    type="submit"
                    className="rounded-2xl bg-[#FF385C] px-6 py-3 text-base font-bold text-white transition duration-200 hover:bg-[#e62e53] hover:shadow-lg"
                  >
                    Search
                  </button>

                  {hasAppliedFilters ? (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="rounded-2xl border border-[#e4e4e4] bg-white px-6 py-3 text-base font-bold text-[#444444] transition duration-200 hover:border-[#FF385C] hover:text-[#FF385C]"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </form>
            </div>
            {searchError ? (
              <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {searchError}
              </p>
            ) : null}
          </div>
        </section>

        <div className="mx-auto w-full max-w-[1440px] px-6 pb-16 pt-8 lg:px-10">
          {user?.role === 'guest' ? (
            <section>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#ff385c]">Recommended for you</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#222222] lg:text-3xl">
                    Personalized picks for your next stay
                  </h2>
                </div>
              </div>

              {recommendedProperties.length > 0 ? (
                <div className="mt-6 flex gap-5 overflow-x-auto pb-3 pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {recommendedProperties.map((property) => (
                    <div key={`recommended-${property.id}`} className="min-w-[240px] max-w-[240px] flex-none sm:min-w-[252px] sm:max-w-[252px]">
                      <PropertyCard property={property} hoverScale={false} />
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          <section ref={browseSectionRef} className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#ff385c]">Browse</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#222222] lg:text-3xl">
                  Explore all stays
                </h2>
              </div>
              <p className="text-sm text-[#6a6a6a]">Filter by vibe and discover places that fit your trip.</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 ${selectedCategory === category
                    ? 'border-[#FF385C] bg-[#FF385C] text-white shadow-sm'
                    : 'border-[#e4e4e4] bg-white text-[#444444] hover:border-[#FF385C] hover:text-[#FF385C]'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {isLoading ? <p className="mt-8 text-[#6a6a6a]">Loading properties...</p> : null}
            {error ? (
              <p className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            {!isLoading && !error && filteredProperties.length === 0 ? (
              <p className="mt-8 rounded-3xl border border-[#ececec] bg-white px-4 py-10 text-center text-[#6a6a6a] shadow-sm">
                No properties matched your filters.
              </p>
            ) : null}

            {!isLoading && filteredProperties.length > 0 ? (
              <section className="mt-8 flex flex-wrap items-start gap-4">
                {filteredProperties.map((property) => (
                  <div key={property.id} className="w-[292px] sm:w-[320px] lg:w-[348px]">
                    <PropertyCard property={property} hoverScale={false} />
                  </div>
                ))}
              </section>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  )
}

export default Home
