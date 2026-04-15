import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext()

const normalizeUser = (rawUser) => {
  if (!rawUser || typeof rawUser !== 'object') {
    return null
  }

  // Login/register responses use user_id while /auth/me uses id.
  const normalizedId = rawUser.id ?? rawUser.user_id ?? null
  if (!normalizedId) {
    return rawUser
  }

  return {
    ...rawUser,
    id: normalizedId,
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('stayease_token')
    const storedUser = localStorage.getItem('stayease_user')

    if (storedToken) {
      setToken(storedToken)
      if (storedUser) {
        const normalizedStoredUser = normalizeUser(JSON.parse(storedUser))
        setUser(normalizedStoredUser)
        localStorage.setItem('stayease_user', JSON.stringify(normalizedStoredUser))
      }

      api
        .get('/api/auth/me')
        .then((response) => {
          const normalizedUser = normalizeUser(response.data)
          setUser(normalizedUser)
          localStorage.setItem('stayease_user', JSON.stringify(normalizedUser))
        })
        .catch(() => {
          localStorage.removeItem('stayease_token')
          localStorage.removeItem('stayease_user')
          setToken(null)
          setUser(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    setIsLoading(true)
    try {
      const response = await api.post('/api/auth/login', { email, password })
      const { token: newToken, ...userData } = response.data
      const normalizedUser = normalizeUser(userData)

      localStorage.setItem('stayease_token', newToken)
      localStorage.setItem('stayease_user', JSON.stringify(normalizedUser))

      setToken(newToken)
      setUser(normalizedUser)
      return normalizedUser
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name, email, password, role) => {
    setIsLoading(true)
    try {
      const response = await api.post('/api/auth/register', {
        name,
        email,
        password,
        role,
      })
      const { token: newToken, ...userData } = response.data
      const normalizedUser = normalizeUser(userData)

      localStorage.setItem('stayease_token', newToken)
      localStorage.setItem('stayease_user', JSON.stringify(normalizedUser))

      setToken(newToken)
      setUser(normalizedUser)
      return normalizedUser
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('stayease_token')
    localStorage.removeItem('stayease_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
