import { useState, useEffect } from "react"
import AdminSidebar from "../components/AdminSidebar.jsx"
import { useAuth } from "../context/AuthProvider.jsx"
import { logoutApi } from "../api/auth.js"
import { getAllEvents, createEvent, updateEvent, cancelEvent, deleteEvent } from "../api/admin.js"
import { useNavigate } from "react-router-dom"
import "../styles/admin-dashboard.css"
import "../styles/admin-forms.css"

export default function AdminManageEvents() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [viewingRegistrations, setViewingRegistrations] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    category: "Cultural",
    type: "event",
    schedule: "",
    isRecurring: false,
    isPublic: true
  })

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate("/dashboard", { replace: true })
      return
    }
    fetchEvents()
  }, [user])

  async function fetchEvents() {
    try {
      setLoading(true)
      const res = await getAllEvents()
      if (res.events) {
        setEvents(res.events)
      }
    } catch (err) {
      console.error("Failed to fetch events:", err)
    } finally {
      setLoading(false)
    }
  }

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  function handleEdit(event) {
    setEditingId(event._id)
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date ? new Date(event.date).toISOString().split('T')[0] : "",
      location: event.location || "",
      category: event.category || "Cultural",
      type: event.type || "event",
      schedule: event.schedule || "",
      isRecurring: event.isRecurring || false,
      isPublic: event.isPublic !== undefined ? event.isPublic : true
    })
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      title: "",
      description: "",
      date: "",
      location: "",
      category: "Cultural",
      type: "event",
      schedule: "",
      isRecurring: false,
      isPublic: true
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        date: formData.date ? new Date(formData.date) : new Date()
      }

      if (editingId) {
        await updateEvent(editingId, data)
      } else {
        await createEvent(data)
      }

      await fetchEvents()
      
      // Dispatch custom event to refresh dashboard stats
      window.dispatchEvent(new CustomEvent('adminDataUpdated', { 
        detail: { type: 'event', action: editingId ? 'updated' : 'created' }
      }))
      
      handleCancel()
    } catch (err) {
      alert(err.message || "Failed to save event")
    }
  }

  async function handleCancelEvent(id) {
    if (!confirm("Are you sure you want to cancel this event?")) return

    try {
      await cancelEvent(id)
      await fetchEvents()
      
      // Dispatch custom event to refresh dashboard stats
      window.dispatchEvent(new CustomEvent('adminDataUpdated', { 
        detail: { type: 'event', action: 'cancelled' }
      }))
    } catch (err) {
      alert(err.message || "Failed to cancel event")
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this event? This cannot be undone.")) return

    try {
      await deleteEvent(id)
      await fetchEvents()
      
      // Dispatch custom event to refresh dashboard stats
      window.dispatchEvent(new CustomEvent('adminDataUpdated', { 
        detail: { type: 'event', action: 'deleted' }
      }))
    } catch (err) {
      alert(err.message || "Failed to delete event")
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
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  if (user?.role !== 'admin') {
    return null
  }

  return (
    <div className="admin-dashboard">
      <AdminSidebar user={user} onLogout={onLogout} />
      
      <div className="admin-main-content">
        <header className="admin-header">
          <div className="breadcrumbs">
            <span>Dashboard &gt; Manage Event and Activities</span>
          </div>
          <div className="header-icons">
            <button className="icon-btn">🔔</button>
            <button className="icon-btn">⚙️</button>
            <button className="icon-btn">🔍</button>
            <button className="icon-btn">👤</button>
          </div>
        </header>

        <div className="admin-content">
          <div className="main-section">
            <div className="page-title">
              <h1>Manage Events and Activities</h1>
              <p>Create, edit, and cancel events and activities</p>
            </div>

            <div className="content-actions">
              <button 
                className="btn-primary"
                onClick={() => setShowForm(true)}
              >
                + Create Event
              </button>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
              <div className="admin-form-card">
                <h3>{editingId ? 'Edit Event' : 'Create Event'}</h3>
                <form onSubmit={handleSubmit} className="admin-form">
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows="4"
                      className="form-input"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Date *</label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Location *</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Category *</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                      >
                        <option value="Cultural">Cultural</option>
                        <option value="Academic">Academic</option>
                        <option value="Social">Social</option>
                        <option value="Activity">Activity</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Type</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="form-input"
                      >
                        <option value="event">Event</option>
                        <option value="activity">Activity</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Schedule (for recurring activities)</label>
                    <input
                      type="text"
                      name="schedule"
                      value={formData.schedule}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., Every Wednesday, 8:00 PM"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="isRecurring"
                          checked={formData.isRecurring}
                          onChange={handleInputChange}
                        />
                        Recurring Event
                      </label>
                    </div>

                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="isPublic"
                          checked={formData.isPublic}
                          onChange={handleInputChange}
                        />
                        Public (visible to visitors)
                      </label>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary">
                      {editingId ? 'Update' : 'Create'} Event
                    </button>
                    <button type="button" onClick={handleCancel} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Events List */}
            <div className="content-section">
              <h2 className="section-title">All Events and Activities</h2>
              {loading ? (
                <p>Loading events...</p>
              ) : events.length > 0 ? (
                <div className="admin-list">
                  {events.map(event => (
                    <div key={event._id} className={`admin-list-item ${event.cancelled ? 'cancelled' : ''}`}>
                      <div className="item-content">
                        <div className="item-header">
                          <h3 className="item-title">{event.title}</h3>
                          {event.cancelled && <span className="badge cancelled-badge">Cancelled</span>}
                        </div>
                        <p className="item-description">{event.description}</p>
                        <div className="item-meta">
                          <span>📅 {formatDate(event.date)}</span>
                          <span>📍 {event.location}</span>
                          <span className="badge">{event.category}</span>
                          {event.registeredUsers && (
                            <span>👥 {event.registeredUsers.length} registered</span>
                          )}
                        </div>
                      </div>
                      <div className="item-actions">
                        {event.registeredUsers && event.registeredUsers.length > 0 && (
                          <button 
                            className="btn-view"
                            onClick={() => setViewingRegistrations(event)}
                          >
                            View Registrations ({event.registeredUsers.length})
                          </button>
                        )}
                        <button 
                          className="btn-edit"
                          onClick={() => handleEdit(event)}
                        >
                          Edit
                        </button>
                        {!event.cancelled && (
                          <button 
                            className="btn-cancel"
                            onClick={() => handleCancelEvent(event._id)}
                          >
                            Cancel
                          </button>
                        )}
                        <button 
                          className="btn-delete"
                          onClick={() => handleDelete(event._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No events yet. Create one to get started!</p>
              )}
            </div>
          </div>
        </div>

        {/* Registrations Modal */}
        {viewingRegistrations && (
          <div className="modal-overlay" onClick={() => setViewingRegistrations(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Event Registrations: {viewingRegistrations.title}</h2>
                <button className="modal-close" onClick={() => setViewingRegistrations(null)}>×</button>
              </div>
              <div className="modal-body">
                {viewingRegistrations.registeredUsers && viewingRegistrations.registeredUsers.length > 0 ? (
                  <div className="registrations-list">
                    <p className="registrations-count">
                      Total: {viewingRegistrations.registeredUsers.length} registered
                    </p>
                    <table className="registrations-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingRegistrations.registeredUsers.map((user, idx) => (
                          <tr key={idx}>
                            <td>{typeof user === 'object' ? user.name : 'N/A'}</td>
                            <td>{typeof user === 'object' ? user.email : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="empty-state">No registrations yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <footer className="admin-footer">
          <p>© ISS Yemen WebApp by Beta Blockers 2025</p>
        </footer>
      </div>
    </div>
  )
}
