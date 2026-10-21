import { backendFetch } from '@/src/lib/api/server';

export async function getSettings() { return backendFetch<{ key: string; value: string }[]>('/settings'); }
export async function getPortalSettings() {
  const rows = await backendFetch<{ key: string; value: string }[]>('/settings/portal');
  return Object.fromEntries(rows.map(row => [row.key, row.value]));
}
