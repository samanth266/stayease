import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Home from './pages/Home'
import HostDashboard from './pages/HostDashboard'
import Login from './pages/Login'
import MyBookings from './pages/MyBookings'
import PropertyDetail from './pages/PropertyDetail'
import Register from './pages/Register'
import './App.css'

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" />
  }

  return children
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute requiredRole="guest">
            <MyBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="host">
            <HostDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/properties/:id" element={<PropertyDetail />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
