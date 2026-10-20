import { backendFetch } from '@/src/lib/api/server';

type DocumentFilters = { search?: string; type?: string; clientId?: string; projectId?: string; archived?: string; page?: string };
export async function getDocuments(filters: DocumentFilters = {}) {
  const query = new URLSearchParams();
  if (filters.search) query.set('q', filters.search);
  if (filters.type) query.set('type', filters.type);
  if (filters.clientId) query.set('clientId', filters.clientId);
  if(filters.archived) query.set('archived',filters.archived);
  if(filters.page) query.set('page',filters.page);
  if (filters.projectId) query.set('projectId', filters.projectId);
  const response = await backendFetch<{ items: Array<{ id: string; originalName: string; type: string; size: number; visibleToClient: boolean; createdAt: string; client: { name: string; businessName: string | null } | null; project: { id: string; name: string } | null; uploadedBy: { name: string } }>; total: number }>(`/documents${query.size ? `?${query}` : ''}`);
  return response.items;
}

export async function getDocumentsPage(query: Record<string,string|undefined>) { const params=new URLSearchParams();for(const [key,value] of Object.entries(query))if(value)params.set(key,value);return backendFetch<{items:import('@/components/internal/AdminDocumentsTable').AdminDocumentItem[];total:number;page:number;pageSize:number}>(`/documents?${params}`); }
