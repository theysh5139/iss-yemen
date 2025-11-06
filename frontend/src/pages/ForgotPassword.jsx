"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { requestPasswordResetApi } from "../api/auth.js"
import "../styles/auth-pages.css"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function onSubmit(e) {
    e.preventDefault()
    setError("")
    setMessage("")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email format")
      return
    }
    setLoading(true)
    try {
      const res = await requestPasswordResetApi({ email })
      setMessage(res.message || "If the email exists, reset instructions have been sent")
      setEmail("")
    } catch (err) {
      setError(err.message || "Request failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container animate-fadeInUp">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Enter your email to receive reset instructions</p>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="form-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? "Sending…" : "Send Reset Link"}
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
