import { ClientNavbar } from '@/components/layout/ClientNavbar';
import { requireAuth } from '@/src/lib/auth';
import { ROLES } from '@/src/modules/auth/server/permissions';

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  await requireAuth([ROLES.CLIENT]);

  return (
    <div className="min-h-screen bg-background">
      <ClientNavbar />
      <main className="min-h-[calc(100vh-4rem)]">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
