import { apiFetch } from './client.js'

export function getHomepageData() {
  return apiFetch('/api/events/homepage')
}

export function getAllActivities() {
  return apiFetch('/api/events/activities')
}

export function getEvents() {
  return apiFetch('/api/events')
}

export function getEventById(id) {
  return apiFetch(`/api/events/${id}`)
}

export function getUpcomingEvents() {
  return apiFetch('/api/events/upcoming')
}

export function getPastEvents() {
  return apiFetch('/api/events/past')
}

export function getEventsByType(type) {
  return apiFetch(`/api/events/type/${type}`)
}

export function registerForEvent(id, registrationData = {}) {
  // apiFetch already handles FormData correctly (no Content-Type header for FormData)
  return apiFetch(`/api/events/${id}/register`, { 
    method: 'POST',
    body: registrationData
  })
}

export function unregisterFromEvent(id) {
  return apiFetch(`/api/events/${id}/unregister`, { method: 'POST' })
}

