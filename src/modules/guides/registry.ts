/**
 * Registro de las guías internas. El contenido vive en `content/guides/<slug>.mdx`;
 * aquí van los metadatos que leen el índice, el botón «?», ⌘K y el test de guías.
 *
 * Si un cambio altera un flujo que cubre una guía, actualiza la guía y su
 * `updatedAt` en el mismo commit.
 */

export type GuideIcon = 'leads' | 'tasks' | 'today' | 'project' | 'test';

export type GuideSection = {
  /** Debe coincidir con el id que genera `headingId()` a partir del `##` del MDX. */
  id: string;
  title: string;
  /** Palabras que también encuentran la sección desde ⌘K («revisor», «bloqueo»). */
  keywords?: string[];
};

export type GuideCover = {
  /** Patrón de ruta del panel, con segmentos dinámicos como `[leadId]`. */
  route: string;
  /** Sección a la que lleva el «?» desde esa ruta; sin ella, el inicio de la guía. */
  section?: string;
};

export type Guide = {
  slug: string;
  title: string;
  summary: string;
  icon: GuideIcon;
  /** Fecha ISO (AAAA-MM-DD) de la última revisión contra el código. */
  updatedAt: string;
  /** Pantallas que explica la guía: ahí aparece el «?». */
  covers: GuideCover[];
  sections: GuideSection[];
};

export const GUIDES: Guide[] = [
  // Guía de prueba de las Fases 1 y 2: valida el MDX y el kit de diagramas. Se borra en la Fase 4.
  {
    slug: 'prueba',
    title: 'Guía de prueba',
    summary: 'Valida el módulo: texto, tablas, avisos y los cuatro tipos de diagrama.',
    icon: 'test',
    updatedAt: '2026-10-20',
    // Rutas de prueba para el «?» de la Fase 3; las guías reales las reemplazan en la Fase 4.
    covers: [
      { route: '/internal/tasks', section: 'avisos-y-pasos' },
      { route: '/internal/leads', section: 'carriles' },
      { route: '/internal/leads/[leadId]', section: 'ciclo-de-estados' },
      { route: '/internal/projects/[projectId]/tasks/kanban', section: 'jerarquia' },
    ],
    sections: [
      { id: 'para-que-sirve', title: 'Para qué sirve' },
      { id: 'relaciones', title: 'Relaciones' },
      { id: 'jerarquia', title: 'Jerarquía' },
      { id: 'ciclo-de-estados', title: 'Ciclo de estados' },
      { id: 'carriles', title: 'Carriles' },
      { id: 'avisos-y-pasos', title: 'Avisos y pasos', keywords: ['revisor', 'subtareas'] },
    ],
  },
];

export function getGuide(slug: string) {
  return GUIDES.find((guide) => guide.slug === slug) ?? null;
}

export const guideHref = (slug: string, section?: string) => `/internal/guides/${slug}${section ? `#${section}` : ''}`;

// Un segmento dinámico no acepta `new`: en el panel, `…/new` siempre es su propia página.
const routePattern = (route: string) =>
  new RegExp(`^${route.split('/').map((part) => (/^\[.+\]$/.test(part) ? '(?!new/?$)[^/]+' : part.replace(/[.*+?^${}()|\\]/g, '\\$&'))).join('/')}/?$`);

/**
 * Guía y sección que explican una pantalla. Si varias rutas coinciden, gana la
 * más específica (más segmentos fijos): `/leads/new` antes que `/leads/[leadId]`.
 */
export function findGuideForPath(pathname: string) {
  let best: { guide: Guide; section?: string; score: number } | null = null;
  for (const guide of GUIDES) {
    for (const cover of guide.covers) {
      if (!routePattern(cover.route).test(pathname)) continue;
      const score = cover.route.split('/').filter((part) => part && !part.startsWith('[')).length;
      if (!best || score > best.score) best = { guide, section: cover.section, score };
    }
  }
  return best && { guide: best.guide, section: best.section, href: guideHref(best.guide.slug, best.section) };
}

/** Id estable para un encabezado: minúsculas, sin tildes y con guiones. */
export function headingId(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatGuideDate(iso: string) {
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
}
