import { Route, Routes } from "react-router-dom"
import Signup from "./pages/Signup.jsx"
import VerifyEmail from "./pages/VerifyEmail.jsx"
import Login from "./pages/Login.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import ProtectedRoute from "./routes/ProtectedRoute.jsx"
import { AuthProvider } from "./context/AuthProvider.jsx"
import ForgotPassword from "./pages/ForgotPassword.jsx"
import ResetPassword from "./pages/ResetPassword.jsx"
import Navbar from "./components/Navbar.jsx"
import AboutUs from "./pages/AboutUs.jsx"
import Members from "./pages/Members.jsx"
import PastEvents from "./pages/PastEvents.jsx"
import "./App.css"

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<AboutUs />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/members" element={<Members />} />
        <Route path="/events" element={<PastEvents />} />
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
        <Route path="*" element={<Signup />} />
      </Routes>
    </AuthProvider>
  )
}
