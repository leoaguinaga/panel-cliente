'use server';

import { revalidatePath } from 'next/cache';
import { BackendApiError, backendFetch } from '@/src/lib/api/server';

export type MilestoneActionResult = { ok: true; error: null } | { ok: false; error: string };

async function run(projectId: string, request: () => Promise<unknown>): Promise<MilestoneActionResult> {
  try {
    await request();
  } catch (error) {
    if (error instanceof BackendApiError) return { ok: false, error: error.message };
    throw error;
  }
  revalidatePath(`/internal/projects/${projectId}`, 'layout');
  revalidatePath('/internal/dashboard');
  revalidatePath('/internal/calendar');
  return { ok: true, error: null };
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: body === undefined ? undefined : JSON.stringify(body),
});

const base = (projectId: string) => `/projects/${projectId}`;

export async function createMilestone(projectId: string, body: { startDate?: string | null; requirementIds?: string[]; title: string; dueDate: string | null; visibleToClient: boolean }) {
  return run(projectId, () => backendFetch(`${base(projectId)}/milestones`, json('POST', body)));
}

export async function updateMilestone(projectId: string, milestoneId: string, body: Partial<{ startDate: string | null; requirementIds: string[]; title: string; dueDate: string | null; visibleToClient: boolean; order: number }>) {
  return run(projectId, () => backendFetch(`${base(projectId)}/milestones/${milestoneId}`, json('PATCH', body)));
}

/** Intercambia el orden de dos hitos vecinos. */
export async function swapMilestones(projectId: string, a: { id: string; order: number }, b: { id: string; order: number }) {
  return run(projectId, async () => {
    await backendFetch(`${base(projectId)}/milestones/${a.id}`, json('PATCH', { order: b.order }));
    await backendFetch(`${base(projectId)}/milestones/${b.id}`, json('PATCH', { order: a.order }));
  });
}

export async function deleteMilestone(projectId: string, milestoneId: string) {
  return run(projectId, () => backendFetch(`${base(projectId)}/milestones/${milestoneId}`, { method: 'DELETE' }));
}

export async function submitMilestone(projectId: string, milestoneId: string) {
  return run(projectId, () => backendFetch(`${base(projectId)}/milestones/${milestoneId}/submit`, json('POST')));
}

export async function approveMilestone(projectId: string, milestoneId: string, note: string) {
  return run(projectId, () => backendFetch(`${base(projectId)}/milestones/${milestoneId}/approve`, json('POST', { note: note || undefined })));
}

export async function requestMilestoneChanges(projectId: string, milestoneId: string, comment: string) {
  return run(projectId, () => backendFetch(`${base(projectId)}/milestones/${milestoneId}/request-changes`, json('POST', { comment })));
}

export async function addMilestoneDeliverable(projectId: string, milestoneId: string, title: string, documentId: string | null) {
  return run(projectId, () => backendFetch(`${base(projectId)}/deliverables`, json('POST', { title, milestoneId, documentId })));
}

export async function updateMilestoneDeliverable(projectId: string, deliverableId: string, body: Partial<{ done: boolean; documentId: string | null }>) {
  return run(projectId, () => backendFetch(`${base(projectId)}/deliverables/${deliverableId}`, json('PATCH', body)));
}

export async function deleteMilestoneDeliverable(projectId: string, deliverableId: string) {
  return run(projectId, () => backendFetch(`${base(projectId)}/deliverables/${deliverableId}`, { method: 'DELETE' }));
}

export async function setRequirementMilestone(projectId: string, requirementId: string, milestoneId: string | null) {
  return run(projectId, () => backendFetch(`${base(projectId)}/requirements/${requirementId}`, json('PATCH', { milestoneId })));
}
