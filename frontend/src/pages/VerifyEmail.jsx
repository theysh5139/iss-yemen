"use client"

import { useEffect, useState } from "react"
import { useLocation, Link } from "react-router-dom"
import { verifyEmailApi } from "../api/auth.js"
import "../styles/auth-pages.css"

export default function VerifyEmail() {
  const location = useLocation()
  const [status, setStatus] = useState("loading")
  const [message, setMessage] = useState("Verifying…")

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get("token")
    const email = params.get("email")
    if (!token || !email) {
      setStatus("error")
      setMessage("Invalid verification link")
      return
    }
    verifyEmailApi({ token, email })
      .then((res) => {
        setStatus("success")
        setMessage(res.message || "Email verified successfully")
      })
      .catch((err) => {
        setStatus("error")
        setMessage(err.message || "Verification failed")
      })
  }, [location.search])

  return (
    <div className="auth-container animate-fadeInUp">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Email Verification</h1>
          <p>{status === "success" ? "✓ Verified" : status === "error" ? "✗ Error" : "Verifying…"}</p>
        </div>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <p
            style={{
              marginTop: 12,
              color: status === "error" ? "#c53030" : status === "success" ? "#22543d" : "#7f8c8d",
              fontSize: "16px",
              lineHeight: "1.6",
            }}
          >
            {message}
          </p>
        </div>

        <div className="auth-links">
          <Link to="/signup" className="link-text">
            Back to Signup
          </Link>
          <span className="separator">•</span>
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
