import { ClientPageHeader } from '@/components/client/ClientPageHeader';
import { ClientProposals, type ClientProposal } from '@/components/client/ClientProposals';
import { backendFetch } from '@/src/lib/api/server';

export default async function ClientProposalsPage() {
  const proposals = await backendFetch<ClientProposal[]>('/proposals/portal');
  return (
    <>
      <ClientPageHeader title="Propuestas" description="Las propuestas que te enviamos. Revísalas en PDF y acéptalas aquí; luego te enviamos el contrato para firma." />
      <ClientProposals proposals={proposals} />
    </>
  );
}
