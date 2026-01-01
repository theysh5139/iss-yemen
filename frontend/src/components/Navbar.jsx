"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthProvider.jsx"
import "../styles/navbar.css"
import utmLogo from "../assets/utm-logo.png"

export default function Navbar() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    setUser(null)
    navigate("/", { replace: true }) // Redirect to homepage as visitor
    setMenuOpen(false)
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
          <Link to="/events" className="nav-link" onClick={closeMenu}>
            Events
          </Link>
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
              {user.role === 'member' && (
                <Link to="/profile" className="nav-link" onClick={closeMenu}>
                  Profile
                </Link>
              )}
              {user.role === 'admin' && (
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
