'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createServiceAction, updateServiceAction, deleteServiceAction } from '@/src/modules/products/server/actions';
import type { getCatalogs } from '@/src/modules/products/server/queries';
import styles from './settings.module.css';

type Service = Awaited<ReturnType<typeof getCatalogs>>['services'][number];
function ServiceForm({ service, close }: { service?: Service; close: () => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  function request(action: (data: FormData) => Promise<{ ok: boolean; error?: string }>, data: FormData, message: string) {
    start(async () => {
      setError('');
      try {
        const result = await action(data);
        if (!result.ok) { setError(result.error || 'No se pudo guardar el servicio.'); return; }
        toast.success(message); close();
      } catch { setError('No se pudo completar la operación. Revisa tu conexión e inténtalo nuevamente.'); }
    });
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    request(service ? updateServiceAction.bind(null, service.id) : createServiceAction, new FormData(event.currentTarget), service ? 'Servicio actualizado.' : 'Servicio creado.');
  }
  return <form onSubmit={submit}><fieldset disabled={pending}>
    <div className={styles.fields}>
      <label>Nombre<input name="name" required maxLength={200} defaultValue={service?.name} autoFocus /></label>
      <label>Identificador<input name="slug" required maxLength={200} defaultValue={service?.slug} /></label>
      <label>Tipo<select name="type" defaultValue={service?.type || 'WEBSITE_DEVELOPMENT'}><option value="WEBSITE_DEVELOPMENT">Desarrollo de sitios web</option><option value="CUSTOM_SOFTWARE">Software a medida</option></select></label>
      {service && <label>Estado<select name="active" defaultValue={String(service.active)}><option value="true">Activo</option><option value="false">Inactivo</option></select></label>}
      <label className={styles.wide}>Descripción<textarea name="description" maxLength={5000} defaultValue={service?.description || ''} /></label>
    </div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.actions}>
      {service && <Button type="button" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}>Eliminar servicio</Button>}
      <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
      <Button type="submit">{pending ? 'Guardando…' : service ? 'Guardar cambios' : 'Crear servicio'}</Button>
    </div>
    {service && confirmDelete && <div className={styles.deleteConfirmation}><p>¿Eliminar {service.name}? Si tiene proyectos asociados, deberás conservarlo y marcarlo como inactivo.</p><div className={styles.add}><Button type="button" variant="destructive" onClick={() => request(deleteServiceAction.bind(null, service.id), new FormData(), 'Servicio eliminado.')}>Confirmar eliminación</Button><Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>Conservar servicio</Button></div></div>}
  </fieldset></form>;
}
export function ServicesSettings({ services }: { services: Service[] }) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  return <section><header className={styles.servicesHeading}><div className={styles.intro}><h2>Servicios</h2><p>Define las líneas de trabajo que podrás asignar a tus proyectos.</p></div><Button type="button" aria-expanded={creating} aria-controls="new-service-form" onClick={() => { setCreating(!creating); setEditing(null); }}>Nuevo servicio</Button></header>
    {creating && <div id="new-service-form" className={styles.section}><h3>Nuevo servicio</h3><ServiceForm close={() => setCreating(false)} /></div>}
    <div className={styles.servicesList}>{services.length === 0 && <p className={styles.note}>Aún no hay servicios registrados. Crea tu primera línea de trabajo.</p>}
      {services.map(service => <article key={service.id} className={styles.serviceRow}><div className={styles.serviceSummary}><div><h3>{service.name}</h3><p>{service._count.projects} {service._count.projects === 1 ? 'proyecto' : 'proyectos'}</p></div><div className={styles.serviceControls}><span className={service.active ? styles.activeService : styles.note}>{service.active ? 'Activo' : 'Inactivo'}</span><Button type="button" variant="ghost" aria-expanded={editing === service.id} aria-controls={`service-${service.id}`} onClick={() => { setEditing(editing === service.id ? null : service.id); setCreating(false); }}>Editar servicio<span className="sr-only"> {service.name}</span></Button></div></div>{editing === service.id && <div id={`service-${service.id}`}><ServiceForm service={service} close={() => setEditing(null)} /></div>}</article>)}
    </div></section>;
}
