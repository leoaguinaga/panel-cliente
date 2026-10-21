import { backendFetch } from '@/src/lib/api/server';
import type { ProposalDetail } from '../types';

export async function getProposal(id: string) {
  return backendFetch<ProposalDetail>(`/proposals/${id}`);
}
