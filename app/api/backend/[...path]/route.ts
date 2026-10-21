import { proxyBackend } from '@/src/lib/api/proxy';
async function handler(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (!['support', 'calendar', 'documents', 'payments', 'clients', 'projects', 'catalogs', 'workers', 'settings', 'dashboard', 'leads', 'product-demos', 'proposals', 'directory', 'me', 'users'].includes(path[0]) || path.some(part => part === '..' || part.includes('/') || part.includes('\\'))) return new Response(null, { status: 404 });
  return proxyBackend(request, '/' + path.map(encodeURIComponent).join('/'));
}
export { handler as GET, handler as POST, handler as PATCH, handler as PUT, handler as DELETE };
