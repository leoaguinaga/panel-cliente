import { notFound } from 'next/navigation';
import { ProposalEditor } from '@/components/proposals/ProposalEditor';
import { BackendApiError } from '@/src/lib/api/server';
import { getProposal } from '@/src/modules/proposals/server/queries';

export default async function ProposalPage({ params }: { params: Promise<{ proposalId: string }> }) {
  const { proposalId } = await params;
  const proposal = await getProposal(proposalId).catch((error) => {
    if (error instanceof BackendApiError && error.status === 404) notFound();
    throw error;
  });
  // La clave reinicia el editor al pasar de una versión a otra.
  return <ProposalEditor key={proposal.id} initial={proposal} />;
}
