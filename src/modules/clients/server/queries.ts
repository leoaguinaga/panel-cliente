import type { Client, ClientDetail, Activity } from '@/src/lib/api/contracts';
import { backendFetch } from '@/src/lib/api/server';
import { allPages, type Page } from '@/src/lib/api/pagination';
export function getClients(filters?: { search?: string }) { return allPages<Client>(`/clients${filters?.search ? `?q=${encodeURIComponent(filters.search)}` : ''}`); }
export function getClientsPage(query: Record<string, string | undefined>) { const params = new URLSearchParams(); for (const [key,value] of Object.entries(query)) if(value) params.set(key,value); return backendFetch<Page<Client>>(`/clients?${params}`); }
export function getClientById(id: string) { return backendFetch<ClientDetail>(`/clients/${id}`); }
export function getClientActivity(id: string, page = '1') { return backendFetch<Page<Activity>>(`/clients/${id}/activity?page=${encodeURIComponent(page)}`); }
