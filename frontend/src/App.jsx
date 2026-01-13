import { Route, Routes, Outlet } from "react-router-dom"

// Context
import { AuthProvider } from "./context/AuthProvider.jsx"

// Route Guards
import ProtectedRoute from "./routes/ProtectedRoute.jsx"
import AdminRoute from "./routes/AdminRoute.jsx"

// Components
import Navbar from "./components/Navbar.jsx"
import Chatbot from "./components/Chatbot.jsx"

// Public Pages
import HomePage from "./pages/HomePage.jsx"
import AboutUs from "./pages/AboutUs.jsx"
import Members from "./pages/Members.jsx"
import PastEvents from "./pages/PastEvents.jsx"
import AllEvents from "./pages/AllEvents.jsx"
import AllActivities from "./pages/AllActivities.jsx"
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
import AdminManageActivities from "./pages/AdminManageActivities.jsx"
import AdminManageUsers from "./pages/AdminManageUsers.jsx"
import AdminManageCommittees from "./pages/AdminManageCommittees.jsx"
import AdminManageHODs from "./pages/AdminManageHODs.jsx"
import AdminAboutUs from "./pages/AdminAboutUs.jsx"
import AdminNews from "./pages/AdminNews.jsx"
import AdminSettings from "./pages/AdminSettings.jsx"
import AdminChatbot from "./pages/AdminChatbot.jsx"
import AdminVerifyPayments from "./pages/AdminVerifyPayments.jsx"
import AdminEventRegistrations from "./pages/AdminEventRegistrations.jsx"

import "./App.css"

// =======================
// Layout Components
// =======================

// 1️⃣ Auth Layout (No Navbar, No Chatbot)
const AuthLayout = () => <Outlet />

// 2️⃣ Main Layout (Navbar + Chatbot)
const MainLayout = () => (
  <>
    <Navbar />
    <Chatbot />
    <Outlet />
  </>
)

// 3️⃣ Admin Layout (No Chatbot)
const AdminLayout = () => (
  <>
    <Outlet />
  </>
)

// =======================
// App Component
// =======================
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* --- Auth Routes --- */}
        <Route element={<AuthLayout />}>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* --- Public & User Routes --- */}
        <Route element={<MainLayout />}>
          {/* Public Pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/members" element={<Members />} />
          <Route path="/events" element={<PastEvents />} />
          <Route path="/all-events" element={<AllEvents />} />
          <Route path="/activities" element={<AllActivities />} />

          {/* Protected User Pages */}
          <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

       {/* --- Admin Routes --- */}
<Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
  <Route path="dashboard" element={<AdminDashboard />} />
  <Route path="events" element={<AdminManageEvents />} />
  <Route path="activities" element={<AdminManageActivities />} />
  <Route path="registrations" element={<AdminEventRegistrations />} />
  <Route path="users" element={<AdminManageUsers />} />
  <Route path="news" element={<AdminNews />} />
  <Route path="hods" element={<AdminManageHODs />} />
  <Route path="committees" element={<AdminManageCommittees />} />
  <Route path="aboutus" element={<AdminAboutUs />} />
  <Route path="settings" element={<AdminSettings />} />
  <Route path="chatbot" element={<AdminChatbot />} />
  <Route path="verify-payments" element={<AdminVerifyPayments />} />
</Route>


        {/* Catch-all */}
        <Route path="*" element={<Signup />} />
      </Routes>
    </AuthProvider>
  )
}
