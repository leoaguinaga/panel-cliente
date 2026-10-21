"use client";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Video,
  CalendarDays,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Connection, Entry, Event, Options, Results } from "./types";
import { CalendarGridLoading } from "./CalendarLoading";
import styles from "./calendar.module.css";
import { usePanelMotion } from "./usePanelMotion";
const labels: Record<string, string> = {
  task: "Tarea",
  lead: "Seguimiento",
  demo: "Demo",
  demo_follow_up: "Seguimiento de demo",
  deliverable: "Entrega",
  milestone: "Hito",
  payment: "Cobro",
  reminder: "Recordatorio",
  meeting: "Reunión",
};
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const dayLabel = (s: string) =>
  new Date(s + "T12:00:00Z").toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch("/api/backend/calendar/" + path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const d = await r.json();
  if (!r.ok)
    throw new Error(
      Array.isArray(d.message)
        ? d.message.join(". ")
        : d.message || d.error || "No se pudo completar la operación",
    );
  return d;
}
const payload = (e: Entry) => ({
  kind: e.kind,
  meetingType: e.meetingType,
  title: e.title,
  date: e.date,
  time: e.time || undefined,
  duration: e.duration,
  ownerId: e.ownerId,
  visibility: e.visibility,
  projectId: e.projectId || undefined,
  notes: e.notes,
  attendees: e.attendees,
  useMeet: e.useMeet,
  sendInvites: e.sendInvites,
  status: e.status,
  version: e.version,
});
export function CalendarWorkspace() {
  const [month, setMonth] = useState(() => today().slice(0, 7));
  const [selected, setSelected] = useState(today);
  const [mode, setMode] = useState<"month" | "agenda">("month");
  const [type, setType] = useState("");
  const [owner, setOwner] = useState("");
  const [project, setProject] = useState("");
  const [space, setSpace] = useState("");
  const [options, setOptions] = useState<Options>();
  const [connection, setConnection] = useState<Connection>();
  const [hourFormat, setHourFormat] = useState("24");
  const displayTime = (time: string | null) => { if (!time) return "Sin hora"; if (hourFormat === "24") return time; const [h, m] = time.split(":"); return `${Number(h) % 12 || 12}:${m} ${Number(h) < 12 ? "a. m." : "p. m."}`; };
  const [events, setEvents] = useState<Event[]>([]);
  const [late, setLate] = useState<Event[]>([]);
  const [lateTotal, setLateTotal] = useState(0);
  const [lateOffset, setLateOffset] = useState<number | null>(null);
  const [showLate, setShowLate] = useState(false);
  const [detail, setDetail] = useState<Event>();
  const [cancelOpen, setCancelOpen] = useState(false);
  const { form, setForm, exiting, content, dayContent } = usePanelMotion<{
    kind: "meeting" | "reminder";
    entry?: Entry;
  }>(selected);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reload, setReload] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const range = useCallback(() => {
    const first = new Date(month + "-01T00:00:00Z");
    const start = new Date(first);
    start.setUTCDate(1 - ((first.getUTCDay() + 6) % 7));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 42);
    return new URLSearchParams({
      from: dayKey(start),
      to: dayKey(end),
      ...(type ? { type } : {}),
      ...(owner ? { ownerId: owner } : {}),
      ...(project ? { projectId: project } : {}),
      ...(space ? { productId: space } : {}),
    });
  }, [month, type, owner, project, space]);
  useEffect(() => {
    let active = true;
    fetch('/api/backend/settings/preferences', { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('No se pudieron cargar las preferencias'); return r.json(); }).then(p => { if (active) setHourFormat(p.hourFormat); }).catch(() => {});
    api<Options>("options")
      .then((o) => {
        if (active) setOptions(o);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    api<Connection>("google/status")
      .then((c) => {
        if (active) setConnection(c);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [reload]);
  useEffect(() => {
    let active = true;
    async function load() {
      await Promise.resolve();
      if (!active) return;
      setLoading(true);
      setError("");
      const params = range();
      let items: Event[] = [];
      let next: number | null = 0;
      while (next !== null && active) {
        params.set("offset", String(next));
        const result: Results = await api<Results>("events?" + params);
        items = items.concat(result.items);
        next = result.nextOffset;
      }
      const overdue = await api<Results>("overdue?" + range());
      if (active) {
        setEvents(items);
        setLate(overdue.items);
        setLateTotal(overdue.total);
        setLateOffset(overdue.nextOffset);
        setLoading(false);
      }
    }
    load().catch((e) => {
      if (active) {
        setError(e.message);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [range, reload]);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("code") && !url.searchParams.has("error")) return;
    window.location.replace('/internal/settings?section=integraciones&' + url.searchParams.toString());
  }, []);
  const navigate = (delta: number) => {
    const d = new Date(month + "-01T00:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + delta);
    setMonth(dayKey(d).slice(0, 7));
    setShowLate(false);
  };
  const pick = (e: Event) => {
    setDetail(e);
    setForm(undefined);
    panel.current?.scrollIntoView({ block: "nearest", behavior: "auto" });
  };
  const selectDay = (date: string, keyboard = false) => {
    setSelected(date);
    setDetail(undefined);
    setForm(undefined, false);
    requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 1150px)").matches) {
        panel.current?.focus({ preventScroll: true });
        panel.current?.scrollIntoView({ block: "start", behavior: keyboard || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      }
    });
  };
  async function mutate(run: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError("");
    try {
      const result = await run();
      setFeedback(typeof result === "string" ? result : message);
      setReload((v) => v + 1);
      setDetail(undefined);
      setForm(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }
  async function save(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!form || !options || exiting || busy) return;
    const f = new FormData(ev.currentTarget);
    const previous = form.entry;
    const data = {
      kind: form.kind,
      meetingType: String(f.get("meetingType") || "CLIENT"),
      title: String(f.get("title")).trim(),
      date: f.get("date"),
      time: f.get("time") || undefined,
      duration: Number(f.get("duration") || 30),
      ownerId: f.get("ownerId"),
      visibility: f.get("visibility"),
      projectId: f.get("projectId") || undefined,
      notes: f.get("notes") || "",
      attendees: String(f.get("attendees") || "")
        .split(/[,;\n]/)
        .map((x) => x.trim())
        .filter(Boolean),
      useMeet: f.has("useMeet"),
      sendInvites: f.has("sendInvites"),
      status: previous?.status || "OPEN",
      version: previous?.version,
    };
    await mutate(async () => {
      const e = await api<Entry>(
        "entries" + (previous ? "/" + previous.id : ""),
        { method: previous ? "PATCH" : "POST", body: JSON.stringify(data) },
      );
      setSelected(e.date);
      setMonth(e.date.slice(0, 7));
      if (e.syncError) {
        return "Reunión guardada; falta sincronizar con Google. Abre su detalle para reintentar.";
      }
    }, "Pendiente guardado.");
  }
  const visible = showLate ? late : events;
  const selectedEvents = visible.filter((e) => showLate || e.date === selected);
  const monthEvents = visible.filter(
    (e) => showLate || e.date.startsWith(month),
  );
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(month + "-01T00:00:00Z");
    d.setUTCDate(1 - ((d.getUTCDay() + 6) % 7) + i);
    return dayKey(d);
  });
  const refresh = () => {
    setDetail(undefined);
    setReload((v) => v + 1);
  };
  const spaces = Array.from(
    new Map(
      options?.projects
        .filter((p) => p.productId)
        .map((p) => [p.productId!, p.product!.name]),
    ).entries(),
  );
  return (
    <div className={styles.root}>
      <header className={styles.heading}>
        <div>
          <h1>Calendario</h1>
          <p>Todo lo que tiene fecha. Un solo lugar para anticiparte.</p>
        </div>
        <div className={styles.actions}>
          <Button
            variant="outline"
            disabled={!options || busy}
            onClick={() => {
              setDetail(undefined);
              setForm({ kind: "reminder" });
            }}
          >
            Crear recordatorio
          </Button>
          <Button
            disabled={!options || busy}
            onClick={() => {
              setDetail(undefined);
              setForm({ kind: "meeting" });
            }}
          >
            Crear reunión
          </Button>
        </div>
      </header>
      <div className={styles.periodRow}>
        <div className={styles.period}>
          <h2>
            {new Date(month + "-01T12:00:00Z").toLocaleDateString("es-PE", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mes anterior"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mes siguiente"
            onClick={() => navigate(1)}
          >
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMonth(today().slice(0, 7));
              setSelected(today());
              setShowLate(false);
              setDetail(undefined);
              setForm(undefined);
            }}
          >
            Ir a hoy
          </Button>
        </div>
        <div className={styles.toggle}>
          {(["month", "agenda"] as const).map((v) => (
            <button
              key={v}
              aria-pressed={mode === v}
              onClick={() => setMode(v)}
            >
              {v === "month" ? "Mes" : "Agenda"}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.filters}>
        <div>
          <select
            aria-label="Tipo de pendiente"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            {Object.entries(labels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            aria-label="Responsable"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          >
            <option value="">
              {options?.isAdmin ? "Todo el equipo" : "Mis pendientes y equipo"}
            </option>
            {options?.workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Proyecto"
            value={project}
            onChange={(e) => setProject(e.target.value)}
          >
            <option value="">Todos los proyectos</option>
            {options?.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Espacio"
            value={space}
            onChange={(e) => setSpace(e.target.value)}
          >
            <option value="">Todos los espacios</option>
            <option value="base">FoxCode</option>
            {spaces.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <button
          className={styles.late}
          aria-pressed={showLate}
          onClick={() => {
            setShowLate((v) => !v);
            setDetail(undefined);
            setForm(undefined);
          }}
        >
          {showLate
            ? "Volver al calendario"
            : `${lateTotal} pendientes vencidos`}
          <ChevronRight size={14} />
        </button>
      </div>
      {feedback && (
        <p className={styles.success} role="status">
          {feedback}
        </p>
      )}
      {error && (
        <div role="alert" className={styles.error}>
          {error}{" "}
          <Button variant="outline" size="sm" onClick={refresh}>
            Actualizar
          </Button>
        </div>
      )}
      <div
        className={styles.workspace}
        aria-busy={loading}
      >
        <div>
          {loading ? (
            <CalendarGridLoading />
          ) : (
            <>
              {mode === "month" && !showLate ? (
                <div className={styles.calendar}>
                  <div className={styles.weekdays}>
                    {["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"].map(
                      (d) => (
                        <span key={d}>{d}</span>
                      ),
                    )}
                  </div>
                  <div className={styles.grid}>
                    {days.map((d) => {
                      const list = events.filter((e) => e.date === d);
                      return (
                        <div
                          key={d}
                          className={`${styles.day} ${d === selected ? styles.selected : ""} ${!d.startsWith(month) ? styles.outside : ""}`}
                        >
                          <button
                            className={`${styles.number} ${d === today() ? styles.today : ""}`}
                            aria-label={`${dayLabel(d)}, ${list.length} pendientes`}
                            aria-pressed={d === selected}
                            onClick={(event) => selectDay(d, event.detail === 0)}
                          >
                            {Number(d.slice(8))}
                            <span
                              className={styles.mobileMarks}
                              aria-hidden="true"
                            >
                              {list.slice(0, 3).map((e) => (
                                <i
                                  key={e.id}
                                  className={styles[e.kind] || ""}
                                />
                              ))}
                              {list.length > 3 && (
                                <small>+{list.length - 3}</small>
                              )}
                            </span>
                          </button>
                          {list.slice(0, 3).map((e) => (
                            <button
                              key={e.id}
                              className={`${styles.event} ${styles[e.kind] || ""}`}
                              onClick={() => pick(e)}
                              title={`${labels[e.kind]}: ${e.title}`}
                              aria-label={`${labels[e.kind]}: ${e.title}`}
                            >
                              <span>
                                {e.time && displayTime(e.time) + " "}
                                {e.title}
                              </span>
                            </button>
                          ))}
                          {list.length > 3 && (
                            <button
                              className={styles.more}
                              onClick={(event) => selectDay(d, event.detail === 0)}
                            >
                              Ver {list.length - 3} más
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className={styles.agenda}>
                  {showLate && <h2>Pendientes vencidos</h2>}
                  {monthEvents.length ? (
                    monthEvents.map((e) => (
                      <button
                        key={e.id}
                        className={styles.agendaRow}
                        onClick={() => pick(e)}
                      >
                        <span>
                          {e.date.slice(8)}/{e.date.slice(5, 7)}
                          <small>{displayTime(e.time)}</small>
                        </span>
                        <span>
                          <small>
                            {labels[e.kind]} · {e.context}
                          </small>
                          <b>{e.title}</b>
                          <small>{e.owner}</small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    ))
                  ) : (
                    <div className={styles.empty}>
                      <CalendarDays />
                      <b>No hay pendientes con estos filtros</b>
                      <p>Prueba otra fecha o restablece los filtros.</p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setType("");
                          setOwner("");
                          setProject("");
                          setSpace("");
                        }}
                      >
                        Restablecer filtros
                      </Button>
                    </div>
                  )}
                  {showLate && lateOffset !== null && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setBusy(true);
                        api<Results>(
                          "overdue?" + range() + "&offset=" + lateOffset,
                        )
                          .then((result) => {
                            setLate((v) => v.concat(result.items));
                            setLateOffset(result.nextOffset);
                          })
                          .catch((e) => setError(e.message))
                          .finally(() => setBusy(false));
                      }}
                    >
                      Ver más vencidos
                    </Button>
                  )}
                </div>
              )}
              <div className={styles.legend}>
                {Object.entries(labels)
                  .filter(([k]) => k !== "demo_follow_up")
                  .map(([k, l]) => (
                    <span key={k}>
                      <i className={styles[k] || ""} />
                      {l}
                    </span>
                  ))}
              </div>
              <p className={styles.zone}>Horario de Lima · UTC−5</p>
            </>
          )}
        </div>
        <div ref={panel} tabIndex={-1} className={styles.detail}>
          <div ref={content} data-calendar-panel-content inert={exiting}>
          {form && options ? (
            <>
              <div className={styles.panelHeading}>
                <h2>
                  {form.entry ? "Editar" : "Crear"}{" "}
                  {form.kind === "meeting" ? "reunión" : "recordatorio"}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Cerrar formulario"
                  onClick={() => setForm(undefined)}
                >
                  <X />
                </Button>
              </div>
              {form.kind === "meeting" && (
                <div className={styles.connection}>
                  <Video size={18} />
                  <span>
                    {connection?.connected ? (
                      <>
                        Google Calendar conectado
                        <small>{connection.email}</small>
                      </>
                    ) : (
                      <>
                        Google Calendar sin conectar
                        <small>
                          Puedes guardar la reunión y conectarlo después.
                        </small>
                      </>
                    )}
                  </span>
                </div>
              )}
              <form
                key={form.entry?.id || form.kind}
                className={styles.form}
                onSubmit={save}
              >
                <label>
                  Título
                  <input
                    name="title"
                    required
                    maxLength={120}
                    defaultValue={form.entry?.title}
                  />
                </label>
                {form.kind === "meeting" && (
                  <label>
                    Tipo de reunión
                    <select
                      name="meetingType"
                      defaultValue={form.entry?.meetingType || "CLIENT"}
                    >
                      <option value="CLIENT">Con cliente</option>
                      <option value="INTERNAL">Interna</option>
                    </select>
                  </label>
                )}
                <label>
                  Fecha
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={form.entry?.date || selected}
                  />
                </label>
                <div className={styles.timeFields}>
                  <label>
                    Hora {form.kind === "reminder" && "(opcional)"}
                    <input
                      name="time"
                      type="time"
                      required={form.kind === "meeting"}
                      defaultValue={
                        form.entry?.time ||
                        (form.kind === "meeting" ? "10:00" : "")
                      }
                    />
                  </label>
                  {form.kind === "meeting" && (
                    <label>
                      Duración
                      <select
                        name="duration"
                        defaultValue={form.entry?.duration || 30}
                      >
                        {[15, 30, 45, 60, 90, 120].map((n) => (
                          <option key={n} value={n}>
                            {n} minutos
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                <label>
                  Responsable
                  <select
                    name="ownerId"
                    defaultValue={form.entry?.ownerId || options.userId}
                  >
                    {options.workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Visibilidad
                  <select
                    name="visibility"
                    defaultValue={
                      form.entry?.visibility ||
                      (form.kind === "meeting" ? "TEAM" : "PERSONAL")
                    }
                  >
                    <option value="PERSONAL">
                      Personal · creador y responsable
                    </option>
                    <option value="TEAM">
                      Compartido con el equipo interno
                    </option>
                  </select>
                </label>
                <label>
                  Proyecto (opcional)
                  <select
                    name="projectId"
                    defaultValue={form.entry?.projectId || ""}
                  >
                    <option value="">Sin proyecto</option>
                    {options.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                {form.kind === "meeting" && (
                  <>
                    <label>
                      Participantes
                      <textarea
                        name="attendees"
                        defaultValue={form.entry?.attendees.join(", ")}
                        placeholder="Correos separados por comas"
                      />
                      <small>
                        Colaboradores y clientes. Los invitados no reciben
                        acceso al panel.
                      </small>
                    </label>
                    <div className={styles.people}>
                      {options.workers.map((w) => (
                        <button
                          type="button"
                          key={w.id}
                          onClick={(e) => {
                            const input = e.currentTarget
                              .closest("form")!
                              .querySelector<HTMLTextAreaElement>(
                                "[name=attendees]",
                              )!;
                            const values = input.value
                              .split(",")
                              .map((v) => v.trim())
                              .filter(Boolean);
                            if (!values.includes(w.email))
                              input.value = [...values, w.email].join(", ");
                          }}
                        >
                          Añadir {w.name}
                        </button>
                      ))}
                    </div>
                    {form.entry?.googleEventId && (
                      <>
                        {form.entry.useMeet && (
                          <input type="hidden" name="useMeet" value="on" />
                        )}
                        {form.entry.sendInvites && (
                          <input type="hidden" name="sendInvites" value="on" />
                        )}
                      </>
                    )}
                    <label className={styles.check}>
                      <input
                        name="useMeet"
                        type="checkbox"
                        disabled={Boolean(form.entry?.googleEventId)}
                        defaultChecked={form.entry?.useMeet ?? true}
                      />
                      Generar Google Meet
                    </label>
                    <label className={styles.check}>
                      <input
                        name="sendInvites"
                        type="checkbox"
                        disabled={Boolean(form.entry?.googleEventId)}
                        defaultChecked={form.entry?.sendInvites ?? true}
                      />
                      Enviar invitaciones por Google Calendar
                    </label>
                    <small>
                      Al guardar se enviarán invitaciones a los correos
                      indicados desde{" "}
                      {connection?.email ||
                        "la cuenta organizadora que se conecte"}
                      . La disponibilidad no se verifica automáticamente. Las
                      opciones Meet/invitaciones se conservan después de
                      sincronizar.
                    </small>
                  </>
                )}
                <label>
                  Notas
                  <textarea
                    name="notes"
                    maxLength={5000}
                    defaultValue={form.entry?.notes}
                  />
                </label>
                <Button disabled={busy}>
                  {busy
                    ? "Guardando…"
                    : form.kind === "meeting"
                      ? "Guardar reunión"
                      : "Guardar recordatorio"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setForm(undefined)}
                >
                  Cancelar
                </Button>
              </form>
            </>
          ) : detail ? (
            <>
              <span className={styles.type}>
                {labels[detail.kind]}
                {detail.entry?.kind === "meeting"
                  ? detail.entry.meetingType === "INTERNAL"
                    ? " · Interna"
                    : " · Con cliente"
                  : ""}
                {detail.entry?.status === "CANCELLED"
                  ? " · Cancelada (pendiente de sincronizar)"
                  : ""}
              </span>
              <h2>{detail.title}</h2>
              <p>
                {dayLabel(detail.date)}
                <br />
                {displayTime(detail.time)}
                {detail.entry?.kind === "meeting" &&
                  ` · ${detail.entry.duration} minutos`}
              </p>
              <p className={styles.muted}>
                {detail.context}
                <br />
                {detail.owner}
              </p>
              {detail.href && (
                <Button asChild variant="outline">
                  <Link href={detail.href}>
                    Abrir en {labels[detail.kind].toLowerCase()}
                  </Link>
                </Button>
              )}
              {detail.entry && (
                <>
                  <p className={styles.notes}>{detail.entry.notes}</p>
                  {detail.entry.attendees.length > 0 && (
                    <>
                      <h3>Participantes</h3>
                      <p className={styles.notes}>
                        {detail.entry.attendees.join(", ")}
                      </p>
                    </>
                  )}
                  {detail.entry.meetUrl && (
                    <Button asChild>
                      <a
                        href={detail.entry.meetUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Video />
                        Unirse a Meet
                      </a>
                    </Button>
                  )}
                  {detail.entry.syncStatus !== "LOCAL" && (
                    <p
                      className={
                        detail.entry.syncStatus === "ERROR"
                          ? styles.error
                          : styles.muted
                      }
                    >
                      {
                        {
                          PENDING:
                            "Preparando Google Meet o pendiente de sincronizar",
                          SYNCING: "Sincronizando con Google",
                          SYNCED: "Sincronizado con Google Calendar",
                          ERROR:
                            detail.entry.syncError || "Error de sincronización",
                        }[detail.entry.syncStatus]
                      }
                    </p>
                  )}
                  {detail.canEdit && (
                    <div className={styles.detailActions}>
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          setForm({
                            kind: detail.entry!.kind,
                            entry: detail.entry,
                          })
                        }
                      >
                        Editar
                      </Button>
                      {detail.entry.kind === "reminder" && (
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            void mutate(
                              () =>
                                api("entries/" + detail.entry!.id, {
                                  method: "PATCH",
                                  body: JSON.stringify({
                                    ...payload(detail.entry!),
                                    status: "DONE",
                                  }),
                                }),
                              "Recordatorio completado.",
                            )
                          }
                        >
                          Marcar completado
                        </Button>
                      )}
                      {["ERROR", "PENDING", "SYNCING"].includes(
                        detail.entry.syncStatus,
                      ) && (
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            void mutate(async () => {
                              const r = await api<Entry>(
                                "entries/" + detail.entry!.id + "/sync",
                                { method: "POST" },
                              );
                              if (r.syncError) throw new Error(r.syncError);
                            }, "Sincronización actualizada.")
                          }
                        >
                          Reintentar sincronización
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        disabled={busy}
                        onClick={() => setCancelOpen(true)}
                      >
                        Cancelar{" "}
                        {detail.entry.kind === "meeting"
                          ? "reunión"
                          : "recordatorio"}
                      </Button>
                      <AlertDialog
                        open={cancelOpen}
                        onOpenChange={setCancelOpen}
                      >
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {detail.entry.kind === "meeting"
                                ? "¿Cancelar la reunión?"
                                : "¿Cancelar este recordatorio?"}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {detail.entry.kind === "meeting"
                                ? "Se notificará a los invitados si las invitaciones están activadas."
                                : "El recordatorio dejará de aparecer en el calendario."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Volver</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() =>
                                void mutate(async () => {
                                  const result = await api<Entry>(
                                    "entries/" + detail.entry!.id,
                                    {
                                      method: "PATCH",
                                      body: JSON.stringify({
                                        ...payload(detail.entry!),
                                        status: "CANCELLED",
                                      }),
                                    },
                                  );
                                  if (result.syncError)
                                    return "Cancelación guardada; falta actualizar Google. Abre el pendiente para reintentar.";
                                }, "Pendiente cancelado.")
                              }
                            >
                              Sí, cancelar{" "}
                              {detail.entry.kind === "meeting"
                                ? "reunión"
                                : "recordatorio"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </>
              )}
              <Button variant="ghost" onClick={() => setDetail(undefined)}>
                Volver al día
              </Button>
            </>
          ) : (
            <>
              <h2>{showLate ? "Vencidos" : dayLabel(selected)}</h2>
              <p className={styles.muted}>
                {showLate
                  ? "Conservan su fecha original hasta resolverse."
                  : "Agenda del día"}
              </p>
              <div ref={dayContent} data-calendar-day-content>
              {selectedEvents.length ? (
                selectedEvents.map((e) => (
                  <button
                    className={styles.dayEntry}
                    key={e.id}
                    onClick={() => pick(e)}
                  >
                    <small>
                      {labels[e.kind]} · {displayTime(e.time)}
                    </small>
                    <b>{e.title}</b>
                    <span>
                      {e.context} · {e.owner}
                    </span>
                  </button>
                ))
              ) : (
                <p className={styles.muted}>
                  {loading
                    ? "Cargando…"
                    : "No hay pendientes para este día con estos filtros."}
                </p>
              )}
              </div>
            </>
          )}
          </div>
        </div>
      </div>

    </div>
  );
}
