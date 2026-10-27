import { TaskKanban } from '@/components/kanban/TaskKanban';
import { TaskDrawer } from '@/components/projects/TaskDrawer';
import { getSession } from '@/src/lib/auth';
import { getProjectTasks, getTaskDetail } from '@/src/modules/projects/server/queries';
import { getWorkers } from '@/src/modules/leads/server/queries';
import { getLeads } from '@/src/modules/leads/server/queries';
import { getCatalogs } from '@/src/modules/products/server/queries';

export default async function ProjectKanbanPage({ params, searchParams }: { params: Promise<{ projectId: string }>; searchParams: Promise<{ task?: string }> }) {
  const [{ projectId }, { task: taskId }] = await Promise.all([params, searchParams]);
  const [data, workers, catalogs, leads, session, task] = await Promise.all([
    getProjectTasks(projectId),
    getWorkers().catch(() => []),
    getCatalogs(),
    getLeads(),
    getSession(),
    taskId ? getTaskDetail(projectId, taskId) : null,
  ]);
  return <>
    <TaskKanban projectId={projectId} initialTasks={data.tasks} usesSprints={data.usesSprints} sprints={data.sprints} requirements={data.requirements} milestones={data.milestones} workers={workers} products={catalogs.products} leads={leads} />
    {task && session && <TaskDrawer projectId={projectId} task={task} tasks={data.tasks} workers={workers} milestones={data.milestones} sprints={data.sprints} requirements={data.requirements} usesSprints={data.usesSprints} currentUser={{ id: session.user.id, role: session.user.role }} products={catalogs.products} leads={leads} />}
  </>;
}
