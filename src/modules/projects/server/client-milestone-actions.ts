'use server';

import { revalidatePath } from 'next/cache';
import { BackendApiError, backendFetch } from '@/src/lib/api/server';
import type { MilestoneActionResult } from './milestone-actions';

/** Decisión del cliente sobre un hito en revisión (rutas `client/milestones/:id/*`). */
async function decide(projectId: string, milestoneId: string, path: 'approve' | 'request-changes', body: Record<string, string>): Promise<MilestoneActionResult> {
  try {
    await backendFetch(`/client/milestones/${milestoneId}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch (error) {
    if (error instanceof BackendApiError) return { ok: false, error: error.message };
    throw error;
  }
  revalidatePath('/client', 'layout');
  revalidatePath(`/internal/projects/${projectId}`, 'layout');
  revalidatePath('/internal/dashboard');
  return { ok: true, error: null };
}

export async function approveMilestoneAsClient(projectId: string, milestoneId: string, note: string) {
  return decide(projectId, milestoneId, 'approve', note.trim() ? { note: note.trim() } : {});
}

export async function requestMilestoneChangesAsClient(projectId: string, milestoneId: string, comment: string) {
  return decide(projectId, milestoneId, 'request-changes', { comment: comment.trim() });
}
