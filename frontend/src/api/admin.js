import { apiFetch } from './client.js'

export function getAdminStats() {
  return apiFetch('/api/admin/stats')
}

// User Management
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

// Announcement Management
export function getAllAnnouncements() {
  return apiFetch('/api/admin/announcements')
}

export function createAnnouncement(announcementData) {
  return apiFetch('/api/admin/announcements', {
    method: 'POST',
    body: announcementData
  })
}

export function updateAnnouncement(announcementId, announcementData) {
  return apiFetch(`/api/admin/announcements/${announcementId}`, {
    method: 'PATCH',
    body: announcementData
  })
}

export function deleteAnnouncement(announcementId) {
  return apiFetch(`/api/admin/announcements/${announcementId}`, {
    method: 'DELETE'
  })
}

// Event Management
export function getAllEvents() {
  return apiFetch('/api/admin/events')
}

export function createEvent(eventData) {
  return apiFetch('/api/admin/events', {
    method: 'POST',
    body: eventData
  })
}

export function updateEvent(eventId, eventData) {
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

