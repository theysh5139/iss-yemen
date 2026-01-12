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
  const [showPassword, setShowPassword] = useState(false)
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
      } else {
        // If no token in response but user is returned, backend set cookie
        // Store flag to indicate cookie-based authentication
        localStorage.setItem("authToken", "cookie-based-auth")
      }

      // Set auth context
      setUser(res.user)

      // Check if user was redirected from a specific page (e.g., events page)
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin')
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin')
        // Redirect back to the page they came from (e.g., events page)
        navigate(redirectUrl, { replace: true })
        return
      }

      // Redirect based on role
      if (res.user.role === "admin") {
        navigate("/admin/dashboard", { replace: true })
      } else {
        // Member accounts go to homepage
        navigate("/", { replace: true })
      }
      return
    }

    // Regular members → OTP flow
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
            <div className="password-input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={onChange}
                placeholder="••••••••"
                required
                className="form-input password-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
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
