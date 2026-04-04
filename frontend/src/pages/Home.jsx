import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import PropertyCard from '../components/PropertyCard'
import api from '../services/api'

function Home() {
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-10 rounded-2xl bg-gradient-to-r from-sky-700 to-cyan-600 px-6 py-10 text-white shadow-xl sm:px-10">
          <h1 className="text-3xl font-semibold sm:text-4xl">Find your next great stay</h1>
          <p className="mt-3 max-w-2xl text-sky-100">
            Browse homes, villas, and cozy city apartments curated by trusted hosts on StayEase.
          </p>
        </section>

        {isLoading ? <p className="text-slate-600">Loading properties...</p> : null}
        {error ? (
          <p className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : null}

        {!isLoading && !error && properties.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-slate-600">
            No properties available yet.
          </p>
        ) : null}

        {!isLoading && properties.length > 0 ? (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </section>
        ) : null}
      </main>
    </div>
  )
}

export default Home
