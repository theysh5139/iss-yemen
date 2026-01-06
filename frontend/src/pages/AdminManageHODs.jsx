import { useState, useEffect } from "react"
import AdminSidebar from "../components/AdminSidebar.jsx"
import { useAuth } from "../context/AuthProvider.jsx"
import { logoutApi } from "../api/auth.js"
import { getHODs, createHOD, updateHOD, deleteHOD } from "../api/hods.js"
import { useNavigate } from "react-router-dom"
import "../styles/admin-dashboard.css"
import "../styles/admin-forms.css"

export default function AdminManageHODs() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [hods, setHods] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingHOD, setEditingHOD] = useState(null)
  const [formData, setFormData] = useState({ name: "", designation: "", photo: "", order: 0 })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [photoPreview, setPhotoPreview] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [uploadMethod, setUploadMethod] = useState("url") // "url" or "file"

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate("/dashboard", { replace: true })
      return
    }
    fetchHODs()
  }, [user])

  async function fetchHODs() {
    try {
      setLoading(true)
      setError("")
      const res = await getHODs()
      console.log("Fetched HODs:", res)
      if (res && res.hods) {
        setHods(res.hods)
        console.log(`Loaded ${res.hods.length} HOD profiles`)
      } else {
        setHods([])
      }
    } catch (err) {
      console.error("Failed to fetch HODs:", err)
      const errorMsg = err.message || err.data?.message || "Failed to load HODs"
      // Only set error if not in form mode
      if (!showForm) {
        setError(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  function openCreateForm() {
    setEditingHOD(null)
    setFormData({ name: "", designation: "", photo: "", order: 0 })
    setError("")
    setSuccess("")
    setPhotoPreview("")
    setPhotoFile(null)
    setUploadMethod("url")
    setShowForm(true)
  }

  function openEditForm(hod) {
    setEditingHOD(hod)
    setFormData({
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
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingHOD(null)
    setFormData({ name: "", designation: "", photo: "", order: 0 })
    setError("")
    setSuccess("")
    setPhotoPreview("")
    setPhotoFile(null)
    setUploadMethod("url")
    setIsSubmitting(false)
  }

  function handlePhotoUrlChange(e) {
    const url = e.target.value
    setFormData({ ...formData, photo: url })
    setPhotoPreview(url)
    setPhotoFile(null)
    // Clear error when user starts typing
    if (error && error.includes("Photo")) {
      setError("")
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPG, PNG, GIF, or WEBP)")
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError("Image file size must be less than 5MB")
      return
    }

    setPhotoFile(file)
    setError("")

    // Convert to base64 for preview and storage
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64String = event.target.result
      setPhotoPreview(base64String)
      setFormData({ ...formData, photo: base64String })
    }
    reader.onerror = () => {
      setError("Failed to read the image file. Please try again.")
    }
    reader.readAsDataURL(file)
  }

  function validateForm() {
    console.log("Validating form data:", formData)
    
    if (!formData.name || !formData.name.trim()) {
      const errorMsg = "Name is required"
      console.log("Validation error:", errorMsg)
      setError(errorMsg)
      return false
    }
    if (!formData.designation || !formData.designation.trim()) {
      const errorMsg = "Designation is required"
      console.log("Validation error:", errorMsg)
      setError(errorMsg)
      return false
    }
    if (!formData.photo || !formData.photo.trim()) {
      const errorMsg = "Photo is required. Please upload an image or enter a URL."
      console.log("Validation error:", errorMsg)
      setError(errorMsg)
      return false
    }
    
    // If it's a base64 data URL, it's already validated
    if (formData.photo.startsWith('data:image/')) {
      console.log("Photo is base64 data URL - valid")
      return true
    }
    
    // Validate image URL format
    const urlPattern = /^(https?:\/\/|\.|\/)/;
    if (!urlPattern.test(formData.photo)) {
      const errorMsg = "Photo must be a valid URL or path"
      console.log("Validation error:", errorMsg)
      setError(errorMsg)
      return false
    }

    // Validate image extension for URLs
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!imageExtensions.test(formData.photo)) {
      const errorMsg = "Photo must be a valid image file (jpg, jpeg, png, gif, webp)"
      console.log("Validation error:", errorMsg)
      setError(errorMsg)
      return false
    }

    console.log("Form validation passed")
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    console.log("Form submitted", formData)
    
    setError("")
    setSuccess("")
    setIsSubmitting(true)

    // Validate form
    const isValid = validateForm()
    console.log("Form validation:", isValid)
    
    if (!isValid) {
      console.log("Validation failed, error:", error)
      setIsSubmitting(false)
      return
    }

    // Log the data being sent (truncate photo for logging)
    const photoPreview = formData.photo.length > 100 
      ? formData.photo.substring(0, 100) + "..." 
      : formData.photo
    console.log("Submitting HOD data:", {
      name: formData.name,
      designation: formData.designation,
      photo: photoPreview,
      photoLength: formData.photo.length,
      order: formData.order,
      editing: !!editingHOD
    })
    
    // Check if photo is too large (base64 can be large)
    if (formData.photo.length > 10 * 1024 * 1024) { // 10MB base64 string
      const errorMsg = "Image is too large. Please use a smaller image file (max 5MB)."
      setError(errorMsg)
      setIsSubmitting(false)
      return
    }

    try {
      let result
      if (editingHOD) {
        console.log("Updating HOD:", editingHOD._id)
        result = await updateHOD(editingHOD._id, formData)
        console.log("Update result:", result)
        setSuccess("✓ HOD profile updated successfully!")
      } else {
        console.log("Creating new HOD")
        result = await createHOD(formData)
        console.log("Create result:", result)
        setSuccess("✓ HOD profile created successfully!")
      }
      
      // Refresh the HOD list to show the new/updated HOD immediately
      console.log("Refreshing HOD list...")
      await fetchHODs()
      console.log("HOD list refreshed")
      
      // Keep form open for 2.5 seconds to show success message, then close
      setTimeout(() => {
        console.log("Closing form")
        closeForm()
      }, 2500)
    } catch (err) {
      console.error("Error saving HOD - Full error:", err)
      console.error("Error message:", err.message)
      console.error("Error data:", err.data)
      console.error("Error stack:", err.stack)
      
      const errorMessage = err.message || err.data?.message || "Failed to save HOD. Please check the console for details."
      setError(errorMessage)
      setIsSubmitting(false)
    }
  }

  async function handleDelete(hodId) {
    if (!confirm("Are you sure you want to delete this HOD profile? This cannot be undone.")) return

    try {
      await deleteHOD(hodId)
      await fetchHODs()
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
          <div className="header-icons">
            <button className="icon-btn">🔔</button>
            <button className="icon-btn">⚙️</button>
          </div>
        </header>

        <div className="admin-content">
          <div className="main-section">
            <div className="page-title">
              <h1>Manage HOD Profiles</h1>
              <p>Create, edit, and delete Head of Department profiles</p>
            </div>

            <div className="content-section">
              <div className="section-header">
                <h2 className="section-title">HOD Profiles</h2>
                <button className="btn btn-primary" onClick={openCreateForm}>
                  + Add New HOD
                </button>
              </div>

              {error && !showForm && (
                <div className="alert alert-error" style={{marginBottom: '1rem'}}>
                  <span className="alert-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
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
                            onClick={() => openEditForm(hod)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(hod._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No HOD profiles yet. <button onClick={openCreateForm} className="link-btn">Create one now</button></p>
              )}
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={closeForm}>
            <div className="modal-content hod-form-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>{editingHOD ? "Edit HOD Profile" : "Create New HOD Profile"}</h2>
                  <p className="modal-subtitle">Fill in the details below to {editingHOD ? "update" : "create"} a Head of Department profile</p>
                </div>
                <button className="modal-close" onClick={closeForm} aria-label="Close">×</button>
              </div>
              
              <div className="modal-body">
                <form onSubmit={handleSubmit} className="admin-form hod-form">
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
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Dr. Ahmed Hassan"
                        required
                        className="form-input"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="order">
                        Display Order
                      </label>
                      <input
                        id="order"
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                        min="0"
                        className="form-input"
                        disabled={isSubmitting}
                      />
                      <small className="form-hint">Lower numbers appear first</small>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="designation">
                      Designation <span className="required">*</span>
                    </label>
                    <input
                      id="designation"
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g., Head of Computer Science Department"
                      required
                      className="form-input"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="photo">
                      Photo <span className="required">*</span>
                    </label>
                    
                    {/* Upload Method Toggle */}
                    <div className="upload-method-toggle">
                      <button
                        type="button"
                        className={`toggle-btn ${uploadMethod === 'file' ? 'active' : ''}`}
                        onClick={() => {
                          setUploadMethod('file')
                          setFormData({ ...formData, photo: '' })
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
                          setFormData({ ...formData, photo: '' })
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
                        <>
                          <div className="file-upload-area">
                            <input
                              id="photo-file"
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              onChange={handleFileSelect}
                              className="file-input"
                              disabled={isSubmitting}
                            />
                            <label htmlFor="photo-file" className="file-upload-label">
                              <div className="file-upload-content">
                                <span className="file-upload-icon">📤</span>
                                <div>
                                  <strong>Click to select image</strong>
                                  <p>or drag and drop</p>
                                </div>
                                <small>JPG, PNG, GIF, or WEBP (max 5MB)</small>
                              </div>
                            </label>
                            {photoFile && (
                              <div className="file-selected">
                                <span className="file-name">✓ {photoFile.name}</span>
                                <span className="file-size">({(photoFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <input
                          id="photo"
                          type="url"
                          value={formData.photo}
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
                            onError={(e) => {
                              e.target.style.display = 'none'
                              const errorDiv = e.target.nextElementSibling
                              if (errorDiv) errorDiv.style.display = 'block'
                            }}
                          />
                          <div className="photo-preview-error" style={{display: 'none'}}>
                            <span>⚠️ Invalid image</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <small className="form-hint">
                      <span className="hint-icon">ℹ️</span>
                      {uploadMethod === 'file' 
                        ? 'Upload an image from your computer. Supported formats: JPG, PNG, GIF, WEBP (max 5MB).'
                        : 'Enter a valid image URL (jpg, jpeg, png, gif, webp). Image preview will appear above.'}
                    </small>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={closeForm}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner"></span>
                          {editingHOD ? "Updating..." : "Creating..."}
                        </>
                      ) : (
                        <>
                          <span className="btn-icon">{editingHOD ? "✏️" : "➕"}</span>
                          {editingHOD ? "Update Profile" : "Create Profile"}
                        </>
                      )}
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

