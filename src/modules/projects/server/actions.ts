'use server';

import { revalidatePath } from 'next/cache';
import { backendFetch } from '@/src/lib/api/server';

const text = (formData: FormData, key: string) => String(formData.get(key) || '').trim();
const refresh = (projectId?: string) => {
  if (projectId) revalidatePath(`/internal/projects/${projectId}`, 'layout');
  revalidatePath('/internal/projects');
  revalidatePath('/internal/dashboard');
};

export async function createProjectAction(formData: FormData) {
  const res = await backendFetch<{ id: string }>('/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: text(formData, 'name'),
      clientId: text(formData, 'clientId'),
      type: text(formData, 'type') || 'SYSTEM',
      description: text(formData, 'description') || null,
      price: Number(formData.get('price') || 0),
    }),
  });
  refresh();
  return res;
}

export async function updateProjectAction(id: string, formData: FormData) {
  await backendFetch(`/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: text(formData, 'name'),
      description: text(formData, 'description') || null,
      status: text(formData, 'status'),
      priority: text(formData, 'priority'),
      serviceId: text(formData, 'serviceId') || null,
      productId: text(formData, 'productId') || null,
      price: Number(formData.get('price') || 0),
      responsibleWorkerId: text(formData, 'responsibleWorkerId') || null,
    }),
  });
  refresh(id);
}

// Sprints
export async function createSprintAction(projectId: string, formData: FormData) {
  await backendFetch(`/projects/${projectId}/sprints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: text(formData, 'name'),
      goal: text(formData, 'goal') || null,
      startDate: text(formData, 'startDate') || null,
      endDate: text(formData, 'endDate') || null,
    }),
  });
  refresh(projectId);
}

export async function updateSprintAction(projectId: string, sprintId: string, formData: FormData) {
  await backendFetch(`/projects/${projectId}/sprints/${sprintId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: text(formData, 'name'),
      goal: text(formData, 'goal') || null,
      status: text(formData, 'status') || undefined,
      startDate: text(formData, 'startDate') || null,
      endDate: text(formData, 'endDate') || null,
    }),
  });
  refresh(projectId);
}

export async function deleteSprintAction(projectId: string, sprintId: string) {
  await backendFetch(`/projects/${projectId}/sprints/${sprintId}`, { method: 'DELETE' });
  refresh(projectId);
}

// Requirements
export async function createRequirementAction(projectId: string, formData: FormData) {
  await backendFetch(`/projects/${projectId}/requirements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: text(formData, 'code') || undefined,
      title: text(formData, 'title'),
      description: text(formData, 'description') || null,
      priority: text(formData, 'priority') || 'MEDIUM',
    }),
  });
  refresh(projectId);
}

export async function updateRequirementAction(projectId: string, reqId: string, formData: FormData) {
  await backendFetch(`/projects/${projectId}/requirements/${reqId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: text(formData, 'code') || undefined,
      title: text(formData, 'title'),
      description: text(formData, 'description') || null,
      priority: text(formData, 'priority') || 'MEDIUM',
    }),
  });
  refresh(projectId);
}

export async function deleteRequirementAction(projectId: string, reqId: string) {
  await backendFetch(`/projects/${projectId}/requirements/${reqId}`, { method: 'DELETE' });
  refresh(projectId);
}

// Tasks
export async function createTaskAction(projectId: string, formData: FormData) {
  await backendFetch(`/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: text(formData, 'title'),
      description: text(formData, 'description') || null,
      priority: text(formData, 'priority') || 'MEDIUM',
      status: text(formData, 'status') || 'TODO',
      sprintId: text(formData, 'sprintId') || null,
      requirementId: text(formData, 'requirementId') || null,
      assignedToId: text(formData, 'assignedToId') || null,
      dueDate: text(formData, 'dueDate') || null,
      plannedStartDate: text(formData, 'plannedStartDate') || null,
      plannedEndDate: text(formData, 'plannedEndDate') || null,
    }),
  });
  refresh(projectId);
}

export async function updateTaskStatusAction(taskId: string, projectId: string, status: string, order?: number) {
  await backendFetch(`/projects/${projectId}/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, order }),
  });
  refresh(projectId);
}

export async function updateTaskDetailsAction(taskId: string, projectId: string, formData: FormData) {
  await backendFetch(`/projects/${projectId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: text(formData, 'title') || undefined,
      description: text(formData, 'description') || null,
      priority: text(formData, 'priority') || undefined,
      assignedToId: text(formData, 'assignedToId') || null,
      sprintId: text(formData, 'sprintId') || null,
      requirementId: text(formData, 'requirementId') || null,
      dueDate: text(formData, 'dueDate') || null,
      plannedStartDate: text(formData, 'plannedStartDate') || null,
      plannedEndDate: text(formData, 'plannedEndDate') || null,
    }),
  });
  refresh(projectId);
}

export async function deleteTaskAction(projectId: string, taskId: string) {
  await backendFetch(`/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' });
  refresh(projectId);
}

export async function createTaskDependencyAction(projectId: string, taskId: string, predecessorId: string) {
  const result = await backendFetch(`/projects/${projectId}/tasks/${taskId}/dependencies`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ predecessorId }) });
  refresh(projectId);
  return result;
}

export async function deleteTaskDependencyAction(projectId: string, taskId: string, dependencyId: string) {
  await backendFetch(`/projects/${projectId}/tasks/${taskId}/dependencies/${dependencyId}`, { method: 'DELETE' });
  refresh(projectId);
}

// Evidences
export async function addTaskEvidenceAction(projectId: string, taskId: string, formData: FormData) {
  await backendFetch(`/projects/${projectId}/tasks/${taskId}/evidences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: text(formData, 'title') || 'Evidencia de cumplimiento',
      fileUrl: text(formData, 'fileUrl'),
      notes: text(formData, 'notes') || null,
    }),
  });
  refresh(projectId);
}

export async function deleteTaskEvidenceAction(projectId: string, taskId: string, evidenceId: string) {
  await backendFetch(`/projects/${projectId}/tasks/${taskId}/evidences/${evidenceId}`, { method: 'DELETE' });
  refresh(projectId);
}

// Payment Preset
export async function applyPaymentPresetAction(projectId: string, preset: string, totalPrice?: number) {
  await backendFetch(`/projects/${projectId}/payments/apply-preset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preset, totalPrice }),
  });
  refresh(projectId);
}

export async function createMilestoneAction(projectId: string, formData: FormData) {
  await backendFetch(`/projects/${projectId}/milestones`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: text(formData, 'title'), description: text(formData, 'description') || null, dueDate: text(formData, 'dueDate') || null, visibleToClient: formData.get('visibleToClient') === 'on' }) });
  refresh(projectId);
}

export async function updateMilestoneAction(projectId: string, milestoneId: string, formData: FormData) {
  await backendFetch(`/projects/${projectId}/milestones/${milestoneId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: text(formData, 'title') || undefined, status: text(formData, 'status') || undefined, dueDate: text(formData, 'dueDate') || null, visibleToClient: formData.get('visibleToClient') === 'on' }) });
  refresh(projectId);
}

export async function deleteMilestoneAction(projectId: string, milestoneId: string) { await backendFetch(`/projects/${projectId}/milestones/${milestoneId}`, { method: 'DELETE' }); refresh(projectId); }

export async function upsertScopeAction(projectId: string, formData: FormData) {
  await backendFetch(`/projects/${projectId}/scope`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ summary: text(formData, 'summary'), inclusions: text(formData, 'inclusions'), exclusions: text(formData, 'exclusions'), assumptions: text(formData, 'assumptions') }) });
  refresh(projectId);
}

export async function createDeliverableAction(projectId: string, formData: FormData) {
  await backendFetch(`/projects/${projectId}/deliverables`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: text(formData, 'title'), description: text(formData, 'description'), dueDate: text(formData, 'dueDate') || null, visibleToClient: formData.get('visibleToClient') === 'on' }) });
  refresh(projectId);
}

export async function updateDeliverableAction(projectId: string, deliverableId: string, formData: FormData) {
  await backendFetch(`/projects/${projectId}/deliverables/${deliverableId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: formData.get('completed') === 'on', visibleToClient: formData.get('visibleToClient') === 'on', dueDate: text(formData, 'dueDate') || null }) });
  refresh(projectId);
}

export async function deleteDeliverableAction(projectId: string, deliverableId: string) { await backendFetch(`/projects/${projectId}/deliverables/${deliverableId}`, { method: 'DELETE' }); refresh(projectId); }

export async function updatePaymentAction(projectId: string, paymentId: string, formData: FormData) {
  await backendFetch(`/projects/${projectId}/payments/${paymentId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ concept: text(formData, 'concept'), amount: Number(formData.get('amount') || 0), percentage: text(formData, 'percentage') ? Number(formData.get('percentage')) : null, currency: text(formData, 'currency') || 'USD', dueDate: text(formData, 'dueDate') || null, status: text(formData, 'status'), milestoneId: text(formData, 'milestoneId') || null, notes: text(formData, 'notes') }) });
  refresh(projectId);
}
