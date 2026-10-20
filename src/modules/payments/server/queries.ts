import type { Payment } from '@/src/lib/api/contracts';
import { allPages, type Page } from '@/src/lib/api/pagination';
import { backendFetch } from '@/src/lib/api/server';

export async function getPayments(filters?: { status?: string; clientId?: string }) {
  const query = new URLSearchParams();
  if (filters?.status) query.set('status', filters.status);
  if (filters?.clientId) query.set('clientId', filters.clientId);
  return allPages<Payment>(`/payments${query.size ? `?${query}` : ''}`);
}

export async function getPaymentSummary() {
  return backendFetch<{ total: number; paid: number; underReview: number; pending: number; overdue: number }>('/payments/summary');
}

export function getPaymentsPage(query: Record<string,string|undefined>) { const params=new URLSearchParams(); for(const [key,value] of Object.entries(query))if(value)params.set(key,value); return backendFetch<Page<Payment>>(`/payments?${params}`); }
