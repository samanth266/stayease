import { Link } from 'react-router-dom'

function PropertyCard({ property, actions }) {
  const fallbackImage = 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=1200&auto=format&fit=crop'

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <img
        src={property.photo_url || fallbackImage}
        alt={property.title}
        className="h-48 w-full object-cover"
      />
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="line-clamp-1 text-lg font-semibold text-slate-900">{property.title}</h3>
          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
            ${property.price_per_night}/night
          </span>
        </div>

        <p className="line-clamp-2 text-sm text-slate-600">{property.description || 'Comfortable stay in a great location.'}</p>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{property.location}</p>
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            <Link
              to={`/properties/${property.id}`}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

export default PropertyCard
