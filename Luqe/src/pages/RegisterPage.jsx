import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function RegisterPage() {
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirm, setConfirm] = useState('')
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const navigate = useNavigate()

	async function submit(e) {
		e.preventDefault()
		setError('')
		setSuccess('')
		if (password !== confirm) {
			setError('Passwords do not match')
			return
		}
		try {
			const res = await fetch('/api/admin/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, email, password }),
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(data.message || 'Registration failed')
			setSuccess('Account created. You can now log in.')
			setTimeout(() => navigate('/login'), 800)
		} catch (err) {
			setError(err.message)
		}
	}

	return (
		<div className="login-wrapper">
			<div className="login-card">
				<h2 className="login-title">Create an account</h2>
				<form className="login-form" onSubmit={submit}>
					<label className="login-label">Full name
						<input className="login-input" value={name} onChange={(e)=>setName(e.target.value)} required />
					</label>
					<label className="login-label">Email
						<input className="login-input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
					</label>
					<label className="login-label">Password
						<input className="login-input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
					</label>
					<label className="login-label">Confirm password
						<input className="login-input" type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} required />
					</label>

					{error && <div className="login-error">{error}</div>}
					{success && <div className="badge green" style={{width:'100%'}}>{success}</div>}

					<button className="login-submit" type="submit">Create account</button>
				</form>
			</div>
		</div>
	)
}


