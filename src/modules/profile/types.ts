export type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  image: string | null;
  role: 'ADMIN' | 'WORKER';
  status: string;
  createdAt: string;
  passwordUpdatedAt: string | null;
};
export type ProfileSession = { id: string; userAgent: string | null; ipAddress: string | null; createdAt: string; updatedAt: string; current: boolean };
export type ActionResult = { ok: boolean; error?: string };

export const JOB_TITLE_SUGGESTIONS = ['Diseño UI', 'Frontend', 'Backend', 'Mobile', 'Gestión de proyectos', 'Ventas'];

/** «Chrome en macOS» a partir del user-agent; suficiente para reconocer un dispositivo propio. */
export function describeDevice(userAgent?: string | null): { label: string; kind: 'phone' | 'tablet' | 'desktop' } {
  const ua = userAgent || '';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\/|CriOS\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : null;
  const os = /iPad/.test(ua) ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Mac OS X|Macintosh/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : null;
  const kind = /iPad|Tablet/.test(ua) ? 'tablet' : /iPhone|Android.*Mobile|Mobile/.test(ua) ? 'phone' : 'desktop';
  const label = browser && os ? `${browser} en ${os}` : browser || os || 'Dispositivo desconocido';
  return { label, kind };
}
