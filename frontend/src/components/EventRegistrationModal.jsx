import { useState, useEffect } from "react"
import { registerForEvent, unregisterFromEvent } from "../api/events.js"
import { downloadReceipt, shareReceipt } from "../api/receipts.js"
import "../styles/event-registration-modal.css"

export default function EventRegistrationModal({ event, isOpen, onClose, onRegistrationChange, user }) {
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const [shareUrl, setShareUrl] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    matricNumber: '',
    phone: '',
    notes: ''
  })
  const [receiptFile, setReceiptFile] = useState(null)

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen && event && user) {
      console.log('Modal opened with event:', event?.title)
      setError(null)
      setReceipt(null)
      setShareUrl(null)
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        matricNumber: '',
        phone: '',
        notes: ''
      })
      setReceiptFile(null)
      
      // Check if user is already registered
      const isUserRegistered = event.registeredUsers?.some(regUser => 
        typeof regUser === 'object' ? regUser._id === user?.id : regUser === user?.id
      )
      
      // Automatically show form for unregistered events
      setShowForm(!isUserRegistered)
    } else {
      console.log('Modal state - isOpen:', isOpen, 'event:', event)
      setShowForm(false)
    }
  }, [isOpen, event, user])

  if (!isOpen || !event) {
    console.log('Modal not rendering - isOpen:', isOpen, 'event:', event)
    return null
  }

  // STRICT ACCESS CONTROL: Only allow member or admin role accounts to access registration
  // Non-logged-in users (user === null) will see nothing (return null)
  // This prevents non-logged-in users from registering even if they somehow access the modal
  if (!user || (user.role !== 'member' && user.role !== 'admin')) {
    console.log('[EventRegistrationModal] Access denied - user:', user ? user.role : 'not logged in')
    return null
  }

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

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.name.trim()) {
      setError('Please enter your name')
      return
    }
    if (!formData.email.trim()) {
      setError('Please enter your email')
      return
    }
    if (!formData.matricNumber.trim()) {
      setError('Please enter your matric number')
      return
    }
    if (!formData.phone.trim()) {
      setError('Please enter your phone number')
      return
    }
    const requiresPayment = (event.requiresPayment && event.paymentAmount > 0) || (event.fee && event.fee > 0)
    const paymentAmount = event.paymentAmount || event.fee || 0
    
    if (requiresPayment && paymentAmount > 0) {
      if (!receiptFile) {
        setError('Please upload your payment receipt (PDF or Image)')
        return
      }
    }

    try {
      setRegistering(true)
      setError(null)
      setReceipt(null)
      
      // Prepare registration data as FormData to support file upload
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name.trim())
      formDataToSend.append('email', formData.email.trim())
      formDataToSend.append('matricNumber', formData.matricNumber.trim())
      formDataToSend.append('phone', formData.phone.trim())
      formDataToSend.append('notes', formData.notes.trim())
      const requiresPayment = (event.requiresPayment && event.paymentAmount > 0) || (event.fee && event.fee > 0)
      if (requiresPayment) {
        // Default payment method for QR code / bank transfer
        formDataToSend.append('paymentMethod', 'QR Code / Bank Transfer')
        if (receiptFile) {
          formDataToSend.append('receipt', receiptFile)
        }
      }
      
      const response = await registerForEvent(event._id, formDataToSend)
      
      // If receipt was generated, show it
      if (response.receipt) {
        setReceipt(response.receipt)
        setShowForm(false) // Hide form after successful registration
      }
      
      if (onRegistrationChange) {
        await onRegistrationChange()
      }
      
      // Don't close immediately if receipt was generated - let user download it
      if (!response.receipt) {
        onClose()
      }
    } catch (err) {
      console.error("Failed to register for event:", err)
      setError(err.message || "Failed to register for event")
    } finally {
      setRegistering(false)
    }
  }

  const handleReceiptFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type - allow PDF and images
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp']
      const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
        setError('Please upload a PDF or image file (JPG, PNG, GIF, WEBP) for the receipt')
        return
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Receipt file size must be less than 5MB')
        return
      }
      setReceiptFile(file)
      setError(null)
    }
  }

  const handleRegister = () => {
    // Show form instead of registering immediately
    setShowForm(true)
    setError(null)
    setReceipt(null)
  }

  async function handleDownloadReceipt() {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
      const userId = user?.id
      const downloadUrl = `${API_BASE_URL}/api/receipts/event/${event._id}/download${userId ? `?userId=${userId}` : ''}`
      // Open in new window - cookies will be sent automatically
      window.open(downloadUrl, '_blank')
    } catch (err) {
      console.error("Failed to download receipt:", err)
      alert("Failed to download receipt: " + (err.message || "Unknown error"))
    }
  }

  async function handleShareReceipt() {
    try {
      const response = await shareReceipt(event._id)
      setShareUrl(response.shareUrl)
      // Copy to clipboard
      await navigator.clipboard.writeText(response.shareUrl)
      alert("Shareable link copied to clipboard!")
    } catch (err) {
      console.error("Failed to share receipt:", err)
      alert("Failed to generate share link: " + (err.message || "Unknown error"))
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
            {((event.requiresPayment && event.paymentAmount > 0) || (event.fee && event.fee > 0)) && (
              <div className="event-detail-row" style={{ 
                background: '#fff3cd', 
                padding: '0.75rem', 
                borderRadius: '6px',
                marginTop: '0.5rem',
                border: '1px solid #ffc107'
              }}>
                <span className="detail-label">💰 Payment Required:</span>
                <span className="detail-value" style={{ fontWeight: 'bold', color: '#856404' }}>
                  RM {(event.paymentAmount || event.fee || 0).toFixed(2)}
                </span>
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
              {isRegistered || receipt ? (
                <>
                  <div className="registration-status registered">
                    <span className="status-icon">✓</span>
                    <div className="status-content">
                      <strong>You are registered for this event</strong>
                      <p>You will receive event updates and reminders.</p>
                    </div>
                  </div>
                  
                  {/* Registration Details Section */}
                  {(() => {
                    // Find user's registration details
                    const registration = event.registrations?.find(reg => {
                      const regUserId = typeof reg.user === 'object' ? reg.user._id?.toString() : reg.user?.toString()
                      return regUserId === user?.id?.toString()
                    })
                    
                    if (!registration) return null
                    
                    return (
                      <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #dee2e6'
                      }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600', color: '#1e3a8a' }}>
                          📋 Registration Details
                        </h4>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr',
                          gap: '0.75rem 1.5rem',
                          fontSize: '0.9rem'
                        }}>
                          {registration.registrationName && (
                            <>
                              <span style={{ fontWeight: '600', color: '#666' }}>Name:</span>
                              <span style={{ color: '#333' }}>{registration.registrationName}</span>
                            </>
                          )}
                          {registration.registrationEmail && (
                            <>
                              <span style={{ fontWeight: '600', color: '#666' }}>Email:</span>
                              <span style={{ color: '#333' }}>{registration.registrationEmail}</span>
                            </>
                          )}
                          {registration.matricNumber && (
                            <>
                              <span style={{ fontWeight: '600', color: '#666' }}>Matric Number:</span>
                              <span style={{ color: '#333' }}>{registration.matricNumber}</span>
                            </>
                          )}
                          {registration.phone && (
                            <>
                              <span style={{ fontWeight: '600', color: '#666' }}>Phone:</span>
                              <span style={{ color: '#333' }}>{registration.phone}</span>
                            </>
                          )}
                          {registration.registeredAt && (
                            <>
                              <span style={{ fontWeight: '600', color: '#666' }}>Registered At:</span>
                              <span style={{ color: '#333' }}>{formatDate(registration.registeredAt)}</span>
                            </>
                          )}
                          {registration.notes && (
                            <>
                              <span style={{ fontWeight: '600', color: '#666' }}>Notes:</span>
                              <span style={{ color: '#333', fontStyle: 'italic' }}>{registration.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                  
                  {/* Receipt Section */}
                  {(() => {
                    // Get receipt from registration or from state
                    const registration = event.registrations?.find(reg => {
                      const regUserId = typeof reg.user === 'object' ? reg.user._id?.toString() : reg.user?.toString()
                      return regUserId === user?.id?.toString()
                    })
                    const receiptData = receipt || registration?.paymentReceipt
                    
                    if (!receiptData) return null
                    
                    return (
                      <div className="receipt-section" style={{ 
                        marginTop: '1.5rem', 
                        padding: '1rem', 
                        background: '#f0f9ff', 
                        borderRadius: '8px',
                        border: '1px solid #1e3a8a'
                      }}>
                        <h4 style={{ margin: '0 0 0.75rem 0', color: '#1e3a8a', fontWeight: '600' }}>
                          🧾 Payment Receipt
                        </h4>
                        
                        {/* Receipt Details */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr',
                          gap: '0.5rem 1rem',
                          fontSize: '0.9rem',
                          marginBottom: '1rem'
                        }}>
                          {receiptData.receiptNumber && (
                            <>
                              <span style={{ fontWeight: '600', color: '#666' }}>Receipt Number:</span>
                              <span style={{ color: '#333' }}><strong>{receiptData.receiptNumber}</strong></span>
                            </>
                          )}
                          {receiptData.amount > 0 && (
                            <>
                              <span style={{ fontWeight: '600', color: '#666' }}>Amount:</span>
                              <span style={{ color: '#856404', fontWeight: '600' }}>RM {receiptData.amount.toFixed(2)}</span>
                            </>
                          )}
                          {receiptData.paymentMethod && (
                            <>
                              <span style={{ fontWeight: '600', color: '#666' }}>Payment Method:</span>
                              <span style={{ color: '#333' }}>{receiptData.paymentMethod}</span>
                            </>
                          )}
                          {receiptData.paymentStatus && (
                            <>
                              <span style={{ fontWeight: '600', color: '#666' }}>Status:</span>
                              <span style={{ 
                                color: receiptData.paymentStatus === 'Verified' ? '#155724' : 
                                       receiptData.paymentStatus === 'Rejected' ? '#721c24' : '#856404',
                                fontWeight: '600'
                              }}>
                                {receiptData.paymentStatus === 'Verified' ? '✅ Verified' :
                                 receiptData.paymentStatus === 'Rejected' ? '❌ Rejected' :
                                 '⏳ Pending'}
                              </span>
                            </>
                          )}
                          {receiptData.generatedAt && (
                            <>
                              <span style={{ fontWeight: '600', color: '#666' }}>Generated:</span>
                              <span style={{ color: '#333' }}>{formatDate(receiptData.generatedAt)}</span>
                            </>
                          )}
                        </div>
                        
                        {/* Display Uploaded Receipt File */}
                        {receiptData.receiptUrl && (() => {
                          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
                          const receiptFileUrl = receiptData.receiptUrl.startsWith('http') 
                            ? receiptData.receiptUrl 
                            : `${apiBaseUrl}${receiptData.receiptUrl}`
                          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(receiptData.receiptUrl)
                          const isPDF = /\.pdf$/i.test(receiptData.receiptUrl)
                          
                          return (
                            <div style={{
                              marginTop: '1rem',
                              padding: '1rem',
                              background: '#fff',
                              borderRadius: '6px',
                              border: '1px solid #dee2e6'
                            }}>
                              <h5 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: '600', color: '#1e3a8a' }}>
                                📎 Uploaded Receipt File
                              </h5>
                              {isImage ? (
                                <div style={{ textAlign: 'center' }}>
                                  <img 
                                    src={receiptFileUrl}
                                    alt="Payment Receipt"
                                    style={{
                                      maxWidth: '100%',
                                      maxHeight: '400px',
                                      border: '1px solid #dee2e6',
                                      borderRadius: '6px',
                                      marginBottom: '0.75rem'
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = 'none'
                                      e.target.nextSibling.style.display = 'block'
                                    }}
                                  />
                                  <div style={{ display: 'none', color: '#721c24', fontSize: '0.85rem' }}>
                                    Failed to load image. <a href={receiptFileUrl} target="_blank" rel="noopener noreferrer">Click here to view</a>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ textAlign: 'center' }}>
                                  <p style={{ margin: '0 0 0.75rem 0', color: '#666' }}>PDF Receipt File</p>
                                  <a 
                                    href={receiptFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary"
                                    style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', textDecoration: 'none', display: 'inline-block' }}
                                  >
                                    📄 View PDF Receipt
                                  </a>
                                </div>
                              )}
                              <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                                <a 
                                  href={receiptFileUrl}
                                  download
                                  style={{ fontSize: '0.85rem', color: '#1e3a8a', textDecoration: 'none' }}
                                >
                                  ⬇️ Download Receipt File
                                </a>
                              </div>
                            </div>
                          )
                        })()}
                        
                        {/* Receipt Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                          <button
                            className="btn btn-primary"
                            onClick={handleDownloadReceipt}
                            style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                          >
                            📥 Download Official Receipt
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={handleShareReceipt}
                            style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                          >
                            🔗 Share Receipt
                          </button>
                          {shareUrl && (
                            <input
                              type="text"
                              value={shareUrl}
                              readOnly
                              style={{ 
                                flex: 1, 
                                padding: '0.5rem', 
                                border: '1px solid #ccc', 
                                borderRadius: '4px',
                                fontSize: '0.85rem'
                              }}
                              onClick={(e) => e.target.select()}
                            />
                          )}
                        </div>
                      </div>
                    )
                  })()}
                  
                  <div className="registration-form-actions" style={{ marginTop: '1rem' }}>
                    <button
                      className="btn btn-secondary btn-full"
                      onClick={() => {
                        setReceipt(null)
                        setShareUrl(null)
                        setShowForm(false)
                        onClose()
                      }}
                    >
                      Close
                    </button>
                    {!receipt && (
                      <button
                        className="btn btn-secondary btn-full"
                        onClick={handleUnregister}
                        disabled={registering}
                      >
                        {registering ? "Unregistering..." : "Unregister from Event"}
                      </button>
                    )}
                  </div>
                </>
              ) : !showForm ? (
                <>
                  {((event.requiresPayment && event.paymentAmount > 0) || (event.fee && event.fee > 0)) && (
                    <div className="registration-info" style={{ 
                      background: '#e7f3ff', 
                      padding: '1rem', 
                      borderRadius: '6px',
                      marginBottom: '1rem',
                      border: '1px solid #1e3a8a'
                    }}>
                      <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#1e3a8a' }}>
                        💳 Payment Information
                      </p>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                        This event requires a payment of <strong>RM {(event.paymentAmount || event.fee || 0).toFixed(2)}</strong>.
                        A payment receipt will be generated upon registration and will be pending admin verification.
                      </p>
                    </div>
                  )}
                  <div className="registration-info">
                    <p>By registering for this event, you confirm that:</p>
                    <ul className="registration-terms">
                      <li>You will attend the event on the scheduled date and time</li>
                      <li>You understand the event location and requirements</li>
                      <li>You will notify organizers if you cannot attend</li>
                      {((event.requiresPayment && event.paymentAmount > 0) || (event.fee && event.fee > 0)) && (
                        <li>You understand that payment verification is required before event participation</li>
                      )}
                    </ul>
                  </div>
                  <div className="registration-form-actions">
                    <button
                      className="btn btn-primary btn-full"
                      onClick={handleRegister}
                      disabled={registering}
                    >
                      {((event.requiresPayment && event.paymentAmount > 0) || (event.fee && event.fee > 0))
                        ? `Register & Pay RM ${(event.paymentAmount || event.fee || 0).toFixed(2)}` 
                        : "Register for Event"}
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleFormSubmit} className="registration-form">
                  <h4 style={{ marginBottom: '1rem', color: '#1e3a8a' }}>Registration Form</h4>
                  
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="matricNumber">Matric Number *</label>
                    <input
                      type="text"
                      id="matricNumber"
                      name="matricNumber"
                      value={formData.matricNumber}
                      onChange={handleFormChange}
                      required
                      placeholder="Enter your matric number"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      required
                      placeholder="Enter your phone number"
                    />
                  </div>

                  {((event.requiresPayment && event.paymentAmount > 0) || (event.fee && event.fee > 0)) && (
                    <>
                      <div className="payment-summary" style={{
                        background: '#fff3cd',
                        padding: '1rem',
                        borderRadius: '6px',
                        marginBottom: '1rem',
                        border: '2px solid #ffc107'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1rem' }}>
                          <span style={{ fontWeight: '600' }}>Registration Fee:</span>
                          <strong style={{ fontSize: '1.2rem', color: '#856404' }}>RM {(event.paymentAmount || event.fee || 0).toFixed(2)}</strong>
                        </div>
                      </div>

                      <div className="qr-code-section" style={{
                        background: '#f0f9ff',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        border: '2px solid #1e3a8a',
                        textAlign: 'center'
                      }}>
                        <p style={{ margin: '0 0 1rem 0', fontWeight: '600', color: '#1e3a8a', fontSize: '1.1rem' }}>
                          💳 Payment QR Code
                        </p>
                        {(() => {
                          // Default QR code file for paid events
                          const defaultQrCode = '/uploads/qr/1767293083911-qr pay.png'
                          const qrCodePath = event.qrCodeUrl || defaultQrCode
                          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
                          
                          // Build the URL - encodeURI handles spaces in paths correctly
                          const qrCodeUrl = `${apiBaseUrl}${encodeURI(qrCodePath)}`
                          
                          return (
                            <img 
                              src={qrCodeUrl}
                              alt="Payment QR Code"
                              style={{
                                maxWidth: '250px',
                                width: '100%',
                                height: 'auto',
                                border: '2px solid #1e3a8a',
                                borderRadius: '8px',
                                backgroundColor: '#fff',
                                padding: '0.75rem',
                                marginBottom: '1rem',
                                display: 'block'
                              }}
                            />
                          )
                        })()}
                        <div style={{
                          background: '#fff',
                          padding: '1rem',
                          borderRadius: '6px',
                          border: '1px solid #ddd',
                          marginTop: '1rem'
                        }}>
                          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666', fontWeight: '600' }}>
                            Or transfer to account number:
                          </p>
                          <p style={{ 
                            margin: 0, 
                            fontSize: '1.1rem', 
                            color: '#1e3a8a', 
                            fontWeight: '700',
                            fontFamily: 'monospace',
                            letterSpacing: '2px'
                          }}>
                            1234567890
                          </p>
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                            Bank: [Bank Name]
                          </p>
                        </div>
                        <p style={{ margin: '1rem 0 0 0', fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>
                          Scan QR code or transfer to the account number above
                        </p>
                      </div>

                      <div className="form-group">
                        <label htmlFor="receipt">Transaction Proof (PDF or Image) *</label>
                        <input
                          type="file"
                          id="receipt"
                          name="receipt"
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,application/pdf,image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleReceiptFileChange}
                          required
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            backgroundColor: '#fff'
                          }}
                        />
                        {receiptFile && (
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#28a745' }}>
                            ✓ Selected: {receiptFile.name}
                          </p>
                        )}
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                          Please upload your transaction proof (PDF, JPG, PNG, GIF, or WEBP - Max 5MB)
                        </p>
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label htmlFor="notes">Additional Notes</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleFormChange}
                      rows="3"
                      placeholder="Any special requirements or notes (optional)"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div className="registration-form-actions" style={{ marginTop: '1.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowForm(false)
                        setError(null)
                        setReceiptFile(null)
                      }}
                      disabled={registering}
                      style={{ marginRight: '0.5rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={registering}
                    >
                      {registering ? "Registering..." : ((event.requiresPayment && event.paymentAmount > 0) || (event.fee && event.fee > 0))
                        ? `Complete Registration & Pay RM ${(event.paymentAmount || event.fee || 0).toFixed(2)}` 
                        : "Complete Registration"}
                    </button>
                  </div>
                </form>
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

