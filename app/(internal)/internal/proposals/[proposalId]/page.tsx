import { notFound } from 'next/navigation';
import { InteractiveProposal } from '@/components/proposals/InteractiveProposal';
import { ProposalClosing } from '@/components/proposals/ProposalClosing';
import { ProposalEditor } from '@/components/proposals/ProposalEditor';
import { requireAuth } from '@/src/lib/auth';
import { BackendApiError } from '@/src/lib/api/server';
import { getProposal } from '@/src/modules/proposals/server/queries';

export default async function ProposalPage({ params }: { params: Promise<{ proposalId: string }> }) {
  const { proposalId } = await params;
  const { user } = await requireAuth(['ADMIN', 'WORKER']);
  const proposal = await getProposal(proposalId).catch((error) => {
    if (error instanceof BackendApiError && error.status === 404) notFound();
    throw error;
  });
  // La clave reinicia el editor al pasar de una versión a otra.
  return (
    <div className="space-y-6">
      {proposal.mode === 'INTERACTIVE' ? <InteractiveProposal key={proposal.id} initial={proposal} /> : <ProposalEditor key={proposal.id} initial={proposal} />}
      <ProposalClosing proposal={proposal} isAdmin={user.role === 'ADMIN'} />
    </div>
  );
}
