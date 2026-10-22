import type { LeadItem } from '@/components/kanban/LeadKanban';
import type { ProjectSummary, ProjectTask, ProjectDocument, ProjectPayment } from '@/src/modules/projects/types';
export type Worker = { id: string; name: string; email: string; phone: string | null; jobTitle: string | null; image: string | null; role: 'ADMIN' | 'WORKER'; status: string; _count: { assignedProjects: number; assignedTasks: number } };
export type Lead = LeadItem & { clientId: string | null; convertedProjectId: string | null; project: { id: string; name: string } | null; demos: { id: string; product: { name: string } }[]; updatedAt: string; lastContactAt: string | null; nextActionAt?: string | null };
export type LeadMeeting = { id: string; title: string; date: string; time: string | null; duration: number; status: string; notes: string; attendees: string[]; useMeet: boolean; sendInvites: boolean; meetUrl: string | null; syncStatus: string; syncError: string | null; version: number; owner: { id: string; name: string } };
export type LeadDetail = Lead & { meetings: LeadMeeting[] };
export type Client = { id: string; name: string; businessName: string | null; email: string | null; phone: string | null; documentType: string | null; documentNumber: string | null; address: string | null; website: string | null; logoKey?: string | null; status: string; notes: string | null; whatsapp: string | null; responsibleWorkerId: string | null; responsibleWorker: Worker | null; assignedToId: string | null; assignedTo: Worker | null; createdAt: string; _count: { projects: number; payments: number } };
export type Payment = ProjectPayment & { dueDate: string | null; paidAt: string | null; client: Client; project: { id: string; name: string } | null };
export type ClientUser = { id: string; name: string; email: string; status: 'ACTIVE' | 'INVITED' | 'INACTIVE'; createdAt: string };
export type ClientDetail = Client & { users: ClientUser[]; projects: ProjectSummary[]; documents: (ProjectDocument & { archivedAt: string | null })[]; payments: Payment[]; leads: Lead[] };
export type Activity = { id: string; description: string | null; entityType: string; action: string; actor: { name: string } | null; createdAt: string };
export type Task = ProjectTask & { project: { id: string; name: string }; parent?: { id: string; number: number; title: string } | null };
export type Project = ProjectSummary & { client: Client; tasks: ProjectTask[]; updatedAt: string; startDate: string | null; estimatedEndDate: string | null };

export type WorkerDetail = Worker & {
  createdAt: string;
  _count: Worker['_count'] & { assignedLeads: number };
  assignedProjects: { id: string; name: string; status: string; progress: number; client: { name: string } }[];
  assignedTasks: { id: string; number: number; title: string; status: string; dueDate: string | null; project: { id: string; name: string } }[];
};
export type WorkerActivity = Activity & { entityId: string; actorId: string | null };
export type WorkerActivityPage = { items: WorkerActivity[]; total: number; page: number; pageSize: number; actions: string[] };
