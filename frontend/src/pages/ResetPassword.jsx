"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { resetPasswordApi } from "../api/auth.js"
import "../styles/auth-pages.css"

export default function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [validating, setValidating] = useState(true)
  const [isValidLink, setIsValidLink] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const t = params.get("token")
    const e = params.get("email")
    
    setValidating(true)
    
    if (!t || !e) {
      setError("Invalid reset link. Please check your email for the correct reset link.")
      setIsValidLink(false)
      setValidating(false)
      return
    }
    
    setToken(t)
    setEmail(e)
    setIsValidLink(true)
    setError("")
    setValidating(false)
  }, [location.search])

  function validate() {
    if (!token || !email) return "Invalid reset link"
    if (newPassword.length < 8) return "Password must be at least 8 characters"
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return "Password must include upper, lower, and a digit"
    }
    if (newPassword !== confirmPassword) return "Passwords must match"
    return ""
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError("")
    setMessage("")
    const v = validate()
    if (v) return setError(v)
    setLoading(true)
    try {
      const res = await resetPasswordApi({ token, email, newPassword, confirmPassword })
      setMessage(res.message || "Password reset successful")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => navigate("/login", { replace: true }), 1200)
    } catch (err) {
      const errorMsg = err.message || "Reset failed"
      setError(errorMsg)
      
      // If token is invalid or expired, mark link as invalid
      if (errorMsg.toLowerCase().includes('invalid') || errorMsg.toLowerCase().includes('expired')) {
        setIsValidLink(false)
      }
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="auth-container animate-fadeInUp">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Validating Reset Link</h1>
            <p>Please wait...</p>
          </div>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner" style={{ margin: '0 auto', width: '40px', height: '40px', borderWidth: '3px' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (!isValidLink) {
    return (
      <div className="auth-container animate-fadeInUp">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Invalid Reset Link</h1>
            <p>The password reset link is invalid or expired</p>
          </div>
          
          {error && <div className="error-message" style={{ marginTop: '1rem' }}>{error}</div>}
          
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <Link to="/forgot-password" className="submit-button" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Request New Reset Link
            </Link>
          </div>

          <div className="auth-links" style={{ marginTop: '2rem' }}>
            <Link to="/login" className="link-text">
              Back to Sign In
            </Link>
            <span className="separator">•</span>
            <Link to="/signup" className="link-text">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container animate-fadeInUp">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create New Password</h1>
          <p>Enter your new password below</p>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="form-input"
            />
            <small style={{ color: "#7f8c8d", fontSize: "12px" }}>
              Min 8 characters with uppercase, lowercase, and number
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="form-input"
            />
          </div>

          {error && <div className="error-message animate-pulse">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login" className="link-text">
            Back to Sign In
          </Link>
          <span className="separator">•</span>
          <Link to="/signup" className="link-text">
            Create Account
          </Link>
        </div>
      </div>

      <div className="auth-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
      </div>
    </div>
  )
}
