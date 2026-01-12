import { apiFetch } from './client.js'

// ===== COMMITTEES =====
export function getCommittees() {
  return apiFetch('/api/committees/committees')
}

export function getCommitteeById(id) {
  return apiFetch(`/api/committees/committees/${id}`)
}

export function createCommittee(payload) {
  return apiFetch('/api/committees/committees', { method: 'POST', body: payload })
}

export function updateCommittee(id, payload) {
  return apiFetch(`/api/committees/committees/${id}`, { method: 'PATCH', body: payload })
}

export function deleteCommittee(id) {
  return apiFetch(`/api/committees/committees/${id}`, { method: 'DELETE' })
}

// ===== EXECUTIVE MEMBERS =====
export function getExecutiveMembers() {
  return apiFetch('/api/committees/executive-members')
}

export function getExecutiveMemberById(id) {
  return apiFetch(`/api/committees/executive-members/${id}`)
}

export function createExecutiveMember(payload) {
  console.log('API: createExecutiveMember called with payload:', payload)
  return apiFetch('/api/committees/executive-members', { method: 'POST', body: payload })
}

export function updateExecutiveMember(id, payload) {
  return apiFetch(`/api/committees/executive-members/${id}`, { method: 'PATCH', body: payload })
}

export function deleteExecutiveMember(id) {
  return apiFetch(`/api/committees/executive-members/${id}`, { method: 'DELETE' })
}

// ===== COMMITTEE HEADS =====
export function getCommitteeHeads() {
  return apiFetch('/api/committees/committee-heads')
}

export function getCommitteeHeadById(id) {
  return apiFetch(`/api/committees/committee-heads/${id}`)
}

export function getCommitteeHeadsByCommittee(committeeId) {
  return apiFetch(`/api/committees/committee-heads/committee/${committeeId}`)
}

export function createCommitteeHead(payload) {
  return apiFetch('/api/committees/committee-heads', { method: 'POST', body: payload })
}

export function updateCommitteeHead(id, payload) {
  return apiFetch(`/api/committees/committee-heads/${id}`, { method: 'PATCH', body: payload })
}

export function deleteCommitteeHead(id) {
  return apiFetch(`/api/committees/committee-heads/${id}`, { method: 'DELETE' })
}

// ===== COMMITTEE MEMBERS =====
export function getCommitteeMembers() {
  return apiFetch('/api/committees/committee-members')
}

export function getCommitteeMembersGrouped() {
  return apiFetch('/api/committees/committee-members/grouped')
}

export function getCommitteeMembersByCommittee(committeeId) {
  return apiFetch(`/api/committees/committee-members/committee/${committeeId}`)
}

export function getCommitteeMemberById(id) {
  return apiFetch(`/api/committees/committee-members/${id}`)
}

export function createCommitteeMember(payload) {
  return apiFetch('/api/committees/committee-members', { method: 'POST', body: payload })
}

export function updateCommitteeMember(id, payload) {
  return apiFetch(`/api/committees/committee-members/${id}`, { method: 'PATCH', body: payload })
}

export function deleteCommitteeMember(id) {
  return apiFetch(`/api/committees/committee-members/${id}`, { method: 'DELETE' })
}
