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
      isPublic: true,
      fee: 0,
      qrFile: null, // File object for QR
      qrPreview: "" // URL to preview QR
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
          // Filter out announcements, activities, and news - only show actual events
          // Backend should already filter, but double-check on frontend
          const eventsOnly = res.events.filter(event => 
            event.type === 'event' && event.category !== 'News'
          )
          setEvents(eventsOnly)
        }
      } catch (err) {
        console.error("Failed to fetch events:", err)
      } finally {
        setLoading(false)
      }
    }

    function handleInputChange(e) {
      const { name, value, type, checked, files } = e.target
      if (type === 'file') {
        setFormData(prev => ({
          ...prev,
          qrFile: files[0],
          qrPreview: files[0] ? URL.createObjectURL(files[0]) : ""
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : type === 'number' ? (value === '' ? 0 : Number(value)) : value
        }))
      }
    }

    function handleEdit(event) {
  setEditingId(event._id)
  setFormData({
    title: event.title || "",
    description: event.description || "",
    date: event.date ? new Date(event.date).toISOString().split('T')[0] : "",
    location: event.location || "",
    category: event.category || "Cultural",
    type: event.type || "event",
    schedule: event.schedule || "",
    isRecurring: event.isRecurring || false,
    isPublic: event.isPublic !== undefined ? event.isPublic : true,
    fee: event.fee || event.paymentAmount || 0,  // Use fee, fallback to paymentAmount for backward compatibility
    qrFile: null,                   // keep file empty on edit
    qrPreview: event.qrCodeUrl || "" // <-- show existing QR if available
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
        isPublic: true,
        fee: 0,
        qrFile: null,
        qrPreview: ""
      })
    }

    async function handleSubmit(e) {
      e.preventDefault()
      try {
        const data = new FormData();
data.append('title', formData.title);
data.append('description', formData.description);
data.append('date', formData.date ? new Date(formData.date).toISOString() : new Date().toISOString());
data.append('location', formData.location);
data.append('category', formData.category);
data.append('type', formData.type);
data.append('schedule', formData.schedule);
data.append('isRecurring', formData.isRecurring);
data.append('isPublic', formData.isPublic);
data.append('fee', formData.fee);

if (formData.qrFile) data.append('qrCode', formData.qrFile);


        if (editingId) {
          await updateEvent(editingId, data)
        } else {
          await createEvent(data)
        }

        await fetchEvents()
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
      } catch (err) {
        alert(err.message || "Failed to cancel event")
      }
    }

    async function handleDelete(id) {
      if (!confirm("Are you sure you want to delete this event? This cannot be undone.")) return
      try {
        await deleteEvent(id)
        await fetchEvents()
      } catch (err) {
        alert(err.message || "Failed to delete event")
      }
    }

    async function onLogout() {
      try { await logoutApi() } catch {}
      setUser(null)
      navigate("/", { replace: true })
    }

    function formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    }

    if (user?.role !== 'admin') return null

    return (
      <div className="admin-dashboard">
        <AdminSidebar user={user} onLogout={onLogout} />
        <div className="admin-main-content">
          <header className="admin-header">
            <div className="breadcrumbs">Dashboard &gt; Manage Event and Activities</div>
          </header>

          <div className="admin-content">
            <div className="main-section">
              <div className="page-title">
                <h1>Manage Events and Activities</h1>
              </div>

              <div className="content-actions">
                <button className="btn-primary" onClick={() => setShowForm(true)}>+ Create Event</button>
              </div>

              {showForm && (
                <div className="admin-form-card">
                  <h3>{editingId ? 'Edit Event' : 'Create Event'}</h3>
                  <form onSubmit={handleSubmit} className="admin-form">
                    <div className="form-group">
                      <label>Title *</label>
                      <input type="text" name="title" value={formData.title} onChange={handleInputChange} required className="form-input" />
                    </div>

                    <div className="form-group">
                      <label>Description *</label>
                      <textarea name="description" value={formData.description} onChange={handleInputChange} required rows="4" className="form-input" />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Date *</label>
                        <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="form-input" />
                      </div>

                      <div className="form-group">
                        <label>Location *</label>
                        <input type="text" name="location" value={formData.location} onChange={handleInputChange} required className="form-input" />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Category *</label>
                        <select name="category" value={formData.category} onChange={handleInputChange} required className="form-input">
                          <option value="Cultural">Cultural</option>
                          <option value="Academic">Academic</option>
                          <option value="Social">Social</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Type</label>
                        <select name="type" value={formData.type} onChange={handleInputChange} className="form-input">
                          <option value="event">Event</option>
                          <option value="activity">Activity</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Schedule</label>
                      <input type="text" name="schedule" value={formData.schedule} onChange={handleInputChange} className="form-input" placeholder="e.g., Every Wednesday, 8:00 PM" />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input type="checkbox" name="isRecurring" checked={formData.isRecurring} onChange={handleInputChange} /> Recurring Event
                        </label>
                      </div>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input type="checkbox" name="isPublic" checked={formData.isPublic} onChange={handleInputChange} /> Public (visible to non-logged-in users)
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Fee (RM)</label>
                      <input type="number" name="fee" value={formData.fee} onChange={handleInputChange} className="form-input" min="0" step="0.01" />
                    </div>

                    <div className="form-group">
                      <label>QR Code for Payment</label>
                      <input type="file" name="qrFile" accept="image/*" onChange={handleInputChange} />
                      {formData.qrPreview && (
                        <img src={formData.qrPreview} alt="QR Preview" style={{ width: "150px", marginTop: "8px" }} />
                      )}
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create'} Event</button>
                      <button type="button" onClick={handleCancel} className="btn-secondary">Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="content-section">
                <h2 className="section-title">All Events</h2>
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
                            <span>💲 Fee: {event.requiresPayment && event.paymentAmount > 0 ? `${event.paymentAmount} RM` : 'Free'}</span>
                            {event.registeredUsers && <span>👥 {event.registeredUsers.length} registered</span>}
                          </div>
                          {event.qrCodeUrl && (
                            <div className="qr-code-section" style={{ marginTop: "8px", padding: "8px", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
                              <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Payment QR Code:</div>
                              <img
                                src={`http://localhost:5000${event.qrCodeUrl}`}
                                alt="Payment QR Code"
                                style={{
                                  width: "120px",
                                  height: "120px",
                                  objectFit: "contain",
                                  border: "1px solid #ddd",
                                  borderRadius: "4px",
                                  backgroundColor: "white"
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <div className="item-actions">
                          {event.registeredUsers && event.registeredUsers.length > 0 && (
                            <button className="btn-view" onClick={() => setViewingRegistrations(event)}>
                              View Registrations ({event.registeredUsers.length})
                            </button>
                          )}
                          <button className="btn-edit" onClick={() => handleEdit(event)}>Edit</button>
                          {!event.cancelled && <button className="btn-cancel" onClick={() => handleCancelEvent(event._id)}>Cancel</button>}
                          <button className="btn-delete" onClick={() => handleDelete(event._id)}>Delete</button>
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
        </div>
      </div>
    )
  }
