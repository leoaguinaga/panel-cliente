import { notFound } from 'next/navigation';
import { ProjectHeader } from '@/components/projects/ProjectHeader';
import { ProjectNavigation } from '@/components/projects/ProjectNavigation';
import { getProjectSummary } from '@/src/modules/projects/server/queries';

export default async function ProjectLayout({ children, params }: { children: React.ReactNode; params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProjectSummary(projectId).catch(() => null);
  if (!project) notFound();
  return <div className="space-y-5"><ProjectHeader project={project} /><ProjectNavigation projectId={projectId} /><main>{children}</main></div>;
}
