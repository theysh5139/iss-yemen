import { apiFetch } from './client.js'

export function getAboutUs() {
  return apiFetch('/api/aboutus')
}

export function updateAboutUs(payload) {
  return apiFetch('/api/aboutus', { method: 'PATCH', body: payload })
}







