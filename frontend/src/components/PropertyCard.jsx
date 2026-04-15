import { Link } from 'react-router-dom'

function PropertyCard({ property, actions, hoverScale = true }) {
  const fallbackImage = 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=1200&auto=format&fit=crop'
  const rating = property.rating || 4.8
  const reviewCount = property.review_count || 32

  return (
    <Link
      to={`/properties/${property.id}`}
      className={`group block rounded-2xl border border-[#e8e8e8] bg-white transition duration-300 ${hoverScale
        ? 'hover:shadow-[0_18px_40px_rgba(34,34,34,0.14)]'
        : 'hover:shadow-[0_14px_30px_rgba(34,34,34,0.1)]'
        }`}
    >
      {/* ✅ FIXED: Limited height with aspect ratio */}
      <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl shadow-sm">
        <img
          src={property.photo_url || fallbackImage}
          alt={property.title}
          className={`h-full w-full object-cover transition-transform duration-300 ${hoverScale ? 'group-hover:scale-105' : ''
            }`}
        />

        <button
          type="button"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-base text-[#222222] shadow-sm backdrop-blur transition hover:scale-110"
          aria-label={`Save ${property.title}`}
          onClick={(e) => {
            e.preventDefault()
            // Add favorite logic here
          }}
        >
          ♥
        </button>

        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#222222] shadow-sm backdrop-blur">
          Superhost
        </div>
      </div>

      {/* ✅ FIXED: Compact content section */}
      <div className="border-t border-[#f1f1f1] px-3 pt-3 pb-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-tight text-[#222222]">
              {property.location}
            </p>
            <p className="mt-0.5 truncate text-sm text-[#6a6a6a]">
              {property.title}
            </p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-sm text-[#FF385C]">★</span>
            <span className="text-sm font-semibold text-[#222222]">
              {property.rating ?? 4.5}
            </span>
          </div>
        </div>

        <p className="text-xs text-[#8a8a8a]">
          {property.review_count ?? 0} reviews
        </p>

        <p className="pt-0.5 text-base font-bold text-[#222222]">
          <span className="text-[#FF385C]">
            ${property.price_per_night}
          </span>
          <span className="text-sm font-normal text-[#6a6a6a]">
            {' '}/ night
          </span>
        </p>
      </div>
    </Link>
  )
}

export default PropertyCard