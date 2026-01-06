import { apiFetch } from './client.js';

export async function getAllPaymentReceipts(status = null) {
  const query = status ? `?status=${status}` : '';
  return apiFetch(`/api/admin/payments${query}`);
}

export async function approvePayment(id) {
  return apiFetch(`/api/admin/payments/${id}/approve`, {
    method: 'PATCH'
  });
}

export async function rejectPayment(id, reason = '') {
  return apiFetch(`/api/admin/payments/${id}/reject`, {
    method: 'PATCH',
    body: { reason }
  });
}


