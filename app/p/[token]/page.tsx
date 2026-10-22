import type { Metadata } from 'next';
import { PublicProposal } from '@/components/proposals/PublicProposal';

// Enlace que recibe el cliente: sin sesión (el proxy no cubre /p) y fuera de buscadores.
export const metadata: Metadata = {
  title: 'Propuesta — FoxCode',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function PublicProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PublicProposal token={token} />;
}
