import { proxyBackend } from '@/src/lib/api/proxy';
function handler(request: Request) { return proxyBackend(request, new URL(request.url).pathname); }
export { handler as GET, handler as POST };
