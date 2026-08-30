import { backendFetch } from '@/src/lib/api/server';
type ApiEntity = Record<string, any>;
type ClientDetail = ApiEntity & { projects: ApiEntity[]; documents: ApiEntity[]; payments: ApiEntity[] };

export async function getClients(filters?: { search?: string }) {
  const search = filters?.search?.trim();
  return backendFetch<any[]>(`/clients${search ? `?q=${encodeURIComponent(search)}` : ''}`);
}

export async function getClientById(id: string) {
  return backendFetch<ClientDetail>(`/clients/${id}`);
}
