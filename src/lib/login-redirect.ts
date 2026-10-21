/** Only portal paths are valid login destinations; never allow external URLs. */
export function getLoginDestination(search: string, role?: string): string {
  const fallback = role === 'CLIENT' ? '/client/dashboard' : '/internal/dashboard';
  const params = new URLSearchParams(search);
  let target = params.get('next');
  // Also support shared links such as /login?client/payments.
  if (!target && search.startsWith('?') && !search.includes('=')) {
    try { target = `/${decodeURIComponent(search.slice(1)).replace(/^\//, '')}`; } catch { return fallback; }
  }
  if (!target || !target.startsWith('/') || target.startsWith('//') || /[\\\x00-\x20]/.test(target)) return fallback;
  try {
    const url = new URL(target, 'http://portal.local');
    const root = role === 'CLIENT' ? '/client' : '/internal';
    if (url.origin !== 'http://portal.local' || !(url.pathname === root || url.pathname.startsWith(`${root}/`))) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return fallback; }
}

export function getLoginUrl(target: string | null): string {
  return target ? `/login?${new URLSearchParams({ next: target })}` : '/login';
}
