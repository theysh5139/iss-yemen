import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import "../styles/admin-header-icons.css"

export default function AdminHeaderIcons({ user }) {
  const navigate = useNavigate()
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchRef = useRef(null)
  const notificationsRef = useRef(null)
  const profileRef = useRef(null)

  // Admin pages/links for search
  const adminPages = [
    { label: "Dashboard", path: "/admin/dashboard", keywords: ["dashboard", "home", "main"] },
    { label: "Manage Events", path: "/admin/events", keywords: ["events", "manage events", "event management"] },
    { label: "Verify Payments", path: "/admin/verify-payments", keywords: ["payments", "verify", "receipts", "payment verification"] },
    { label: "Manage Users", path: "/admin/users", keywords: ["users", "manage users", "user management", "members"] },
    { label: "News & Announcements", path: "/admin/news", keywords: ["news", "announcements", "posts", "articles"] },
    { label: "Manage Committees", path: "/admin/committees", keywords: ["committees", "executive", "committee heads", "committee members", "manage committees"] },
    { label: "Manage HODs", path: "/admin/hods", keywords: ["hods", "heads of department", "heads", "department", "manage hods"] },
    { label: "Chatbot Manager", path: "/admin/chatbot", keywords: ["chatbot", "ai", "assistant", "faq", "rules"] },
    { label: "Edit About Us", path: "/admin/aboutus", keywords: ["about", "about us", "information"] },
    { label: "Settings & Help", path: "/admin/settings", keywords: ["settings", "help", "configuration", "preferences"] }
  ]

  // Filter pages based on search query
  const filteredPages = searchQuery.trim() === "" 
    ? [] 
    : adminPages.filter(page => {
        const query = searchQuery.toLowerCase()
        return page.label.toLowerCase().includes(query) || 
               page.keywords.some(keyword => keyword.toLowerCase().includes(query))
      })

  // Close popups when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleSearchClick(page) {
    navigate(page.path)
    setShowSearch(false)
    setSearchQuery("")
  }

  function handleSettingsClick() {
    navigate("/admin/settings")
  }

  function handleProfileClick(action) {
    if (action === "profile") {
      navigate("/profile")
      setShowProfile(false)
    } else if (action === "logout") {
      // Logout will be handled by parent component
      window.location.href = "/login"
      setShowProfile(false)
    }
  }

  function handleProfileIconClick() {
    navigate("/profile")
    setShowProfile(false)
  }

  return (
    <div className="header-icons">
      {/* Notifications Icon */}
      <div className="header-icon-wrapper" ref={notificationsRef}>
        <button 
          className="icon-btn" 
          aria-label="Notifications"
          title="Notifications"
          onClick={() => {
            setShowNotifications(!showNotifications)
            setShowSearch(false)
            setShowProfile(false)
          }}
        >
          🔔
        </button>
        {showNotifications && (
          <div className="icon-popup notifications-popup">
            <div className="popup-header">
              <h3>Notifications</h3>
            </div>
            <div className="popup-content">
              <div className="empty-state">
                <p>No new notifications</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Icon */}
      <div className="header-icon-wrapper">
        <button 
          className="icon-btn" 
          aria-label="Settings"
          title="Settings"
          onClick={handleSettingsClick}
        >
          ⚙️
        </button>
      </div>

      {/* Search Icon */}
      <div className="header-icon-wrapper" ref={searchRef}>
        <button 
          className="icon-btn" 
          aria-label="Search"
          title="Search Pages"
          onClick={() => {
            setShowSearch(!showSearch)
            setShowNotifications(false)
            setShowProfile(false)
          }}
        >
          🔍
        </button>
        {showSearch && (
          <div className="icon-popup search-popup">
            <div className="popup-header">
              <h3>Search Pages</h3>
            </div>
            <div className="popup-content">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Type to search pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              {searchQuery.trim() !== "" && (
                <div className="search-results">
                  {filteredPages.length > 0 ? (
                    filteredPages.map((page, index) => (
                      <button
                        key={index}
                        className="search-result-item"
                        onClick={() => handleSearchClick(page)}
                      >
                        <span className="result-label">{page.label}</span>
                        <span className="result-icon">→</span>
                      </button>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p>No pages found</p>
                    </div>
                  )}
                </div>
              )}
              {searchQuery.trim() === "" && (
                <div className="search-hint">
                  <p>Start typing to search for admin pages...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profile Icon */}
      <div className="header-icon-wrapper" ref={profileRef}>
        <button 
          className="icon-btn" 
          aria-label="Profile"
          title="Profile"
          onClick={(e) => {
            // If clicking the icon itself (not the dropdown), go to profile
            if (!showProfile) {
              handleProfileIconClick()
            } else {
              setShowProfile(false)
              setShowSearch(false)
              setShowNotifications(false)
            }
          }}
        >
          👤
        </button>
        {showProfile && (
          <div className="icon-popup profile-popup">
            <div className="popup-header">
              <div className="profile-info-header">
                <div className="profile-avatar">👤</div>
                <div>
                  <div className="profile-name">{user?.name || "Admin User"}</div>
                  <div className="profile-email">{user?.email || "admin@issyemen.com"}</div>
                </div>
              </div>
            </div>
            <div className="popup-content">
              <button
                className="profile-menu-item"
                onClick={() => handleProfileClick("profile")}
              >
                <span>👤</span>
                <span>View Profile</span>
              </button>
              <button
                className="profile-menu-item"
                onClick={() => handleProfileClick("logout")}
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

