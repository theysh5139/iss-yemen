import { apiFetch } from './client.js'

export function sendChatMessage(message) {
  return apiFetch('/api/chatbot/message', {
    method: 'POST',
    body: { message }
  })
}

export function getTopFAQs() {
  return apiFetch('/api/chatbot/faqs')
}

