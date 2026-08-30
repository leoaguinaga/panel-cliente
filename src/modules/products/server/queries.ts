import { backendFetch } from '@/src/lib/api/server';
type ApiEntity = Record<string, any>;
type ServiceCatalog = ApiEntity & { sectors: ApiEntity[] };

export async function getCatalogs() {
  return backendFetch<{ services: ServiceCatalog[]; products: ApiEntity[] }>('/catalogs');
}
