import { proxyBackend } from '@/src/lib/api/proxy';
export async function POST(request: Request) {
  return proxyBackend(request, '/client-access/set-password');
}
