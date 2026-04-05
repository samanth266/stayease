import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import PropertyCard from '../components/PropertyCard'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Home() {
  const { user } = useAuth()
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')

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

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const locationText = `${property.location || ''} ${property.title || ''} ${property.description || ''}`.toLowerCase()
      const categoryMatch =
        selectedCategory === 'All' || locationText.includes(selectedCategory.toLowerCase())
      const queryMatch = !locationQuery || locationText.includes(locationQuery.toLowerCase())
      return categoryMatch && queryMatch
    })
  }, [properties, locationQuery, selectedCategory])

  const recommendedProperties = useMemo(() => {
    return filteredProperties.slice(0, 8)
  }, [filteredProperties])

  return (
    <div className="min-h-screen bg-[#faf7f5]">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-[#FF385C] via-[#ff4d6d] to-[#E61E4D]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.14))]" />
          <div className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-6 pb-14 pt-10 lg:px-10 lg:pb-20 lg:pt-16">
            <div className="max-w-4xl">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/85">StayEase</p>
              <h1 className="mt-4 text-5xl font-extrabold tracking-[-0.05em] text-white lg:text-7xl">
                Find your perfect stay
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-white/90 lg:text-xl">
                Discover amazing places to stay
              </p>
            </div>

            <div className="w-full max-w-5xl rounded-[32px] bg-white p-4 shadow-[0_24px_60px_rgba(34,34,34,0.18)] lg:p-5">
              <div className="grid gap-3 lg:grid-cols-[1.3fr_0.9fr_0.9fr_auto] lg:gap-0">
                <label className="flex flex-col rounded-2xl px-4 py-3 transition hover:bg-[#fafafa] lg:border-r lg:border-[#ececec]">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#6a6a6a]">Location</span>
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={(event) => setLocationQuery(event.target.value)}
                    placeholder="Where are you going?"
                    className="mt-1 border-none bg-transparent text-base font-medium text-[#222222] outline-none placeholder:text-[#9a9a9a]"
                  />
                </label>

                <label className="flex flex-col rounded-2xl px-4 py-3 transition hover:bg-[#fafafa] lg:border-r lg:border-[#ececec]">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#6a6a6a]">Check in</span>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(event) => setCheckIn(event.target.value)}
                    className="mt-1 border-none bg-transparent text-base font-medium text-[#222222] outline-none"
                  />
                </label>

                <label className="flex flex-col rounded-2xl px-4 py-3 transition hover:bg-[#fafafa]">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#6a6a6a]">Check out</span>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(event) => setCheckOut(event.target.value)}
                    className="mt-1 border-none bg-transparent text-base font-medium text-[#222222] outline-none"
                  />
                </label>

                <button
                  type="button"
                  className="rounded-2xl bg-[#FF385C] px-7 py-4 text-base font-bold text-white transition duration-200 hover:bg-[#e62e53] hover:shadow-lg"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-[1440px] px-6 pb-16 pt-10 lg:px-10">
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
                    <div key={`recommended-${property.id}`} className="min-w-[280px] max-w-[280px] flex-none">
                      <PropertyCard property={property} hoverScale={false} />
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="mt-12">
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
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 ${
                    selectedCategory === category
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
              <section className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
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
