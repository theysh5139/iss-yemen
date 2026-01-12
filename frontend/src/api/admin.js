import { apiFetch } from './client.js'

// Admin Dashboard
export function getAdminStats() {
  return apiFetch('/api/admin/stats')
}

// Users
export function getAllUsers() {
  return apiFetch('/api/admin/users')
}

export function updateUserRole(userId, role) {
  return apiFetch(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: { role }
  })
}

export function deactivateUser(userId) {
  return apiFetch(`/api/admin/users/${userId}/deactivate`, {
    method: 'PATCH'
  })
}

export function deleteUser(userId) {
  return apiFetch(`/api/admin/users/${userId}`, {
    method: 'DELETE'
  })
}

// Announcements
export function getAllAnnouncements() {
  return apiFetch('/api/admin/announcements')
}

export function createAnnouncement(data) {
  return apiFetch('/api/admin/announcements', {
    method: 'POST',
    body: data
  })
}

export function updateAnnouncement(id, data) {
  return apiFetch(`/api/admin/announcements/${id}`, {
    method: 'PATCH',
    body: data
  })
}

export function deleteAnnouncement(id) {
  return apiFetch(`/api/admin/announcements/${id}`, {
    method: 'DELETE'
  })
}

// Events
export function getAllEvents() {
  return apiFetch('/api/admin/events')
}

export function createEvent(eventData) {
  // Handle FormData (for file uploads) differently
  if (eventData instanceof FormData) {
    return apiFetch('/api/admin/events', {
      method: 'POST',
      body: eventData,
      headers: {} // Don't set Content-Type for FormData
    })
  }
  // Handle regular JSON data
  return apiFetch('/api/admin/events', {
    method: 'POST',
    body: eventData
  })
}


export function updateEvent(eventId, eventData) {
  // Handle FormData (for file uploads) differently
  if (eventData instanceof FormData) {
    return apiFetch(`/api/admin/events/${eventId}`, {
      method: 'PATCH',
      body: eventData,
      headers: {} // Don't set Content-Type for FormData
    })
  }
  // Handle regular JSON data
  return apiFetch(`/api/admin/events/${eventId}`, {
    method: 'PATCH',
    body: eventData
  })
}

export function cancelEvent(eventId) {
  return apiFetch(`/api/admin/events/${eventId}/cancel`, {
    method: 'PATCH'
  })
}

export function deleteEvent(eventId) {
  return apiFetch(`/api/admin/events/${eventId}`, {
    method: 'DELETE'
  })
}

// Event Registrations
export function getAllEventRegistrations() {
  return apiFetch('/api/admin/registrations')
}

// Activities
export function getAllActivities() {
  return apiFetch('/api/admin/activities')
}

export function createActivity(activityData) {
  // Handle FormData (for file uploads) differently
  if (activityData instanceof FormData) {
    return apiFetch('/api/admin/activities', {
      method: 'POST',
      body: activityData,
      headers: {} // Don't set Content-Type for FormData
    })
  }
  // Handle regular JSON data
  return apiFetch('/api/admin/activities', {
    method: 'POST',
    body: activityData
  })
}

export function updateActivity(activityId, activityData) {
  // Handle FormData (for file uploads) differently
  if (activityData instanceof FormData) {
    return apiFetch(`/api/admin/activities/${activityId}`, {
      method: 'PATCH',
      body: activityData,
      headers: {} // Don't set Content-Type for FormData
    })
  }
  // Handle regular JSON data
  return apiFetch(`/api/admin/activities/${activityId}`, {
    method: 'PATCH',
    body: activityData
  })
}

export function deleteActivity(activityId) {
  return apiFetch(`/api/admin/activities/${activityId}`, {
    method: 'DELETE'
  })
}

// Payments
export function getAllPayments() {
  return apiFetch('/api/admin/payments')
}

export function approvePayment(eventId, registrationIndex) {
  return apiFetch(`/api/admin/payments/${eventId}/${registrationIndex}/approve`, {
    method: 'PATCH'
  })
}

export function rejectPayment(eventId, registrationIndex) {
  return apiFetch(`/api/admin/payments/${eventId}/${registrationIndex}/reject`, {
    method: 'PATCH'
  })
}
