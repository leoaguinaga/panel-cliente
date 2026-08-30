import { backendFetch } from '@/src/lib/api/server';

export async function getLeads(filters?: { status?: string; type?: string; priority?: string; zone?: string; q?: string }) {
  const query = new URLSearchParams();
  if (filters?.status) query.set('status', filters.status);
  if (filters?.type) query.set('type', filters.type);
  if (filters?.priority) query.set('priority', filters.priority);
  if (filters?.zone) query.set('zone', filters.zone);
  if (filters?.q) query.set('q', filters.q);
  return backendFetch<any[]>(`/leads${query.size ? `?${query}` : ''}`);
}

export async function getLeadById(id: string) {
  return backendFetch<any>(`/leads/${id}`);
}

export async function getWorkers() {
  return backendFetch<any[]>('/directory/workers');
}

export async function getClients() {
  return backendFetch<any[]>('/clients');
}

