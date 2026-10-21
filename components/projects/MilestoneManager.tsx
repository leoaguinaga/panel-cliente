'use client';

import { useState, useTransition } from 'react';
import { DeliverableAttachments } from './DeliverableAttachments';
import { ArrowDown, ArrowUp, Eye, EyeOff, Paperclip, Plus, Pencil, Trash2, X } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { paymentStatus } from '@/components/client/client-formatters';
import { isMilestoneDone, type ProjectMilestone, type ProjectRequirement } from '@/src/modules/projects/types';
import {
  addMilestoneDeliverable,
  approveMilestone,
  createMilestone,
  deleteMilestone,
  deleteMilestoneDeliverable,
  requestMilestoneChanges,
  submitMilestone,
  swapMilestones,
  updateMilestone,
  updateMilestoneDeliverable,
  type MilestoneActionResult,
} from '@/src/modules/projects/server/milestone-actions';

import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

type Document = { id: string; originalName: string };
type Feedback = { tone: 'ok' | 'error'; text: string } | null;

const field = 'min-h-10 rounded-xl border bg-card px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600';
const ghost = 'inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60';
const primary = 'inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60';
const ROLE_LABELS: Record<string, string> = { CLIENT: 'cliente', ADMIN: 'admin', WORKER: 'equipo' };

/** Avance del hito por tareas hoja (una tarea con subtareas avanza por ellas). */
function taskProgress(tasks: NonNullable<ProjectMilestone['tasks']>) {
  const parents = new Set(tasks.map((task) => task.parentId).filter(Boolean));
  const leaves = tasks.filter((task) => !parents.has(task.id));
  return {
    total: leaves.length,
    done: leaves.filter((task) => task.status === 'DONE').length,
    blocked: leaves.filter((task) => task.status === 'BLOCKED').length,
  };
}

function useAction() {
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const run = (request: () => Promise<MilestoneActionResult>, success: string, onDone?: () => void) => {
    setFeedback(null);
    start(async () => {
      try {
        const result = await request();
        if (!result.ok) return setFeedback({ tone: 'error', text: result.error });
        setFeedback({ tone: 'ok', text: success });
        onDone?.();
      } catch {
        setFeedback({ tone: 'error', text: 'No se pudo completar la operación. Vuelve a intentarlo.' });
      }
    });
  };
  return { pending, feedback, run };
}

function FeedbackLine({ feedback, pending }: { feedback: Feedback; pending: boolean }) {
  if (feedback?.tone === 'error') return <p role="alert" className="text-xs text-destructive">{feedback.text}</p>;
  return <p role="status" aria-live="polite" className="text-xs text-muted-foreground">{pending ? 'Guardando…' : feedback?.text}</p>;
}

export function MilestoneManager({ projectId, milestones, requirements = [], documents = [], isAdmin }: { projectId: string; milestones: ProjectMilestone[]; requirements?: ProjectRequirement[]; documents?: Document[]; isAdmin: boolean }) {
  const [creating, setCreating] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Sheet open={creating} onOpenChange={setCreating}>
          <SheetTrigger asChild><button className={primary}><Plus className="size-4" />Nuevo hito</button></SheetTrigger>
          <SheetContent className="gap-0 p-0"><MilestoneForm projectId={projectId} requirements={requirements} onDone={() => setCreating(false)} /></SheetContent>
        </Sheet>
      </div>
      {milestones.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">Todavía no hay hitos. Cada hito es algo que el cliente recibe y aprueba; los pagos y requerimientos cuelgan de él.</div>
      ) : (
        <ol className="space-y-3">
          {milestones.map((milestone, index) => (
            <MilestoneCard key={milestone.id} projectId={projectId} milestone={milestone} index={index} previous={milestones[index - 1]} next={milestones[index + 1]} documents={documents} requirements={requirements} isAdmin={isAdmin} />
          ))}
        </ol>
      )}
    </div>
  );
}

function MilestoneCard({ projectId, milestone, index, previous, next, documents, requirements, isAdmin }: { projectId: string; milestone: ProjectMilestone; index: number; previous?: ProjectMilestone; next?: ProjectMilestone; documents: Document[]; requirements: ProjectRequirement[]; isAdmin: boolean }) {
  const { pending, feedback, run } = useAction();
  const [editing, setEditing] = useState(false);
  const [decision, setDecision] = useState<'approve' | 'changes' | null>(null);
  const [note, setNote] = useState('');
  const [item, setItem] = useState('');
  const [itemDocument, setItemDocument] = useState('');
  const progress = taskProgress(milestone.tasks ?? []);
  const approved = isMilestoneDone(milestone.status);
  const inReview = milestone.status === 'IN_REVIEW';
  const canSubmit = !approved && !inReview && !(milestone.tasks ?? []).length;
  const percent = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  const swap = (other?: ProjectMilestone) => other && run(() => swapMilestones(projectId, { id: milestone.id, order: milestone.order }, { id: other.id, order: other.order }), 'Orden actualizado');

  return (
    <li aria-busy={pending} className={`space-y-4 rounded-2xl border bg-card p-4 ${inReview ? 'border-violet-300 ring-1 ring-violet-400/20' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">{index + 1}</span>
            <h3 className="text-sm font-bold text-slate-900">{milestone.title}</h3>
            <StatusBadge status={milestone.status} />
          </div>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{milestone.startDate ? `Inicio ${formatDate(milestone.startDate)}` : 'Sin fecha de inicio'} · {milestone.dueDate ? `Fin ${formatDate(milestone.dueDate)}` : 'Sin fecha de fin'}</span>
            <span className="inline-flex items-center gap-1">{milestone.visibleToClient ? <><Eye className="size-3.5" />Visible al cliente</> : <><EyeOff className="size-3.5" />Solo interno</>}</span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Subir hito" disabled={!previous || pending} onClick={() => swap(previous)} className="inline-flex size-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 disabled:opacity-30"><ArrowUp className="size-4" /></button>
          <button type="button" aria-label="Bajar hito" disabled={!next || pending} onClick={() => swap(next)} className="inline-flex size-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 disabled:opacity-30"><ArrowDown className="size-4" /></button>
          <Sheet open={editing} onOpenChange={setEditing}>
            <SheetTrigger asChild><button type="button" className={ghost}><Pencil className="size-3.5" />Editar</button></SheetTrigger>
            <SheetContent className="gap-0 p-0"><MilestoneForm projectId={projectId} milestone={milestone} requirements={requirements} onDone={() => setEditing(false)} /></SheetContent>
          </Sheet>
          <button type="button" aria-label={`Eliminar hito ${milestone.title}`} disabled={pending} onClick={() => { if (window.confirm(`¿Eliminar el hito «${milestone.title}»? Sus entregables se eliminan con él.`)) run(() => deleteMilestone(projectId, milestone.id), 'Hito eliminado'); }} className="inline-flex size-10 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="size-4" /></button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section aria-label="Avance" className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Avance</h4>
          {progress.total ? (
            <>
              <div className="flex justify-between text-xs"><span className="text-slate-600">{progress.done} de {progress.total} tareas terminadas</span><span className="font-semibold text-slate-800">{percent}%</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${approved ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${percent}%` }} /></div>
              {progress.blocked > 0 && <p className="text-xs font-medium text-rose-700">{progress.blocked} tarea(s) bloqueada(s)</p>}
            </>
          ) : (
            <p className="text-xs text-slate-500">Sin tareas. {approved ? '' : 'Pasa a revisión con «Enviar a revisión».'}</p>
          )}
          {(milestone.payments ?? []).map((payment) => (
            <p key={payment.id} className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">{formatCurrency(payment.amount, payment.currency)}</span>
              {payment.percentage ? <span>({Number(payment.percentage)} %)</span> : null}
              <span>· {paymentStatus[payment.status] || payment.status}</span>
            </p>
          ))}
        </section>

        <section aria-label="Requerimientos" className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Requerimientos</h4>
          {(milestone.requirements ?? []).length ? (
            <ul className="space-y-1">{milestone.requirements!.map((requirement) => <li key={requirement.id} className="truncate text-xs text-slate-700"><span className="mr-1.5 rounded border px-1 font-semibold text-slate-500">{requirement.code || 'REQ'}</span>{requirement.title}</li>)}</ul>
          ) : (
            <p className="text-xs text-slate-500">Ninguno. Añádelos desde «Editar».</p>
          )}
        </section>

        <section aria-label="Entregables" className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Entregables</h4>
          <ul className="space-y-1">
            {(milestone.deliverables ?? []).map((deliverable) => (
              <li key={deliverable.id} className="space-y-1 border-b pb-3 last:border-0">
              <div className="flex items-center gap-2 text-xs">
                <input type="checkbox" aria-label={`Marcar ${deliverable.title}`} checked={deliverable.done} disabled={pending} onChange={(event) => run(() => updateMilestoneDeliverable(projectId, deliverable.id, { done: event.target.checked }), `Entregable «${deliverable.title}» actualizado`)} className="size-4" />
                <span className={`min-w-0 flex-1 truncate ${deliverable.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{deliverable.title}</span>
                {deliverable.document && <a href={`/api/backend/documents/${deliverable.document.id}/download`} className="inline-flex items-center gap-1 text-blue-700 hover:underline" title={deliverable.document.originalName}><Paperclip className="size-3.5" /><span className="sr-only">{deliverable.document.originalName}</span></a>}
                <button type="button" aria-label={`Quitar ${deliverable.title}`} disabled={pending} onClick={() => run(() => deleteMilestoneDeliverable(projectId, deliverable.id), 'Entregable quitado')} className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-700"><X className="size-3.5" /></button>
              </div>
              <DeliverableAttachments projectId={projectId} milestone={milestone} deliverable={deliverable} documents={documents} />
              </li>
            ))}
          </ul>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!item.trim()) return;
              run(() => addMilestoneDeliverable(projectId, milestone.id, item.trim(), itemDocument || null), `Entregable «${item.trim()}» añadido`, () => { setItem(''); setItemDocument(''); });
            }}
            className="flex flex-wrap gap-2"
          >
            <label className="sr-only" htmlFor={`item-${milestone.id}`}>Nuevo entregable</label>
            <input id={`item-${milestone.id}`} value={item} onChange={(event) => setItem(event.target.value)} placeholder="Añadir entregable" className={`min-w-0 flex-1 ${field}`} />
            {documents.length > 0 && <select aria-label="Archivo del entregable" value={itemDocument} onChange={(event) => setItemDocument(event.target.value)} className={`max-w-40 ${field}`}><option value="">Sin archivo</option>{documents.map((document) => <option key={document.id} value={document.id}>{document.originalName}</option>)}</select>}
            <button disabled={pending || !item.trim()} className={ghost}>Añadir</button>
          </form>
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <p className="text-xs text-slate-600">
          {approved
            ? milestone.approvedAt
              ? <>Aprobado {milestone.approvedBy ? <>por <b className="font-semibold text-slate-800">{milestone.approvedBy.name}</b> ({ROLE_LABELS[milestone.approvedBy.role] || milestone.approvedBy.role}) </> : 'antes del cambio de flujo '}el {formatDate(milestone.approvedAt)}{milestone.approvalNote ? ` · «${milestone.approvalNote}»` : ''}</>
              : 'Aprobado'
            : inReview
              ? <>Esperando aprobación del cliente{milestone.reviewRequestedAt ? ` desde el ${formatDate(milestone.reviewRequestedAt)}` : ''}</>
              : progress.total
                ? 'Pasa solo a revisión cuando se terminen sus tareas.'
                : 'Hito de gestión: envíalo a revisión cuando esté listo.'}
        </p>
        <div className="flex flex-wrap gap-2">
          {canSubmit && <button type="button" disabled={pending} onClick={() => run(() => submitMilestone(projectId, milestone.id), 'Hito enviado a revisión')} className={primary}>Enviar a revisión</button>}
          {inReview && isAdmin && <>
            <button type="button" aria-expanded={decision === 'approve'} onClick={() => { setDecision(decision === 'approve' ? null : 'approve'); setNote(''); }} className={primary}>Aprobar en nombre del cliente</button>
            <button type="button" aria-expanded={decision === 'changes'} onClick={() => { setDecision(decision === 'changes' ? null : 'changes'); setNote(''); }} className={ghost}>Pedir cambios</button>
          </>}
        </div>
      </div>

      {decision && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (decision === 'approve') run(() => approveMilestone(projectId, milestone.id, note.trim()), `Hito «${milestone.title}» aprobado`, () => setDecision(null));
            else run(() => requestMilestoneChanges(projectId, milestone.id, note.trim()), 'Cambios registrados como tarea del hito', () => setDecision(null));
          }}
          className="space-y-2 rounded-xl bg-slate-50 p-3"
        >
          <label className="block text-xs font-semibold text-slate-700">
            {decision === 'approve' ? 'Nota (opcional): por ejemplo, cómo confirmó el cliente' : 'Qué cambios pidió el cliente'}
            <textarea value={note} onChange={(event) => setNote(event.target.value)} required={decision === 'changes'} minLength={decision === 'changes' ? 3 : undefined} rows={2} className={`mt-1 w-full py-2 ${field}`} />
          </label>
          <p className="text-xs text-slate-500">{decision === 'approve' ? 'Quedará registrado que lo aprobaste tú en nombre del cliente. Sus pagos programados pasan a «por cobrar».' : 'Se crea una tarea en el hito y vuelve a «En curso».'}</p>
          <div className="flex gap-2"><button disabled={pending} className={primary}>{decision === 'approve' ? 'Confirmar aprobación' : 'Registrar cambios'}</button><button type="button" onClick={() => setDecision(null)} className={ghost}>Cancelar</button></div>
        </form>
      )}

      <FeedbackLine feedback={feedback} pending={pending} />
    </li>
  );
}

function MilestoneForm({ projectId, milestone, requirements, onDone }: { projectId: string; milestone?: ProjectMilestone; requirements: ProjectRequirement[]; onDone: () => void }) {
  const { pending, feedback, run } = useAction();
  const [startDate, setStartDate] = useState(milestone?.startDate?.slice(0, 10) || '');
  const [endDate, setEndDate] = useState(milestone?.dueDate?.slice(0, 10) || '');
  const [selected, setSelected] = useState<string[]>(milestone?.requirements?.map(item => item.id) ?? []);
  return <>
    <SheetHeader className="border-b px-6 py-6 pr-12">
      <SheetTitle>{milestone ? 'Editar hito' : 'Nuevo hito'}</SheetTitle>
      <SheetDescription>Define la entrega, su periodo de trabajo y los requerimientos que incluye.</SheetDescription>
    </SheetHeader>
    <form className="flex min-h-0 flex-1 flex-col" aria-busy={pending} onSubmit={event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const body = { title: String(data.get('title') || '').trim(), startDate: startDate || null, dueDate: endDate || null, visibleToClient: data.get('visibleToClient') === 'on', requirementIds: selected };
      run(() => milestone ? updateMilestone(projectId, milestone.id, body) : createMilestone(projectId, body), milestone ? 'Hito actualizado' : 'Hito creado', onDone);
    }}>
      <fieldset disabled={pending} className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6 disabled:opacity-60">
        <label className="block text-sm font-medium">Nombre del hito<input autoFocus name="title" required maxLength={200} defaultValue={milestone?.title} placeholder="Ej. Diseño aprobado" className={`mt-2 w-full ${field}`} /></label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="min-w-0 text-sm font-medium">Fecha de inicio<input type="date" value={startDate} max={endDate || undefined} onChange={e => setStartDate(e.target.value)} className={`mt-2 w-full ${field}`} /></label>
          <label className="min-w-0 text-sm font-medium">Fecha de fin<input type="date" value={endDate} min={startDate || undefined} onChange={e => setEndDate(e.target.value)} className={`mt-2 w-full ${field}`} /></label>
        </div>
        <label className="flex min-h-11 items-start gap-3 text-sm"><input type="checkbox" name="visibleToClient" defaultChecked={milestone?.visibleToClient ?? true} className="mt-1 size-4 accent-primary" /><span>Visible al cliente<span className="mt-1 block text-xs text-muted-foreground">El cliente podrá consultar este hito en su portal.</span></span></label>
        <section aria-label="Asignar requerimientos" className="space-y-3 border-t pt-5">
          <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Requerimientos</h3><span className="text-xs text-muted-foreground">{selected.length} seleccionados</span></div>
          <p className="text-xs text-muted-foreground">Selecciona los que forman parte de esta entrega. Los asignados a otro hito se moverán aquí.</p>
          {requirements.length ? <div className="divide-y rounded-xl border">{requirements.map(requirement => <label key={requirement.id} className="flex cursor-pointer items-start gap-3 p-3 hover:bg-muted/50">
            <input type="checkbox" checked={selected.includes(requirement.id)} onChange={e => setSelected(ids => e.target.checked ? [...ids, requirement.id] : ids.filter(id => id !== requirement.id))} className="mt-1 size-4 shrink-0 accent-primary" />
            <span className="min-w-0 break-words text-sm"><span className="mr-2 text-xs text-muted-foreground">{requirement.code || 'REQ'}</span>{requirement.title}{requirement.milestoneId && requirement.milestoneId !== milestone?.id && <span className="mt-1 block text-xs text-muted-foreground">Asignado a otro hito</span>}</span>
          </label>)}</div> : <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Aún no hay requerimientos en este proyecto. Puedes crearlos desde la pestaña Requerimientos.</p>}
        </section>
      </fieldset>
      <div className="space-y-3 border-t p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <FeedbackLine feedback={feedback} pending={pending} />
        <div className="flex justify-end gap-2"><button type="button" disabled={pending} onClick={onDone} className={ghost}>Cancelar</button><button disabled={pending} className={primary}>{pending ? 'Guardando…' : milestone ? 'Guardar cambios' : 'Crear hito'}</button></div>
      </div>
    </form>
  </>;
}
