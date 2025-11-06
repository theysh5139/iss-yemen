"use client"

import { useAuth } from "../context/AuthProvider.jsx"
import { logoutApi } from "../api/auth.js"
import { useNavigate } from "react-router-dom"
import "../styles/dashboard.css"

export default function Dashboard() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  async function onLogout() {
    try {
      await logoutApi()
    } catch {}
    setUser(null)
    navigate("/login", { replace: true })
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-card animate-fadeInUp">
        <div className="dashboard-header">
          <h1>Welcome{user?.name ? `, ${user.name}` : " to UTM"}!</h1>
          <p>You are successfully logged in to the UTM Students Union platform</p>
        </div>

        <div className="dashboard-content">
          <div className="user-info-card">
            <h3>Your Profile</h3>
            {user?.email && (
              <p>
                <strong>Email:</strong> {user.email}
              </p>
            )}
            {user?.name && (
              <p>
                <strong>Name:</strong> {user.name}
              </p>
            )}
          </div>

          <button onClick={onLogout} className="logout-button">
            Log Out
          </button>
        </div>
      </div>
    </div>
  )
}
