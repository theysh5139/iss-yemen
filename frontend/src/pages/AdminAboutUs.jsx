import { useState, useEffect } from "react"
import AdminSidebar from "../components/AdminSidebar.jsx"
import AdminHeaderIcons from "../components/AdminHeaderIcons.jsx"
import { useAuth } from "../context/AuthProvider.jsx"
import { logoutApi } from "../api/auth.js"
import { getAboutUs, updateAboutUs } from "../api/aboutus.js"
import { useNavigate } from "react-router-dom"
import "../styles/admin-dashboard.css"
import "../styles/admin-forms.css"

export default function AdminAboutUs() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({
    mission: "",
    vision: "",
    activities: [
      { icon: "🎓", title: "", description: "" },
      { icon: "🎉", title: "", description: "" },
      { icon: "🤝", title: "", description: "" },
      { icon: "🎯", title: "", description: "" }
    ],
    joinUsText: ""
  })

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate("/dashboard", { replace: true })
      return
    }
    fetchAboutUs()
  }, [user])

  async function fetchAboutUs() {
    try {
      setLoading(true)
      const res = await getAboutUs()
      if (res.aboutUs) {
        setFormData({
          mission: res.aboutUs.mission || "",
          vision: res.aboutUs.vision || "",
          activities: res.aboutUs.activities || formData.activities,
          joinUsText: res.aboutUs.joinUsText || ""
        })
      }
    } catch (err) {
      console.error("Failed to fetch About Us:", err)
      setError(err.message || "Failed to load About Us content")
    } finally {
      setLoading(false)
    }
  }

  function updateActivity(index, field, value) {
    const newActivities = [...formData.activities]
    newActivities[index] = { ...newActivities[index], [field]: value }
    setFormData({ ...formData, activities: newActivities })
  }

  function addActivity() {
    setFormData({
      ...formData,
      activities: [...formData.activities, { icon: "⭐", title: "", description: "" }]
    })
  }

  function removeActivity(index) {
    const newActivities = formData.activities.filter((_, i) => i !== index)
    setFormData({ ...formData, activities: newActivities })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSaving(true)

    try {
      await updateAboutUs(formData)
      setSuccess("About Us content updated successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.message || "Failed to update About Us content")
    } finally {
      setSaving(false)
    }
  }

  async function onLogout() {
    try {
      await logoutApi()
    } catch {}
    setUser(null)
    navigate("/", { replace: true })
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
            <span>Dashboard &gt; Edit About Us</span>
          </div>
          <AdminHeaderIcons user={user} />
        </header>

        <div className="admin-content">
          <div className="main-section">
            <div className="page-title">
              <h1>Edit About Us</h1>
              <p>Update the content displayed on the About Us page</p>
            </div>

            {loading ? (
              <p>Loading...</p>
            ) : (
              <form onSubmit={handleSubmit} className="admin-form">
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <div className="form-group">
                  <label htmlFor="mission">Mission *</label>
                  <textarea
                    id="mission"
                    value={formData.mission}
                    onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                    required
                    rows="4"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="vision">Vision *</label>
                  <textarea
                    id="vision"
                    value={formData.vision}
                    onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                    required
                    rows="4"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Activities *</label>
                  {formData.activities.map((activity, index) => (
                    <div key={index} className="activity-form-group">
                      <div className="activity-header">
                        <input
                          type="text"
                          value={activity.icon}
                          onChange={(e) => updateActivity(index, 'icon', e.target.value)}
                          placeholder="Icon (emoji)"
                          className="form-input icon-input"
                          maxLength="2"
                          required
                        />
                        <input
                          type="text"
                          value={activity.title}
                          onChange={(e) => updateActivity(index, 'title', e.target.value)}
                          placeholder="Activity Title"
                          className="form-input"
                          required
                        />
                        {formData.activities.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => removeActivity(index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <textarea
                        value={activity.description}
                        onChange={(e) => updateActivity(index, 'description', e.target.value)}
                        placeholder="Activity Description"
                        rows="2"
                        className="form-input"
                        required
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={addActivity}
                  >
                    + Add Activity
                  </button>
                </div>

                <div className="form-group">
                  <label htmlFor="joinUsText">Join Us Text *</label>
                  <textarea
                    id="joinUsText"
                    value={formData.joinUsText}
                    onChange={(e) => setFormData({ ...formData, joinUsText: e.target.value })}
                    required
                    rows="3"
                    className="form-input"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <a href="/about" className="btn btn-secondary" target="_blank" rel="noopener noreferrer">
                    Preview Page
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}







