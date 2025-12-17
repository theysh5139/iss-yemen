"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { loginApi } from "../api/auth.js"
import { useAuth } from "../context/AuthProvider.jsx"
import "../styles/auth-pages.css"

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "", otp: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [requiresOtp, setRequiresOtp] = useState(false)
  const [otpExpiry, setOtpExpiry] = useState(null)
  const navigate = useNavigate()
  const { login } = useAuth();

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
    
    if (!requiresOtp) {
      const v = validate()
      if (v) return setError(v)
    } else {
      if (!form.otp || form.otp.length !== 6) {
        return setError("Please enter a valid 6-digit OTP")
      }
    }
    
    setLoading(true)
    try {
      const res = await loginApi(form)
      console.log("API Response:", res)
      
      if (res.requiresOtp) {
        setRequiresOtp(true)
        setOtpExpiry(Date.now() + 60000) // 60 seconds from now
        setError("")
      } else {
        localStorage.setItem('authToken', res.token);
        login(res.user, res.token);
        // Redirect admin users to admin dashboard
        if (res.user?.role === 'admin') {
          navigate("/admin/dashboard", { replace: true })
        } else {
          navigate("/dashboard", { replace: true })
        }
      }
    } catch (err) {
      let errorMessage = err.message || "Login failed"
      
      // Handle rate limiting error
      if (err.status === 429 || errorMessage.includes('Too many')) {
        errorMessage = "Too many login attempts. Please wait a few minutes before trying again."
      }
      
      setError(errorMessage)
      // If OTP error, keep the OTP form visible
      if (err.message && err.message.includes('OTP')) {
        setRequiresOtp(true)
      }
    } finally {
      setLoading(false)
    }
  }
  
  // OTP countdown timer
  useEffect(() => {
    if (!otpExpiry) return
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((otpExpiry - Date.now()) / 1000))
      if (remaining === 0) {
        setOtpExpiry(null)
        clearInterval(interval)
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [otpExpiry])

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
              style={{ textAlign: 'center' }}
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
              required={!requiresOtp}
              disabled={requiresOtp}
              className="form-input"
              style={{ textAlign: 'center', letterSpacing: '0.2em' }}
            />
          </div>

          {requiresOtp && (
            <div className="form-group">
              <label htmlFor="otp">Enter OTP Code</label>
              <input
                id="otp"
                name="otp"
                type="text"
                value={form.otp}
                onChange={onChange}
                placeholder="000000"
                maxLength={6}
                pattern="[0-9]{6}"
                required
                className="form-input otp-input"
                autoFocus
                style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.1rem', fontWeight: '600' }}
              />
              {otpExpiry && (
                <p className="otp-timer">
                  OTP expires in: {Math.max(0, Math.floor((otpExpiry - Date.now()) / 1000))} seconds
                </p>
              )}
              <p className="otp-hint">Check your email for the 6-digit code</p>
            </div>
          )}

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
