export type ProjectWorker = { id: string; name: string; email?: string; image?: string | null; role?: 'ADMIN' | 'WORKER' };
export type ProjectClient = { id: string; name: string; businessName?: string | null };

export type ProjectSummary = {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  status: string;
  priority: string;
  progress: number;
  price: number | string;
  clientId: string;
  client: ProjectClient;
  service?: { id: string; name: string } | null;
  product?: { id: string; name: string } | null;
  responsibleWorker?: ProjectWorker | null;
  sprints: ProjectSprint[];
  _count: { tasks: number; milestones: number; sprints: number; requirements: number; documents: number; payments: number };
};

export type ProjectSprint = { id: string; name: string; goal?: string | null; status: string; startDate?: string | null; endDate?: string | null; order: number; _count?: { tasks: number } };
export type ProjectRequirement = { id: string; code: string | null; title: string; description?: string | null; priority?: string; tasks?: Array<{ id: string; title: string; status: string; priority: string }> };
export type ProjectMilestone = { id: string; title: string; description?: string | null; status: string; order: number; dueDate?: string | null; completedAt?: string | null; visibleToClient: boolean; payments?: ProjectPayment[] };
export type ProjectScope = { id: string; summary?: string | null; inclusions?: string | null; exclusions?: string | null; assumptions?: string | null };
export type ProjectDeliverable = { id: string; title: string; description?: string | null; dueDate?: string | null; completedAt?: string | null; visibleToClient: boolean };
export type ProjectDocument = { id: string; type: string; originalName: string; mimeType: string; size: number; visibleToClient: boolean; createdAt: string; uploadedBy: { id?: string; name: string } };
export type ProjectPayment = {
  id: string;
  concept: string;
  amount: number | string;
  percentage?: number | string | null;
  currency: string;
  status: string;
  dueDate?: string | null;
  paidAt?: string | null;
  paymentChannel?: string | null;
  transactionReference?: string | null;
  evidenceUrl?: string | null;
  evidenceStorageKey?: string | null;
  evidenceOriginalName?: string | null;
  evidenceMimeType?: string | null;
  clientNotes?: string | null;
  reviewNotes?: string | null;
  notes?: string | null;
  milestoneId?: string | null;
  milestone?: { id: string; title: string; status: string } | null;
};

export type ProjectTask = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'BLOCKED' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  order: number;
  dueDate: string | null;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  completedAt: string | null;
  assignedTo?: ProjectWorker | null;
  sprint?: { id: string; name: string; status: string } | null;
  requirement?: { id: string; code: string | null; title: string } | null;
  evidences?: Array<{ id: string; title: string | null; fileUrl: string; notes: string | null; createdAt: string; uploadedBy?: { id: string; name: string } | null }>;
  blockedBy?: Array<{ id: string; predecessorId: string; predecessor: { id: string; title: string; status: string } }>;
  unlocks?: Array<{ id: string; successorId: string; successor: { id: string; title: string; status: string } }>;
};

export type ProjectTasksSection = { id: string; tasks: ProjectTask[]; sprints: ProjectSprint[]; milestones: ProjectMilestone[]; requirements: ProjectRequirement[] };
export type ProjectPlanningSection = { id: string; requirements: ProjectRequirement[]; sprints: ProjectSprint[]; milestones: ProjectMilestone[]; scope: ProjectScope | null; deliverables: ProjectDeliverable[] };
export type ProjectDocumentationSection = { id: string; clientId: string; price: number | string; documents: ProjectDocument[]; payments: ProjectPayment[]; milestones: Array<{ id: string; title: string; status: string }> };
