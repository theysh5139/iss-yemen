import { useState, useEffect } from "react"
import { getAllActivities } from "../api/events.js"
import { useAuth } from "../context/AuthProvider.jsx"
import "../styles/all-events.css"
import "../styles/home.css"

export default function AllActivities() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activities, setActivities] = useState([])

  useEffect(() => {
    fetchActivities()
  }, [])

  async function fetchActivities() {
    try {
      setLoading(true)
      const res = await getAllActivities()
      if (res.activities) {
        setActivities(res.activities)
      }
    } catch (err) {
      console.error("Failed to fetch activities:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "TBA"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  function getCategoryColor(category) {
    const colors = {
      'Cultural': '#8B5CF6',
      'Academic': '#3B82F6',
      'Social': '#10B981',
      'Other': '#6B7280'
    }
    return colors[category] || colors['Other']
  }

  if (loading || authLoading) {
    return (
      <main className="page events-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading activities...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page events-page">
        <div className="error-container">
          <p>Error loading activities: {error}</p>
          <button onClick={fetchActivities} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="page events-page">
      <div className="events-header">
        <h1 className="page-title">All Activities</h1>
        <p className="page-subtitle">
          Discover all activities organized by ISS Yemen. Join ongoing programmes and gatherings.
        </p>
      </div>

      {activities.length > 0 ? (
        <div className="events-grid">
          {activities.map(activity => (
            <div key={activity._id} className="event-card card-3d">
              {activity.imageUrl && (
                <div className="event-image-container">
                  <img
                    src={activity.imageUrl.startsWith('http') 
                      ? activity.imageUrl 
                      : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${activity.imageUrl}`}
                    alt={activity.title}
                    className="event-image"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              )}
              
              <div className="event-card-header">
                <h3 className="event-title">{activity.title}</h3>
                <div className="event-badges">
                  {activity.isRecurring && (
                    <span className="event-badge recurring">Recurring</span>
                  )}
                  {!activity.isPublic && (
                    <span className="event-badge members-only">Members Only</span>
                  )}
                  {activity.category && (
                    <span 
                      className="event-badge category"
                      style={{ backgroundColor: getCategoryColor(activity.category) }}
                    >
                      {activity.category}
                    </span>
                  )}
                </div>
              </div>

              <div className="event-details">
                <p className="event-date">
                  📅 {activity.schedule || formatDate(activity.date)}
                </p>
                {activity.location && (
                  <p className="event-location">📍 {activity.location}</p>
                )}
              </div>

              {activity.description && (
                <p className="event-description">
                  {activity.description.length > 200
                    ? `${activity.description.substring(0, 200)}...`
                    : activity.description}
                </p>
              )}

              {activity.schedule && activity.isRecurring && (
                <div className="activity-schedule">
                  <strong>Schedule:</strong> {activity.schedule}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No activities available at this time.</p>
          <p className="empty-state-subtitle">
            Check back later for new activities and programmes.
          </p>
        </div>
      )}
    </main>
  )
}
