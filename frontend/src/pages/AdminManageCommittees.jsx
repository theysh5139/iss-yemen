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
const COMMITTEE_OPTIONS = [
  'Head of Academic',
  'Head of Social',
  'Head of Culture',
  'Head of Sports',
  'Head of Logistics',
  'Head of YSAG'
]

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
    
    // Initialize form data based on type
    if (type === 'committee') {
      setFormData({ name: "", description: "" })
    } else if (type === 'executive') {
      setFormData({ name: "", role: "", photo: "", email: "", phone: "", order: 0 })
    } else if (type === 'head') {
      setFormData({ name: "", committee: "", photo: "", email: "", phone: "", order: 0 })
    } else if (type === 'member') {
      setFormData({ name: "", committee: "", position: "", photo: "", email: "", phone: "", order: 0 })
    }
    
    setShowForm(true)
    setActiveTab(type === 'committee' ? 'committees' : type === 'executive' ? 'executive' : type === 'head' ? 'heads' : 'members')
  }

  function openEditForm(item, type) {
    setFormType(type)
    setEditingItem(item)
    setError("")
    setSuccess("")
    setPhotoPreview(item.photo || "")
    setPhotoFile(null)
    setUploadMethod("url")
    // Normalize committee field to use committeeId (backend expects committeeId)
    const normalized = { ...item }
    if ((type === 'head' || type === 'member')) {
      // Keep committeeId if present, and also populate committee text for the input
      normalized.committee = normalized.committeeId?.name || normalized.committee || ""
    }
    setFormData(normalized)
    setShowForm(true)
    setActiveTab(type === 'committee' ? 'committees' : type === 'executive' ? 'executive' : type === 'head' ? 'heads' : 'members')
  }

  function closeForm() {
    setShowForm(false)
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

  async function handleSubmit(e) {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Form submitted:', { formType, formData, editingItem })
    
    setError("")
    setSuccess("")
    
    // Get form element and check HTML5 validation
    const form = e.target
    if (!form.checkValidity()) {
      // HTML5 validation failed, let it show native messages
      form.reportValidity()
      return
    }
    
    // Simple validation - HTML5 required attributes should handle most cases

    setIsSubmitting(true)
    // Prepare payload: prefer sending committeeId if available, otherwise send committee name
    const payload = { ...formData }
    if (formType === 'head' || formType === 'member') {
      if (formData.committeeId) {
        payload.committeeId = formData.committeeId
      } else if (formData.committee) {
        payload.committee = formData.committee
      }
    }
    console.log('Validation passed, submitting with payload:', payload)

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
          result = await updateCommitteeHead(editingItem._id, payload)
          setSuccess("✓ Committee head updated successfully!")
        } else {
          result = await createCommitteeHead(payload)
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
            <div className="tabs-container" style={{ marginBottom: '2rem', borderBottom: '2px solid #e0e0e0', display: 'flex', gap: '0' }}>
              <button
                className={`tab-button ${activeTab === 'committees' ? 'active' : ''}`}
                onClick={() => setActiveTab('committees')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: activeTab === 'committees' ? '#4a6fa5' : 'transparent',
                  color: activeTab === 'committees' ? 'white' : '#666',
                  border: 'none',
                  borderBottom: activeTab === 'committees' ? '3px solid #4a6fa5' : '3px solid transparent',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'committees' ? '600' : '400',
                  transition: 'all 0.3s ease'
                }}
              >
                📋 Committees
              </button>
              <button
                className={`tab-button ${activeTab === 'executive' ? 'active' : ''}`}
                onClick={() => setActiveTab('executive')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: activeTab === 'executive' ? '#4a6fa5' : 'transparent',
                  color: activeTab === 'executive' ? 'white' : '#666',
                  border: 'none',
                  borderBottom: activeTab === 'executive' ? '3px solid #4a6fa5' : '3px solid transparent',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'executive' ? '600' : '400',
                  transition: 'all 0.3s ease'
                }}
              >
                👔 Executive Members
              </button>
              <button
                className={`tab-button ${activeTab === 'heads' ? 'active' : ''}`}
                onClick={() => setActiveTab('heads')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: activeTab === 'heads' ? '#4a6fa5' : 'transparent',
                  color: activeTab === 'heads' ? 'white' : '#666',
                  border: 'none',
                  borderBottom: activeTab === 'heads' ? '3px solid #4a6fa5' : '3px solid transparent',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'heads' ? '600' : '400',
                  transition: 'all 0.3s ease'
                }}
              >
                ⚙️ Committee Heads
              </button>
              <button
                className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
                onClick={() => setActiveTab('members')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: activeTab === 'members' ? '#4a6fa5' : 'transparent',
                  color: activeTab === 'members' ? 'white' : '#666',
                  border: 'none',
                  borderBottom: activeTab === 'members' ? '3px solid #4a6fa5' : '3px solid transparent',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'members' ? '600' : '400',
                  transition: 'all 0.3s ease'
                }}
              >
                👥 Committee Members
              </button>
            </div>

            {/* Committees Tab */}
            {activeTab === 'committees' && (
              <div className="content-section">
                <div className="section-header">
                  <h2 className="section-title">Committees</h2>
                  <button className="btn btn-primary" onClick={() => openCreateForm('committee')}>
                    + Add Committee
                  </button>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem', width: '40px', height: '40px', borderWidth: '3px' }}></div>
                    <p>Loading committees...</p>
                  </div>
                ) : committees.length > 0 ? (
                  <div className="hods-grid">
                    {committees.map(committee => (
                      <div key={committee._id} className="hod-admin-card">
                        <div className="hod-admin-info">
                          <h3>{committee.name}</h3>
                          {committee.description && <p>{committee.description}</p>}
                          <div className="hod-admin-actions">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEditForm(committee, 'committee')}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(committee._id, 'committee')}
                            >
                              Delete
                            </button>
                          </div>
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
                  <h2 className="section-title">Executive Members</h2>
                  <button className="btn btn-primary" onClick={() => openCreateForm('executive')}>
                    + Add Executive Member
                  </button>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem', width: '40px', height: '40px', borderWidth: '3px' }}></div>
                    <p>Loading executive members...</p>
                  </div>
                ) : executiveMembers.length > 0 ? (
                  <div className="hods-grid">
                    {executiveMembers.map(member => (
                      <div key={member._id} className="hod-admin-card">
                        {member.photo && (
                          <div className="hod-admin-photo">
                            <img
                              src={member.photo}
                              alt={member.name}
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=200&background=4a6fa5&color=fff`
                              }}
                            />
                          </div>
                        )}
                        <div className="hod-admin-info">
                          <h3>{member.name}</h3>
                          <p>{member.role}</p>
                          {member.email && <p style={{ fontSize: '0.875rem', color: '#666' }}>{member.email}</p>}
                          <div className="hod-admin-actions">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEditForm(member, 'executive')}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(member._id, 'executive')}
                            >
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

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem', width: '40px', height: '40px', borderWidth: '3px' }}></div>
                    <p>Loading committee heads...</p>
                  </div>
                ) : committeeHeads.length > 0 ? (
                  <div className="hods-grid">
                    {committeeHeads.map(head => (
                      <div key={head._id} className="hod-admin-card">
                        {head.photo && (
                          <div className="hod-admin-photo">
                            <img
                              src={head.photo}
                              alt={head.name}
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(head.name)}&size=200&background=4a6fa5&color=fff`
                              }}
                            />
                          </div>
                        )}
                        <div className="hod-admin-info">
                          <h3>{head.name}</h3>
                          <p>{head.committeeId?.name || head.committee || ''}</p>
                          {head.email && <p style={{ fontSize: '0.875rem', color: '#666' }}>{head.email}</p>}
                          <div className="hod-admin-actions">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEditForm(head, 'head')}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(head._id, 'head')}
                            >
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
                    + Add Committee Member
                  </button>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem', width: '40px', height: '40px', borderWidth: '3px' }}></div>
                    <p>Loading committee members...</p>
                  </div>
                ) : committeeMembersGrouped.length > 0 ? (
                  <div>
                    {committeeMembersGrouped.map(group => (
                      <div key={group.committee} style={{ marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#4a6fa5' }}>{group.committee}</h3>
                        <div className="hods-grid">
                          {group.members.map(member => (
                            <div key={member._id} className="hod-admin-card">
                              {member.photo && (
                                <div className="hod-admin-photo">
                                  <img
                                    src={member.photo}
                                    alt={member.name}
                                    onError={(e) => {
                                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=200&background=4a6fa5&color=fff`
                                    }}
                                  />
                                </div>
                              )}
                              <div className="hod-admin-info">
                                <h3>{member.name}</h3>
                                <p>{member.position}</p>
                                {member.email && <p style={{ fontSize: '0.875rem', color: '#666' }}>{member.email}</p>}
                                <div className="hod-admin-actions">
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => openEditForm(member, 'member')}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(member._id, 'member')}
                                  >
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
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={closeForm}>
            <div className="modal-content hod-form-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>
                    {editingItem ? `Edit ${formType === 'committee' ? 'Committee' : formType === 'executive' ? 'Executive Member' : formType === 'head' ? 'Committee Head' : 'Committee Member'}` : 
                     `Create ${formType === 'committee' ? 'Committee' : formType === 'executive' ? 'Executive Member' : formType === 'head' ? 'Committee Head' : 'Committee Member'}`}
                  </h2>
                </div>
                <button className="modal-close" onClick={closeForm}>×</button>
              </div>

              <div className="modal-body">
                <form onSubmit={handleSubmit} className="admin-form">
                  {error && (
                    <div className="alert alert-error">
                      <span className="alert-icon">⚠️</span>
                      <span>{error}</span>
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
                        <label>Name <span className="required">*</span></label>
                        <input
                          type="text"
                          value={formData.name || ""}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="form-input"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          value={formData.description || ""}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows="3"
                          className="form-input"
                          disabled={isSubmitting}
                        />
                      </div>
                    </>
                  )}

                  {/* Executive/Head/Member Form */}
                  {(formType === 'executive' || formType === 'head' || formType === 'member') && (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Name <span className="required">*</span></label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name || ""}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="form-input"
                            disabled={isSubmitting}
                          />
                        </div>
                        {formType === 'executive' && (
                          <div className="form-group">
                            <label>Role <span className="required">*</span></label>
                            <select
                              name="role"
                              value={formData.role || ""}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                              required
                              className="form-input"
                              disabled={isSubmitting}
                            >
                              <option value="">Select Role</option>
                              {EXECUTIVE_ROLES.map(role => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          </div>
                        )}
                          {(formType === 'head' || formType === 'member') && (
                          <div className="form-group">
                            <label>Committee <span className="required">*</span></label>
                              <input
                                type="text"
                                name="committee"
                                value={formData.committee || ""}
                                onChange={(e) => {
                                  const committeeValue = e.target.value
                                  setFormData({ ...formData, committee: committeeValue })
                                  if (committeeValue && error && error.includes("Committee")) {
                                    setError("")
                                  }
                                }}
                                placeholder="e.g., Head of Academic, Head of Social, etc."
                                className="form-input"
                                disabled={isSubmitting}
                              />
                            <small className="form-hint" style={{ marginTop: '0.5rem', color: '#666' }}>
                              Suggested: Head of Academic, Head of Social, Head of Culture, Head of Sports, Head of Logistics, Head of YSAG
                            </small>
                          </div>
                        )}
                      </div>
                      {formType === 'member' && (
                        <div className="form-group">
                          <label>Position</label>
                          <input
                            type="text"
                            name="position"
                            value={formData.position || ""}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            className="form-input"
                            disabled={isSubmitting}
                          />
                        </div>
                      )}
                      <div className="form-row">
                        <div className="form-group">
                          <label>Email</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email || ""}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="form-input"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="form-group">
                          <label>Phone</label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone || ""}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="form-input"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Photo</label>
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
                            <div className="file-upload-area">
                              <input
                                id={`photo-file-input-${formType}-${editingItem?._id || 'new'}`}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                onChange={handleFileSelect}
                                className="file-input"
                                disabled={isSubmitting}
                              />
                              <label 
                                htmlFor={`photo-file-input-${formType}-${editingItem?._id || 'new'}`}
                                className="file-upload-label"
                                style={{ 
                                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                  pointerEvents: isSubmitting ? 'none' : 'auto'
                                }}
                              >
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
                              type="url"
                              value={formData.photo || ""}
                              onChange={handlePhotoUrlChange}
                              placeholder="https://example.com/photo.jpg"
                              className="form-input"
                              disabled={isSubmitting}
                            />
                          )}
                          {photoPreview && (
                            <div className="photo-preview">
                              <img src={photoPreview} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Display Order</label>
                        <input
                          type="number"
                          value={formData.order || 0}
                          onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                          min="0"
                          className="form-input"
                          disabled={isSubmitting}
                        />
                        <small className="form-hint">Lower numbers appear first</small>
                      </div>
                    </>
                  )}

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
                      onClick={(e) => {
                        console.log('Create/Update button clicked')
                        if (!e.defaultPrevented) {
                          // Form will handle submission via onSubmit
                        }
                      }}
                      style={{
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        pointerEvents: isSubmitting ? 'none' : 'auto'
                      }}
                    >
                      {isSubmitting ? "Saving..." : (editingItem ? "Update" : "Create")}
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
