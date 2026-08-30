import { ClientNavbar } from '@/components/layout/ClientNavbar';
import { requireAuth } from '@/src/lib/auth';
import { ROLES } from '@/src/modules/auth/server/permissions';

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  await requireAuth([ROLES.CLIENT]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <ClientNavbar />
      <main className="flex-1 py-8">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
