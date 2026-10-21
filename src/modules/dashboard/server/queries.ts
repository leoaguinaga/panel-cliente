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

export type ProjectSite = {
  kind: 'LIVE' | 'DEMO'; url: string; comment: string | null;
  ogTitle: string | null; ogDescription: string | null;
  ogStatus: 'PENDING' | 'OK' | 'NO_IMAGE' | 'FAILED'; ogError: string | null; ogFetchedAt: string | null;
  hasImage: boolean; hasFavicon: boolean; version: number;
};
export type ClientMeeting = { id: string; title: string; date: string; time: string | null; duration: number; meetUrl: string | null; projectId: string | null };
export type ClientDashboard = Awaited<ReturnType<typeof getClientDashboard>>;
export async function getClientDashboard() {
  return backendFetch<{
    client: { name: string; businessName: string | null; email: string | null; phone: string | null; address: string | null; website: string | null } | null;
    userName: string; userEmail: string; userPhone: string | null;
    projects: Array<{ id: string; name: string; description: string | null; type: string; status: string; progress: number; startDate: string | null; estimatedEndDate: string | null; updatedAt: string; scope?: { inclusions: string | null; exclusions: string | null; assumptions: string | null } | null; site: ProjectSite | null; milestones: Array<{ id: string; title: string; description?: string | null; status: string; order: number; dueDate?: string | null; completedAt: string | null; reviewRequestedAt?: string | null; approvedAt?: string | null }>; sprints?: Array<{ id: string; name: string; status: string; startDate: string | null; endDate: string | null; order: number }>; deliverables?: Array<{ id: string; title: string; description: string | null; done?: boolean; dueDate: string | null; completedAt: string | null; milestone?: { id: string; title: string } | null; document?: { id: string; originalName: string; archivedAt?: string | null } | null; attachments?: import('@/src/modules/projects/types').DeliverableAttachment[] }> }>;
    documents: Array<{ id: string; originalName: string; type: string; size: number; createdAt: string; projectId?: string | null; project: { name: string } | null }>;
    payments: Array<{ paidAmount?: number; milestone?: { title: string } | null; id: string; concept: string; amount: number | string; currency: string; status: string; dueDate: string | null; paidAt: string | null; paymentChannel?: string | null; transactionReference?: string | null; evidenceUrl?: string | null; evidenceOriginalName?: string | null; evidenceStorageKey?: string | null; evidenceMimeType?: string | null; clientNotes?: string | null; reviewNotes?: string | null; projectId?: string | null; milestoneId?: string | null; project: { name: string } | null }>;
    meetings: ClientMeeting[];
  }>(`/dashboard/client`);
}

export type TodayItemKind = 'task' | 'lead' | 'demo' | 'demo_follow_up' | 'deliverable' | 'milestone_review' | 'payment_review' | 'payment_due' | 'project_unassigned' | 'task_blocked';
export type TodayItem = {
  id: string; kind: TodayItemKind; title: string; context: string;
  /** Día calendario YYYY-MM-DD (America/Lima). */
  date: string | null;
  ref: { taskId?: string; projectId?: string; leadId?: string; productId?: string; demoId?: string; paymentId?: string };
  status?: string; unassigned?: boolean; amount?: { value: number; currency: string };
};
export type TodayAgenda = {
  date: string;
  overdue: TodayItem[]; today: TodayItem[]; week: TodayItem[]; decisions: TodayItem[];
  unassignedTasks: number;
  summary: { activeProjects: number; pausedProjects: number; openTeamTasks: number };
  workers: Array<{ id: string; name: string; email: string }>;
};

export async function getTodayAgenda() {
  return backendFetch<TodayAgenda>('/dashboard/today');
}
