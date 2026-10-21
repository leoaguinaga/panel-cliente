import { requireAuth } from '@/src/lib/auth';
import { WorkspacesView } from '@/components/products/WorkspacesView';
import { getCatalogs, getProductPulse } from '@/src/modules/products/server/queries';

/** Cada producto propio es un espacio de trabajo; FoxCode (servicios) no se gestiona aquí. */
export default async function ProductsPage() {
  const session = await requireAuth(['ADMIN', 'WORKER']);
  const isAdmin = session.user.role === 'ADMIN';
  const [{ products }, { archivedProducts }] = await Promise.all([getProductPulse(), getCatalogs()]);
  return <WorkspacesView products={products} archived={isAdmin ? archivedProducts : []} isAdmin={isAdmin} />;
}
