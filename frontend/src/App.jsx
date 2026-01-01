import { Route, Routes, Outlet } from "react-router-dom"

// Context
import { AuthProvider } from "./context/AuthProvider.jsx"

// Route Guards
import ProtectedRoute from "./routes/ProtectedRoute.jsx"
import AdminRoute from "./routes/AdminRoute.jsx"

// Components
import Navbar from "./components/Navbar.jsx"

// Public Pages
import HomePage from "./pages/HomePage.jsx"
import AboutUs from "./pages/AboutUs.jsx"
import Members from "./pages/Members.jsx"
import PastEvents from "./pages/PastEvents.jsx"
import AllEvents from "./pages/AllEvents.jsx"
import Signup from "./pages/Signup.jsx"
import Login from "./pages/Login.jsx"
import VerifyEmail from "./pages/VerifyEmail.jsx"
import VerifyOTP from "./pages/VerifyOTP.jsx"
import ForgotPassword from "./pages/ForgotPassword.jsx"
import ResetPassword from "./pages/ResetPassword.jsx"

// User Pages
import Dashboard from "./pages/Dashboard.jsx"
import Profile from "./pages/Profile.jsx"

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard.jsx"
import AdminManageEvents from "./pages/AdminManageEvents.jsx"
import AdminManageUsers from "./pages/AdminManageUsers.jsx"
import AdminManageHODs from "./pages/AdminManageHODs.jsx"
import AdminAboutUs from "./pages/AdminAboutUs.jsx"
import AdminNews from "./pages/AdminNews.jsx"
import AdminSettings from "./pages/AdminSettings.jsx"
// 👇 IMPORTANT: Import the new pages here
import AdminChatbot from "./pages/AdminChatbot.jsx" 
import AdminVerifyPayments from "./pages/AdminVerifyPayments.jsx"

import "./App.css"

// Layout for pages that require the Navbar
const MainLayout = () => (
  <>
    <Navbar />
    <Outlet />
  </>
)

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* --- Public & User Routes (With Navbar) --- */}
        <Route element={<MainLayout />}>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/members" element={<Members />} />
          <Route path="/events" element={<PastEvents />} />
          <Route path="/all-events" element={<AllEvents />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* User Protected */}
          <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* --- Admin Routes (No Navbar, All Protected) --- */}
        {/* All paths here start with /admin */}
        <Route path="/admin" element={<AdminRoute><Outlet /></AdminRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="events" element={<AdminManageEvents />} />
          <Route path="users" element={<AdminManageUsers />} />
          <Route path="news" element={<AdminNews />} />
          <Route path="hods" element={<AdminManageHODs />} />
          <Route path="aboutus" element={<AdminAboutUs />} />
          <Route path="settings" element={<AdminSettings />} />
          
          {/* 👇 Your New Routes */}
          <Route path="chatbot" element={<AdminChatbot />} />
          <Route path="verify-payments" element={<AdminVerifyPayments />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Signup />} />
      </Routes>
    </AuthProvider>
  )
}