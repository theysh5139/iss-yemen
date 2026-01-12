"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthProvider.jsx"
import { logoutApi } from "../api/auth.js"
import "../styles/navbar.css"
import utmLogo from "../assets/utm-logo.png"

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    console.log('[Navbar] Logging out user...')
    
    // First, clear frontend state immediately to prevent any race conditions
    logout() // This clears localStorage and sets user to null
    
    // Clear sessionStorage (redirect URLs, etc.)
    sessionStorage.clear()
    
    // Clear any other localStorage items related to auth (double-check)
    localStorage.removeItem('authToken')
    localStorage.removeItem('cookie-based-auth')
    
    // Then call backend logout API to clear cookies
    // Do this after clearing frontend state to prevent re-authentication
    try {
      await logoutApi()
      console.log('[Navbar] Backend logout successful')
    } catch (err) {
      console.error('[Navbar] Logout API error:', err)
      // Continue with logout even if API call fails - frontend state is already cleared
    }
    
    // Close menu and redirect to homepage
    setMenuOpen(false)
    navigate("/", { replace: true })
    
    console.log('[Navbar] Logout complete - user should be logged out')
  }

  function toggleMenu() {
    setMenuOpen(!menuOpen)
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <nav className="navbar animate-slideInDown">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <img src={utmLogo || "/placeholder.svg"} alt="ISS Yemen Logo" className="navbar-logo" />
          <span className="navbar-title">ISS YEMEN</span>
        </Link>

        <button className="navbar-toggle" onClick={toggleMenu} aria-label="Toggle menu">
          {menuOpen ? "✕" : "☰"}
        </button>

        <div className={`navbar-menu ${menuOpen ? "active" : ""}`}>
          <Link to="/about" className="nav-link" onClick={closeMenu}>
            About
          </Link>
          <Link to="/members" className="nav-link" onClick={closeMenu}>
            Members
          </Link>
          {user && (user.role === 'member' || user.role === 'admin') ? (
            <Link to="/all-events" className="nav-link" onClick={closeMenu}>
              Events
            </Link>
          ) : (
            <Link to="/events" className="nav-link" onClick={closeMenu}>
              Events
            </Link>
          )}
          {!user ? (
            <>
              <Link to="/signup" className="nav-link" onClick={closeMenu}>
                Signup
              </Link>
              <Link to="/login" className="nav-link nav-link-login" onClick={closeMenu}>
                Login
              </Link>
            </>
          ) : (
            <>
              <Link to="/profile" className="nav-link" onClick={closeMenu}>
                Profile
              </Link>
              {user && user.role === 'admin' && (
                <Link to="/admin/dashboard" className="nav-link" onClick={closeMenu}>
                  Dashboard
                </Link>
              )}
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
