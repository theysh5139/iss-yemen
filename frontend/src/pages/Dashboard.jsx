"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthProvider.jsx"
import { logoutApi } from "../api/auth.js"
import { getEvents } from "../api/events.js"
import { useNavigate } from "react-router-dom"
import "../styles/dashboard.css"

export default function Dashboard() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate("/admin/dashboard", { replace: true })
    } else if (user?.role === 'member') {
      // Redirect members to profile page
      navigate("/profile", { replace: true })
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
      const res = await getEvents()
      if (res.events) {
        // Filter events where user is registered (including past events)
        const registered = res.events.filter(event => {
          if (!event.registeredUsers || !user?.id) return false
          return event.registeredUsers.some(regUser => {
            const regUserId = typeof regUser === 'object' ? regUser._id?.toString() : regUser?.toString()
            const currentUserId = user.id.toString()
            return regUserId === currentUserId
          })
        })
        setRegisteredEvents(registered)
        
        // Also get upcoming events for reference
        const now = new Date()
        const upcoming = res.events.filter(event => new Date(event.date) >= now)
        setUpcomingEvents(upcoming)
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
    navigate("/", { replace: true }) // Redirect to homepage
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }
  
  function isUpcomingEvent(event) {
    return new Date(event.date) >= new Date()
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
                  {registeredEvents.map(event => {
                    const upcoming = isUpcomingEvent(event)
                    const registration = event.registrations?.find(reg => 
                      (typeof reg.user === 'object' ? reg.user._id : reg.user) === user?.id
                    )
                    
                    return (
                      <div key={event._id} className="event-item card-3d">
                        <div className="event-item-header">
                          <h4 className="event-item-title">{event.title}</h4>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span className="event-status registered">✓ Registered</span>
                            {!upcoming && (
                              <span className="event-status" style={{
                                background: '#95a5a6',
                                color: 'white',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                              }}>Past</span>
                            )}
                          </div>
                        </div>
                        <div className="event-item-details">
                          <p>📅 {formatDate(event.date)}</p>
                          <p>📍 {event.location}</p>
                          {event.requiresPayment && event.paymentAmount > 0 && (
                            <p style={{ 
                              marginTop: '0.5rem',
                              color: '#856404', 
                              fontWeight: '600',
                              fontSize: '0.9rem'
                            }}>
                              💰 RM {event.paymentAmount.toFixed(2)}
                              {registration?.paymentReceipt?.paymentStatus && (
                                <span style={{ 
                                  marginLeft: '0.5rem',
                                  fontSize: '0.85rem',
                                  color: registration.paymentReceipt.paymentStatus === 'Verified' ? '#155724' : 
                                         registration.paymentReceipt.paymentStatus === 'Rejected' ? '#721c24' : '#856404'
                                }}>
                                  ({registration.paymentReceipt.paymentStatus})
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                        <p className="event-item-description">{event.description}</p>
                        
                        {/* Receipt Details Section */}
                        {registration?.paymentReceipt && (
                          <div style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            background: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #dee2e6'
                          }}>
                            <h5 style={{ 
                              margin: '0 0 0.75rem 0', 
                              fontSize: '0.95rem', 
                              fontWeight: '600',
                              color: '#1e3a8a'
                            }}>
                              🧾 Receipt Details
                            </h5>
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'auto 1fr', 
                              gap: '0.5rem 1rem',
                              fontSize: '0.85rem'
                            }}>
                              {registration.paymentReceipt.receiptNumber && (
                                <>
                                  <span style={{ fontWeight: '600', color: '#666' }}>Receipt No:</span>
                                  <span style={{ color: '#333' }}>{registration.paymentReceipt.receiptNumber}</span>
                                </>
                              )}
                              {registration.registrationName && (
                                <>
                                  <span style={{ fontWeight: '600', color: '#666' }}>Name:</span>
                                  <span style={{ color: '#333' }}>{registration.registrationName}</span>
                                </>
                              )}
                              {registration.matricNumber && (
                                <>
                                  <span style={{ fontWeight: '600', color: '#666' }}>Matric No:</span>
                                  <span style={{ color: '#333' }}>{registration.matricNumber}</span>
                                </>
                              )}
                              {registration.registrationEmail && (
                                <>
                                  <span style={{ fontWeight: '600', color: '#666' }}>Email:</span>
                                  <span style={{ color: '#333' }}>{registration.registrationEmail}</span>
                                </>
                              )}
                              {registration.phone && (
                                <>
                                  <span style={{ fontWeight: '600', color: '#666' }}>Phone:</span>
                                  <span style={{ color: '#333' }}>{registration.phone}</span>
                                </>
                              )}
                              {registration.paymentReceipt.amount && (
                                <>
                                  <span style={{ fontWeight: '600', color: '#666' }}>Amount:</span>
                                  <span style={{ color: '#856404', fontWeight: '600' }}>RM {registration.paymentReceipt.amount.toFixed(2)}</span>
                                </>
                              )}
                              {registration.paymentReceipt.paymentMethod && (
                                <>
                                  <span style={{ fontWeight: '600', color: '#666' }}>Payment Method:</span>
                                  <span style={{ color: '#333' }}>{registration.paymentReceipt.paymentMethod}</span>
                                </>
                              )}
                              {registration.paymentReceipt.generatedAt && (
                                <>
                                  <span style={{ fontWeight: '600', color: '#666' }}>Registered:</span>
                                  <span style={{ color: '#333' }}>{formatDate(registration.paymentReceipt.generatedAt)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                          {registration?.paymentReceipt?.receiptUrl ? (
                            <button
                              className="btn btn-primary"
                              onClick={() => {
                                // Open proof of payment in new tab
                                const receiptUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${registration.paymentReceipt.receiptUrl}`
                                window.open(receiptUrl, '_blank')
                              }}
                              style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                            >
                              👁️ View Proof of Payment
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                              No payment proof uploaded
                            </span>
                          )}
                          {registration?.paymentReceipt?.paymentStatus === 'Verified' && (
                            <button
                              className="btn btn-secondary"
                              onClick={(e) => {
                                e.stopPropagation()
                                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
                                const downloadUrl = `${API_BASE_URL}/api/receipts/event/${event._id}/download?userId=${user?.id}&format=pdf`
                                window.open(downloadUrl, '_blank')
                              }}
                              style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', position: 'relative', zIndex: 10, cursor: 'pointer' }}
                            >
                              📄 Download Official Receipt
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="empty-events">
                  <p>You haven't registered for any events yet.</p>
                  <a href="/events" className="btn-link">Browse Events →</a>
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
            <a href="/events" className="action-btn card-3d">
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
