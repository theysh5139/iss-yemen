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

// Club Members API
export function getClubMembers() {
  return apiFetch('/api/club-members')
}

export function getClubMemberById(id) {
  return apiFetch(`/api/club-members/${id}`)
}

export function createClubMember(payload) {
  return apiFetch('/api/club-members', { method: 'POST', body: payload })
}

export function updateClubMember(id, payload) {
  return apiFetch(`/api/club-members/${id}`, { method: 'PATCH', body: payload })
}

export function deleteClubMember(id) {
  return apiFetch(`/api/club-members/${id}`, { method: 'DELETE' })
}







