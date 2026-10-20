import type { Worker } from '@/src/lib/api/contracts';
import { backendFetch } from '@/src/lib/api/server';

export async function getWorkers() {
  return backendFetch<Worker[]>('/workers');
}
