import { useState, useEffect } from "react"
import AdminSidebar from "../components/AdminSidebar.jsx"
import AdminHeaderIcons from "../components/AdminHeaderIcons.jsx"
import { useAuth } from "../context/AuthProvider.jsx"
import { logoutApi } from "../api/auth.js"
import { getAllUsers, updateUserRole, deactivateUser, deleteUser } from "../api/admin.js"
import { useNavigate } from "react-router-dom"
import "../styles/admin-dashboard.css"
import "../styles/admin-forms.css"

export default function AdminManageUsers() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate("/dashboard", { replace: true })
      return
    }
    fetchUsers()
  }, [user])

  async function fetchUsers() {
    try {
      setLoading(true)
      const res = await getAllUsers()
      if (res.users) {
        setUsers(res.users)
      }
    } catch (err) {
      console.error("Failed to fetch users:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await updateUserRole(userId, newRole)
      await fetchUsers()
    } catch (err) {
      alert(err.message || "Failed to update user role")
    }
  }

  async function handleDeactivate(userId) {
    const user = users.find(u => (u.id || u._id) === userId);
    const action = user?.isActive ? 'deactivate' : 'reactivate';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return

    try {
      await deactivateUser(userId)
      await fetchUsers()
    } catch (err) {
      alert(err.message || `Failed to ${action} user`)
    }
  }

  async function handleDelete(userId) {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return

    try {
      await deleteUser(userId)
      await fetchUsers()
    } catch (err) {
      alert(err.message || "Failed to delete user")
    }
  }

  async function onLogout() {
    try {
      await logoutApi()
    } catch {}
    setUser(null)
    navigate("/", { replace: true })
  }

  const filteredUsers = users.filter(u => {
    const search = searchTerm.toLowerCase()
    return (
      u.email?.toLowerCase().includes(search) ||
      u.name?.toLowerCase().includes(search) ||
      u.role?.toLowerCase().includes(search)
    )
  })

  if (user?.role !== 'admin') {
    return null
  }

  return (
    <div className="admin-dashboard">
      <AdminSidebar user={user} onLogout={onLogout} />
      
      <div className="admin-main-content">
        <header className="admin-header">
          <div className="breadcrumbs">
            <span>Dashboard &gt; Manage Users</span>
          </div>
          <AdminHeaderIcons user={user} />
        </header>

        <div className="admin-content">
          <div className="main-section">
            <div className="page-title">
              <h1>Manage Users</h1>
              <p>View and manage user accounts</p>
            </div>

            <div className="content-actions">
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Users List */}
            <div className="content-section">
              <h2 className="section-title">
                All Users ({filteredUsers.length})
              </h2>
              {loading ? (
                <p>Loading users...</p>
              ) : filteredUsers.length > 0 ? (
                <div className="admin-list">
                  {filteredUsers.map(u => (
                    <div key={u.id || u._id} className="admin-list-item">
                      <div className="item-content">
                        <div className="item-header">
                          <h3 className="item-title">{u.name || 'No name'}</h3>
                          <span className={`badge role-${u.role}`}>
                            {u.role?.charAt(0).toUpperCase() + u.role?.slice(1)}
                          </span>
                        </div>
                        <div className="item-meta">
                          <span>📧 {u.email}</span>
                          {u.emailVerified && <span className="badge verified">✓ Verified</span>}
                        </div>
                      </div>
                      <div className="item-actions">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id || u._id, e.target.value)}
                          className="role-select"
                          disabled={u.id === user?.id || u._id === user?.id}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        {u.id !== user?.id && u._id !== user?.id && (
                          <>
                            <button 
                              className={u.isActive ? "btn-deactivate" : "btn-reactivate"}
                              onClick={() => handleDeactivate(u.id || u._id)}
                            >
                              {u.isActive ? 'Deactivate' : 'Reactivate'}
                            </button>
                            <button 
                              className="btn-delete"
                              onClick={() => handleDelete(u.id || u._id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No users found.</p>
              )}
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
