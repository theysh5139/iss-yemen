"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getPastEvents } from "../api/events.js"
import { useAuth } from "../context/AuthProvider.jsx"
import "../styles/past-events.css"

export default function PastEvents() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [dateFilter, setDateFilter] = useState("All")

  // Redirect members to all-events page (past events timeline is for non-logged-in users)
  useEffect(() => {
    if (user && (user.role === 'member' || user.role === 'admin')) {
      navigate("/all-events", { replace: true })
    }
  }, [user, navigate])


  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true)
        const res = await getPastEvents()
        if (res.events) {
          // Filter out announcements, activities, and news - only show actual events
          // Backend should already filter, but double-check on frontend
          const eventsOnly = res.events.filter(event => 
            event.type === 'event' && event.category !== 'News'
          )
          const sortedEvents = eventsOnly.sort((a, b) => new Date(b.date) - new Date(a.date))
          setEvents(sortedEvents)
          setFilteredEvents(sortedEvents)
        }
      } catch (err) {
        console.error("Failed to fetch past events:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  useEffect(() => {
    let filtered = [...events]

    // Filter by category
    if (categoryFilter !== "All") {
      filtered = filtered.filter(event => event.category === categoryFilter)
    }

    // Filter by date
    if (dateFilter !== "All") {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case "This Month":
          filterDate.setMonth(now.getMonth() - 1)
          break
        case "Last 3 Months":
          filterDate.setMonth(now.getMonth() - 3)
          break
        case "Last 6 Months":
          filterDate.setMonth(now.getMonth() - 6)
          break
        case "This Year":
          filterDate.setFullYear(now.getFullYear() - 1)
          break
        default:
          break
      }
      
      filtered = filtered.filter(event => new Date(event.date) >= filterDate)
    }

    setFilteredEvents(filtered)
  }, [categoryFilter, dateFilter, events])

  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
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

  // Get unique categories from events
  const categories = ["All", ...new Set(events.map(e => e.category).filter(Boolean))]


  if (loading) {
    return (
      <div className="events-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading past events...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="events-container">
        <div className="error-container">
          <p>Error loading events: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="events-container animate-fadeInUp">
      <div className="events-header">
        <h1 className="events-title">Past Events Timeline</h1>
        <p className="events-subtitle">A look back at our recent activities and celebrations</p>
      </div>

      {/* Filters */}
      <div className="events-filters">
        <div className="filter-group">
          <label htmlFor="category-filter">Filter by Category:</label>
          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="date-filter">Filter by Date:</label>
          <select
            id="date-filter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Time</option>
            <option value="This Month">This Month</option>
            <option value="Last 3 Months">Last 3 Months</option>
            <option value="Last 6 Months">Last 6 Months</option>
            <option value="This Year">This Year</option>
          </select>
        </div>

        <div className="filter-results">
          Showing {filteredEvents.length} of {events.length} events
        </div>
      </div>

      <div className="events-content">
        {filteredEvents.length > 0 ? (
          <div className="timeline">
            {filteredEvents.map((event) => (
              <div key={event._id} className="timeline-item">
                <div className="timeline-marker" style={{ borderColor: getCategoryColor(event.category) }}>
                  <div 
                    className="timeline-dot" 
                    style={{ backgroundColor: getCategoryColor(event.category) }}
                  ></div>
                </div>
                <div className="timeline-content">
                  <div className="event-card">
                    <div className="event-header">
                      <div className="event-category" style={{ backgroundColor: getCategoryColor(event.category) }}>
                        {event.category}
                      </div>
                      <div className="event-date">{formatDate(event.date)}</div>
                    </div>
                    <h2 className="event-title">{event.title}</h2>
                    <div className="event-details">
                      <div className="event-detail">
                        <span className="detail-icon">📍</span>
                        <span>{event.location}</span>
                      </div>
                      <div className="event-detail">
                        <span className="detail-icon">👥</span>
                        <span>{event.attendees || (event.registeredUsers?.length || 0)} attendees</span>
                      </div>
                    </div>
                    <p className="event-description">{event.description}</p>
                    <div className="event-actions">
                      <a 
                        href={`/all-events?event=${event._id}`} 
                        className="btn btn-secondary" 
                        style={{ 
                          textDecoration: 'none',
                          pointerEvents: 'auto',
                          cursor: 'pointer',
                          position: 'relative',
                          zIndex: 10002
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          console.log('View Details clicked for event:', event._id)
                        }}
                      >
                        View Details →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No past events found matching your filters.</p>
          </div>
        )}
      </div>

    </div>
  )
}
