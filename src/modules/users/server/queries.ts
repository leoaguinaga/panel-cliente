import { backendFetch } from '@/src/lib/api/server';

export async function getWorkers() {
  return backendFetch<any[]>('/workers');
}
