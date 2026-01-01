import { apiFetch } from './client.js'

export function getUserReceipts() {
  return apiFetch('/api/receipts/user/receipts')
}

export function getReceipt(eventId) {
  return apiFetch(`/api/receipts/event/${eventId}`)
}

export function downloadReceipt(eventId, format = 'html') {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  // Include credentials in the URL for authentication
  return `${API_BASE_URL}/api/receipts/event/${eventId}/download?format=${format}`
}

export function shareReceipt(eventId) {
  return apiFetch(`/api/receipts/event/${eventId}/share`, { method: 'GET' })
}

