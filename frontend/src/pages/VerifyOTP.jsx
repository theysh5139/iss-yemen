"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { verifyOtpApi, resendOtpApi } from "../api/auth.js"
import { useAuth } from "../context/AuthProvider.jsx"
import "../styles/auth-pages.css"

export default function VerifyOTP() {
  const location = useLocation()
  const navigate = useNavigate()
  const { setUser } = useAuth()
  
  const email = location.state?.email || ""
  
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [timeRemaining, setTimeRemaining] = useState(60) // 60 seconds countdown
  const [lockoutSeconds, setLockoutSeconds] = useState(null)
  const [resendCooldown, setResendCooldown] = useState(0) // 30 seconds cooldown for resend
  const intervalRef = useRef(null)
  const lockoutIntervalRef = useRef(null)
  const resendCooldownRef = useRef(null)

  // Redirect to login if no email
  useEffect(() => {
    if (!email) {
      navigate("/login", { replace: true })
    }
  }, [email, navigate])

  // Countdown timer for OTP expiration (U13 - OTP Expiration)
  useEffect(() => {
    if (timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            setError("OTP has expired. Please log in again to receive a new OTP.")
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timeRemaining])

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds !== null && lockoutSeconds > 0) {
      lockoutIntervalRef.current = setInterval(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(lockoutIntervalRef.current)
            setLockoutSeconds(null)
            setError("")
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (lockoutIntervalRef.current) {
        clearInterval(lockoutIntervalRef.current)
      }
    }
  }, [lockoutSeconds])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      resendCooldownRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(resendCooldownRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (resendCooldownRef.current) {
        clearInterval(resendCooldownRef.current)
      }
    }
  }, [resendCooldown])

  function handleOtpChange(e) {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6) // Only digits, max 6
    setOtp(value)
    setError("") // Clear error when user types
  }

  function validate() {
    if (!email) return "Email is required"
    if (otp.length !== 6) return "OTP must be 6 digits"
    return ""
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError("")
    
    const v = validate()
    if (v) return setError(v)

    if (lockoutSeconds > 0) {
      return setError(`Please wait ${lockoutSeconds} more seconds before trying again.`)
    }

    if (timeRemaining <= 0) {
      return setError("OTP has expired. Please log in again to receive a new OTP.")
    }

    setLoading(true)
    try {
      const res = await verifyOtpApi({ email, otp })
      // Store token if provided, or set a flag to indicate user is logged in
      if (res.token) {
        localStorage.setItem("authToken", res.token)
      } else if (res.user) {
        // Backend sets cookie, but no token in response - store a flag
        // This ensures AuthProvider knows user is logged in
        localStorage.setItem("authToken", "cookie-based-auth")
      }
      setUser(res.user)
      
      // Check if user was redirected from a specific page (e.g., events page)
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin')
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin')
        // Redirect back to the page they came from (e.g., events page)
        navigate(redirectUrl, { replace: true })
        return
      }
      
      navigate("/", { replace: true })
    } catch (err) {
      const errorMessage = err.message || "OTP verification failed"
      setError(errorMessage)

      // Extract lockout seconds if provided
      if (err.lockoutSeconds) {
        setLockoutSeconds(err.lockoutSeconds)
        setTimeRemaining(0) // Stop OTP timer if locked out
      }

      // Clear OTP input on error for security (U14 - Invalid OTP Error)
      setOtp("")
    } finally {
      setLoading(false)
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) {
      return
    }

    setResending(true)
    setError("")
    setSuccess("")
    
    try {
      const res = await resendOtpApi({ email })
      setSuccess(res.message || "A new OTP has been sent to your email.")
      setResendCooldown(30) // 30 second cooldown
      setTimeRemaining(60) // Reset OTP expiration timer
      setOtp("") // Clear current OTP input
      setError("") // Clear any errors
    } catch (err) {
      const errorMessage = err.message || "Failed to resend OTP"
      setError(errorMessage)

      // Handle cooldown from backend
      if (err.cooldownSeconds) {
        setResendCooldown(err.cooldownSeconds)
      }

      // Handle lockout
      if (err.lockoutSeconds) {
        setLockoutSeconds(err.lockoutSeconds)
        setTimeRemaining(0)
      }
    } finally {
      setResending(false)
    }
  }

  function handleBackToLogin() {
    navigate("/login", { replace: true })
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="auth-container animate-fadeInUp">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Verify Your Account</h1>
          <p>Enter the 6-digit code sent to {email}</p>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="otp">Verification Code</label>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={handleOtpChange}
              placeholder="000000"
              maxLength={6}
              required
              className="form-input"
              style={{
                textAlign: "center",
                fontSize: "24px",
                letterSpacing: "8px",
                fontFamily: "monospace",
                fontWeight: "bold"
              }}
              disabled={loading || lockoutSeconds > 0 || timeRemaining <= 0}
              autoFocus
            />
            {timeRemaining > 0 && !lockoutSeconds && (
              <p style={{ 
                textAlign: "center", 
                marginTop: "8px", 
                fontSize: "14px", 
                color: "#666" 
              }}>
                Code expires in: <strong>{formatTime(timeRemaining)}</strong>
              </p>
            )}
            {lockoutSeconds > 0 && (
              <p style={{ 
                textAlign: "center", 
                marginTop: "8px", 
                fontSize: "14px", 
                color: "#c53030" 
              }}>
                Account locked. Try again in: <strong>{formatTime(lockoutSeconds)}</strong>
              </p>
            )}
            {timeRemaining <= 0 && !lockoutSeconds && (
              <p style={{ 
                textAlign: "center", 
                marginTop: "8px", 
                fontSize: "14px", 
                color: "#c53030" 
              }}>
                OTP expired
              </p>
            )}
          </div>

          {error && (
            <div className="error-message animate-pulse" style={{ 
              backgroundColor: lockoutSeconds > 0 ? "#fed7d7" : "#fee",
              borderColor: lockoutSeconds > 0 ? "#fc8181" : "#feb2b2"
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: "12px",
              backgroundColor: "#d4edda",
              border: "1px solid #c3e6cb",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
              textAlign: "center",
              color: "#155724"
            }}>
              {success}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || lockoutSeconds > 0 || timeRemaining <= 0 || otp.length !== 6} 
            className="submit-button"
          >
            {loading ? "Verifying..." : lockoutSeconds > 0 ? `Locked (${formatTime(lockoutSeconds)})` : timeRemaining <= 0 ? "Expired" : "Verify Code"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "16px", marginBottom: "16px" }}>
          <button
            onClick={handleResendOtp}
            disabled={resending || resendCooldown > 0 || lockoutSeconds > 0}
            style={{
              background: "none",
              border: "none",
              color: resendCooldown > 0 || lockoutSeconds > 0 ? "#999" : "#2563eb",
              cursor: resendCooldown > 0 || lockoutSeconds > 0 ? "not-allowed" : "pointer",
              fontSize: "14px",
              textDecoration: resendCooldown > 0 || lockoutSeconds > 0 ? "none" : "underline",
              padding: "8px 16px",
              borderRadius: "4px",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              if (!resendCooldown && !lockoutSeconds) {
                e.target.style.backgroundColor = "#f0f0f0"
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent"
            }}
          >
            {resending 
              ? "Sending..." 
              : resendCooldown > 0 
                ? `Resend code in ${resendCooldown}s` 
                : "Resend code"
            }
          </button>
        </div>

        <div className="auth-links">
          <button
            onClick={handleBackToLogin}
            className="link-text"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Back to Login
          </button>
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

