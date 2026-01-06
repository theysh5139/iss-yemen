import AdminSidebar from "../components/AdminSidebar.jsx"
import { useAuth } from "../context/AuthProvider.jsx"
import { logoutApi } from "../api/auth.js"
import { useNavigate } from "react-router-dom"
import "../styles/admin-dashboard.css"

export default function AdminSettings() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  async function onLogout() {
    try {
      await logoutApi()
    } catch {}
    setUser(null)
    navigate("/", { replace: true })
  }

  if (user?.role !== 'admin') {
    navigate("/dashboard", { replace: true })
    return null
  }

  return (
    <div className="admin-dashboard">
      <AdminSidebar user={user} onLogout={onLogout} />
      
      <div className="admin-main-content">
        <header className="admin-header">
          <div className="breadcrumbs">
            <span>Dashboard &gt; Settings & Help</span>
          </div>
          <div className="header-icons">
            <button className="icon-btn">🔔</button>
            <button className="icon-btn">⚙️</button>
            <button className="icon-btn">🔍</button>
            <button className="icon-btn">👤</button>
          </div>
        </header>

        <div className="admin-content">
          <div className="main-section">
            <div className="page-title">
              <h1>Settings & Help</h1>
              <p>Configure settings and get help</p>
            </div>

            <div className="content-section">
              <p>Settings and help interface coming soon...</p>
            </div>
          </div>
        </div>

        <footer className="admin-footer">
          <p>© ISS Yemen WebApp by Beta Blockers 2025</p>
        </footer>
      </div>
    </div>
  )
}


