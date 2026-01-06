"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { loginApi } from "../api/auth.js"
import { useAuth } from "../context/AuthProvider.jsx"
import "../styles/auth-pages.css"

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { setUser } = useAuth()

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function validate() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Invalid email format"
    if (form.password.length < 8) return "Password must be at least 8 characters"
    return ""
  }

  async function onSubmit(e) {
  e.preventDefault()
  setError("")

  const v = validate()
  if (v) return setError(v)

  setLoading(true)

  try {
    const res = await loginApi(form)

    /**
     * Admin and Test Member account skip OTP/TAC verification
     * Backend returns user object only for admin and the test member account (member@issyemen.com)
     * Other member accounts require OTP and backend returns { message, email } instead
     */
    if (res.user) {
      // Store token if provided (for admin, token might be in cookie)
      if (res.token) {
        localStorage.setItem("authToken", res.token)
      }

      // Set auth context
      setUser(res.user)

      // Redirect based on role
      if (res.user.role === "admin") {
        navigate("/admin/dashboard", { replace: true })
      } else {
        // Test member account goes to dashboard
        navigate("/dashboard", { replace: true })
      }
      return
    }

    // Normal users (visitors) → OTP flow
    navigate("/verify-otp", {
      replace: true,
      state: { email: form.email }
    })

  } catch (err) {
    setError(err.message || "Login failed")
  } finally {
    setLoading(false)
  }
}


  return (
    <div className="auth-container animate-fadeInUp">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="you@example.com"
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
          </div>

          {error && <div className="error-message animate-pulse">{error}</div>}

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password" className="link-text">
            Forgot password?
          </Link>
          <span className="separator">•</span>
          <Link to="/signup" className="link-text">
            Create account
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
