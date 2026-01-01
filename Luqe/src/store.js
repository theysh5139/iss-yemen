// Simple localStorage-backed store for demo purposes

const STORAGE_KEYS = {
	events: 'ap_events',
	registrations: 'ap_registrations',
	members: 'ap_members',
	announcements: 'ap_announcements',
	auth: 'ap_auth',
	token: 'ap_token',
}

function read(key, fallback) {
	try {
		const raw = localStorage.getItem(key)
		return raw ? JSON.parse(raw) : fallback
	} catch {
		return fallback
	}
}

function write(key, value) {
	localStorage.setItem(key, JSON.stringify(value))
}

// Seed defaults on first run
if (!localStorage.getItem(STORAGE_KEYS.events)) {
	const seedEvents = [
		{ id: crypto.randomUUID(), title: 'Monthly Meetup', date: '2025-12-01', location: 'Main Hall', status: 'active', description: 'Networking and lightning talks.' },
		{ id: crypto.randomUUID(), title: 'Workshop: React Basics', date: '2025-12-15', location: 'Lab 2', status: 'active', description: 'Hands-on intro to React.' },
	]
	write(STORAGE_KEYS.events, seedEvents)
	write(STORAGE_KEYS.registrations, {})
	const seedMembers = [
		{ id: crypto.randomUUID(), name: 'Alice Johnson', email: 'alice@example.com', status: 'active' },
		{ id: crypto.randomUUID(), name: 'Bob Smith', email: 'bob@example.com', status: 'active' },
	]
	write(STORAGE_KEYS.members, seedMembers)
}

// Seed announcements if missing
if (!localStorage.getItem(STORAGE_KEYS.announcements)) {
	const seedAnnouncements = [
		{ id: crypto.randomUUID(), title: 'Welcome to the portal', body: 'Admins can manage events, registrations, and members here.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
	]
	write(STORAGE_KEYS.announcements, seedAnnouncements)
}

export const store = {
	// Auth (very basic demo auth)
	getAuth() {
		// Prefer JWT token if present
		const token = localStorage.getItem(STORAGE_KEYS.token)
		if (token) return { token }
		return read(STORAGE_KEYS.auth, null)
	},
	login(email, password) {
		// Demo credentials only
		const ok = email === 'admin@example.com' && password === 'admin123'
		if (!ok) return false
		const session = { email, loggedInAt: new Date().toISOString() }
		write(STORAGE_KEYS.auth, session)
		return true
	},
	logout() {
		localStorage.removeItem(STORAGE_KEYS.auth)
		localStorage.removeItem(STORAGE_KEYS.token)
	},

	// Events
	getEvents() {
		return read(STORAGE_KEYS.events, [])
	},
	createEvent(eventInput) {
		const events = store.getEvents()
		const newEvent = { id: crypto.randomUUID(), status: 'active', ...eventInput }
		write(STORAGE_KEYS.events, [newEvent, ...events])
		return newEvent
	},
	updateEvent(eventId, updates) {
		const events = store.getEvents().map(e => (e.id === eventId ? { ...e, ...updates } : e))
		write(STORAGE_KEYS.events, events)
	},
	cancelEvent(eventId) {
		store.updateEvent(eventId, { status: 'cancelled' })
	},
	reactivateEvent(eventId) {
		store.updateEvent(eventId, { status: 'active' })
	},

	// Registrations
	getRegistrationsByEvent(eventId) {
		const map = read(STORAGE_KEYS.registrations, {})
		return map[eventId] || []
	},
	registerUser(eventId, attendee) {
		const map = read(STORAGE_KEYS.registrations, {})
		const list = map[eventId] || []
		const newEntry = { id: crypto.randomUUID(), ...attendee, registeredAt: new Date().toISOString() }
		map[eventId] = [newEntry, ...list]
		write(STORAGE_KEYS.registrations, map)
		return newEntry
	},

	// Members
	getMembers() {
		return read(STORAGE_KEYS.members, [])
	},
	addMember(memberInput) {
		const members = store.getMembers()
		const newMember = { id: crypto.randomUUID(), status: 'active', ...memberInput }
		write(STORAGE_KEYS.members, [newMember, ...members])
		return newMember
	},
	updateMember(memberId, updates) {
		const next = store.getMembers().map(m => (m.id === memberId ? { ...m, ...updates } : m))
		write(STORAGE_KEYS.members, next)
	},
	deactivateMember(memberId) {
		store.updateMember(memberId, { status: 'inactive' })
	},
	reactivateMember(memberId) {
		store.updateMember(memberId, { status: 'active' })
	},

	// Announcements
	getAnnouncements() {
		return read(STORAGE_KEYS.announcements, [])
	},
	createAnnouncement(input) {
		const list = store.getAnnouncements()
		const now = new Date().toISOString()
		const created = { id: crypto.randomUUID(), title: input.title, body: input.body, createdAt: now, updatedAt: now }
		write(STORAGE_KEYS.announcements, [created, ...list])
		return created
	},
	updateAnnouncement(id, updates) {
		const now = new Date().toISOString()
		const next = store.getAnnouncements().map(a => a.id === id ? { ...a, ...updates, updatedAt: now } : a)
		write(STORAGE_KEYS.announcements, next)
	},
	deleteAnnouncement(id) {
		const next = store.getAnnouncements().filter(a => a.id !== id)
		write(STORAGE_KEYS.announcements, next)
	},
}


