"use client"

import { useState } from "react"
import { signupApi } from "../api/auth.js"
import { Link } from "react-router-dom"
import "../styles/auth-pages.css"

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function validate() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Invalid email format"
    if (form.password.length < 8) return "Password must be at least 8 characters"
    if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password)) {
      return "Password must include upper, lower, and a digit"
    }
    if (form.password !== form.confirmPassword) return "Passwords must match"
    return ""
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError("")
    setSuccess("")
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setLoading(true)
    try {
      const res = await signupApi({ ...form })
      setSuccess(res.message || "Signup successful. Check your email to verify.")
      setForm({ name: "", email: "", password: "", confirmPassword: "" })
    } catch (err) {
      setError(err.message || "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container animate-fadeInUp">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Join Us</h1>
          <p>Create your member  account</p>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Amr Hazea (Optional)"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="your@email.com"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
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
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={onChange}
              placeholder="••••••••"
              required
              className="form-input"
            />
          </div>

          {error && <div className="error-message animate-pulse">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <div className="auth-links">
          <span style={{ color: "#7f8c8d" }}>Already have an account?</span>
          <Link to="/login" className="link-text">
            Sign In
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
