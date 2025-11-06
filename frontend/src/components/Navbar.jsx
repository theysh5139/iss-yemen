"use client"

import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthProvider.jsx"
import "../styles/navbar.css"
import utmLogo from "../assets/utm-logo.png"

export default function Navbar() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    setUser(null)
    navigate("/login", { replace: true })
  }

  return (
    <nav className="navbar animate-slideInDown">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img src={utmLogo || "/placeholder.svg"} alt="UTM Students Union Logo" className="navbar-logo" />
          <span className="navbar-title">ISS YEMEN</span>
        </Link>

        <div className="navbar-menu">
          {!user ? (
            <>
              <Link to="/signup" className="nav-link">
                Signup
              </Link>
              <Link to="/login" className="nav-link nav-link-login">
                Login
              </Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="nav-logout-btn">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
