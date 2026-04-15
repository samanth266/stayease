import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import stayeaseMark from '../assets/stayease-mark.svg'

function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const isHomePage = location.pathname === '/'

  const displayName = useMemo(() => {
    if (!user?.name) return 'Guest'
    return user.name.split(' ')[0]
  }, [user])

  const initials = useMemo(() => {
    if (!user?.name) return 'G'
    const parts = user.name.trim().split(' ').filter(Boolean)
    return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('')
  }, [user])

  useEffect(() => {
    const onClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleLogout = () => {
    setIsMenuOpen(false)
    logout()
    navigate('/login')
  }

  const handlePrimaryAction = () => {
    setIsMenuOpen(false)
    navigate(user?.role === 'host' ? '/dashboard' : '/bookings')
  }

  return (
    <>
      <header id="main-navbar" className="fixed top-0 z-50 w-full border-b border-[#ececec] bg-white shadow-[0_4px_18px_rgba(34,34,34,0.06)] overflow-visible">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-6 px-6 py-3 lg:px-10 overflow-visible">
          <Link to="/" className="group inline-flex items-center gap-2 transition-transform duration-200 hover:scale-[1.02]">
            <img src={stayeaseMark} alt="StayEase logo" className="h-9 w-9" />
            <span className="text-2xl font-extrabold tracking-tight text-[#222222]">StayEase</span>
          </Link>

          {isHomePage ? (
            <div className="hidden flex-1 justify-center md:flex">
              <div className="flex w-full max-w-[540px] items-center rounded-full border border-[#dddddd] bg-white px-5 py-3 shadow-sm transition hover:shadow-md">
                <svg viewBox="0 0 24 24" className="mr-3 h-5 w-5 text-[#666666]" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  type="text"
                  placeholder="Where are you going?"
                  className="w-full border-none bg-transparent text-sm font-medium text-[#222222] outline-none placeholder:text-[#8a8a8a]"
                  aria-label="Search stays by location"
                />
              </div>
            </div>
          ) : (
            <div className="hidden flex-1 md:block" />
          )}

          <nav className="relative flex items-center gap-3 overflow-visible" ref={menuRef}>
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="hidden rounded-full px-3 py-2 text-sm font-semibold text-[#222222] transition hover:bg-[#f7f7f7] md:inline-block"
                >
                  Become a Host
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-[#d8d8d8] bg-white px-5 py-2 text-sm font-semibold text-[#222222] transition hover:border-[#c2c2c2] hover:shadow-sm"
                >
                  Login
                </Link>
              </>
            ) : (
              <>
                <span className="hidden text-sm font-medium text-[#555555] lg:inline">Hi {displayName}</span>

                <button
                  type="button"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-3 rounded-full border border-[#dddddd] bg-white px-2 py-1.5 shadow-sm transition hover:shadow-md"
                  aria-haspopup="menu"
                  aria-expanded={isMenuOpen}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF385C] text-sm font-bold text-white">
                    {initials}
                  </div>
                  <svg viewBox="0 0 24 24" className="mr-1 h-4 w-4 text-[#666666]" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-full z-[140] mt-2 w-56 rounded-2xl border border-[#ececec] bg-white py-2 shadow-[0_14px_32px_rgba(34,34,34,0.14)]">
                    <button
                      type="button"
                      onClick={handlePrimaryAction}
                      className="block w-full px-4 py-2.5 text-left text-sm font-medium text-[#333333] transition hover:bg-[#fff1f4]"
                    >
                      {user.role === 'host' ? 'Dashboard' : 'My Bookings'}
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full px-4 py-2.5 text-left text-sm font-medium text-[#333333] transition hover:bg-[#fff1f4]"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            )}
          </nav>
        </div>
      </header>
      <div aria-hidden="true" className="h-[54px] md:h-[62px]" />
    </>
  )
}

export default Navbar
