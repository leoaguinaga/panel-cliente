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
  scope?: Pick<ProjectScope, 'inclusions' | 'exclusions' | 'assumptions'> | null;
  usesSprints: boolean;
  sprints: ProjectSprint[];
  _count: { tasks: number; milestones: number; sprints: number; requirements: number; documents: number; payments: number };
};

export type ProjectSprint = { id: string; name: string; goal?: string | null; status: string; startDate?: string | null; endDate?: string | null; order: number; _count?: { tasks: number } };
export type RequirementStatus = 'pending' | 'in_progress' | 'done';
export type ProjectRequirement = { acceptanceCriteria?: Array<{ id: string; text: string; checked: boolean }>; id: string; code: string | null; title: string; description?: string | null; priority?: string; milestoneId?: string | null; status?: RequirementStatus; tasks?: Array<{ id: string; title: string; status: string; priority: string }> };
/** Aprobado (o COMPLETED, el estado anterior al rediseño de hitos). */
export const isMilestoneDone = (status: string) => status === 'APPROVED' || status === 'COMPLETED';

export type DeliverableAttachment = {
  id: string; kind: string; title: string; url?: string | null; notes?: string | null;
  document?: { id: string; originalName: string; archivedAt?: string | null } | null;
  sourceTaskId?: string | null; sourceTaskTitle?: string | null; sourceEvidenceId?: string | null;
};
export type MilestoneDeliverable = { attachments?: DeliverableAttachment[]; id: string; title: string; done: boolean; document?: { id: string; originalName: string } | null };
export type ProjectMilestone = {
  startDate?: string | null;
  id: string;
  title: string;
  description?: string | null;
  status: string;
  order: number;
  dueDate?: string | null;
  completedAt?: string | null;
  visibleToClient: boolean;
  reviewRequestedAt?: string | null;
  approvedAt?: string | null;
  approvalNote?: string | null;
  approvedBy?: { id: string; name: string; role: string } | null;
  payments?: ProjectPayment[];
  requirements?: Array<{ id: string; code: string | null; title: string }>;
  tasks?: Array<{ id: string; title?: string; status: string; parentId: string | null; evidences?: TaskEvidence[] }>;
  deliverables?: MilestoneDeliverable[];
};
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
  number: number;
  projectId: string;
  productId?: string | null;
  product?: { id: string; name: string } | null;
  leadId?: string | null;
  lead?: { id: string; name: string; companyName?: string | null } | null;
  parentId: string | null;
  /** Estado previo mientras está BLOCKED (la tarjeta se dibuja en esa columna). */
  blockedFromStatus?: Exclude<ProjectTask['status'], 'BLOCKED'> | null;
  statusChangedAt?: string;
  milestoneId?: string | null;
  reviewerId?: string | null;
  estimateHours?: string | number | null;
  reviewer?: { id: string; name: string } | null;
  milestone?: { id: string; title: string; status?: string } | null;
  subtasks?: Array<{ id: string; status: ProjectTask['status'] }>;
  _count?: { comments: number };
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
  requiresEvidence?: boolean;
  evidences?: TaskEvidence[];
  blockedBy?: Array<{ id: string; predecessorId: string; predecessor: { id: string; title: string; status: string } }>;
  unlocks?: Array<{ id: string; successorId: string; successor: { id: string; title: string; status: string } }>;
};

export type ProjectTasksSection = { id: string; usesSprints: boolean; tasks: ProjectTask[]; sprints: ProjectSprint[]; milestones: ProjectMilestone[]; requirements: ProjectRequirement[] };
export type ProjectPlanningSection = { id: string; usesSprints: boolean; requirements: ProjectRequirement[]; sprints: ProjectSprint[]; milestones: ProjectMilestone[]; documents: Array<{ id: string; originalName: string }>; scope: ProjectScope | null; deliverables: ProjectDeliverable[] };
export type ProjectDocumentationSection = { id: string; clientId: string; price: number | string; documents: ProjectDocument[]; payments: ProjectPayment[]; milestones: Array<{ id: string; title: string; status: string }> };

export type TaskPerson = { id: string; name: string; image?: string | null };
export type TaskComment = { id: string; body: string; createdAt: string; author: TaskPerson };
export type TaskActivity = { id: string; action: string; description: string | null; createdAt: string; actor: { id: string; name: string } | null };
export type TaskDetail = Omit<ProjectTask, 'subtasks' | 'assignedTo' | 'blockedBy' | 'unlocks'> & {
  assignedTo: TaskPerson | null;
  reviewer: TaskPerson | null;
  parent: { id: string; number: number; title: string } | null;
  subtasks: Array<Pick<ProjectTask, 'id' | 'number' | 'title' | 'status' | 'priority' | 'dueDate' | 'estimateHours'> & { assignedTo: TaskPerson | null }>;
  comments: TaskComment[];
  activity: TaskActivity[];
  blockedBy: Array<{ id: string; predecessorId: string; predecessor: { id: string; number: number; title: string; status: string } }>;
  unlocks: Array<{ id: string; successorId: string; successor: { id: string; number: number; title: string; status: string } }>;
};

export type TaskEvidence = {
  id: string;
  kind: 'IMAGE' | 'LINK' | 'NOTE';
  title: string | null;
  fileUrl: string | null;
  notes: string | null;
  createdAt: string;
  uploadedBy?: { id: string; name: string } | null;
};
