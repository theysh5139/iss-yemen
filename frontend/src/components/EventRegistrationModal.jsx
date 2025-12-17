import { useState } from "react"
import { registerForEvent, unregisterFromEvent } from "../api/events.js"
import "../styles/event-registration-modal.css"

export default function EventRegistrationModal({ event, isOpen, onClose, onRegistrationChange, user }) {
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen || !event) return null

  const isRegistered = event.registeredUsers?.some(regUser => 
    typeof regUser === 'object' ? regUser._id === user?.id : regUser === user?.id
  )

  const eventDate = new Date(event.date)
  const isUpcoming = eventDate >= new Date()
  // Allow registration for all events (ignore past/cancelled restrictions for testing)
  const canRegister = !event.cancelled || true

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

  async function handleRegister() {
    try {
      setRegistering(true)
      setError(null)
      await registerForEvent(event._id)
      if (onRegistrationChange) {
        await onRegistrationChange()
      }
      onClose()
    } catch (err) {
      console.error("Failed to register for event:", err)
      setError(err.message || "Failed to register for event")
    } finally {
      setRegistering(false)
    }
  }

  async function handleUnregister() {
    try {
      setRegistering(true)
      setError(null)
      await unregisterFromEvent(event._id)
      if (onRegistrationChange) {
        await onRegistrationChange()
      }
      onClose()
    } catch (err) {
      console.error("Failed to unregister from event:", err)
      setError(err.message || "Failed to unregister from event")
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal-content" onClick={e => e.stopPropagation()}>
        <button className="event-modal-close" onClick={onClose}>×</button>
        
        <div className="event-modal-header">
          <h2 className="event-modal-title">{event.title}</h2>
          {event.cancelled && (
            <span className="event-badge cancelled-badge">Cancelled</span>
          )}
          {!canRegister && !event.cancelled && (
            <span className="event-badge past">Past Event</span>
          )}
        </div>

        <div className="event-modal-body">
          <div className="event-modal-details">
            <div className="event-detail-row">
              <span className="detail-label">📅 Date & Time:</span>
              <span className="detail-value">{formatDate(event.date)}</span>
            </div>
            <div className="event-detail-row">
              <span className="detail-label">📍 Location:</span>
              <span className="detail-value">{event.location}</span>
            </div>
            <div className="event-detail-row">
              <span className="detail-label">🏷️ Category:</span>
              <span className="detail-value">{event.category}</span>
            </div>
            {event.registeredUsers && (
              <div className="event-detail-row">
                <span className="detail-label">👥 Registered:</span>
                <span className="detail-value">{event.registeredUsers.length} members</span>
              </div>
            )}
          </div>

          <div className="event-modal-description">
            <h3>Description</h3>
            <p>{event.description}</p>
          </div>

          {error && (
            <div className="event-modal-error">
              {error}
            </div>
          )}

          {!event.cancelled && (
            <div className="event-modal-registration-form">
              <h3 className="form-title">Event Registration</h3>
              {isRegistered ? (
                <>
                  <div className="registration-status registered">
                    <span className="status-icon">✓</span>
                    <div className="status-content">
                      <strong>You are registered for this event</strong>
                      <p>You will receive event updates and reminders.</p>
                    </div>
                  </div>
                  <div className="registration-form-actions">
                    <button
                      className="btn btn-secondary btn-full"
                      onClick={handleUnregister}
                      disabled={registering}
                    >
                      {registering ? "Unregistering..." : "Unregister from Event"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="registration-info">
                    <p>By registering for this event, you confirm that:</p>
                    <ul className="registration-terms">
                      <li>You will attend the event on the scheduled date and time</li>
                      <li>You understand the event location and requirements</li>
                      <li>You will notify organizers if you cannot attend</li>
                    </ul>
                  </div>
                  <div className="registration-form-actions">
                    <button
                      className="btn btn-primary btn-full"
                      onClick={handleRegister}
                      disabled={registering}
                    >
                      {registering ? "Registering..." : "Confirm Registration"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {event.cancelled && (
            <div className="event-modal-actions">
              <div className="registration-status unavailable">
                This event has been cancelled
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

