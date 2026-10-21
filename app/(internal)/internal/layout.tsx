import { cookies } from 'next/headers';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { DynamicBreadcrumbs } from '@/components/layout/DynamicBreadcrumbs';
import { HelpLink } from '@/components/guides/HelpLink';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { requireAuth } from '@/src/lib/auth';
import { ROLES } from '@/src/modules/auth/server/permissions';
import { getCatalogs } from '@/src/modules/products/server/queries';
import { getActiveWorkspace } from '@/src/modules/workspaces/server/workspace';

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth([ROLES.ADMIN, ROLES.WORKER]);
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar:state')?.value !== 'false';
  const [catalogs, workspace] = await Promise.all([getCatalogs().catch(() => null), getActiveWorkspace()]);
  const workspaces = (catalogs?.products ?? []).map(({ id, name, color, logoUrl }) => ({ id, name, color, logoUrl }));
  // Un producto archivado o borrado deja de filtrar (el backend hace lo mismo).
  const activeWorkspace = workspace === 'all' || workspace === 'foxcode' || workspaces.some((item) => item.id === workspace) ? workspace : 'all';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar user={session.user} workspaces={workspaces} activeWorkspace={activeWorkspace} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <DynamicBreadcrumbs />
          <CommandPalette />
          <HelpLink />
        </header>
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          {/* La clave remonta la página al cambiar de espacio: las vistas con estado local (tableros) arrancan de nuevo. */}
          <div key={activeWorkspace} className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
