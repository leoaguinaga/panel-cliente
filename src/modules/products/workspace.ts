/**
 * Identidad de los espacios de trabajo (productos propios). FoxCode, el
 * espacio base, usa el naranja de marca; por eso no está en esta paleta.
 */
export const WORKSPACE_COLORS = [
  { value: '#3fa7d6', label: 'Celeste' },
  { value: '#e0a43a', label: 'Ámbar' },
  { value: '#9a7bf0', label: 'Violeta' },
  { value: '#4fbf8f', label: 'Verde' },
  { value: '#e0668f', label: 'Rosa' },
  { value: '#8a9bb0', label: 'Gris azulado' },
] as const;

export const DEFAULT_WORKSPACE_COLOR = WORKSPACE_COLORS[0].value;

export const workspaceStatusLabels: Record<string, string> = { ACTIVE: 'Activo', PILOT: 'Piloto' };

export const workspaceInitial = (name: string) => (name.trim()[0] || 'N').toLocaleUpperCase('es-PE');

export const slugify = (value: string) =>
  value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
