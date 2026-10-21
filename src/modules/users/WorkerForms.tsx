"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { ActionForm } from "@/components/shared/ActionForm";
import {
  createWorkerProfileAction,
  updateWorkerFormAction,
  sendWorkerLinkFormAction,
} from "./server/actions";
import type { Worker } from "@/src/lib/api/contracts";
import styles from "./workers.module.css";

export function WorkerForm({ worker, onCancel }: { worker?: Worker; onCancel?: () => void }) {
  const [state, formAction, pending] = useActionState(
    createWorkerProfileAction,
    { error: null },
  );
  // Una invitación pendiente se edita como «activo»: el backend la mantiene
  // pendiente hasta que la persona cree su contraseña.
  const invited = worker?.status === "INVITED";
  const [status, setStatus] = useState(
    invited ? "ACTIVE" : worker?.status || "ACTIVE",
  );
  const fields = (
    <>
      {worker && <input type="hidden" name="workerId" value={worker.id} />}
      <label>
        Nombre completo
        <input
          name="name"
          required
          maxLength={120}
          defaultValue={worker?.name}
          autoComplete="name"
        />
      </label>
      <label>
        Correo de acceso
        <input
          name="email"
          type="email"
          required
          defaultValue={worker?.email}
          autoComplete="email"
        />
      </label>
      <label>
        Teléfono
        <input
          name="phone"
          type="tel"
          maxLength={40}
          defaultValue={worker?.phone || ""}
          autoComplete="tel"
        />
      </label>
      <label>
        Cargo o especialidad
        <input
          name="jobTitle"
          maxLength={40}
          defaultValue={worker?.jobTitle || ""}
          placeholder="Por ejemplo, Frontend"
        />
      </label>
      <label>
        Rol
        <select name="role" defaultValue={worker?.role || "WORKER"}>
          <option value="WORKER">Colaborador</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </label>
      {worker && (
        <label>
          Estado
          <select
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="ACTIVE">
              {invited ? "Invitación pendiente" : "Activo"}
            </option>
            <option value="INACTIVE">Inactivo</option>
          </select>
        </label>
      )}
      <p className={styles.formNote}>
        Los administradores gestionan el equipo y la configuración. Los
        colaboradores acceden a la operación según sus permisos.
      </p>
      {!worker && (
        <p className={styles.formNote}>
          Le enviaremos un correo a esa dirección para que cree su contraseña.
          El enlace vence en 1 hora; si no llega a usarlo, puedes reenviarlo
          desde su ficha, en Acceso.
        </p>
      )}
      <div className={styles.formActions}>
        <button className={styles.primary}>
          {worker
            ? "Guardar cambios"
            : pending
              ? "Creando…"
              : "Crear trabajador"}
        </button>
        {!worker && (
          onCancel ? (
            <button type="button" onClick={onCancel} className={styles.secondary}>
              Cancelar
            </button>
          ) : (
            <Link href="/internal/workers" className={styles.secondary}>
              Cancelar
            </Link>
          )
        )}
      </div>
    </>
  );
  if (worker)
    return (
      <ActionForm
        action={updateWorkerFormAction}
        className={styles.form}
        confirmMessage={
          worker.status !== "INACTIVE" && status === "INACTIVE"
            ? `Se desactivará el acceso de ${worker.name}. Sus asignaciones se conservarán. ¿Continuar?`
            : undefined
        }
      >
        {fields}
      </ActionForm>
    );
  return (
    <form action={formAction} className={styles.form}>
      <fieldset disabled={pending} className="contents">
        {fields}
      </fieldset>
      {state.error && (
        <p role="alert" className={styles.formError}>
          {state.error}
        </p>
      )}
      <p role="status" className={styles.formNote}>
        {pending ? "Creando trabajador…" : ""}
      </p>
    </form>
  );
}

export function WorkerAccessForm({ worker }: { worker: Worker }) {
  const invited = worker.status === "INVITED";
  if (worker.status === "INACTIVE")
    return (
      <p className={styles.formNote}>
        El acceso está desactivado. Actívalo desde Datos para enviarle un
        enlace.
      </p>
    );
  return (
    <ActionForm
      action={sendWorkerLinkFormAction}
      className={styles.form}
      successMessage={`Enviamos el enlace a ${worker.email}.`}
      pendingMessage="Enviando correo…"
    >
      <input type="hidden" name="workerId" value={worker.id} />
      <div className={styles.formNote}>
        {invited
          ? `${worker.name} todavía no crea su contraseña. Reenvíale la invitación a ${worker.email}.`
          : `Le llegará a ${worker.email} un enlace para crear una contraseña nueva. Su contraseña actual sigue funcionando hasta que la cambie; al cambiarla se cierran sus sesiones.`}{" "}
        El enlace vence en 1 hora y sirve una sola vez.
      </div>
      <button className={styles.secondary}>
        {invited ? "Reenviar invitación" : "Enviar enlace de restablecimiento"}
      </button>
    </ActionForm>
  );
}
