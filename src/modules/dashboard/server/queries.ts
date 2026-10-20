import { backendFetch } from '@/src/lib/api/server';
type TaskItem = { id: string; title: string; status: string; dueDate: string | null; project: { id: string; name: string }; assignedTo?: { name: string } | null };
type DashboardResponse = {
  activeProjects: number; pausedProjects: number;
  workers: Array<{ id: string; name: string }>;
  services: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string; projects: Array<{ status: string; progress: number }>; activeProjects: number; pausedProjects: number; averageProgress: number }>;
  overdueTasks: TaskItem[]; blockedTasks: TaskItem[]; myTasks: TaskItem[];
  unassignedProjects: Array<{ id: string; name: string; status: string; client: { name: string; businessName: string | null } }>;
  upcomingDeliverables: Array<{ id: string; title: string; dueDate: string | null; project: { id: string; name: string } }>;
  workload: Array<{ id: string; name: string; openTasks: number }>;
};

export type DashboardFilters = { workerId?: string; productId?: string; serviceId?: string; status?: string };

export async function getOperationalDashboard(filters: DashboardFilters = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, value);
  }
  return backendFetch<DashboardResponse>(`/dashboard${query.size ? `?${query}` : ''}`);
}

export type ClientDashboard = Awaited<ReturnType<typeof getClientDashboard>>;
export async function getClientDashboard() {
  return backendFetch<{
    client: { name: string; businessName: string | null; email: string | null; phone: string | null; address: string | null; website: string | null } | null;
    userName: string; userEmail: string; userPhone: string | null;
    projects: Array<{ id: string; name: string; description: string | null; type: string; status: string; progress: number; startDate: string | null; estimatedEndDate: string | null; updatedAt: string; milestones: Array<{ id: string; title: string; description?: string | null; status: string; order: number; dueDate?: string | null; completedAt: string | null }>; sprints?: Array<{ id: string; name: string; status: string; startDate: string | null; endDate: string | null; order: number }>; deliverables?: Array<{ id: string; title: string; description: string | null; dueDate: string | null; completedAt: string | null }> }>;
    documents: Array<{ id: string; originalName: string; type: string; size: number; createdAt: string; projectId?: string | null; project: { name: string } | null }>;
    payments: Array<{ id: string; concept: string; amount: number | string; currency: string; status: string; dueDate: string | null; paidAt: string | null; paymentChannel?: string | null; transactionReference?: string | null; evidenceUrl?: string | null; evidenceOriginalName?: string | null; evidenceStorageKey?: string | null; evidenceMimeType?: string | null; clientNotes?: string | null; reviewNotes?: string | null; projectId?: string | null; project: { name: string } | null }>;
  }>(`/dashboard/client`);
}
