import { notFound } from 'next/navigation';
import { hasScope } from '@/components/projects/ScopeColumns';
import { ProjectDetailHeader, type ProjectTab } from '@/components/client/project-detail/ProjectDetailHeader';
import { MoneyDocsView, ProgressView, ScopeView, SummaryView } from '@/components/client/project-detail/ProjectDetailViews';
import { getClientDashboard } from '@/src/modules/dashboard/server/queries';

export default async function ClientProjectDetail({ params, searchParams }: { params: Promise<{ projectId: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [{ projectId }, { tab: requested }] = await Promise.all([params, searchParams]);
  const data = await getClientDashboard();
  const project = data.projects.find((item) => item.id === projectId);
  if (!project) notFound();

  const documents = data.documents.filter((doc) => doc.projectId === project.id);
  const payments = data.payments.filter((payment) => payment.projectId === project.id);
  const inReview = project.milestones.some((m) => m.status === 'IN_REVIEW');
  const tabs: ProjectTab[] = [
    'resumen',
    ...(project.milestones.length || (project.deliverables?.length ?? 0) ? ['avance' as const] : []),
    ...(hasScope(project.scope) ? ['alcance' as const] : []),
    ...(payments.length || documents.length ? ['pagos' as const] : []),
  ];
  const tab = tabs.find((t) => t === requested) ?? (inReview && tabs.includes('avance') ? 'avance' : 'resumen');

  return <div className="space-y-6">
    <ProjectDetailHeader project={project} payments={payments} tab={tab} tabs={tabs} documentsCount={documents.length} />
    {tab === 'resumen' && <SummaryView project={project} payments={payments} />}
    {tab === 'avance' && <ProgressView project={project} payments={payments} />}
    {tab === 'alcance' && <ScopeView project={project} />}
    {tab === 'pagos' && <MoneyDocsView project={project} payments={payments} documents={documents} />}
  </div>;
}
