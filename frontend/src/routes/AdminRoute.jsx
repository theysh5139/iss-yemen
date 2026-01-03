import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider.jsx'

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'admin') {
    return <Navigate to="/profile" replace />
  }

  return children
}


