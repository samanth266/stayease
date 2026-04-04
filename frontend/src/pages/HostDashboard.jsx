import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PropertyCard from '../components/PropertyCard'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const initialFormState = {
  title: '',
  description: '',
  price_per_night: '',
  location: '',
}

function HostDashboard() {
  const { user } = useAuth()
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [createForm, setCreateForm] = useState(initialFormState)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [activeUploadId, setActiveUploadId] = useState('')
  const fileInputRefs = useRef({})

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await api.get('/api/properties')
        setProperties(response.data)
      } catch (err) {
        const message = err?.response?.data?.detail || 'Could not load dashboard data.'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperties()
  }, [])

  const hostProperties = useMemo(() => {
    if (!user) {
      return []
    }
    return properties.filter((property) => property.host_id === user.id)
  }, [properties, user])

  const handleCreateChange = (event) => {
    const { name, value } = event.target
    setCreateForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateProperty = async (event) => {
    event.preventDefault()
    setCreateError('')
    setCreateSuccess('')
    setIsCreating(true)

    try {
      const response = await api.post('/api/properties', {
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        price_per_night: Number(createForm.price_per_night),
        location: createForm.location.trim(),
      })

      setProperties((prev) => [response.data, ...prev])
      setCreateForm(initialFormState)
      setCreateSuccess('Property created successfully.')
    } catch (err) {
      const message = err?.response?.data?.detail || 'Could not create property.'
      setCreateError(message)
    } finally {
      setIsCreating(false)
    }
  }

  const triggerPhotoPicker = (propertyId) => {
    setUploadError('')
    setUploadSuccess('')
    setActiveUploadId(propertyId)
    fileInputRefs.current[propertyId]?.click()
  }

  const handlePhotoUpload = async (propertyId, event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only jpg, png, and webp images are allowed.')
      setActiveUploadId('')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Photo must be 5MB or smaller.')
      setActiveUploadId('')
      return
    }

    setUploadError('')
    setUploadSuccess('')
    setActiveUploadId(propertyId)

    const formData = new FormData()
    formData.append('photo', file)

    try {
      const response = await api.post(`/api/properties/${propertyId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setProperties((prev) =>
        prev.map((property) =>
          property.id === propertyId ? { ...property, photo_url: response.data.photo_url } : property
        )
      )
      setUploadSuccess('Photo uploaded successfully.')
    } catch (err) {
      const message = err?.response?.data?.detail || 'Could not upload photo.'
      setUploadError(message)
    } finally {
      setActiveUploadId('')
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Host Dashboard</h1>
            <p className="mt-2 text-slate-600">Manage your listings and monitor performance.</p>
          </div>
          <Link
            to="/"
            className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Browse all properties
          </Link>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">Create Property</h2>
            <p className="mt-1 text-sm text-slate-600">Add a new listing and it will appear below immediately.</p>
          </div>

          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleCreateProperty}>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                name="title"
                value={createForm.title}
                onChange={handleCreateChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                placeholder="Beachfront Villa"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="4"
                value={createForm.description}
                onChange={handleCreateChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                placeholder="Describe your property"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="price_per_night">
                Price per night
              </label>
              <input
                id="price_per_night"
                name="price_per_night"
                type="number"
                min="0"
                step="0.01"
                value={createForm.price_per_night}
                onChange={handleCreateChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                placeholder="150.00"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                name="location"
                value={createForm.location}
                onChange={handleCreateChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                placeholder="Miami Beach"
              />
            </div>

            <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isCreating}
                className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? 'Creating...' : 'Create Property'}
              </button>

              {createSuccess ? <p className="text-sm font-medium text-emerald-700">{createSuccess}</p> : null}
            </div>
          </form>

          {createError ? (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {createError}
            </p>
          ) : null}
        </section>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total listings</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{hostProperties.length}</p>
        </div>

        <section className="mt-8 space-y-4">
          {isLoading ? <p className="text-slate-600">Loading your listings...</p> : null}
          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
          ) : null}
          {uploadError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{uploadError}</p>
          ) : null}
          {uploadSuccess ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {uploadSuccess}
            </p>
          ) : null}

          {!isLoading && !error && hostProperties.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-slate-600">
              You do not have any listings yet. Create your first property above.
            </div>
          ) : null}

          {hostProperties.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {hostProperties.map((property) => (
                <div key={property.id} className="space-y-3">
                  <PropertyCard
                    property={property}
                    actions={
                      <>
                        <button
                          type="button"
                          onClick={() => triggerPhotoPicker(property.id)}
                          className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                        >
                          Upload Photo
                        </button>
                        <input
                          ref={(node) => {
                            fileInputRefs.current[property.id] = node
                          }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(event) => handlePhotoUpload(property.id, event)}
                        />
                      </>
                    }
                  />
                  {activeUploadId === property.id ? (
                    <p className="px-2 text-xs font-medium text-slate-500">Uploading photo...</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}

export default HostDashboard
