import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/src/lib/auth";
import {
  getWorker,
  getWorkerActivity,
} from "@/src/modules/users/server/queries";
import { WorkerAvatar } from "@/src/modules/users/WorkerAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Pagination } from "@/components/shared/Pagination";
import {
  WorkerForm,
  WorkerAccessForm,
} from "@/src/modules/users/WorkerForms";
import styles from "@/src/modules/users/workers.module.css";
const date = (value: string) =>
  new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeZone: "America/Lima",
  }).format(new Date(value));
const timestamp = (value: string) =>
  new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(value));
const actions: Record<string, string> = {
  CREATED: "Creación",
  UPDATED: "Actualización",
  DELETED: "Eliminación",
  STATUS_CHANGED: "Cambio de estado",
  USER_PASSWORD_EMAIL: "Enlace de contraseña enviado",
  USER_PASSWORD_SET: "Contraseña creada",
  ASSIGNED: "Asignación",
  UPLOADED: "Archivo subido",
  DOWNLOADED: "Descarga",
  APPROVED: "Aprobación",
  REJECTED: "Rechazo",
  CREATE: "Creación",
  UPDATE: "Actualización",
  REPLACED: "Archivo reemplazado",
  CONVERTED: "Conversión",
  CONVERTED_TO_PROJECT: "Conversión a proyecto",
  PAYMENT_REPORTED: "Pago reportado",
  PAYMENT_APPROVED: "Pago aprobado",
  PAYMENT_REJECTED: "Pago rechazado",
  REVIEW_APPROVED: "Revisión aprobada",
  REVIEW_RETURNED: "Revisión devuelta",
};
const entities: Record<string, string> = {
  User: "Cuenta",
  Project: "Proyecto",
  Task: "Tarea",
  Lead: "Lead",
  Client: "Cliente",
  Document: "Documento",
  Payment: "Pago",
  PaymentSchedule: "Pago",
  InternalSetting: "Configuración",
};
export default async function WorkerPage({
  params,
  searchParams,
}: {
  params: Promise<{ workerId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAuth(["ADMIN"]);
  const { workerId } = await params,
    query = await searchParams;
  const worker = await getWorker(workerId);
  if (!worker) notFound();
  const section = ["data", "access", "audit"].includes(query.section || "")
    ? query.section!
    : "work";
  const scope = query.scope === "account" ? "account" : "performed";
  const activity =
    section === "audit"
      ? await getWorkerActivity(workerId, { ...query, scope })
      : null;
  return (
    <section className={styles.workspace}>
      <Link href="/internal/workers" className={styles.back}>
        <ArrowLeft size={16} aria-hidden="true" />
        Todos los trabajadores
      </Link>
      <header className={styles.identity}>
        <WorkerAvatar worker={worker} className="size-16 shrink-0 rounded-xl" />
        <div className={styles.identityText}>
          <h1>{worker.name}</h1>
          <p>
            {worker.jobTitle || "Sin cargo definido"} · {worker.email}
          </p>
          <div className={styles.identityMeta}>
            <StatusBadge status={worker.status} />
            <span>
              {worker.role === "ADMIN" ? "Administrador" : "Colaborador"}
            </span>
            <span>En el equipo desde {date(worker.createdAt)}</span>
          </div>
        </div>
      </header>
      <nav className={styles.nav} aria-label="Secciones del trabajador">
        {[
          ["work", "Trabajo asignado"],
          ["data", "Datos personales"],
          ["access", "Acceso"],
          ["audit", "Auditoría"],
        ].map(([key, label]) => (
          <Link
            key={key}
            href={`?section=${key}`}
            aria-current={section === key ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      {section === "work" && (
        <>
          <div className={styles.workSummary}>
            <span>
              <strong>{worker._count.assignedTasks}</strong>{" "}
              {worker._count.assignedTasks === 1
                ? "tarea asignada"
                : "tareas asignadas"}
            </span>
            <span>
              <strong>{worker._count.assignedProjects}</strong>{" "}
              {worker._count.assignedProjects === 1
                ? "proyecto a cargo"
                : "proyectos a cargo"}
            </span>
            <span>
              <strong>{worker._count.assignedLeads}</strong>{" "}
              {worker._count.assignedLeads === 1
                ? "lead asignado"
                : "leads asignados"}
            </span>
          </div>
          <div className={styles.workGrid}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2>Tareas asignadas</h2>
                <p>
                  Actualizadas recientemente · {worker.assignedTasks.length} de{" "}
                  {worker._count.assignedTasks}
                </p>
              </div>
              {worker.assignedTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/internal/tasks?task=${task.id}&taskProject=${task.project.id}`}
                  className={styles.workItem}
                >
                  <div>
                    <strong>{task.title}</strong>
                    <p>
                      FOX-{task.number} · {task.project.name}
                    </p>
                    <p>
                      {task.dueDate
                        ? `Vence el ${date(task.dueDate)}`
                        : "Sin fecha de vencimiento"}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                </Link>
              ))}
              {!worker.assignedTasks.length && (
                <p className={styles.emptyInline}>
                  No tiene tareas asignadas. Puedes asignarle trabajo desde el
                  tablero de un proyecto.
                </p>
              )}
              {worker._count.assignedTasks > worker.assignedTasks.length && (
                <Link
                  className={styles.back}
                  href={`/internal/tasks?view=all&workerId=${worker.id}`}
                >
                  Ver todas las tareas
                </Link>
              )}
            </section>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2>Proyectos a cargo</h2>
                <p>
                  {worker.assignedProjects.length} de{" "}
                  {worker._count.assignedProjects}
                </p>
              </div>
              {worker.assignedProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/internal/projects/${project.id}`}
                  className={styles.workItem}
                >
                  <div>
                    <strong>{project.name}</strong>
                    <p>
                      {project.client.name} · {project.progress}% de avance
                    </p>
                  </div>
                  <StatusBadge status={project.status} />
                </Link>
              ))}
              {!worker.assignedProjects.length && (
                <p className={styles.emptyInline}>
                  No tiene proyectos a cargo. Los proyectos donde figure como
                  responsable aparecerán aquí.
                </p>
              )}
              {worker._count.assignedProjects >
                worker.assignedProjects.length && (
                <Link
                  className={styles.back}
                  href={`/internal/projects?view=all&workerId=${worker.id}`}
                >
                  Ver todos los proyectos
                </Link>
              )}
            </section>
          </div>
        </>
      )}
      {section === "data" && (
        <section className={`${styles.panel} ${styles.settingsPanel}`}>
          <h2>Datos y rol del trabajador</h2>
          <p className={styles.auditIntro}>
            Mantén actualizada su información de contacto y su rol en el equipo.
          </p>
          <WorkerForm worker={worker} />
        </section>
      )}
      {section === "access" && (
        <section className={`${styles.panel} ${styles.settingsPanel}`}>
          <h2>
            {worker.status === "INVITED"
              ? "Invitación pendiente"
              : "Restablecer contraseña"}
          </h2>
          <p className={styles.auditIntro}>
            La contraseña se gestiona por correo: nadie del equipo la ve ni la
            escribe. Cada envío queda registrado en la auditoría de su cuenta.
          </p>
          <WorkerAccessForm worker={worker} />
        </section>
      )}
      {activity && (
        <section className={styles.panel}>
          <h2>Auditoría de acciones</h2>
          <p className={styles.auditIntro}>
            Consulta las acciones registradas por el sistema y quién las
            realizó. Fechas en hora de Lima. Este historial no incluye eventos
            que el sistema no registra.
          </p>
          <nav aria-label="Tipo de auditoría" className={styles.auditScope}>
            <Link
              href="?section=audit&scope=performed"
              aria-current={scope === "performed"}
            >
              Acciones realizadas
            </Link>
            <Link
              href="?section=audit&scope=account"
              aria-current={scope === "account"}
            >
              Cambios sobre su cuenta
            </Link>
          </nav>
          <form className={styles.auditFilters}>
            <input type="hidden" name="section" value="audit" />
            <input type="hidden" name="scope" value={scope} />
            <label>
              Tipo de acción
              <select name="action" defaultValue={query.action || ""}>
                <option value="">Todas las acciones</option>
                {query.action && !activity.actions.includes(query.action) && (
                  <option value={query.action}>{query.action}</option>
                )}
                {activity.actions.map((value) => (
                  <option key={value} value={value}>
                    {actions[value] || value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Desde
              <input
                name="from"
                type="date"
                defaultValue={query.from}
                max={query.to}
              />
            </label>
            <label>
              Hasta
              <input
                name="to"
                type="date"
                defaultValue={query.to}
                min={query.from}
              />
            </label>
            <button className={styles.secondary}>Aplicar filtros</button>
            <Link
              className={styles.back}
              href={`?section=audit&scope=${scope}`}
            >
              Limpiar
            </Link>
          </form>
          <p className={styles.resultCount}>
            {activity.total}{" "}
            {activity.total === 1 ? "evento registrado" : "eventos registrados"}
          </p>
          <ol className={styles.auditList}>
            {activity.items.map((event) => (
              <li key={event.id} className={styles.event}>
                <time dateTime={event.createdAt}>
                  {timestamp(event.createdAt)}
                </time>
                <div>
                  <h3>
                    {event.description || actions[event.action] || event.action}
                  </h3>
                  <p>
                    {event.actor?.name || "Sistema o cuenta eliminada"} ·{" "}
                    {entities[event.entityType] || event.entityType} ·{" "}
                    {actions[event.action] || event.action}
                  </p>
                  <details>
                    <summary>Ver referencia del registro</summary>
                    <p>
                      Entidad: {event.entityType} ·{" "}
                      <code>{event.entityId}</code>
                    </p>
                    <p>
                      Evento: <code>{event.id}</code>
                    </p>
                  </details>
                </div>
              </li>
            ))}
          </ol>
          {!activity.items.length && (
            <p className={styles.emptyInline}>
              {activity.total
                ? "No hay eventos en esta página. Regresa a la primera página para consultar el historial."
                : "No hay eventos registrados para esta vista y estos filtros."}
            </p>
          )}
          <Pagination
            total={activity.total}
            page={activity.page}
            pageSize={activity.pageSize}
            query={{
              section: "audit",
              scope,
              action: query.action,
              from: query.from,
              to: query.to,
            }}
          />
        </section>
      )}
    </section>
  );
}
