import type { ProposalDetail } from './types';

/** Sube el propuesta.html de una interactiva; los errores del contrato vuelven uno por línea. */
export async function uploadProposalHtml(url: string, file: File) {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(url, { method: 'POST', body });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join('\n') : data?.message;
    throw new Error(message || (response.status === 413 ? 'El HTML pesa más de 5 MB' : 'No se pudo subir el archivo'));
  }
  return data as ProposalDetail;
}

export const htmlUrl = (id: string, download = false) => `/api/backend/proposals/${id}/html${download ? '?download=1' : ''}`;
