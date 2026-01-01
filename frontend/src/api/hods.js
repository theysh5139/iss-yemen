import { apiFetch } from './client.js'

export function getHODs() {
  return apiFetch('/api/hods')
}

export function getHODById(id) {
  return apiFetch(`/api/hods/${id}`)
}

export function createHOD(payload) {
  return apiFetch('/api/hods', { method: 'POST', body: payload })
}

export function updateHOD(id, payload) {
  return apiFetch(`/api/hods/${id}`, { method: 'PATCH', body: payload })
}

export function deleteHOD(id) {
  return apiFetch(`/api/hods/${id}`, { method: 'DELETE' })
}







