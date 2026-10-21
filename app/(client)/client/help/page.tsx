import { backendFetch } from '@/src/lib/api/server';
import { requireAuth } from '@/src/lib/auth';
import { getPortalSettings } from '@/src/modules/settings/server/queries';
import { HelpCenter } from '@/src/modules/support/HelpCenter';
import type { GuideVote, ProjectOption, TicketList } from '@/src/modules/support/types';
export default async function ClientHelpPage() {
  await requireAuth(['CLIENT']);
  const [settings,tickets,projects,votes]=await Promise.all([getPortalSettings(),backendFetch<TicketList>('/support'),backendFetch<ProjectOption[]>('/support/projects'),backendFetch<GuideVote[]>('/support/feedback')]);
  return <HelpCenter tickets={tickets} projects={projects} votes={votes} email={settings.contact_email||''} whatsapp={settings.official_whatsapp||''} company={settings.company_name||'FoxCode'}/>;
}
