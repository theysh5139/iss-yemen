import { useState, useEffect } from 'react'
import { store } from '../store.js'

export default function SettingsPage() {
	const [activeTab, setActiveTab] = useState('users')
	const [users, setUsers] = useState([])
	const [loading, setLoading] = useState(false)
	const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
	const [profileForm, setProfileForm] = useState({ email: 'admin@example.com', name: 'Admin' })

	useEffect(() => {
		if (activeTab === 'users') {
			loadUsers()
		} else if (activeTab === 'account') {
			loadCurrentUser()
		}
	}, [activeTab])

	async function loadCurrentUser() {
		try {
			const token = localStorage.getItem('ap_token')
			// Decode JWT to get user ID
			const payload = JSON.parse(atob(token.split('.')[1]))
			const res = await fetch(`/api/users/${payload.sub}`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			if (res.ok) {
				const user = await res.json()
				setProfileForm({ email: user.email || 'admin@example.com', name: user.name || 'Admin' })
			}
		} catch (err) {
			console.error('Failed to load current user:', err)
		}
	}

	async function loadUsers() {
		setLoading(true)
		try {
			const token = localStorage.getItem('ap_token')
			const res = await fetch('/api/users', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			if (res.ok) {
				const data = await res.json()
				setUsers(data)
			} else {
				// Fallback to localStorage
				const members = store.getMembers()
				setUsers(members)
			}
		} catch (err) {
			console.error('Failed to load users:', err)
			const members = store.getMembers()
			setUsers(members)
		} finally {
			setLoading(false)
		}
	}

	async function handleDeactivateUser(userId) {
		if (!confirm('Deactivate this user?')) return
		try {
			const token = localStorage.getItem('ap_token')
			const res = await fetch(`/api/users/${userId}/deactivate`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			if (res.ok) {
				loadUsers()
			} else {
				alert('Failed to deactivate user')
			}
		} catch (err) {
			alert('Error: ' + err.message)
		}
	}

	async function handleActivateUser(userId) {
		try {
			const token = localStorage.getItem('ap_token')
			const res = await fetch(`/api/users/${userId}/activate`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			if (res.ok) {
				loadUsers()
			} else {
				alert('Failed to activate user')
			}
		} catch (err) {
			alert('Error: ' + err.message)
		}
	}

	async function handleDeleteUser(userId) {
		if (!confirm('Permanently delete this user? This cannot be undone.')) return
		try {
			const token = localStorage.getItem('ap_token')
			const res = await fetch(`/api/users/${userId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			if (res.ok) {
				loadUsers()
			} else {
				const data = await res.json().catch(() => ({}))
				alert(data.message || 'Failed to delete user')
			}
		} catch (err) {
			alert('Error: ' + err.message)
		}
	}

	async function handlePasswordChange(e) {
		e.preventDefault()
		if (passwordForm.new !== passwordForm.confirm) {
			alert('New passwords do not match')
			return
		}
		if (passwordForm.new.length < 6) {
			alert('Password must be at least 6 characters')
			return
		}
		try {
			const token = localStorage.getItem('ap_token')
			const res = await fetch('/api/users/password', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					currentPassword: passwordForm.current,
					newPassword: passwordForm.new
				})
			})
			const data = await res.json()
			if (res.ok) {
				alert('Password changed successfully')
				setPasswordForm({ current: '', new: '', confirm: '' })
			} else {
				alert(data.message || 'Failed to change password')
			}
		} catch (err) {
			alert('Error: ' + err.message)
		}
	}

	async function handleProfileUpdate(e) {
		e.preventDefault()
		try {
			const token = localStorage.getItem('ap_token')
			const res = await fetch('/api/users/profile', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify(profileForm)
			})
			const data = await res.json()
			if (res.ok) {
				alert('Profile updated successfully')
			} else {
				alert(data.message || 'Failed to update profile')
			}
		} catch (err) {
			alert('Error: ' + err.message)
		}
	}

	return (
		<div className="settings-page">
			<div className="settings-header">
				<h1 className="dashboard-title">Settings & Help</h1>
				<p className="dashboard-greeting">Manage your account and system settings</p>
			</div>

			<div className="settings-tabs">
				<button 
					className={`settings-tab ${activeTab === 'users' ? 'active' : ''}`}
					onClick={() => setActiveTab('users')}
				>
					👥 User Management
				</button>
				<button 
					className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`}
					onClick={() => setActiveTab('account')}
				>
					⚙️ Account Settings
				</button>
				<button 
					className={`settings-tab ${activeTab === 'system' ? 'active' : ''}`}
					onClick={() => setActiveTab('system')}
				>
					🔧 System Settings
				</button>
			</div>

			<div className="settings-content">
				{activeTab === 'users' && (
					<div className="settings-section">
						<h2 className="section-heading">User Management</h2>
						<p className="section-description">Monitor and control all registered users</p>
						
						<div className="users-stats">
							<div className="stat-card">
								<div className="stat-value">{users.length}</div>
								<div className="stat-label">Total Users</div>
							</div>
							<div className="stat-card">
								<div className="stat-value">{users.filter(u => (u.status || 'active') === 'active').length}</div>
								<div className="stat-label">Active Users</div>
							</div>
							<div className="stat-card">
								<div className="stat-value">{users.filter(u => u.status === 'inactive').length}</div>
								<div className="stat-label">Inactive Users</div>
							</div>
						</div>

						<div className="users-table-wrapper">
							<table className="users-table">
								<thead>
									<tr>
										<th>Name</th>
										<th>Email</th>
										<th>Status</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{users.map(user => (
										<tr key={user._id || user.id}>
											<td>{user.name || 'Admin'}</td>
											<td>{user.email}</td>
											<td>
												<span className={`status-badge ${(user.status || 'active') === 'active' ? 'active' : 'inactive'}`}>
													{(user.status || 'active') === 'active' ? 'Active' : 'Inactive'}
												</span>
											</td>
											<td>
												<div className="action-buttons">
													{(user.status || 'active') === 'active' ? (
														<button 
															className="btn-warning" 
															onClick={() => handleDeactivateUser(user._id || user.id)}
														>
															Deactivate
														</button>
													) : (
														<button 
															className="btn-success" 
															onClick={() => handleActivateUser(user._id || user.id)}
														>
															Activate
														</button>
													)}
													<button 
														className="btn-danger" 
														onClick={() => handleDeleteUser(user._id || user.id)}
													>
														Delete
													</button>
												</div>
											</td>
										</tr>
									))}
									{loading ? (
										<tr>
											<td colSpan="4" style={{textAlign: 'center', color: '#9ca3af', padding: '24px'}}>
												Loading users...
											</td>
										</tr>
									) : users.length === 0 ? (
										<tr>
											<td colSpan="4" style={{textAlign: 'center', color: '#9ca3af', padding: '24px'}}>
												No users found
											</td>
										</tr>
									) : null}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{activeTab === 'account' && (
					<div className="settings-section">
						<h2 className="section-heading">Account Settings</h2>
						
						<div className="settings-card">
							<h3 className="card-title">Profile Information</h3>
							<form onSubmit={handleProfileUpdate} className="settings-form">
								<label>
									Email Address
									<input 
										type="email" 
										value={profileForm.email} 
										onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
										required
									/>
								</label>
								<label>
									Display Name
									<input 
										type="text" 
										value={profileForm.name} 
										onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
										required
									/>
								</label>
								<button type="submit" className="primary">Update Profile</button>
							</form>
						</div>

						<div className="settings-card">
							<h3 className="card-title">Change Password</h3>
							<form onSubmit={handlePasswordChange} className="settings-form">
								<label>
									Current Password
									<input 
										type="password" 
										value={passwordForm.current} 
										onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
										required
									/>
								</label>
								<label>
									New Password
									<input 
										type="password" 
										value={passwordForm.new} 
										onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
										required
										minLength={6}
									/>
								</label>
								<label>
									Confirm New Password
									<input 
										type="password" 
										value={passwordForm.confirm} 
										onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
										required
										minLength={6}
									/>
								</label>
								<button type="submit" className="primary">Change Password</button>
							</form>
						</div>
					</div>
				)}

				{activeTab === 'system' && (
					<div className="settings-section">
						<h2 className="section-heading">System Settings</h2>
						
						<div className="settings-card">
							<h3 className="card-title">Database Management</h3>
							<div className="settings-info">
								<p><strong>Database:</strong> MongoDB</p>
								<p><strong>Connection:</strong> mongodb://localhost:27017/iss_yemen_club</p>
								<p><strong>Status:</strong> <span className="status-badge active">Connected</span></p>
							</div>
							<div className="settings-actions">
								<button className="btn-secondary">Backup Database</button>
								<button className="btn-secondary">Clear Cache</button>
							</div>
						</div>

						<div className="settings-card">
							<h3 className="card-title">System Information</h3>
							<div className="settings-info">
								<p><strong>Version:</strong> 1.0.0</p>
								<p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
								<p><strong>Environment:</strong> Development</p>
							</div>
						</div>

						<div className="settings-card">
							<h3 className="card-title">Maintenance</h3>
							<div className="settings-actions">
								<button className="btn-secondary">Clear All Logs</button>
								<button className="btn-secondary">Optimize Database</button>
								<button className="btn-warning">Reset System</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

