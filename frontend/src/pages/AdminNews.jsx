import { useState, useEffect } from "react"
import AdminSidebar from "../components/AdminSidebar.jsx"
import AdminHeaderIcons from "../components/AdminHeaderIcons.jsx"
import { useAuth } from "../context/AuthProvider.jsx"
import { logoutApi } from "../api/auth.js"
import { getAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from "../api/admin.js"
import { useNavigate } from "react-router-dom"
import "../styles/admin-dashboard.css"
import "../styles/admin-forms.css"

export default function AdminNews() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    category: "Announcement",
    isPublic: true
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState("")

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate("/dashboard", { replace: true })
      return
    }
    fetchAnnouncements()
  }, [user])

  async function fetchAnnouncements() {
    try {
      setLoading(true)
      const res = await getAllAnnouncements()
      if (res.announcements) {
        setAnnouncements(res.announcements)
      }
    } catch (err) {
      console.error("Failed to fetch announcements:", err)
    } finally {
      setLoading(false)
    }
  }

  function handleInputChange(e) {
    const { name, value, type, checked, files } = e.target
    if (type === 'file' && files && files[0]) {
      setImageFile(files[0])
      setImagePreview(URL.createObjectURL(files[0]))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  function handleEdit(announcement) {
    setEditingId(announcement._id)
    setFormData({
      title: announcement.title,
      description: announcement.description,
      date: announcement.date ? new Date(announcement.date).toISOString().split('T')[0] : "",
      location: announcement.location || "",
      category: announcement.category || "Announcement",
      isPublic: announcement.isPublic !== undefined ? announcement.isPublic : true
    })
    setImageFile(null)
    setImagePreview(announcement.imageUrl || "")
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
      category: "Announcement",
      isPublic: true
    })
    setImageFile(null)
    setImagePreview("")
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      // If category is "News", set type to 'event' so it's counted in news counter
      // Otherwise, set type to 'announcement'
      const eventType = formData.category === 'News' ? 'event' : 'announcement'
      
      const data = new FormData()
      data.append('title', formData.title)
      data.append('description', formData.description)
      data.append('date', formData.date ? new Date(formData.date).toISOString() : new Date().toISOString())
      data.append('location', formData.location || '')
      data.append('category', formData.category)
      data.append('type', eventType)
      data.append('isPublic', formData.isPublic)
      
      if (imageFile) {
        data.append('image', imageFile)
      }

      if (editingId) {
        await updateAnnouncement(editingId, data)
      } else {
        await createAnnouncement(data)
      }

      await fetchAnnouncements()
      
      // Dispatch custom event to refresh dashboard stats
      window.dispatchEvent(new CustomEvent('adminDataUpdated', { 
        detail: { type: 'announcement', action: editingId ? 'updated' : 'created' }
      }))
      
      handleCancel()
    } catch (err) {
      alert(err.message || "Failed to save announcement")
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this announcement?")) return

    try {
      await deleteAnnouncement(id)
      await fetchAnnouncements()
      
      // Dispatch custom event to refresh dashboard stats
      window.dispatchEvent(new CustomEvent('adminDataUpdated', { 
        detail: { type: 'announcement', action: 'deleted' }
      }))
    } catch (err) {
      alert(err.message || "Failed to delete announcement")
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
            <span>Dashboard &gt; News & Announcements</span>
          </div>
          <AdminHeaderIcons user={user} />
        </header>

        <div className="admin-content">
          <div className="main-section">
            <div className="page-title">
              <h1>News & Announcements</h1>
              <p>Create, edit, and manage announcements</p>
            </div>

            <div className="content-actions">
              <button 
                className="btn-primary"
                onClick={() => setShowForm(true)}
              >
                + Create Announcement
              </button>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
              <div className="admin-form-card">
                <h3>{editingId ? 'Edit Announcement' : 'Create Announcement'}</h3>
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
                      <label>Location</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="TBA"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="form-input"
                      >
                        <option value="Announcement">Announcement</option>
                        <option value="News">News</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="isPublic"
                          checked={formData.isPublic}
                          onChange={handleInputChange}
                        />
                        Public (visible to non-logged-in users)
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Image (Optional)</label>
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={handleInputChange}
                      className="form-input"
                    />
                    {(imagePreview || imageFile) && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          style={{ 
                            maxWidth: '300px', 
                            maxHeight: '200px', 
                            borderRadius: '8px',
                            border: '1px solid #ddd'
                          }} 
                        />
                      </div>
                    )}
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary">
                      {editingId ? 'Update' : 'Create'} Announcement
                    </button>
                    <button type="button" onClick={handleCancel} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Announcements List */}
            <div className="content-section">
              <h2 className="section-title">All Announcements</h2>
              {loading ? (
                <p>Loading announcements...</p>
              ) : announcements.length > 0 ? (
                <div className="admin-list">
                  {announcements.map(announcement => (
                    <div key={announcement._id} className="admin-list-item">
                      <div className="item-content">
                        <h3 className="item-title">{announcement.title}</h3>
                        <p className="item-description">{announcement.description}</p>
                        <div className="item-meta">
                          <span>📅 {formatDate(announcement.date)}</span>
                          {announcement.location && <span>📍 {announcement.location}</span>}
                          <span className={`badge ${announcement.isPublic ? 'public' : 'private'}`}>
                            {announcement.isPublic ? 'Public' : 'Private'}
                          </span>
                        </div>
                      </div>
                      <div className="item-actions">
                        <button 
                          className="btn-edit"
                          onClick={() => handleEdit(announcement)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDelete(announcement._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No announcements yet. Create one to get started!</p>
              )}
            </div>
          </div>
        </div>

        <footer className="admin-footer">
          <p>© ISS Yemen WebApp by Beta Blockers 2025</p>
        </footer>
      </div>
    </div>
  )
}
