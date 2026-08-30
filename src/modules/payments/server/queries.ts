import { backendFetch } from '@/src/lib/api/server';

export async function getPayments(filters?: { status?: string; clientId?: string }) {
  const query = new URLSearchParams();
  if (filters?.status) query.set('status', filters.status);
  if (filters?.clientId) query.set('clientId', filters.clientId);
  return backendFetch<any[]>(`/payments${query.size ? `?${query}` : ''}`);
}

export async function getPaymentSummary() {
  return backendFetch<{ total: number; paid: number; pending: number; overdue: number }>('/payments/summary');
}
