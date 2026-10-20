'use client';

import { useState, useTransition } from 'react';
import {
  createRequirementAction,
  deleteRequirementAction,
  createTaskAction,
} from '@/src/modules/projects/server/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckSquare,
  Plus,
  Trash2,
  ListTodo,
  FileCheck2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export type RequirementItem = {
  id: string;
  projectId?: string;
  code: string | null;
  title: string;
  description?: string | null;
  priority?: string;
  tasks?: Array<{ id: string; title: string; status: string; priority: string }>;
};

type Sprint = { id: string; name: string };
type Worker = { id: string; name: string };

export function RequirementManager({
  projectId,
  requirements = [],
  sprints = [],
  workers = [],
}: {
  projectId: string;
  requirements: RequirementItem[];
  sprints?: Sprint[];
  workers?: Worker[];
}) {
  const [newReqOpen, setNewReqOpen] = useState(false);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  // Breakdown task modal
  const [breakdownReq, setBreakdownReq] = useState<RequirementItem | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSprintId, setTaskSprintId] = useState(sprints[0]?.id || '');
  const [taskWorkerId, setTaskWorkerId] = useState('');

  const [isPending, startTransition] = useTransition();

  const handleCreateRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formData = new FormData();
    formData.append('code', code.trim());
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('priority', priority || 'MEDIUM');

    startTransition(async () => {
      await createRequirementAction(projectId, formData);
      setCode('');
      setTitle('');
      setDescription('');
      setNewReqOpen(false);
    });
  };

  const handleBreakdownTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakdownReq || !taskTitle.trim()) return;

    const formData = new FormData();
    formData.append('title', taskTitle.trim());
    formData.append('requirementId', breakdownReq.id);
    if (taskSprintId) formData.append('sprintId', taskSprintId);
    if (taskWorkerId) formData.append('assignedToId', taskWorkerId);
    formData.append('priority', breakdownReq.priority || 'MEDIUM');

    startTransition(async () => {
      await createTaskAction(projectId, formData);
      setTaskTitle('');
      setBreakdownReq(null);
      window.location.reload();
    });
  };

  const handleDelete = (reqId: string) => {
    if (!confirm('¿Seguro que deseas eliminar este Requerimiento?')) return;
    startTransition(async () => {
      await deleteRequirementAction(projectId, reqId);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Listado de Requerimientos</h3>
          <p className="text-xs text-muted-foreground">
            Requerimientos acordados con el cliente y su desglose en tareas operativas con evidencias.
          </p>
        </div>
        <Button
          onClick={() => setNewReqOpen(true)}
          size="sm"
          className="bg-slate-900 hover:bg-black text-white text-xs gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo Requerimiento
        </Button>
      </div>

      {requirements.length === 0 ? (
        <div className="p-10 border rounded-xl bg-white text-center space-y-3">
          <FileCheck2 className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No hay Requerimientos registrados</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Registra los requerimientos del cliente para luego desglosarlos en tareas del Sprint y recopilar evidencias.
          </p>
          <Button onClick={() => setNewReqOpen(true)} size="sm">
            Registrar REQ-01
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {requirements.map((req: RequirementItem) => {
            const reqTasks = req.tasks || [];
            const doneTasks = reqTasks.filter((t) => t.status === 'DONE');

            return (
              <div
                key={req.id}
                className="rounded-xl border bg-white p-4 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
              >
                {/* Req Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                        {req.code || 'REQ'}
                      </span>
                      <h4 className="font-semibold text-sm text-slate-900">{req.title}</h4>
                    </div>
                    {req.description && (
                      <p className="text-xs text-slate-500">{req.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBreakdownReq(req);
                        setTaskTitle('');
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Desglosar en Tarea
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(req.id)}
                      className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                      title="Eliminar Requerimiento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub-tasks list */}
                <div className="bg-slate-50 rounded-lg p-3 space-y-2 border">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                    <span className="flex items-center gap-1">
                      <ListTodo className="w-3.5 h-3.5 text-slate-400" />
                      Tareas de cumplimiento ({reqTasks.length})
                    </span>
                    <span>
                      {doneTasks.length} de {reqTasks.length} concluidas
                    </span>
                  </div>

                  {reqTasks.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-1">
                      Sin tareas desglosadas. Haz clic en &quot;Desglosar en Tarea&quot; para comenzar la ejecución.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {reqTasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded border text-xs shadow-xs"
                        >
                          <span
                            className={`font-medium line-clamp-1 ${
                              t.status === 'DONE' ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {t.title}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1.5 py-0 ${
                              t.status === 'DONE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : t.status === 'IN_PROGRESS'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : t.status === 'REVIEW'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-50 text-slate-600'
                            }`}
                          >
                            {t.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nuevo Requerimiento */}
      {newReqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Registrar Requerimiento</h3>
              <button
                type="button"
                onClick={() => setNewReqOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequirement} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Código</label>
                  <input
                    placeholder="REQ-01"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full rounded-md border bg-slate-50 px-2.5 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-primary uppercase"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridad</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-md border bg-slate-50 px-2.5 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-primary"
                  >
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título del Requerimiento</label>
                <input
                  required
                  placeholder="Ej. Integración de Pasarela de Pagos (Stripe / MercadoPago)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border bg-slate-50 px-3 py-2 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detalles / Criterios de Aceptación</label>
                <textarea
                  rows={3}
                  placeholder="Especificaciones o alcance acordado con el cliente..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border bg-slate-50 px-3 py-2 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setNewReqOpen(false)}>
                  Cancelar
                </Button>
                <Button disabled={isPending} type="submit" size="sm" className="bg-slate-900 hover:bg-black text-white">
                  {isPending ? 'Guardando...' : 'Guardar Requerimiento'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Desglosar en Tarea */}
      {breakdownReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Desglosar Requerimiento en Tarea</h3>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  [{breakdownReq.code || 'REQ'}] {breakdownReq.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBreakdownReq(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBreakdownTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título de la Tarea</label>
                <input
                  required
                  placeholder="Ej. Crear Webhook y endpoint de confirmación"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full rounded-md border bg-slate-50 px-3 py-2 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sprint</label>
                  <select
                    value={taskSprintId}
                    onChange={(e) => setTaskSprintId(e.target.value)}
                    className="w-full rounded-md border bg-slate-50 px-2.5 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Sin Sprint (Backlog)</option>
                    {sprints.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Responsable</label>
                  <select
                    value={taskWorkerId}
                    onChange={(e) => setTaskWorkerId(e.target.value)}
                    className="w-full rounded-md border bg-slate-50 px-2.5 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Sin asignar</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setBreakdownReq(null)}>
                  Cancelar
                </Button>
                <Button disabled={isPending} type="submit" size="sm" className="bg-slate-900 hover:bg-black text-white">
                  {isPending ? 'Creando Tarea...' : 'Crear Tarea'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
