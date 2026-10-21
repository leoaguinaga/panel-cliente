'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Link2, X } from 'lucide-react';
import { createTaskDependencyAction, deleteTaskDependencyAction } from '@/src/modules/projects/server/actions';
import type { ProjectTask } from '@/src/modules/projects/types';

export function TaskDependencyEditor({ projectId, task, tasks }: { projectId: string; task: Pick<ProjectTask, 'id' | 'blockedBy'>; tasks: ProjectTask[] }) {
  const [predecessorId, setPredecessorId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const existing = new Set(task.blockedBy?.map((dependency) => dependency.predecessorId) || []);
  const options = tasks.filter((candidate) => candidate.id !== task.id && !existing.has(candidate.id));
  const unresolved = task.blockedBy?.filter((dependency) => dependency.predecessor.status !== 'DONE') || [];

  const add = () => { if (!predecessorId) return; startTransition(async () => { setMessage(null); setError(null); try { await createTaskDependencyAction(projectId, task.id, predecessorId); setMessage('Prerequisito añadido.'); setPredecessorId(''); router.refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo añadir el prerequisito.'); } }); };
  const remove = (dependencyId: string) => startTransition(async () => { setMessage(null); setError(null); try { await deleteTaskDependencyAction(projectId, task.id, dependencyId); setMessage('Prerequisito eliminado.'); router.refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo eliminar el prerequisito.'); } });

  return <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/70 p-2" onDragStart={(event) => { event.preventDefault(); event.stopPropagation(); }} onPointerDown={(event) => event.stopPropagation()}><div className="flex items-center justify-between gap-2"><p className="flex items-center gap-1 text-[11px] font-semibold text-slate-600"><Link2 className="size-3" />Prerequisitos</p>{unresolved.length > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Bloqueada por {unresolved.length}</span>}</div>{task.blockedBy?.map((dependency) => <div key={dependency.id} className="flex items-center justify-between gap-2 rounded-md bg-card px-2 py-1.5 text-[11px]"><span className="truncate">{dependency.predecessor.title} · {dependency.predecessor.status === 'DONE' ? 'Completada' : 'Pendiente'}</span><button type="button" onClick={() => remove(dependency.id)} disabled={pending} aria-label={`Eliminar prerequisito ${dependency.predecessor.title}`} className="rounded p-1 text-slate-400 hover:text-rose-600"><X className="size-3" /></button></div>)}<div className="flex gap-1.5"><select value={predecessorId} onChange={(event) => setPredecessorId(event.target.value)} disabled={pending || options.length === 0} aria-label="Tarea prerequisito" className="min-h-9 min-w-0 flex-1 rounded-md border bg-card px-2 text-[11px]"><option value="">Seleccionar tarea previa</option>{options.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}</select><button type="button" onClick={add} disabled={pending || !predecessorId} className="min-h-9 rounded-md bg-brand-button px-2 text-[11px] font-semibold text-white disabled:opacity-50">{pending ? 'Guardando…' : 'Añadir'}</button></div><div aria-live="polite">{message && <p className="text-[10px] text-emerald-700">{message}</p>}{error && <p role="alert" className="text-[10px] text-rose-700">{error}</p>}</div></div>;
}
