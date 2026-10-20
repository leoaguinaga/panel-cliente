'use client';

import { useState, useTransition } from 'react';
import { createSprintAction, updateSprintAction, deleteSprintAction } from '@/src/modules/projects/server/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Layers, CheckCircle2, PlayCircle, Clock, Trash2, Edit2 } from 'lucide-react';
import type { ProjectSprint, ProjectTask } from '@/src/modules/projects/types';
import { formatDate } from '@/lib/formatters';

export type SprintData = {
  id: string;
  projectId: string;
  name: string;
  goal: string | null;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  startDate: string | null;
  endDate: string | null;
  order: number;
  _count?: { tasks: number };
};

export function SprintManager({
  projectId,
  sprints = [],
  tasks = [],
}: {
  projectId: string;
  sprints: ProjectSprint[];
  tasks: ProjectTask[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('goal', goal.trim());
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);

    startTransition(async () => {
      setMessage(null); setError(null);
      try { await createSprintAction(projectId, formData); setName(''); setGoal(''); setStartDate(''); setEndDate(''); setModalOpen(false); setMessage('Sprint creado correctamente.'); }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo crear el sprint.'); }
    });
  };

  const handleStatusChange = (sprintId: string, newStatus: string) => {
    const formData = new FormData();
    formData.append('status', newStatus);
    startTransition(async () => {
      setMessage(null); setError(null);
      try { await updateSprintAction(projectId, sprintId, formData); setMessage('Estado del sprint actualizado.'); }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el sprint.'); }
    });
  };

  const handleDelete = (sprintId: string) => {
    if (!confirm('¿Seguro que deseas eliminar este Sprint? Las tareas asociadas pasarán al Backlog.')) return;
    startTransition(async () => {
      setMessage(null); setError(null);
      try { await deleteSprintAction(projectId, sprintId); setMessage('Sprint eliminado. Las tareas asociadas pasaron al backlog.'); }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo eliminar el sprint.'); }
    });
  };

  const handleEdit = (sprint: ProjectSprint, formData: FormData) => startTransition(async () => {
    setMessage(null); setError(null);
    try { await updateSprintAction(projectId, sprint.id, formData); setMessage(`“${String(formData.get('name') || sprint.name)}” se actualizó correctamente.`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el sprint.'); }
  });

  return (
    <div className="space-y-4">
      <div aria-live="polite" aria-atomic="true">{message && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}{error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}</div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Planificación de Sprints</h3>
          <p className="text-xs text-muted-foreground">
            Organiza las entregas del proyecto en iteraciones de tiempo e hitos definidos.
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          size="sm"
          className="bg-slate-900 hover:bg-black text-white text-xs gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Crear Sprint
        </Button>
      </div>

      {sprints.length === 0 ? (
        <div className="p-10 border rounded-xl bg-white text-center space-y-3">
          <Layers className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No hay Sprints configurados</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Crea tu primer Sprint para organizar el backlog y comenzar la ejecución ágil del proyecto.
          </p>
          <Button onClick={() => setModalOpen(true)} size="sm">
            Crear Sprint 1
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sprints.map((sprint) => {
            const sprintTasks = tasks.filter((task) => task.sprint?.id === sprint.id);
            const doneTasks = sprintTasks.filter((task) => task.status === 'DONE');
            const progress = sprintTasks.length > 0 ? Math.round((doneTasks.length / sprintTasks.length) * 100) : 0;

            return (
              <div
                key={sprint.id}
                className={`rounded-xl border bg-white p-5 shadow-xs space-y-4 flex flex-col justify-between transition-all ${
                  sprint.status === 'ACTIVE'
                    ? 'border-blue-500 ring-1 ring-blue-500/30'
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{sprint.name}</h4>
                      {sprint.goal && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 italic">
                          &quot;{sprint.goal}&quot;
                        </p>
                      )}
                    </div>
                    {sprint.status === 'ACTIVE' && (
                      <Badge className="bg-blue-600 text-white hover:bg-blue-600 text-[10px]">
                        Activo
                      </Badge>
                    )}
                    {sprint.status === 'PLANNED' && (
                      <Badge variant="outline" className="text-slate-600 text-[10px]">
                        Planificado
                      </Badge>
                    )}
                    {sprint.status === 'COMPLETED' && (
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-[10px]">
                        Completado
                      </Badge>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {sprint.startDate ? formatDate(sprint.startDate) : 'Sin inicio'} -{' '}
                      {sprint.endDate ? formatDate(sprint.endDate) : 'Sin fin'}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span>{doneTasks.length} de {sprintTasks.length} tareas completadas</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          sprint.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {sprint.status === 'PLANNED' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(sprint.id, 'ACTIVE')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        Iniciar Sprint
                      </button>
                    )}
                    {sprint.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(sprint.id, 'COMPLETED')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completar Sprint
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(sprint.id)}
                    className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                    title="Eliminar Sprint"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <details className="rounded-lg bg-slate-50 p-3">
                  <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-600"><Edit2 className="size-3.5" />Editar sprint</summary>
                  <form action={handleEdit.bind(null, sprint)} className="mt-3 space-y-3">
                    <label className="block text-xs font-medium text-slate-600">Nombre<input required name="name" defaultValue={sprint.name} className="mt-1 min-h-10 w-full rounded-lg border bg-white px-3 text-xs" /></label>
                    <label className="block text-xs font-medium text-slate-600">Objetivo<textarea name="goal" rows={2} defaultValue={sprint.goal || ''} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-xs" /></label>
                    <div className="grid grid-cols-2 gap-2"><label className="text-xs font-medium text-slate-600">Inicio<input name="startDate" type="date" defaultValue={sprint.startDate?.slice(0,10) || ''} className="mt-1 min-h-10 w-full rounded-lg border bg-white px-2 text-xs" /></label><label className="text-xs font-medium text-slate-600">Fin<input name="endDate" type="date" defaultValue={sprint.endDate?.slice(0,10) || ''} className="mt-1 min-h-10 w-full rounded-lg border bg-white px-2 text-xs" /></label></div>
                    <input type="hidden" name="status" value={sprint.status} />
                    <Button disabled={isPending} size="sm" className="w-full">{isPending ? 'Guardando…' : 'Guardar cambios'}</Button>
                  </form>
                </details>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Creación Sprint */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Crear Nuevo Sprint</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Sprint</label>
                <input
                  required
                  placeholder="Ej. Sprint 2: Catálogo y Carrito de Compras"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border bg-slate-50 px-3 py-2 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Objetivo del Sprint (Sprint Goal)</label>
                <textarea
                  rows={2}
                  placeholder="¿Qué valor entregable logrará el equipo en esta iteración?"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full rounded-md border bg-slate-50 px-3 py-2 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-md border bg-slate-50 px-2.5 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de Fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-md border bg-slate-50 px-2.5 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button disabled={isPending} type="submit" size="sm" className="bg-slate-900 hover:bg-black text-white">
                  {isPending ? 'Creando...' : 'Crear Sprint'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
