"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthProvider.jsx"
import { logoutApi } from "../api/auth.js"
import { getUpcomingEvents } from "../api/events.js"
import { useNavigate } from "react-router-dom"
import "../styles/dashboard.css"

export default function Profile() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate("/admin/dashboard", { replace: true })
    }
  }, [user, navigate])

  const [registeredEvents, setRegisteredEvents] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && (user.role === 'member' || user.role === 'admin')) {
      fetchEvents()
    } else {
      setLoading(false)
    }
  }, [user])

  async function fetchEvents() {
    try {
      const res = await getUpcomingEvents()
      if (res.events) {
        setUpcomingEvents(res.events)
        // Filter registered events
        const registered = res.events.filter(event => 
          event.registeredUsers?.some(regUser => 
            typeof regUser === 'object' ? regUser._id === user?.id : regUser === user?.id
          )
        )
        setRegisteredEvents(registered)
      }
    } catch (err) {
      console.error("Failed to fetch events:", err)
    } finally {
      setLoading(false)
    }
  }

  async function onLogout() {
    try {
      await logoutApi()
    } catch {}
    setUser(null)
    navigate("/", { replace: true })
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  const isMember = user?.role === 'member' || user?.role === 'admin'

  return (
    <div className="dashboard-container">
      <div className="dashboard-card card-3d">
        <div className="dashboard-content">
          {/* User Info Card */}
          <div className="user-info-card card-3d">
            <h3>Your Profile</h3>
            {user?.email && (
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{user.email}</span>
              </div>
            )}
            {user?.name && (
              <div className="info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">{user.name}</span>
              </div>
            )}
            {user?.role && (
              <div className="info-row">
                <span className="info-label">Role:</span>
                <span className="info-value">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
              </div>
            )}
          </div>

          {/* Registered Events Section (Members Only) */}
          {isMember && (
            <div className="registered-events-card card-3d">
              <div className="card-header">
                <h3>Your Registered Events</h3>
                {registeredEvents.length > 0 && (
                  <span className="badge">{registeredEvents.length}</span>
                )}
              </div>
              {loading ? (
                <div className="loading-text">Loading events...</div>
              ) : registeredEvents.length > 0 ? (
                <div className="events-list">
                  {registeredEvents.map(event => (
                    <div key={event._id} className="event-item card-3d">
                      <div className="event-item-header">
                        <h4 className="event-item-title">{event.title}</h4>
                        <span className="event-status registered">✓ Registered</span>
                      </div>
                      <div className="event-item-details">
                        <p>📅 {formatDate(event.date)}</p>
                        <p>📍 {event.location}</p>
                      </div>
                      <p className="event-item-description">{event.description}</p>
                      <a href={`/all-events`} className="event-item-link">
                        View All Events →
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-events">
                  <p>You haven't registered for any events yet.</p>
                  <a href="/all-events" className="btn-link">Browse Events →</a>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="quick-actions">
            <a href="/" className="action-btn card-3d">
              <span className="action-icon">🏠</span>
              <span>Home</span>
            </a>
            <a href="/all-events" className="action-btn card-3d">
              <span className="action-icon">📅</span>
              <span>Events</span>
            </a>
            <a href="/members" className="action-btn card-3d">
              <span className="action-icon">👥</span>
              <span>Members</span>
            </a>
          </div>

          <button onClick={onLogout} className="logout-button btn-3d">
            Log Out
          </button>
        </div>
      </div>
    </div>
  )
}


