/**
 * Primeros pasos de un proyecto recién creado. Cada paso se marca solo con los
 * datos del proyecto; no se guarda nada aparte. Lo explica la guía
 * «Ciclo de un proyecto» (`content/guides/proyectos.mdx`).
 */

export type SetupStepId = 'responsible' | 'scope' | 'milestones' | 'requirements' | 'tasks' | 'documents' | 'start';

export type SetupStep = {
  id: SetupStepId;
  title: string;
  /** Qué hacer y por qué, mientras el paso está pendiente. */
  hint: string;
  /** Lo que falta, con números («2 requerimientos sin tareas»). */
  detail?: string;
  done: boolean;
  /** Se agrega a `/internal/projects/<id>`: una subruta o `?ajustes=1`. */
  path: string;
  action: string;
};

export type SetupInput = {
  status: string;
  hasResponsible: boolean;
  hasScope: boolean;
  documents: number;
  tasks: number;
  milestones: Array<{ dueDate?: string | null }>;
  requirements: Array<{ milestoneId?: string | null; tasks?: unknown[] }>;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function projectSetupSteps(input: SetupInput): SetupStep[] {
  const undated = input.milestones.filter((milestone) => !milestone.dueDate).length;
  const loose = input.requirements.filter((requirement) => !requirement.milestoneId).length;
  const empty = input.requirements.filter((requirement) => !requirement.tasks?.length).length;
  return [
    {
      id: 'responsible',
      title: 'Asignar responsable',
      hint: 'Quien responde por el proyecto. Mientras no tenga, queda en «Requiere tu decisión» del Inicio de los admin.',
      done: input.hasResponsible,
      path: '?ajustes=1',
      action: 'Asignar',
    },
    {
      id: 'scope',
      title: 'Revisar el alcance',
      hint: 'Qué incluye, qué no y los supuestos, tal como se vendió en la propuesta. Es la referencia ante cualquier pedido extra.',
      done: input.hasScope,
      path: '/planning/scope',
      action: 'Definir alcance',
    },
    {
      id: 'milestones',
      title: 'Revisar los hitos',
      hint: 'Cada hito es una entrega que el cliente aprueba y, si tiene cuota, la que habilita el cobro. Confirma fechas y entregables.',
      detail: input.milestones.length === 0 ? 'Todavía no hay hitos' : undated ? plural(undated, 'hito sin fecha', 'hitos sin fecha') : undefined,
      done: input.milestones.length > 0 && undated === 0,
      path: '/planning/milestones',
      action: 'Ver hitos',
    },
    {
      id: 'requirements',
      title: 'Cargar requerimientos',
      hint: 'Divide cada hito en requerimientos (RF-01, RF-02…). Las tareas que cuelgan de un requerimiento heredan su hito.',
      detail: input.requirements.length === 0 ? 'Todavía no hay requerimientos' : loose ? plural(loose, 'requerimiento sin hito', 'requerimientos sin hito') : undefined,
      done: input.requirements.length > 0 && loose === 0,
      path: '/planning/requirements',
      action: 'Cargar requerimientos',
    },
    {
      id: 'tasks',
      title: 'Crear las tareas',
      hint: 'El trabajo diario, con responsable, revisor y horas estimadas. El avance del proyecto se calcula con ellas.',
      detail: input.tasks === 0 ? 'Todavía no hay tareas' : empty ? plural(empty, 'requerimiento sin tareas', 'requerimientos sin tareas') : undefined,
      done: input.tasks > 0 && empty === 0,
      path: '/tasks/kanban',
      action: 'Abrir tablero',
    },
    {
      id: 'documents',
      title: 'Subir los documentos base',
      hint: 'El contrato firmado y lo que mandó el cliente: accesos, logos, textos. Así nadie los busca en el chat.',
      done: input.documents > 0,
      path: '/documentation/files',
      action: 'Subir documentos',
    },
    {
      id: 'start',
      title: 'Pasar a «En progreso»',
      hint: 'Marca que el trabajo empezó. Cambia el estado en Ajustes cuando lo anterior esté listo.',
      done: input.status !== 'PLANNING',
      path: '?ajustes=1',
      action: 'Cambiar estado',
    },
  ];
}
