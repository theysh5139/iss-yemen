import { useState, useEffect } from "react"
import AdminSidebar from "../components/AdminSidebar.jsx"
import { useAuth } from "../context/AuthProvider.jsx"
import { logoutApi } from "../api/auth.js"
import { getAllActivities, createActivity, updateActivity, deleteActivity } from "../api/admin.js"
import { useNavigate } from "react-router-dom"
import "../styles/admin-dashboard.css"
import "../styles/admin-forms.css"

export default function AdminManageActivities() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    category: "Cultural",
    schedule: "",
    isRecurring: false,
    isPublic: true,
    imageFile: null,
    imagePreview: ""
  })

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate("/dashboard", { replace: true })
      return
    }
    fetchActivities()
  }, [user])

  async function fetchActivities() {
    try {
      setLoading(true)
      const res = await getAllActivities()
      if (res.activities) {
        setActivities(res.activities)
      }
    } catch (err) {
      console.error("Failed to fetch activities:", err)
    } finally {
      setLoading(false)
    }
  }

  function handleInputChange(e) {
    const { name, value, type, checked, files } = e.target
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        imageFile: files[0],
        imagePreview: files[0] ? URL.createObjectURL(files[0]) : ""
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  function handleEdit(activity) {
    setEditingId(activity._id)
    setFormData({
      title: activity.title || "",
      description: activity.description || "",
      date: activity.date ? new Date(activity.date).toISOString().split('T')[0] : "",
      location: activity.location || "",
      category: activity.category || "Cultural",
      schedule: activity.schedule || "",
      isRecurring: activity.isRecurring || false,
      isPublic: activity.isPublic !== undefined ? activity.isPublic : true,
      imageFile: null,
      imagePreview: activity.imageUrl || ""
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
      schedule: "",
      isRecurring: false,
      isPublic: true,
      imageFile: null,
      imagePreview: ""
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
      data.append('schedule', formData.schedule);
      data.append('isRecurring', formData.isRecurring);
      data.append('isPublic', formData.isPublic);

      if (formData.imageFile) data.append('image', formData.imageFile);

      if (editingId) {
        await updateActivity(editingId, data)
      } else {
        await createActivity(data)
      }

      await fetchActivities()
      handleCancel()
    } catch (err) {
      console.error("Failed to save activity:", err)
      alert(err.message || "Failed to save activity")
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this activity?")) return
    try {
      await deleteActivity(id)
      await fetchActivities()
    } catch (err) {
      console.error("Failed to delete activity:", err)
      alert(err.message || "Failed to delete activity")
    }
  }

  async function handleLogout() {
    try {
      await logoutApi()
      setUser(null)
      navigate("/", { replace: true })
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }

  if (user?.role !== 'admin') return null

  if (loading) {
    return (
      <div className="admin-dashboard">
        <AdminSidebar user={user} onLogout={handleLogout} />
        <div className="admin-main-content">
          <div className="admin-content">
            <p>Loading activities...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <AdminSidebar user={user} onLogout={handleLogout} />
      <div className="admin-main-content">
        <header className="admin-header">
          <div className="breadcrumbs">Dashboard &gt; Manage Activities</div>
        </header>

        <div className="admin-content">
          <div className="main-section">
            <div className="page-title">
              <h1>Manage Activities</h1>
            </div>

            <div className="content-actions">
              <button className="btn-primary" onClick={() => setShowForm(true)}>+ Create Activity</button>
            </div>

            {showForm && (
              <div className="admin-form-card">
                <h3>{editingId ? 'Edit Activity' : 'Create Activity'}</h3>
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
                      <label>Schedule</label>
                      <input type="text" name="schedule" value={formData.schedule} onChange={handleInputChange} className="form-input" placeholder="e.g., Every Wednesday, 8:00 PM" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Image</label>
                    <input type="file" name="imageFile" accept="image/*" onChange={handleInputChange} />
                    {formData.imagePreview && (
                      <img src={formData.imagePreview} alt="Preview" style={{ width: "150px", marginTop: "8px" }} />
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input type="checkbox" name="isRecurring" checked={formData.isRecurring} onChange={handleInputChange} /> Recurring Activity
                      </label>
                    </div>
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input type="checkbox" name="isPublic" checked={formData.isPublic} onChange={handleInputChange} /> Public (visible to non-logged-in users)
                      </label>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create'} Activity</button>
                    <button type="button" onClick={handleCancel} className="btn-secondary">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className="content-section">
              <h2 className="section-title">All Activities</h2>
              {loading ? (
                <p>Loading activities...</p>
              ) : activities.length > 0 ? (
                <div className="admin-list">
                  {activities.map(activity => (
                    <div key={activity._id} className="admin-list-item">
                      <div className="item-content">
                        <div className="item-header">
                          <h3 className="item-title">{activity.title}</h3>
                          {activity.isRecurring && <span className="badge">Recurring</span>}
                          {!activity.isPublic && <span className="badge">Members Only</span>}
                        </div>
                        {activity.imageUrl && (
                          <img 
                            src={activity.imageUrl.startsWith('/') 
                              ? `http://localhost:5000${activity.imageUrl}` 
                              : activity.imageUrl} 
                            alt={activity.title}
                            style={{ maxWidth: '200px', marginTop: '8px', borderRadius: '4px' }}
                          />
                        )}
                        <p className="item-description">{activity.description}</p>
                        <div className="item-meta">
                          <span>📅 {new Date(activity.date).toLocaleDateString()}</span>
                          <span>📍 {activity.location}</span>
                          <span className="badge">{activity.category}</span>
                          {activity.schedule && <span>🕐 {activity.schedule}</span>}
                        </div>
                      </div>
                      <div className="item-actions">
                        <button 
                          onClick={() => handleEdit(activity)} 
                          className="btn-edit"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(activity._id)} 
                          className="btn-delete"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No activities yet. Create one to get started!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

