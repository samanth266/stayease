import { useState } from 'react'
import { Link } from 'react-router-dom'

function PropertyCard({ property, actions, hoverScale = true }) {
  const fallbackImage = 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=1200&auto=format&fit=crop'
  const rating = typeof property.average_rating === 'number' ? property.average_rating : null
  const reviewCount = Number.isFinite(property.review_count) ? property.review_count : 0
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  // Get all available photos
  const getPropertyPhotos = () => {
    const galleryPhotos = Array.isArray(property?.photos)
      ? property.photos
        .map((photo) => (typeof photo === 'string' ? photo : photo?.photo_url || photo?.url))
        .filter(Boolean)
      : []

    if (galleryPhotos.length > 0) {
      return galleryPhotos
    }

    return property?.photo_url ? [property.photo_url] : [fallbackImage]
  }

  const propertyPhotos = getPropertyPhotos()
  const currentPhoto = propertyPhotos[currentPhotoIndex] || fallbackImage

  const handlePrevPhoto = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (propertyPhotos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev === 0 ? propertyPhotos.length - 1 : prev - 1))
    }
  }

  const handleNextPhoto = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (propertyPhotos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev === propertyPhotos.length - 1 ? 0 : prev + 1))
    }
  }

  return (
    <Link
      to={`/properties/${property.id}`}
      className={`group flex h-full flex-col rounded-2xl border border-[#e8e8e8] bg-white transition duration-300 ${hoverScale
        ? 'hover:shadow-[0_18px_40px_rgba(34,34,34,0.14)]'
        : 'hover:shadow-[0_14px_30px_rgba(34,34,34,0.1)]'
        }`}
    >
      {/* ✅ FIXED: Limited height with aspect ratio */}
      <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl shadow-sm flex-shrink-0">
        <img
          src={currentPhoto}
          alt={property.title}
          className={`h-full w-full object-cover transition-transform duration-300 ${hoverScale ? 'group-hover:scale-105' : ''
            }`}
        />

        {/* Photo counter */}
        {propertyPhotos.length > 1 && (
          <div className="absolute bottom-3 left-3 rounded-full bg-[#222222]/70 px-2.5 py-1 text-xs font-semibold text-white">
            {currentPhotoIndex + 1}/{propertyPhotos.length}
          </div>
        )}

        {/* Left arrow */}
        {propertyPhotos.length > 1 && (
          <button
            type="button"
            onClick={handlePrevPhoto}
            className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg text-[#222222] shadow-sm transition hover:bg-white hover:scale-110 opacity-0 group-hover:opacity-100"
            aria-label="Previous photo"
          >
            ‹
          </button>
        )}

        {/* Right arrow */}
        {propertyPhotos.length > 1 && (
          <button
            type="button"
            onClick={handleNextPhoto}
            className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg text-[#222222] shadow-sm transition hover:bg-white hover:scale-110 opacity-0 group-hover:opacity-100"
            aria-label="Next photo"
          >
            ›
          </button>
        )}

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

      {/* ✅ FIXED: Compact content section with proper height constraint */}
      <div className="flex flex-1 flex-col border-t border-[#f1f1f1] px-3 pt-3 pb-3 space-y-1.5 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-tight text-[#222222]">
              {property.location}
            </p>
            <p className="mt-0.5 line-clamp-2 text-sm text-[#6a6a6a]">
              {property.title}
            </p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-sm text-[#FF385C]">★</span>
            <span className="text-sm font-semibold text-[#222222]">
              {rating !== null ? rating.toFixed(1) : 'New'}
            </span>
          </div>
        </div>

        <p className="text-xs text-[#8a8a8a] line-clamp-1">
          {reviewCount} reviews
        </p>

        <p className="mt-auto pt-0.5 text-base font-bold text-[#222222]">
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