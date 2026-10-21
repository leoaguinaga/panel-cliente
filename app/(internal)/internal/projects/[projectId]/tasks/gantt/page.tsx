import { ProjectGantt } from '@/components/projects/ProjectGantt';
import { getProjectTasks } from '@/src/modules/projects/server/queries';

export default async function ProjectGanttPage({ params }: { params: Promise<{ projectId: string }> }) { const { projectId } = await params; const data = await getProjectTasks(projectId); return <ProjectGantt tasks={data.tasks} sprints={data.usesSprints ? data.sprints : []} milestones={data.milestones} />; }
