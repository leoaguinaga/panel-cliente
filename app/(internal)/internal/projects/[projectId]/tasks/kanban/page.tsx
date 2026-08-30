import { TaskKanban } from '@/components/kanban/TaskKanban';
import { getProjectTasks } from '@/src/modules/projects/server/queries';
import { getWorkers } from '@/src/modules/leads/server/queries';

export default async function ProjectKanbanPage({ params }: { params: Promise<{ projectId: string }> }) { const { projectId } = await params; const [data, workers] = await Promise.all([getProjectTasks(projectId), getWorkers().catch(() => [])]); return <TaskKanban projectId={projectId} initialTasks={data.tasks} sprints={data.sprints} requirements={data.requirements} workers={workers} />; }
