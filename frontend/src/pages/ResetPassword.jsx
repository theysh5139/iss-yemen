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

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const t = params.get("token")
    const e = params.get("email")
    if (t) setToken(t)
    if (e) setEmail(e)
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
      setError(err.message || "Reset failed")
    } finally {
      setLoading(false)
    }
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
