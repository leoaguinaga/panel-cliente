/**
 * Registro de las guías internas. El contenido vive en `content/guides/<slug>.mdx`;
 * aquí van los metadatos que leen el índice, el botón «?», ⌘K y el test de guías.
 *
 * Si un cambio altera un flujo que cubre una guía, actualiza la guía y su
 * `updatedAt` en el mismo commit.
 */

export type GuideIcon = 'leads' | 'tasks' | 'today' | 'project';

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
  {
    slug: 'leads',
    title: 'Leads',
    summary: 'Etapas del embudo, el siguiente paso de cada lead y qué pasa al ganarlo o perderlo.',
    icon: 'leads',
    updatedAt: '2026-10-22',
    covers: [
      { route: '/internal/leads' },
      { route: '/internal/leads/new', section: 'etapas-del-embudo' },
      { route: '/internal/leads/[leadId]', section: 'ficha-completa-y-reuniones' },
    ],
    sections: [
      { id: 'para-que-sirve', title: 'Para qué sirve' },
      { id: 'etapas-del-embudo', title: 'Etapas del embudo', keywords: ['embudo', 'mapeo', 'maqueta', 'cotizado', 'negociación'] },
      { id: 'siguiente-paso', title: 'Siguiente paso', keywords: ['seguimiento', 'vencido', 'último contacto', 'reprogramar'] },
      { id: 'la-hoja-del-lead', title: 'La hoja del lead', keywords: ['whatsapp', 'demo', 'notas'] },
      { id: 'ficha-completa-y-reuniones', title: 'Ficha completa y reuniones', keywords: ['meet', 'reunión', 'agendar', 'google calendar', 'invitación'] },
      { id: 'ganar-un-lead', title: 'Ganar un lead', keywords: ['ganado', 'convertir', 'cliente', 'kickoff'] },
      { id: 'perder-y-reabrir', title: 'Perder y reabrir', keywords: ['perdido', 'motivo', 'rechazado'] },
      { id: 'errores-comunes', title: 'Errores comunes' },
      { id: 'preguntas-frecuentes', title: 'Preguntas frecuentes' },
    ],
  },
  {
    slug: 'tareas',
    title: 'Tareas y Kanban',
    summary: 'Estados y reglas del tablero, revisión, subtareas, prerequisitos, evidencias y cómo se calcula el avance.',
    icon: 'tasks',
    updatedAt: '2026-10-21',
    covers: [
      { route: '/internal/tasks', section: 'estados-y-columnas' },
      { route: '/internal/projects/[projectId]/tasks/kanban', section: 'estados-y-columnas' },
      { route: '/internal/projects/[projectId]/tasks/gantt', section: 'subtareas-y-prerequisitos' },
    ],
    sections: [
      { id: 'para-que-sirve', title: 'Para qué sirve', keywords: ['FOX'] },
      { id: 'estados-y-columnas', title: 'Estados y columnas', keywords: ['bloqueada', 'por hacer', 'terminada'] },
      { id: 'lo-que-muestra-cada-tarjeta', title: 'Lo que muestra cada tarjeta', keywords: ['días en la columna', 'estancada', 'espera'] },
      { id: 'limite-de-trabajo-en-curso', title: 'Límite de trabajo en curso', keywords: ['wip', 'límite', 'en curso'] },
      { id: 'revision', title: 'Revisión', keywords: ['revisor', 'aprobar', 'devolver'] },
      { id: 'subtareas-y-prerequisitos', title: 'Subtareas y prerequisitos', keywords: ['subtareas', 'dependencias', 'desbloquea'] },
      { id: 'estimacion-y-avance', title: 'Estimación y avance', keywords: ['horas', 'progreso', 'porcentaje'] },
      { id: 'evidencias-y-conversacion', title: 'Evidencias y conversación', keywords: ['evidencia', 'captura', 'comentarios'] },
      { id: 'errores-comunes', title: 'Errores comunes' },
      { id: 'preguntas-frecuentes', title: 'Preguntas frecuentes' },
    ],
  },
  {
    slug: 'proyectos',
    title: 'Ciclo de un proyecto',
    summary: 'Qué hacer al recibir un proyecto, cómo se arman hitos, requerimientos y tareas, y cuándo se aprueba y se cobra cada entrega.',
    icon: 'project',
    updatedAt: '2026-10-22',
    covers: [
      { route: '/internal/projects' },
      { route: '/internal/projects/[projectId]', section: 'primeros-pasos' },
      { route: '/internal/projects/[projectId]/planning/milestones', section: 'cuando-avanza-un-hito' },
      { route: '/internal/projects/[projectId]/planning/requirements', section: 'como-se-arma-el-trabajo' },
      { route: '/internal/projects/[projectId]/planning/scope', section: 'primeros-pasos' },
    ],
    sections: [
      { id: 'para-que-sirve', title: 'Para qué sirve', keywords: ['propuesta', 'convertir', 'nuevo proyecto'] },
      { id: 'primeros-pasos', title: 'Primeros pasos', keywords: ['siguiente paso', 'arrancar', 'kickoff', 'responsable', 'alcance'] },
      { id: 'como-se-arma-el-trabajo', title: 'Cómo se arma el trabajo', keywords: ['requerimiento', 'hito', 'tarea suelta', 'RF'] },
      { id: 'cuando-avanza-un-hito', title: 'Cuándo avanza un hito', keywords: ['en revisión', 'enviar a revisión', 'hito sin tareas'] },
      { id: 'aprobacion-y-cobro', title: 'Aprobación y cobro', keywords: ['aprobar', 'pedir cambios', 'cuota', 'programado', 'por cobrar'] },
      { id: 'errores-comunes', title: 'Errores comunes' },
      { id: 'preguntas-frecuentes', title: 'Preguntas frecuentes' },
    ],
  },
  {
    slug: 'mi-dia',
    title: 'Mi día',
    summary: 'Qué aparece en Inicio y en el Calendario, de dónde sale cada pendiente y cómo agendar reuniones con Google.',
    icon: 'today',
    updatedAt: '2026-10-21',
    covers: [
      { route: '/internal/dashboard', section: 'inicio' },
      { route: '/internal/calendar', section: 'calendario' },
    ],
    sections: [
      { id: 'para-que-sirve', title: 'Para qué sirve' },
      { id: 'que-aparece-en-cada-lugar', title: 'Qué aparece en cada lugar', keywords: ['agenda', 'pendientes', 'fecha'] },
      { id: 'inicio', title: 'Inicio', keywords: ['hoy', 'atrasado', 'próximos 7 días', 'decisión'] },
      { id: 'calendario', title: 'Calendario', keywords: ['mes', 'vencidos'] },
      { id: 'reuniones-y-recordatorios', title: 'Reuniones y recordatorios', keywords: ['reunión', 'recordatorio', 'visibilidad'] },
      { id: 'google-calendar', title: 'Google Calendar', keywords: ['meet', 'invitaciones', 'google'] },
      { id: 'errores-comunes', title: 'Errores comunes' },
      { id: 'preguntas-frecuentes', title: 'Preguntas frecuentes' },
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
