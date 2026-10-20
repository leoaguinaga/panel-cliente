import { backendFetch } from '@/src/lib/api/server';

export async function getSettings() { return backendFetch<{ key: string; value: string }[]>('/settings'); }
