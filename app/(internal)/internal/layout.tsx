import { cookies } from 'next/headers';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { DynamicBreadcrumbs } from '@/components/layout/DynamicBreadcrumbs';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { requireAuth } from '@/src/lib/auth';
import { ROLES } from '@/src/modules/auth/server/permissions';

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth([ROLES.ADMIN, ROLES.WORKER]);
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar:state')?.value !== 'false';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar user={session.user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <DynamicBreadcrumbs />
        </header>
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
