import { apiFetch } from './client.js';

export async function getAllPaymentReceipts(status = null) {
  const query = status && status !== 'all' && status !== '' ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch(`/api/admin/payments${query}`);
}

export async function approvePayment(eventId, registrationIndex) {
  return apiFetch(`/api/admin/payments/${eventId}/${registrationIndex}/approve`, {
    method: 'PATCH'
  });
}

export async function rejectPayment(eventId, registrationIndex, reason = '') {
  return apiFetch(`/api/admin/payments/${eventId}/${registrationIndex}/reject`, {
    method: 'PATCH',
    body: { reason }
  });
}


