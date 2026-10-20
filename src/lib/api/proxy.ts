const baseUrl = process.env.BACKEND_URL || 'http://localhost:3004';
export async function proxyBackend(request: Request, path: string) {
  const url = new URL(request.url);
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) return Response.json({ error: 'Origen no permitido' }, { status: 403 });
  }
  const headers = new Headers();
  for (const name of ['cookie', 'content-type', 'accept', 'origin', 'user-agent']) {
    const value = request.headers.get(name); if (value) headers.set(name, value);
  }
  headers.set('x-forwarded-host', url.host);
  headers.set('x-forwarded-proto', url.protocol.slice(0, -1));
  try {
    const response = await fetch(`${baseUrl}${path}${url.search}`, {
      method: request.method, headers,
      ...(!['GET', 'HEAD'].includes(request.method) ? { body: request.body, duplex: 'half' } : {}),
      cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(60_000),
    } as RequestInit);
    const output = new Headers();
    for (const name of ['content-type', 'content-disposition', 'location', 'x-content-type-options']) {
      const value = response.headers.get(name); if (value) output.set(name, value);
    }
    for (const cookie of response.headers.getSetCookie()) output.append('set-cookie', cookie);
    output.set('cache-control', 'private, no-store');
    return new Response(response.body, { status: response.status, headers: output });
  } catch { return Response.json({ error: 'No se pudo conectar con el servidor. Vuelve a intentarlo.' }, { status: 502 }); }
}
