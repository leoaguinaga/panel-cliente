import { backendFetch } from '@/src/lib/api/server';

type DocumentFilters = { search?: string; type?: string; clientId?: string; projectId?: string };
export async function getDocuments(filters: DocumentFilters = {}) {
  const query = new URLSearchParams();
  if (filters.search) query.set('q', filters.search);
  if (filters.type) query.set('type', filters.type);
  if (filters.clientId) query.set('clientId', filters.clientId);
  if (filters.projectId) query.set('projectId', filters.projectId);
  return backendFetch<Array<{ id: string; originalName: string; type: string; size: number; visibleToClient: boolean; createdAt: string; client: { name: string; businessName: string | null } | null; project: { id: string; name: string } | null; uploadedBy: { name: string } }>>(`/documents${query.size ? `?${query}` : ''}`);
}
