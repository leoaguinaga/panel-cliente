import { backendFetch } from '@/src/lib/api/server';
type ApiEntity = { id: string; name: string; slug: string; description: string | null; type: string; active: boolean; _count: { projects: number } };
type ServiceCatalog = ApiEntity & { sectors: ApiEntity[] };

/** Un producto propio es un espacio de trabajo. */
export type ProductStatus = 'ACTIVE' | 'PILOT';
export type CatalogProduct = { id: string; name: string; slug: string; description: string | null; status: ProductStatus; color: string | null; logoUrl: string | null; archivedAt: string | null; _count: { projects: number; demos: number } };

/** `products` excluye los archivados; vienen aparte en `archivedProducts`. */
export async function getCatalogs() {
  return backendFetch<{ services: ServiceCatalog[]; products: CatalogProduct[]; archivedProducts: CatalogProduct[] }>('/catalogs');
}

export type ProductPulse = Pick<CatalogProduct, 'id' | 'name' | 'slug' | 'description' | 'status' | 'color' | 'logoUrl'> & {
  leads: { active: number; unassigned: number };
  demos: { open: number; next: string | null };
  projects: { active: number };
  /** null para colaboradores: «por cobrar» es solo de admin. */
  receivable: { currency: string; amount: string; count: number }[] | null;
};

export async function getProductPulse() {
  return backendFetch<{ products: ProductPulse[] }>('/catalogs/products/pulse');
}
