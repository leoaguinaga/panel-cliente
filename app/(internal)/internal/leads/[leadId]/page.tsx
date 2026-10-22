import { notFound } from 'next/navigation';
import { requireAuth } from '@/src/lib/auth';
import { BackendApiError, backendFetch } from '@/src/lib/api/server';
import { getLeadById, getWorkers } from '@/src/modules/leads/server/queries';
import { getCatalogs } from '@/src/modules/products/server/queries';
import { LeadDetailView } from '@/components/leads/LeadDetailView';

type GoogleStatus = { configured: boolean; connected: boolean; email: string | null };

export default async function LeadDetailPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const [session, lead, workers, products, google] = await Promise.all([
    requireAuth(['ADMIN', 'WORKER']),
    getLeadById(leadId).catch((error) => {
      if (error instanceof BackendApiError && error.status === 404) return null;
      throw error;
    }),
    getWorkers().catch(() => []),
    getCatalogs()
      .then((catalogs) => catalogs.products.map(({ id, name }) => ({ id, name })))
      .catch(() => []),
    backendFetch<GoogleStatus>('/calendar/google/status').catch(() => null),
  ]);

  if (!lead) notFound();

  return (
    <LeadDetailView
      initialLead={lead}
      workers={workers.map(({ id, name }) => ({ id, name }))}
      products={products}
      currentUserId={session.user.id}
      google={google}
    />
  );
}
