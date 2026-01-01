import { apiFetch } from './client.js';

export async function getAllRules() {
  return apiFetch('/api/chatbot/rules');
}

export async function createRule(ruleData) {
  return apiFetch('/api/chatbot/rule', {
    method: 'POST',
    body: ruleData
  });
}

export async function updateRule(id, ruleData) {
  return apiFetch(`/api/chatbot/rule/${id}`, {
    method: 'PUT',
    body: ruleData
  });
}

export async function deleteRule(id) {
  return apiFetch(`/api/chatbot/rule/${id}`, {
    method: 'DELETE'
  });
}

export async function sendChatMessage(message) {
  return apiFetch('/api/chatbot/message', {
    method: 'POST',
    body: { message }
  });
}

export async function getTopFAQs() {
  return apiFetch('/api/chatbot/faqs');
}

