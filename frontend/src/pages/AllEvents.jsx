import { useState, useEffect } from "react"
import { getEvents } from "../api/events.js"
import { useAuth } from "../context/AuthProvider.jsx"
import EventRegistrationModal from "../components/EventRegistrationModal.jsx"
import "../styles/home.css"
import "../styles/all-events.css"

export default function AllEvents() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("all") // all, upcoming, past
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const isMember = user && user.role === 'member'

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    try {
      setLoading(true)
      const res = await getEvents()
      if (res.events) {
        // Sort by date (upcoming first)
        const sorted = res.events.sort((a, b) => new Date(a.date) - new Date(b.date))
        setEvents(sorted)
      }
    } catch (err) {
      console.error("Failed to fetch events:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleEventClick(event) {
    console.log('handleEventClick called with event:', event)
    if (!event || !event._id) {
      console.error('Invalid event passed to handleEventClick:', event)
      return
    }
    console.log('Setting selectedEvent and opening modal...')
    setSelectedEvent(event)
    setIsModalOpen(true)
    console.log('Modal state updated - selectedEvent:', event._id, 'isModalOpen: true')
  }

  async function handleModalClose() {
    setIsModalOpen(false)
    setSelectedEvent(null)
    // Refresh events after registration changes
    await fetchEvents()
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

  function isRegistered(event) {
    if (!isMember || !event.registeredUsers) return false
    return event.registeredUsers.some(regUser => 
      typeof regUser === 'object' ? regUser._id === user?.id : regUser === user?.id
    )
  }

  function getCategoryColor(category) {
    const colors = {
      Cultural: "#4a6fa5",
      Academic: "#5cb85c",
      Social: "#f56565",
      News: "#9b59b6",
      Announcement: "#e67e22",
      Activity: "#3498db"
    }
    return colors[category] || "#7f8c8d"
  }

  const now = new Date()
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date)
    if (filter === "upcoming") return eventDate >= now && !event.cancelled
    if (filter === "past") return eventDate < now
    return !event.cancelled
  })

  if (loading) {
    return (
      <main className="page all-events-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading events...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page all-events-page">
        <div className="error-container">
          <p>Error loading events: {error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="page all-events-page">
      <div className="events-page-header">
        <h1 className="page-title">All Events</h1>
        <p className="page-subtitle">Join events and activities organized by ISS Yemen</p>
      </div>

      {/* Filter Tabs */}
      <div className="events-filter-tabs">
        <button
          className={`filter-tab ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All Events
        </button>
        <button
          className={`filter-tab ${filter === "upcoming" ? "active" : ""}`}
          onClick={() => setFilter("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={`filter-tab ${filter === "past" ? "active" : ""}`}
          onClick={() => setFilter("past")}
        >
          Past Events
        </button>
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="all-events-grid">
          {filteredEvents.map(event => {
            const registered = isRegistered(event)
            const eventDate = new Date(event.date)
            const isUpcoming = eventDate >= now

            return (
              <div 
                key={event._id} 
                className={`event-card-large card-3d ${event.cancelled ? "cancelled" : ""}`}
                style={{ position: 'relative' }}
              >
                <div className="event-card-header">
                  <div className="event-title-section">
                    <h3 className="event-title">{event.title}</h3>
                    <div className="event-badges">
                      <span 
                        className="event-category-badge"
                        style={{ backgroundColor: getCategoryColor(event.category) }}
                      >
                        {event.category}
                      </span>
                      {registered && (
                        <span className="event-badge registered">✓ Registered</span>
                      )}
                      {event.cancelled && (
                        <span className="event-badge cancelled-badge">Cancelled</span>
                      )}
                      {!isUpcoming && !event.cancelled && (
                        <span className="event-badge past">Past</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="event-details">
                  <div className="event-detail-item">
                    <span className="detail-icon">📅</span>
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="event-detail-item">
                    <span className="detail-icon">📍</span>
                    <span>{event.location}</span>
                  </div>
                  {event.requiresPayment && event.paymentAmount > 0 && (
                    <div className="event-detail-item" style={{ 
                      color: '#856404', 
                      fontWeight: '600'
                    }}>
                      <span className="detail-icon">💰</span>
                      <span>RM {event.paymentAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {!event.requiresPayment || event.paymentAmount === 0 ? (
                    <div className="event-detail-item" style={{ 
                      color: '#28a745', 
                      fontWeight: '600'
                    }}>
                      <span className="detail-icon">🆓</span>
                      <span>Free</span>
                    </div>
                  ) : null}
                  {event.registeredUsers && (
                    <div className="event-detail-item">
                      <span className="detail-icon">👥</span>
                      <span>{event.registeredUsers.length} registered</span>
                    </div>
                  )}
                </div>

                <p className="event-description">{event.description}</p>

                {!event.cancelled && (
                  <div className="event-actions">
                    {isMember ? (
                      registered ? (
                        <button
                          className="btn btn-secondary btn-3d"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEventClick(event)
                          }}
                        >
                          View Details / Unregister
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-3d"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('Register button clicked!', event)
                            if (event && event._id) {
                              handleEventClick(event)
                            } else {
                              console.error('Event is invalid:', event)
                              alert('Error: Event data is missing. Please refresh the page.')
                            }
                          }}
                          style={{ 
                            cursor: 'pointer', 
                            pointerEvents: 'auto',
                            position: 'relative',
                            zIndex: 9999,
                            touchAction: 'manipulation'
                          }}
                        >
                          Register
                        </button>
                      )
                    ) : (
                      <a href="/login" className="btn btn-primary btn-3d">
                        Login to Register
                      </a>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <p>No events found matching your filter.</p>
        </div>
      )}

      {/* Registration Modal */}
      <EventRegistrationModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onRegistrationChange={fetchEvents}
        user={user}
      />
    </main>
  )
}

