import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import "../styles/admin-sidebar.css"

export default function AdminSidebar({ user, onLogout, isOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeMenu, setActiveMenu] = useState(null)

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/admin/dashboard' },
    { id: 'events', label: 'Manage Events', icon: '📅', path: '/admin/events' },
    // A16: Added Payment Verification Link (Placed near Events for context)
    { id: 'verify-payments', label: 'Verify Payments', icon: '💰', path: '/admin/verify-payments' },
    { id: 'users', label: 'Manage Users', icon: '👥', path: '/admin/users' },
    { id: 'news', label: 'News & Announcements', icon: '📢', path: '/admin/news' },
    { id: 'hods', label: 'Manage HODs', icon: '👔', path: '/admin/hods' },
    // A14: Added Chatbot Manager Link
    { id: 'chatbot', label: 'Chatbot Manager', icon: '🤖', path: '/admin/chatbot' },
    { id: 'aboutus', label: 'Edit About Us', icon: '📝', path: '/admin/aboutus' },
    { id: 'settings', label: 'Settings & Help', icon: '⚙️', path: '/admin/settings' }
  ]

  function handleMenuClick(item) {
    setActiveMenu(activeMenu === item.id ? null : item.id)
    if (item.path) {
      navigate(item.path)
      // Close sidebar on mobile after navigation
      if (window.innerWidth <= 1024 && onClose) {
        onClose()
      }
    }
  }

  const currentPath = location.pathname
  const activeItem = menuItems.find(item => currentPath.startsWith(item.path))

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-logo">ISS YEMEN</h2>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${activeItem?.id === item.id ? 'active' : ''}`}
            onClick={() => handleMenuClick(item)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {/* Removed the arrow since there are no sub-menus logic in the click handler */}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="profile-icon">👤</div>
          <div className="profile-info">
            <div className="profile-name">{user?.name || 'Admin'}</div>
            <div className="profile-email">{user?.email || 'admin@example.com'}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  )
}