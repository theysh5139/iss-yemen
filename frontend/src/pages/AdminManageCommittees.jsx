import { useState, useEffect } from "react"
import AdminSidebar from "../components/AdminSidebar.jsx"
import AdminHeaderIcons from "../components/AdminHeaderIcons.jsx"
import { useAuth } from "../context/AuthProvider.jsx"
import { logoutApi } from "../api/auth.js"
import {
  getCommittees, createCommittee, updateCommittee, deleteCommittee,
  getExecutiveMembers, createExecutiveMember, updateExecutiveMember, deleteExecutiveMember,
  getCommitteeHeads, createCommitteeHead, updateCommitteeHead, deleteCommitteeHead,
  getCommitteeMembersGrouped, createCommitteeMember, updateCommitteeMember, deleteCommitteeMember
} from "../api/committees.js"
import { useNavigate } from "react-router-dom"
import "../styles/admin-dashboard.css"
import "../styles/admin-forms.css"
import "../styles/admin-settings.css"

const EXECUTIVE_ROLES = ['President', 'VP', 'General Secretary', 'Treasurer']

export default function AdminManageCommittees() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('committees')

  // Committees state
  const [committees, setCommittees] = useState([])
  const [executiveMembers, setExecutiveMembers] = useState([])
  const [committeeHeads, setCommitteeHeads] = useState([])
  const [committeeMembersGrouped, setCommitteeMembersGrouped] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState(null) // 'committee', 'executive', 'head', 'member'
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({})
  const [photoPreview, setPhotoPreview] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [uploadMethod, setUploadMethod] = useState("url")

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate("/dashboard", { replace: true })
      return
    }
    fetchAllData()

    const pollInterval = setInterval(() => {
      fetchAllData()
    }, 30000)

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAllData()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(pollInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  async function fetchAllData() {
    try {
      setLoading(true)
      setError("")
      const [committeesRes, execRes, headsRes, membersRes] = await Promise.all([
        getCommittees(),
        getExecutiveMembers(),
        getCommitteeHeads(),
        getCommitteeMembersGrouped()
      ])

      if (committeesRes?.committees) setCommittees(committeesRes.committees)
      if (execRes?.members) setExecutiveMembers(execRes.members)
      if (headsRes?.heads) setCommitteeHeads(headsRes.heads)
      if (membersRes?.grouped) setCommitteeMembersGrouped(membersRes.grouped)
    } catch (err) {
      console.error("Failed to fetch data:", err)
      const errorMsg = err.message || err.data?.message || "Failed to load data"
      if (!showForm) {
        setError(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  function openCreateForm(type) {
    setFormType(type)
    setEditingItem(null)
    setError("")
    setSuccess("")
    setPhotoPreview("")
    setPhotoFile(null)
    setUploadMethod("url")

    switch (type) {
      case 'committee':
        setFormData({ name: "", priority: null })
        break
      case 'executive':
        setFormData({ name: "", role: "", email: "", phone: "", photo: "" })
        break
      case 'head':
        setFormData({ name: "", committeeId: "", email: "", phone: "", photo: "" })
        break
      case 'member':
        setFormData({ name: "", committeeId: "", photo: "", order: 0 })
        break
    }
    setShowForm(true)
  }

  function openEditForm(item, type) {
    setFormType(type)
    setEditingItem(item)
    setError("")
    setSuccess("")
    setPhotoPreview(item.photo || "")
    setPhotoFile(null)
    setUploadMethod("url")

    switch (type) {
      case 'committee':
        setFormData({ name: item.name || "", priority: item.priority !== undefined ? item.priority : null })
        break
      case 'executive':
        setFormData({
          name: item.name || "",
          role: item.role || "",
          email: item.email || "",
          phone: item.phone || "",
          photo: item.photo || ""
        })
        break
      case 'head':
        setFormData({
          name: item.name || "",
          committeeId: item.committeeId?._id || item.committeeId || "",
          email: item.email || "",
          phone: item.phone || "",
          photo: item.photo || ""
        })
        break
      case 'member':
        setFormData({
          name: item.name || "",
          committeeId: item.committeeId?._id || item.committeeId || "",
          photo: item.photo || "",
          order: item.order || 0
        })
        break
    }
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setFormType(null)
    setEditingItem(null)
    setFormData({})
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
      setFormData({ ...formData, photo: base64String })
    }
    reader.onerror = () => {
      setError("Failed to read the image file. Please try again.")
    }
    reader.readAsDataURL(file)
  }

  function validateForm() {
    if (formType === 'committee') {
      if (!formData.name || !formData.name.trim()) {
        setError("Committee name is required")
        return false
      }
    } else if (formType === 'executive') {
      if (!formData.name || !formData.name.trim()) {
        setError("Name is required")
        return false
      }
      if (!formData.role || !EXECUTIVE_ROLES.includes(formData.role)) {
        setError("Valid role is required")
        return false
      }
      if (!formData.email || !formData.email.trim()) {
        setError("Email is required")
        return false
      }
      if (!formData.photo || !formData.photo.trim()) {
        setError("Photo is required")
        return false
      }
    } else if (formType === 'head') {
      if (!formData.name || !formData.name.trim()) {
        setError("Name is required")
        return false
      }
      if (!formData.committeeId) {
        setError("Committee is required")
        return false
      }
      if (!formData.email || !formData.email.trim()) {
        setError("Email is required")
        return false
      }
      if (!formData.photo || !formData.photo.trim()) {
        setError("Photo is required")
        return false
      }
    } else if (formType === 'member') {
      if (!formData.name || !formData.name.trim()) {
        setError("Name is required")
        return false
      }
      if (!formData.committeeId) {
        setError("Committee is required")
        return false
      }
      if (!formData.photo || !formData.photo.trim()) {
        setError("Photo is required")
        return false
      }
    }
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsSubmitting(true)

    if (!validateForm()) {
      setIsSubmitting(false)
      return
    }

    try {
      let result
      if (formType === 'committee') {
        if (editingItem) {
          result = await updateCommittee(editingItem._id, formData)
          setSuccess("✓ Committee updated successfully!")
        } else {
          result = await createCommittee(formData)
          setSuccess("✓ Committee created successfully!")
        }
      } else if (formType === 'executive') {
        if (editingItem) {
          result = await updateExecutiveMember(editingItem._id, formData)
          setSuccess("✓ Executive member updated successfully!")
        } else {
          result = await createExecutiveMember(formData)
          setSuccess("✓ Executive member created successfully!")
        }
      } else if (formType === 'head') {
        if (editingItem) {
          result = await updateCommitteeHead(editingItem._id, formData)
          setSuccess("✓ Committee head updated successfully!")
        } else {
          result = await createCommitteeHead(formData)
          setSuccess("✓ Committee head created successfully!")
        }
      } else if (formType === 'member') {
        if (editingItem) {
          result = await updateCommitteeMember(editingItem._id, formData)
          setSuccess("✓ Committee member updated successfully!")
        } else {
          result = await createCommitteeMember(formData)
          setSuccess("✓ Committee member created successfully!")
        }
      }

      await fetchAllData()
      setTimeout(() => {
        closeForm()
      }, 2500)
    } catch (err) {
      console.error("Error saving:", err)
      const errorMessage = err.message || err.data?.message || "Failed to save. Please check the console for details."
      setError(errorMessage)
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id, type) {
    if (!confirm(`Are you sure you want to delete this ${type}? This cannot be undone.`)) return

    try {
      switch (type) {
        case 'committee':
          await deleteCommittee(id)
          break
        case 'executive':
          await deleteExecutiveMember(id)
          break
        case 'head':
          await deleteCommitteeHead(id)
          break
        case 'member':
          await deleteCommitteeMember(id)
          break
      }
      await fetchAllData()
    } catch (err) {
      alert(err.message || `Failed to delete ${type}`)
    }
  }

  async function onLogout() {
    try {
      await logoutApi()
    } catch { }
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
            <span>Dashboard &gt; Manage Committees</span>
          </div>
          <AdminHeaderIcons user={user} />
        </header>

        <div className="admin-content">
          <div className="main-section">
            <div className="page-title">
              <h1>Manage Committees</h1>
              <p>Manage committees, executive members, heads, and members</p>
            </div>

            {error && !showForm && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                <span className="alert-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Tabs */}
            <div className="settings-tabs">
              <button
                className={`settings-tab ${activeTab === 'committees' ? 'active' : ''}`}
                onClick={() => setActiveTab('committees')}
              >
                📋 Committees
              </button>
              <button
                className={`settings-tab ${activeTab === 'executive' ? 'active' : ''}`}
                onClick={() => setActiveTab('executive')}
              >
                👔 Executive Members
              </button>
              <button
                className={`settings-tab ${activeTab === 'heads' ? 'active' : ''}`}
                onClick={() => setActiveTab('heads')}
              >
                🎯 Committee Heads
              </button>
              <button
                className={`settings-tab ${activeTab === 'members' ? 'active' : ''}`}
                onClick={() => setActiveTab('members')}
              >
                👥 Committee Members
              </button>
            </div>

            {/* Tab Content */}
            <div className="settings-content">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 1rem', width: '40px', height: '40px', borderWidth: '3px' }}></div>
                  <p>Loading...</p>
                </div>
              ) : (
                <>
                  {/* Committees Tab */}
                  {activeTab === 'committees' && (
                    <div className="content-section">
                      <div className="section-header">
                        <h2 className="section-title">Committees</h2>
                        <button className="btn btn-primary" onClick={() => openCreateForm('committee')}>
                          + Add Committee
                        </button>
                      </div>
                      {committees.length > 0 ? (
                        <div className="admin-list">
                          {committees.map(committee => (
                            <div key={committee._id} className="admin-list-item">
                              <div className="item-content">
                                <h3 className="item-title">{committee.name}</h3>
                                {committee.priority !== null && committee.priority !== undefined && (
                                  <p className="item-description">Priority: {committee.priority}</p>
                                )}
                              </div>
                              <div className="item-actions">
                                <button className="btn-edit" onClick={() => openEditForm(committee, 'committee')}>
                                  Edit
                                </button>
                                <button className="btn-delete" onClick={() => handleDelete(committee._id, 'committee')}>
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="empty-state">No committees yet. <button onClick={() => openCreateForm('committee')} className="link-btn">Create one now</button></p>
                      )}
                    </div>
                  )}

                  {/* Executive Members Tab */}
                  {activeTab === 'executive' && (
                    <div className="content-section">
                      <div className="section-header">
                        <h2 className="section-title">Executive Committee Members</h2>
                        <button className="btn btn-primary" onClick={() => openCreateForm('executive')}>
                          + Add Executive Member
                        </button>
                      </div>
                      {executiveMembers.length > 0 ? (
                        <div className="hods-grid">
                          {executiveMembers.map(member => (
                            <div key={member._id} className="hod-admin-card">
                              <div className="hod-admin-photo">
                                <img
                                  src={member.photo}
                                  alt={member.name}
                                  onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=200&background=0b6b63&color=fff`
                                  }}
                                />
                              </div>
                              <div className="hod-admin-info">
                                <h3>{member.name}</h3>
                                <p><strong>{member.role}</strong></p>
                                <p style={{ fontSize: '0.85rem', color: '#666' }}>{member.email}</p>
                                {member.phone && <p style={{ fontSize: '0.85rem', color: '#666' }}>{member.phone}</p>}
                                <div className="hod-admin-actions">
                                  <button className="btn btn-secondary btn-sm" onClick={() => openEditForm(member, 'executive')}>
                                    Edit
                                  </button>
                                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(member._id, 'executive')}>
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="empty-state">No executive members yet. <button onClick={() => openCreateForm('executive')} className="link-btn">Create one now</button></p>
                      )}
                    </div>
                  )}

                  {/* Committee Heads Tab */}
                  {activeTab === 'heads' && (
                    <div className="content-section">
                      <div className="section-header">
                        <h2 className="section-title">Committee Heads</h2>
                        <button className="btn btn-primary" onClick={() => openCreateForm('head')}>
                          + Add Committee Head
                        </button>
                      </div>
                      {committeeHeads.length > 0 ? (
                        <div className="hods-grid">
                          {committeeHeads.map(head => (
                            <div key={head._id} className="hod-admin-card">
                              <div className="hod-admin-photo">
                                <img
                                  src={head.photo}
                                  alt={head.name}
                                  onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(head.name)}&size=200&background=0b6b63&color=fff`
                                  }}
                                />
                              </div>
                              <div className="hod-admin-info">
                                <h3>{head.name}</h3>
                                {head.committeeId?.name && <p><strong>{head.committeeId.name}</strong></p>}
                                <p style={{ fontSize: '0.85rem', color: '#666' }}>{head.email}</p>
                                {head.phone && <p style={{ fontSize: '0.85rem', color: '#666' }}>{head.phone}</p>}
                                <div className="hod-admin-actions">
                                  <button className="btn btn-secondary btn-sm" onClick={() => openEditForm(head, 'head')}>
                                    Edit
                                  </button>
                                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(head._id, 'head')}>
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="empty-state">No committee heads yet. <button onClick={() => openCreateForm('head')} className="link-btn">Create one now</button></p>
                      )}
                    </div>
                  )}

                  {/* Committee Members Tab */}
                  {activeTab === 'members' && (
                    <div className="content-section">
                      <div className="section-header">
                        <h2 className="section-title">Committee Members</h2>
                        <button className="btn btn-primary" onClick={() => openCreateForm('member')}>
                          + Add Member
                        </button>
                      </div>
                      {committeeMembersGrouped.length > 0 ? (
                        <div>
                          {committeeMembersGrouped.map(group => (
                            <div key={group.committee._id} style={{ marginBottom: '2rem' }}>
                              <h3 style={{ marginBottom: '1rem', color: '#1a2a4a', fontSize: '1.25rem' }}>
                                {group.committee.name}
                              </h3>
                              <div className="hods-grid">
                                {group.members.map(member => (
                                  <div key={member._id} className="hod-admin-card">
                                    <div className="hod-admin-photo">
                                      <img
                                        src={member.photo}
                                        alt={member.name}
                                        onError={(e) => {
                                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=200&background=0b6b63&color=fff`
                                        }}
                                      />
                                    </div>
                                    <div className="hod-admin-info">
                                      <h3>{member.name}</h3>
                                      <div className="hod-admin-actions">
                                        <button className="btn btn-secondary btn-sm" onClick={() => openEditForm(member, 'member')}>
                                          Edit
                                        </button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(member._id, 'member')}>
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="empty-state">No committee members yet. <button onClick={() => openCreateForm('member')} className="link-btn">Create one now</button></p>
                      )}
                    </div>
                  )}
                </>
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
                  <h2>
                    {editingItem
                      ? `Edit ${formType === 'committee' ? 'Committee' : formType === 'executive' ? 'Executive Member' : formType === 'head' ? 'Committee Head' : 'Committee Member'}`
                      : `Create ${formType === 'committee' ? 'Committee' : formType === 'executive' ? 'Executive Member' : formType === 'head' ? 'Committee Head' : 'Committee Member'}`}
                  </h2>
                </div>
                <button className="modal-close" onClick={closeForm} aria-label="Close">×</button>
              </div>

              <div className="modal-body">
                <form onSubmit={handleSubmit} className="admin-form hod-form">
                  {error && (
                    <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="alert-icon">⚠️</span>
                      <span style={{ flex: 1 }}>{error}</span>
                      <button type="button" onClick={() => setError("")} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#c33', padding: '0', lineHeight: '1', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Dismiss error">×</button>
                    </div>
                  )}

                  {success && (
                    <div className="alert alert-success">
                      <span className="alert-icon">✓</span>
                      <span>{success}</span>
                    </div>
                  )}

                  {/* Committee Form */}
                  {formType === 'committee' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="name">Committee Name <span className="required">*</span></label>
                        <input id="name" type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Academic Committee" required className="form-input" disabled={isSubmitting} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="priority">Priority (Optional)</label>
                        <input id="priority" type="number" value={formData.priority !== null && formData.priority !== undefined ? formData.priority : ""} onChange={(e) => setFormData({ ...formData, priority: e.target.value ? parseInt(e.target.value) : null })} placeholder="Lower number = higher priority" className="form-input" disabled={isSubmitting} />
                        <small className="form-hint">Lower numbers appear first. Leave empty for no priority.</small>
                      </div>
                    </>
                  )}

                  {/* Executive Member Form */}
                  {formType === 'executive' && (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="name">Name <span className="required">*</span></label>
                          <input id="name" type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Ahmed Hassan" required className="form-input" disabled={isSubmitting} />
                        </div>
                        <div className="form-group">
                          <label htmlFor="role">Role <span className="required">*</span></label>
                          <select id="role" value={formData.role || ""} onChange={(e) => setFormData({ ...formData, role: e.target.value })} required className="form-input" disabled={isSubmitting}>
                            <option value="">Select Role</option>
                            {EXECUTIVE_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="email">Email <span className="required">*</span></label>
                          <input id="email" type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" required className="form-input" disabled={isSubmitting} />
                        </div>
                        <div className="form-group">
                          <label htmlFor="phone">Phone (Optional)</label>
                          <input id="phone" type="tel" value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+60 12-345-6789" className="form-input" disabled={isSubmitting} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="photo">Photo <span className="required">*</span></label>
                        <div className="upload-method-toggle">
                          <button type="button" className={`toggle-btn ${uploadMethod === 'file' ? 'active' : ''}`} onClick={() => { setUploadMethod('file'); setFormData({ ...formData, photo: '' }); setPhotoPreview(''); setPhotoFile(null) }} disabled={isSubmitting}>📁 Upload File</button>
                          <button type="button" className={`toggle-btn ${uploadMethod === 'url' ? 'active' : ''}`} onClick={() => { setUploadMethod('url'); setFormData({ ...formData, photo: '' }); setPhotoPreview(''); setPhotoFile(null) }} disabled={isSubmitting}>🔗 Enter URL</button>
                        </div>
                        <div className="photo-input-wrapper">
                          {uploadMethod === 'file' ? (
                            <div className="file-upload-area">
                              <input id="photo-file" type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleFileSelect} className="file-input" disabled={isSubmitting} />
                              <label htmlFor="photo-file" className="file-upload-label">
                                <div className="file-upload-content">
                                  <span className="file-upload-icon">📤</span>
                                  <div><strong>Click to select image</strong><p>or drag and drop</p></div>
                                  <small>JPG, PNG, GIF, or WEBP (max 5MB)</small>
                                </div>
                              </label>
                              {photoFile && <div className="file-selected"><span className="file-name">✓ {photoFile.name}</span><span className="file-size">({(photoFile.size / 1024 / 1024).toFixed(2)} MB)</span></div>}
                            </div>
                          ) : (
                            <input id="photo" type="url" value={formData.photo || ""} onChange={handlePhotoUrlChange} placeholder="https://example.com/photo.jpg" required className="form-input" disabled={isSubmitting} />
                          )}
                          {photoPreview && (
                            <div className="photo-preview">
                              <img src={photoPreview} alt="Preview" onError={(e) => { e.target.style.display = 'none'; const errorDiv = e.target.nextElementSibling; if (errorDiv) errorDiv.style.display = 'block' }} />
                              <div className="photo-preview-error" style={{ display: 'none' }}><span>⚠️ Invalid image</span></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Committee Head Form */}
                  {formType === 'head' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="name">Name <span className="required">*</span></label>
                        <input id="name" type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Dr. Ahmed Hassan" required className="form-input" disabled={isSubmitting} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="committeeId">Committee <span className="required">*</span></label>
                        <select id="committeeId" value={formData.committeeId || ""} onChange={(e) => setFormData({ ...formData, committeeId: e.target.value })} required className="form-input" disabled={isSubmitting}>
                          <option value="">Select Committee</option>
                          {committees.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="email">Email <span className="required">*</span></label>
                          <input id="email" type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" required className="form-input" disabled={isSubmitting} />
                        </div>
                        <div className="form-group">
                          <label htmlFor="phone">Phone (Optional)</label>
                          <input id="phone" type="tel" value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+60 12-345-6789" className="form-input" disabled={isSubmitting} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="photo">Photo <span className="required">*</span></label>
                        <div className="upload-method-toggle">
                          <button type="button" className={`toggle-btn ${uploadMethod === 'file' ? 'active' : ''}`} onClick={() => { setUploadMethod('file'); setFormData({ ...formData, photo: '' }); setPhotoPreview(''); setPhotoFile(null) }} disabled={isSubmitting}>📁 Upload File</button>
                          <button type="button" className={`toggle-btn ${uploadMethod === 'url' ? 'active' : ''}`} onClick={() => { setUploadMethod('url'); setFormData({ ...formData, photo: '' }); setPhotoPreview(''); setPhotoFile(null) }} disabled={isSubmitting}>🔗 Enter URL</button>
                        </div>
                        <div className="photo-input-wrapper">
                          {uploadMethod === 'file' ? (
                            <div className="file-upload-area">
                              <input id="photo-file" type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleFileSelect} className="file-input" disabled={isSubmitting} />
                              <label htmlFor="photo-file" className="file-upload-label">
                                <div className="file-upload-content">
                                  <span className="file-upload-icon">📤</span>
                                  <div><strong>Click to select image</strong><p>or drag and drop</p></div>
                                  <small>JPG, PNG, GIF, or WEBP (max 5MB)</small>
                                </div>
                              </label>
                              {photoFile && <div className="file-selected"><span className="file-name">✓ {photoFile.name}</span><span className="file-size">({(photoFile.size / 1024 / 1024).toFixed(2)} MB)</span></div>}
                            </div>
                          ) : (
                            <input id="photo" type="url" value={formData.photo || ""} onChange={handlePhotoUrlChange} placeholder="https://example.com/photo.jpg" required className="form-input" disabled={isSubmitting} />
                          )}
                          {photoPreview && (
                            <div className="photo-preview">
                              <img src={photoPreview} alt="Preview" onError={(e) => { e.target.style.display = 'none'; const errorDiv = e.target.nextElementSibling; if (errorDiv) errorDiv.style.display = 'block' }} />
                              <div className="photo-preview-error" style={{ display: 'none' }}><span>⚠️ Invalid image</span></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Committee Member Form */}
                  {formType === 'member' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="name">Name <span className="required">*</span></label>
                        <input id="name" type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Sarah Ali" required className="form-input" disabled={isSubmitting} />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="committeeId">Committee <span className="required">*</span></label>
                          <select id="committeeId" value={formData.committeeId || ""} onChange={(e) => setFormData({ ...formData, committeeId: e.target.value })} required className="form-input" disabled={isSubmitting}>
                            <option value="">Select Committee</option>
                            {committees.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label htmlFor="order">Display Order (Optional)</label>
                          <input id="order" type="number" value={formData.order || 0} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} min="0" className="form-input" disabled={isSubmitting} />
                          <small className="form-hint">Lower numbers appear first</small>
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="photo">Photo <span className="required">*</span></label>
                        <div className="upload-method-toggle">
                          <button type="button" className={`toggle-btn ${uploadMethod === 'file' ? 'active' : ''}`} onClick={() => { setUploadMethod('file'); setFormData({ ...formData, photo: '' }); setPhotoPreview(''); setPhotoFile(null) }} disabled={isSubmitting}>📁 Upload File</button>
                          <button type="button" className={`toggle-btn ${uploadMethod === 'url' ? 'active' : ''}`} onClick={() => { setUploadMethod('url'); setFormData({ ...formData, photo: '' }); setPhotoPreview(''); setPhotoFile(null) }} disabled={isSubmitting}>🔗 Enter URL</button>
                        </div>
                        <div className="photo-input-wrapper">
                          {uploadMethod === 'file' ? (
                            <div className="file-upload-area">
                              <input id="photo-file" type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleFileSelect} className="file-input" disabled={isSubmitting} />
                              <label htmlFor="photo-file" className="file-upload-label">
                                <div className="file-upload-content">
                                  <span className="file-upload-icon">📤</span>
                                  <div><strong>Click to select image</strong><p>or drag and drop</p></div>
                                  <small>JPG, PNG, GIF, or WEBP (max 5MB)</small>
                                </div>
                              </label>
                              {photoFile && <div className="file-selected"><span className="file-name">✓ {photoFile.name}</span><span className="file-size">({(photoFile.size / 1024 / 1024).toFixed(2)} MB)</span></div>}
                            </div>
                          ) : (
                            <input id="photo" type="url" value={formData.photo || ""} onChange={handlePhotoUrlChange} placeholder="https://example.com/photo.jpg" required className="form-input" disabled={isSubmitting} />
                          )}
                          {photoPreview && (
                            <div className="photo-preview">
                              <img src={photoPreview} alt="Preview" onError={(e) => { e.target.style.display = 'none'; const errorDiv = e.target.nextElementSibling; if (errorDiv) errorDiv.style.display = 'block' }} />
                              <div className="photo-preview-error" style={{ display: 'none' }}><span>⚠️ Invalid image</span></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={closeForm} disabled={isSubmitting}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="spinner"></span>
                          {editingItem ? "Saving..." : "Creating..."}
                        </>
                      ) : (
                        <>
                          <span className="btn-icon">{editingItem ? "✏️" : "➕"}</span>
                          {editingItem ? "Update" : "Create"}
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
