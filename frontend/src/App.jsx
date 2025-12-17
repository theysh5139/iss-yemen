import { Route, Routes, useLocation } from "react-router-dom"
import Signup from "./pages/Signup.jsx"
import VerifyEmail from "./pages/VerifyEmail.jsx"
import Login from "./pages/Login.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import Profile from "./pages/Profile.jsx"
import AdminDashboard from "./pages/AdminDashboard.jsx"
import AdminManageEvents from "./pages/AdminManageEvents.jsx"
import AdminManageUsers from "./pages/AdminManageUsers.jsx"
import AdminManageHODs from "./pages/AdminManageHODs.jsx"
import AdminAboutUs from "./pages/AdminAboutUs.jsx"
import AdminNews from "./pages/AdminNews.jsx"
import AdminSettings from "./pages/AdminSettings.jsx"
import ProtectedRoute from "./routes/ProtectedRoute.jsx"
import AdminRoute from "./routes/AdminRoute.jsx"
import { AuthProvider } from "./context/AuthProvider.jsx"
import ForgotPassword from "./pages/ForgotPassword.jsx"
import ResetPassword from "./pages/ResetPassword.jsx"
import Navbar from "./components/Navbar.jsx"
import AboutUs from "./pages/AboutUs.jsx"
import HomePage from "./pages/HomePage.jsx"
import Members from "./pages/Members.jsx"
import PastEvents from "./pages/PastEvents.jsx"
import AllEvents from "./pages/AllEvents.jsx"
import "./App.css"

function AppContent() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/members" element={<Members />} />
        <Route path="/events" element={<PastEvents />} />
        <Route path="/all-events" element={<AllEvents />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <AdminRoute>
              <AdminManageEvents />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminManageUsers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/news"
          element={
            <AdminRoute>
              <AdminNews />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/hods"
          element={
            <AdminRoute>
              <AdminManageHODs />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/aboutus"
          element={
            <AdminRoute>
              <AdminAboutUs />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <AdminSettings />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Signup />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
