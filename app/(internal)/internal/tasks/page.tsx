import { getProjectTasks, getProjectsOverview, getTaskBoard, getTaskDetail, getTaskFacets } from '@/src/modules/projects/server/queries';
import { getWorkers } from '@/src/modules/leads/server/queries';
import { getCatalogs } from '@/src/modules/products/server/queries';
import { getSession } from '@/src/lib/auth';
import { FilterBar, type FilterDef } from '@/components/internal/FilterBar';
import { DUE_OPTIONS, namedOptions, withCounts, workerOptions } from '@/components/internal/filter-options';
import { TeamTaskBoard } from '@/components/kanban/TeamTaskBoard';
import { TaskDrawer } from '@/components/projects/TaskDrawer';
import { formatTaskStatus } from '@/lib/formatters';

const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'DONE'];
const DEFAULT_VIEW = 'mine';
const CLOSED_PROJECTS = ['DELIVERED', 'CANCELLED'];

export default async function TasksPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { task: taskId, taskProject, ...query } = await searchParams;
  const view = query.view || DEFAULT_VIEW;
  const effective = { ...query, view };
  const [board, facets, workers, projects, catalogs, session, drawer] = await Promise.all([
    getTaskBoard(effective),
    getTaskFacets(effective),
    getWorkers(),
    getProjectsOverview(),
    getCatalogs(),
    getSession(),
    // Detalle de la tarea abierta (?task=&taskProject=), con el contexto de su proyecto.
    taskId && taskProject ? Promise.all([getTaskDetail(taskProject, taskId), getProjectTasks(taskProject)]) : null,
  ]);
  // Cada pestaña ya fija uno de los filtros: no se repite como pastilla.
  const filters: FilterDef[] = [
    ...(view === 'blocked' ? [] : [{ key: 'status', label: 'Estado', options: withCounts(TASK_STATUSES.map((status) => ({ value: status, label: formatTaskStatus(status) })), facets.status) }]),
    ...(view === 'mine' ? [] : [{ key: 'workerId', label: 'Responsable', options: withCounts(workerOptions(workers), facets.worker) }]),
    { key: 'projectId', label: 'Proyecto', options: withCounts(namedOptions(projects), facets.project) },
    ...(view === 'overdue' ? [] : [{ key: 'due', label: 'Vencimiento', single: true, options: DUE_OPTIONS }]),
    { key: 'productId', label: 'Producto', secondary: true, options: namedOptions(catalogs.products) },
    { key: 'serviceId', label: 'Servicio', secondary: true, options: namedOptions(catalogs.services) },
  ];
  const currentUser = { id: session?.user.id ?? '', name: session?.user.name ?? '' };
  const [task, context] = drawer ?? [null, null];
  return (
    <>
      <TeamTaskBoard
        initialTasks={board.items}
        truncated={board.truncated}
        wipLimit={board.wipLimit}
        view={view}
        currentUser={currentUser}
        workers={workers}
        projects={projects.filter((project) => !CLOSED_PROJECTS.includes(project.status)).map((project) => ({ id: project.id, name: project.name }))}
        filterBar={
          <FilterBar
            defaultView={DEFAULT_VIEW}
            views={[
              { id: 'mine', label: 'Mías', count: facets.views.mine },
              { id: 'team', label: 'Equipo', count: facets.views.team },
              { id: 'overdue', label: 'Vencidas', count: facets.views.overdue },
              { id: 'blocked', label: 'Bloqueadas', count: facets.views.blocked },
            ]}
            filters={filters}
            searchPlaceholder="Buscar FOX-12 o título…"
          />
        }
      />
      {task && context && session && (
        <TaskDrawer
          projectId={taskProject!}
          task={task}
          tasks={context.tasks}
          workers={workers}
          milestones={context.milestones}
          sprints={context.sprints}
          requirements={context.requirements}
          currentUser={{ id: session.user.id, role: session.user.role }}
        />
      )}
    </>
  );
}
