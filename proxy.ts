import type { NextRequest } from 'next/server';
import { proxy as sessionProxy } from './src/proxy';

// app/ lives at the project root, so Next.js discovers Proxy here.
export async function proxy(request: NextRequest) { return sessionProxy(request); }
export const config = { matcher: ['/internal/:path*', '/client/:path*', '/login', '/'] };
