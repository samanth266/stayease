import { Link } from 'react-router-dom'

function PropertyCard({ property, actions, hoverScale = true }) {
  const fallbackImage = 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=1200&auto=format&fit=crop'
  const rating = property.rating || 4.8
  const reviewCount = property.review_count || 32

  return (
    <article
      className={`group rounded-2xl bg-white transition duration-300 ${
        hoverScale ? 'hover:scale-[1.03] hover:shadow-[0_18px_40px_rgba(34,34,34,0.14)]' : 'hover:shadow-[0_14px_30px_rgba(34,34,34,0.1)]'
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl shadow-sm">
        <img
          src={property.photo_url || fallbackImage}
          alt={property.title}
          className={`aspect-square w-full object-cover transition duration-500 ${hoverScale ? 'group-hover:scale-105' : ''}`}
        />
        <button
          type="button"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg text-[#222222] shadow-sm backdrop-blur transition hover:scale-105"
          aria-label={`Save ${property.title}`}
        >
          ♥
        </button>
        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#222222] shadow-sm backdrop-blur">
          Superhost favorite
        </div>
      </div>

      <div className="space-y-2 px-1 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#222222]">{property.location}</p>
            <h3 className="mt-1 line-clamp-1 text-sm text-[#6a6a6a]">{property.title}</h3>
          </div>

          <div className="flex items-center gap-1 rounded-full bg-[#fff1f4] px-3 py-1 text-sm font-semibold text-[#ff385c]">
            <span aria-hidden="true">★</span>
            <span>{rating}</span>
          </div>
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-[#5e5e5e]">
          {property.description || 'Comfortable stay in a great location.'}
        </p>

        <div className="flex items-end justify-between gap-3 pt-1">
          <div>
            <p className="text-sm text-[#6a6a6a]">{reviewCount} reviews</p>
            <p className="mt-1 text-base font-bold text-[#222222]">
              ${property.price_per_night} <span className="font-normal text-[#6a6a6a]">per night</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {actions}
            <Link
              to={`/properties/${property.id}`}
              className="rounded-full bg-[#FF385C] px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-[#e62e53]"
            >
              View
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

export default PropertyCard
