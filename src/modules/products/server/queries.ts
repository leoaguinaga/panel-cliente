import { backendFetch } from '@/src/lib/api/server';
type ApiEntity = { id: string; name: string; slug: string; description: string | null; type: string; active: boolean; _count: { projects: number } };
type ServiceCatalog = ApiEntity & { sectors: ApiEntity[] };

export async function getCatalogs() {
  return backendFetch<{ services: ServiceCatalog[]; products: { id: string; name: string; slug: string; description: string | null; status: string; _count: { projects: number; demos: number } }[] }>('/catalogs');
}
