import { useState, useEffect } from "react"
import AdminSidebar from "../components/AdminSidebar.jsx"
import AdminHeaderIcons from "../components/AdminHeaderIcons.jsx"
import { useAuth } from "../context/AuthProvider.jsx"
import { logoutApi } from "../api/auth.js"
import { useNavigate } from "react-router-dom"
import "../styles/admin-dashboard.css"
import "../styles/admin-forms.css"
import "../styles/admin-settings.css"

export default function AdminSettings() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Settings state
  const [settings, setSettings] = useState({
    siteName: 'ISS Yemen',
    siteDescription: 'International Student Society Yemen',
    contactEmail: 'admin@issyemen.com',
    maintenanceMode: false,
    allowRegistrations: true,
    sessionTimeout: 60,
    emailNotifications: true,
    maxFileSize: 5,
    enableChatbot: true
  })

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate("/dashboard", { replace: true })
    }
  }, [user, navigate])

  async function onLogout() {
    try {
      await logoutApi()
    } catch {}
    setUser(null)
    navigate("/", { replace: true })
  }

  function handleSettingChange(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  async function handleSaveSettings() {
    setSaving(true)
    setSuccessMessage('')
    setErrorMessage('')
    
    try {
      // Simulate API call (replace with actual API endpoint when available)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // In a real implementation, you would call an API here:
      // await updateSettingsApi(settings)
      
      setSuccessMessage('Settings saved successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      setErrorMessage('Failed to save settings. Please try again.')
      setTimeout(() => setErrorMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (user?.role !== 'admin') {
    return null
  }

  return (
    <div className="admin-dashboard">
      <AdminSidebar user={user} onLogout={onLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}
      
      <div className="admin-main-content">
        <header className="admin-header">
          <div className="header-left">
            <button className="menu-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
              <span className="hamburger-icon">☰</span>
            </button>
          <div className="breadcrumbs">
            <span>Dashboard &gt; Settings & Help</span>
          </div>
          </div>
          <AdminHeaderIcons user={user} />
        </header>

        <div className="admin-content">
          <div className="main-section">
            <div className="page-title">
              <h1>Settings & Help</h1>
              <p>Configure website settings and manage system preferences</p>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
              <div className="success-message settings-message">
                <span>✅</span>
                <span>{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="error-message settings-message">
                <span>❌</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Settings Tabs */}
            <div className="settings-tabs">
              <button 
                className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveTab('general')}
              >
                ⚙️ General
              </button>
              <button 
                className={`settings-tab ${activeTab === 'email' ? 'active' : ''}`}
                onClick={() => setActiveTab('email')}
              >
                📧 Email
              </button>
              <button 
                className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                🔒 Security
              </button>
              <button 
                className={`settings-tab ${activeTab === 'system' ? 'active' : ''}`}
                onClick={() => setActiveTab('system')}
              >
                💻 System Info
              </button>
              <button 
                className={`settings-tab ${activeTab === 'help' ? 'active' : ''}`}
                onClick={() => setActiveTab('help')}
              >
                ❓ Help
              </button>
            </div>

            {/* Settings Content */}
            <div className="settings-content">
              {activeTab === 'general' && (
                <div className="settings-section">
                  <h2 className="settings-section-title">General Settings</h2>
                  
                  <div className="form-group">
                    <label className="form-label">Site Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={settings.siteName}
                      onChange={(e) => handleSettingChange('siteName', e.target.value)}
                      placeholder="ISS Yemen"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Site Description</label>
                    <textarea
                      className="form-input"
                      rows="3"
                      value={settings.siteDescription}
                      onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                      placeholder="International Student Society Yemen"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={settings.contactEmail}
                      onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                      placeholder="admin@issyemen.com"
                    />
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.maintenanceMode}
                        onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                      />
                      <span>Enable Maintenance Mode (restricts access to non-admin users)</span>
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.allowRegistrations}
                        onChange={(e) => handleSettingChange('allowRegistrations', e.target.checked)}
                      />
                      <span>Allow New User Registrations</span>
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.enableChatbot}
                        onChange={(e) => handleSettingChange('enableChatbot', e.target.checked)}
                      />
                      <span>Enable Chatbot Feature</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div className="settings-section">
                  <h2 className="settings-section-title">Email Settings</h2>
                  
                  <div className="form-group">
                    <label className="form-label">SMTP Server</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="smtp.gmail.com"
                      disabled
                    />
                    <p className="form-hint">Configure in backend .env file</p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">SMTP Port</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="587"
                      disabled
                    />
                    <p className="form-hint">Configure in backend .env file</p>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                      />
                      <span>Enable Email Notifications</span>
                    </label>
                  </div>

                  <div className="info-box">
                    <strong>📝 Note:</strong> Email server configuration is managed through environment variables. 
                    Contact your system administrator to modify SMTP settings.
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="settings-section">
                  <h2 className="settings-section-title">Security Settings</h2>
                  
                  <div className="form-group">
                    <label className="form-label">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      className="form-input"
                      min="5"
                      max="480"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                    />
                    <p className="form-hint">Time before user session expires (5-480 minutes)</p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Maximum File Upload Size (MB)</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      max="50"
                      value={settings.maxFileSize}
                      onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                    />
                    <p className="form-hint">Maximum size for file uploads (1-50 MB)</p>
                  </div>

                  <div className="info-box">
                    <strong>🔐 Security Recommendations:</strong>
                    <ul>
                      <li>Use strong passwords for admin accounts</li>
                      <li>Regularly review user access and permissions</li>
                      <li>Keep the system updated with latest security patches</li>
                      <li>Enable two-factor authentication when available</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'system' && (
                <div className="settings-section">
                  <h2 className="settings-section-title">System Information</h2>
                  
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Application Version:</span>
                      <span className="info-value">1.0.0</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Environment:</span>
                      <span className="info-value">Production</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Database Status:</span>
                      <span className="info-value status-online">● Online</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Last Backup:</span>
                      <span className="info-value">Not configured</span>
                    </div>
                  </div>

                  <div className="info-box">
                    <h3>Quick Actions</h3>
                    <div className="action-buttons">
                      <button className="action-btn" disabled>
                        📥 Export Data
                      </button>
                      <button className="action-btn" disabled>
                        📊 View Logs
                      </button>
                      <button className="action-btn" disabled>
                        🔄 Clear Cache
                      </button>
                    </div>
                    <p className="form-hint">Additional system management features coming soon</p>
                  </div>
                </div>
              )}

              {activeTab === 'help' && (
                <div className="settings-section">
                  <h2 className="settings-section-title">Help & Documentation</h2>
                  
                  <div className="help-section">
                    <h3>📚 Quick Guides</h3>
                    <ul className="help-list">
                      <li>
                        <strong>Managing Events:</strong> Navigate to "Manage Events" to create, edit, or delete events. 
                        You can set registration fees, upload QR codes, and manage attendees.
                      </li>
                      <li>
                        <strong>User Management:</strong> Use "Manage Users" to view all registered users, 
                        change roles, or manage user accounts.
                      </li>
                      <li>
                        <strong>Chatbot Management:</strong> Go to "Chatbot Manager" to add FAQ rules, 
                        manage responses, and configure the chatbot behavior.
                      </li>
                      <li>
                        <strong>Payment Verification:</strong> Access "Verify Payments" to review and approve 
                        event registration payments submitted by members.
                      </li>
                    </ul>
                  </div>

                  <div className="help-section">
                    <h3>❓ Frequently Asked Questions</h3>
                    <ul className="help-list">
                      <li><strong>How do I add a new FAQ?</strong> Go to Chatbot Manager → Create Rules → Mark as FAQ</li>
                      <li><strong>Can I change user roles?</strong> Yes, go to Manage Users and edit the user's role</li>
                      <li><strong>How to upload QR codes?</strong> When creating/editing events, use the QR Code upload field</li>
                      <li><strong>Where are backups stored?</strong> Backups are managed by the system administrator</li>
                    </ul>
            </div>

                  <div className="help-section">
                    <h3>📞 Support</h3>
                    <div className="info-box">
                      <p><strong>Contact:</strong> {settings.contactEmail}</p>
                      <p><strong>Documentation:</strong> Check the FAQ_SETUP_GUIDE.md file for detailed setup instructions</p>
            </div>
          </div>
        </div>
              )}

              {/* Save Button */}
              {activeTab !== 'system' && activeTab !== 'help' && (
                <div className="settings-actions">
                  <button 
                    className="btn-primary"
                    onClick={handleSaveSettings}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : '💾 Save Settings'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


