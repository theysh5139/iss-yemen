import { useState, useEffect } from "react"
import AdminSidebar from "../components/AdminSidebar.jsx"
import AdminHeaderIcons from "../components/AdminHeaderIcons.jsx"
import { useAuth } from "../context/AuthProvider.jsx"
import { logoutApi } from "../api/auth.js"
import { getHODs, createHOD, updateHOD, deleteHOD } from "../api/hods.js"
import { useNavigate } from "react-router-dom"
import "../styles/admin-dashboard.css"
import "../styles/admin-forms.css"

export default function AdminManageHODs() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  
  // HODs state
  const [hods, setHods] = useState([])
  const [hodsLoading, setHodsLoading] = useState(true)
  const [showHODForm, setShowHODForm] = useState(false)
  const [editingHOD, setEditingHOD] = useState(null)
  const [hodFormData, setHodFormData] = useState({ name: "", designation: "", photo: "", order: 0 })
  
  // Common state
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [photoPreview, setPhotoPreview] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [uploadMethod, setUploadMethod] = useState("url")

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate("/dashboard", { replace: true })
      return
    }
    fetchHODs()
    
    // Auto-refresh every 30 seconds to sync with cloud DB
    const pollInterval = setInterval(() => {
      fetchHODs()
    }, 30000)
    
    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchHODs()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearInterval(pollInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  // HOD Functions
  async function fetchHODs() {
    try {
      setHodsLoading(true)
      setError("")
      const res = await getHODs()
      if (res && res.hods) {
        setHods(res.hods)
      } else {
        setHods([])
      }
    } catch (err) {
      console.error("Failed to fetch HODs:", err)
      if (!showHODForm) {
        setError(err.message || "Failed to load HODs")
      }
    } finally {
      setHodsLoading(false)
    }
  }


  // HOD Form Functions
  function openCreateHODForm() {
    setEditingHOD(null)
    setHodFormData({ name: "", designation: "", photo: "", order: 0 })
    setError("")
    setSuccess("")
    setPhotoPreview("")
    setPhotoFile(null)
    setUploadMethod("url")
    setShowHODForm(true)
  }

  function openEditHODForm(hod) {
    setEditingHOD(hod)
    setHodFormData({
      name: hod.name || "",
      designation: hod.designation || "",
      photo: hod.photo || "",
      order: hod.order || 0
    })
    setError("")
    setSuccess("")
    setPhotoPreview(hod.photo || "")
    setPhotoFile(null)
    setUploadMethod("url")
    setShowHODForm(true)
  }

  function closeHODForm() {
    setShowHODForm(false)
    setEditingHOD(null)
    setHodFormData({ name: "", designation: "", photo: "", order: 0 })
    setError("")
    setSuccess("")
    setPhotoPreview("")
    setPhotoFile(null)
    setUploadMethod("url")
    setIsSubmitting(false)
  }

  // Photo handling
  function handlePhotoUrlChange(e) {
    const url = e.target.value
    setHodFormData({ ...hodFormData, photo: url })
    setPhotoPreview(url)
    setPhotoFile(null)
    if (error && error.includes("Photo")) {
      setError("")
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPG, PNG, GIF, or WEBP)")
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError("Image file size must be less than 5MB")
      return
    }

    setPhotoFile(file)
    setError("")

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64String = event.target.result
      setPhotoPreview(base64String)
      setHodFormData({ ...hodFormData, photo: base64String })
    }
    reader.onerror = () => {
      setError("Failed to read the image file. Please try again.")
    }
    reader.readAsDataURL(file)
  }

  // HOD Submit
  async function handleHODSubmit(e) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsSubmitting(true)

    if (!hodFormData.name?.trim() || !hodFormData.designation?.trim() || !hodFormData.photo?.trim()) {
      setError("Name, designation, and photo are required")
      setIsSubmitting(false)
      return
    }

    if (hodFormData.photo.length > 10 * 1024 * 1024) {
      setError("Image is too large. Please use a smaller image file (max 5MB).")
      setIsSubmitting(false)
      return
    }

    try {
      let result
      if (editingHOD) {
        result = await updateHOD(editingHOD._id, hodFormData)
        setSuccess("✓ HOD profile updated successfully!")
      } else {
        result = await createHOD(hodFormData)
        setSuccess("✓ HOD profile created successfully!")
      }
      
      await fetchHODs()
      window.dispatchEvent(new CustomEvent('hodDataUpdated', { 
        detail: { action: editingHOD ? 'updated' : 'created', hod: result.hod }
      }))
      
      setTimeout(() => {
        closeHODForm()
      }, 2500)
    } catch (err) {
      setError(err.message || "Failed to save HOD")
      setIsSubmitting(false)
    }
  }

  async function handleHODDelete(hodId) {
    if (!confirm("Are you sure you want to delete this HOD profile?")) return
    try {
      await deleteHOD(hodId)
      await fetchHODs()
      window.dispatchEvent(new CustomEvent('hodDataUpdated', { 
        detail: { action: 'deleted', hodId }
      }))
    } catch (err) {
      alert(err.message || "Failed to delete HOD")
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
            <span>Dashboard &gt; Manage HODs</span>
          </div>
          <AdminHeaderIcons user={user} />
        </header>

        <div className="admin-content">
          <div className="main-section">
            <div className="page-title">
              <h1>Manage HODs</h1>
              <p>Create, edit, and delete Head of Department profiles. <a href="/" style={{ color: '#4a6fa5', textDecoration: 'underline' }}>View HODs on homepage</a></p>
            </div>

            {/* HODs Section */}
            <div>
            <div className="content-section">
              <div className="section-header">
                  <h2 className="section-title">Heads of Department</h2>
                  <button className="btn btn-primary" onClick={openCreateHODForm}>
                  + Add New HOD
                </button>
              </div>

                {error && !showHODForm && (
                <div className="alert alert-error" style={{marginBottom: '1rem'}}>
                  <span className="alert-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

                {hodsLoading ? (
                <div style={{textAlign: 'center', padding: '2rem'}}>
                  <div className="spinner" style={{margin: '0 auto 1rem', width: '40px', height: '40px', borderWidth: '3px'}}></div>
                  <p>Loading HODs...</p>
                </div>
              ) : hods.length > 0 ? (
                <div className="hods-grid">
                  {hods.map(hod => (
                    <div key={hod._id} className="hod-admin-card">
                      <div className="hod-admin-photo">
                        <img 
                          src={hod.photo} 
                          alt={hod.name}
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(hod.name)}&size=200&background=0b6b63&color=fff`
                          }}
                        />
                      </div>
                      <div className="hod-admin-info">
                        <h3>{hod.name}</h3>
                        <p>{hod.designation}</p>
                        <div className="hod-admin-actions">
                          <button 
                            className="btn btn-secondary btn-sm"
                              onClick={() => openEditHODForm(hod)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                              onClick={() => handleHODDelete(hod._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                  <p className="empty-state">No HOD profiles yet. <button onClick={openCreateHODForm} className="link-btn">Create one now</button></p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* HOD Form Modal */}
        {showHODForm && (
          <div className="modal-overlay" onClick={closeHODForm}>
            <div className="modal-content hod-form-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>{editingHOD ? "Edit HOD Profile" : "Create New HOD Profile"}</h2>
                  <p className="modal-subtitle">Fill in the details below to {editingHOD ? "update" : "create"} a Head of Department profile</p>
                </div>
                <button className="modal-close" onClick={closeHODForm} aria-label="Close">×</button>
              </div>
              
              <div className="modal-body">
                <form onSubmit={handleHODSubmit} className="admin-form hod-form">
                  {error && (
                    <div className="alert alert-error" style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                      <span className="alert-icon">⚠️</span>
                      <span style={{flex: 1}}>{error}</span>
                      <button 
                        type="button"
                        onClick={() => setError("")}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '1.5rem',
                          cursor: 'pointer',
                          color: '#c33',
                          padding: '0',
                          lineHeight: '1',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        aria-label="Dismiss error"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  
                  {success && (
                    <div className="alert alert-success">
                      <span className="alert-icon">✓</span>
                      <span>{success}</span>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">
                        Full Name <span className="required">*</span>
                      </label>
                      <input
                        id="hod-name"
                        type="text"
                        value={hodFormData.name}
                        onChange={(e) => setHodFormData({ ...hodFormData, name: e.target.value })}
                        placeholder="e.g., Dr. Ahmed Hassan"
                        required
                        className="form-input"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="hod-order">Display Order</label>
                      <input
                        id="hod-order"
                        type="number"
                        value={hodFormData.order}
                        onChange={(e) => setHodFormData({ ...hodFormData, order: parseInt(e.target.value) || 0 })}
                        min="0"
                        className="form-input"
                        disabled={isSubmitting}
                      />
                      <small className="form-hint">Lower numbers appear first</small>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="hod-designation">Designation <span className="required">*</span></label>
                    <input
                      id="hod-designation"
                      type="text"
                      value={hodFormData.designation}
                      onChange={(e) => setHodFormData({ ...hodFormData, designation: e.target.value })}
                      placeholder="e.g., Head of Computer Science Department"
                      required
                      className="form-input"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="hod-photo">Photo <span className="required">*</span></label>
                    
                    <div className="upload-method-toggle">
                      <button
                        type="button"
                        className={`toggle-btn ${uploadMethod === 'file' ? 'active' : ''}`}
                        onClick={() => {
                          setUploadMethod('file')
                          setHodFormData({ ...hodFormData, photo: '' })
                          setPhotoPreview('')
                          setPhotoFile(null)
                        }}
                        disabled={isSubmitting}
                      >
                        📁 Upload File
                      </button>
                      <button
                        type="button"
                        className={`toggle-btn ${uploadMethod === 'url' ? 'active' : ''}`}
                        onClick={() => {
                          setUploadMethod('url')
                          setHodFormData({ ...hodFormData, photo: '' })
                          setPhotoPreview('')
                          setPhotoFile(null)
                        }}
                        disabled={isSubmitting}
                      >
                        🔗 Enter URL
                      </button>
                    </div>

                    <div className="photo-input-wrapper">
                      {uploadMethod === 'file' ? (
                          <div className="file-upload-area">
                          <input
                            id="hod-photo-file"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleFileSelect}
                            className="file-input"
                            disabled={isSubmitting}
                          />
                          <label htmlFor="hod-photo-file" className="file-upload-label">
                              <div className="file-upload-content">
                                <span className="file-upload-icon">📤</span>
                                <div>
                                  <strong>Click to select image</strong>
                                  <p>or drag and drop</p>
                                </div>
                                <small>JPG, PNG, GIF, or WEBP (max 5MB)</small>
                              </div>
                            </label>
                          </div>
                      ) : (
                        <input
                          id="hod-photo"
                          type="url"
                          value={hodFormData.photo}
                          onChange={handlePhotoUrlChange}
                          placeholder="https://example.com/photo.jpg or /assets/hods/hod1.jpg"
                          required
                          className="form-input"
                          disabled={isSubmitting}
                        />
                      )}
                      
                      {photoPreview && (
                        <div className="photo-preview">
                          <img 
                            src={photoPreview} 
                            alt="Preview" 
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={closeHODForm}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : (editingHOD ? "Update Profile" : "Create Profile")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

