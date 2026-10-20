import type { Project, Task } from '@/src/lib/api/contracts';
import { allPages, type Page } from '@/src/lib/api/pagination';
import { backendFetch } from '@/src/lib/api/server';
import type { ProjectDocumentationSection, ProjectPlanningSection, ProjectSummary, ProjectTasksSection } from '../types';

export async function getProjectsOverview(filters?: { search?: string; status?: string }) {
  const query = new URLSearchParams();
  if (filters?.status) query.set('status', filters.status);
  if (filters?.search) query.set('q', filters.search);
  return allPages<Project>(`/projects${query.size ? `?${query}` : ''}`);
}

export async function getProjectById(id: string) {
  return backendFetch<Project>(`/projects/${id}`);
}

export const getProjectSummary = (id: string) => backendFetch<ProjectSummary>(`/projects/${id}/summary`);
export const getProjectTasks = (id: string) => backendFetch<ProjectTasksSection>(`/projects/${id}/tasks-section`);
export const getProjectPlanning = (id: string) => backendFetch<ProjectPlanningSection>(`/projects/${id}/planning-section`);
export const getProjectDocumentation = (id: string) => backendFetch<ProjectDocumentationSection>(`/projects/${id}/documentation-section`);

export function getProjectsPage(query: Record<string,string|undefined>) { const params=new URLSearchParams(); for(const [key,value] of Object.entries(query)) if(value) params.set(key,value); return backendFetch<Page<Project>>(`/projects?${params}`); }
export function getTasksPage(query: Record<string,string|undefined>) { const params=new URLSearchParams(); for(const [key,value] of Object.entries(query)) if(value) params.set(key,value); return backendFetch<Page<Task>>(`/projects/tasks?${params}`); }
