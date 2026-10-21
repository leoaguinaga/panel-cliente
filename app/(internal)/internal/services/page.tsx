import { redirect } from 'next/navigation';
import { requireAuth } from '@/src/lib/auth';

export default async function ServicesPage() {
  await requireAuth();
  redirect('/internal/settings?section=servicios');
}
