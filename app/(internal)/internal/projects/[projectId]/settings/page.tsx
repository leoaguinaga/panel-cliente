import { redirect } from 'next/navigation';

// Los ajustes ahora son un panel lateral sobre el resumen; se conserva la ruta para enlaces viejos.
export default async function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  redirect(`/internal/projects/${projectId}?ajustes=1`);
}
