"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, ArrowUpRight, Users, X } from "lucide-react";
import { WorkerCreateSheet } from "./WorkerCreateSheet";
import { WorkerAvatar } from "./WorkerAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Worker } from "@/src/lib/api/contracts";
import styles from "./workers.module.css";

export function WorkerDirectory({ workers }: { workers: Worker[] }) {
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("ALL"),
    [role, setRole] = useState("ALL");
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const filtered = workers.filter(
    (worker) =>
      (status === "ALL" || status === worker.status) &&
      (role === "ALL" || role === worker.role) &&
      normalize(
        `${worker.name} ${worker.email} ${worker.jobTitle || ""}`,
      ).includes(normalize(search.trim())),
  );
  return (
    <div className={styles.directory}>
      <div className={styles.filters}>
        <div className={styles.search}>
          <Search size={17} aria-hidden="true" />
          <input
            aria-label="Buscar trabajadores"
            placeholder="Buscar por nombre, correo o cargo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button aria-label="Limpiar búsqueda" onClick={() => setSearch("")}>
              <X size={16} />
            </button>
          )}
        </div>
        <select
          aria-label="Filtrar por estado"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="ALL">Todos los estados</option>
          <option value="ACTIVE">Activos</option>
          <option value="INVITED">Invitación pendiente</option>
          <option value="INACTIVE">Inactivos</option>
        </select>
        <select
          aria-label="Filtrar por rol"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="ALL">Todos los roles</option>
          <option value="ADMIN">Administradores</option>
          <option value="WORKER">Colaboradores</option>
        </select>
      </div>
      <p role="status" className={styles.resultCount}>
        {filtered.length} de {workers.length} trabajadores
      </p>
      <div className={styles.tableHead}>
        <span>Persona</span>
        <span>Rol y estado</span>
        <span>Asignaciones</span>
        <span className="sr-only">Perfil</span>
      </div>
      {filtered.map((worker) => (
        <Link
          key={worker.id}
          href={`/internal/workers/${worker.id}`}
          className={styles.personRow}
        >
          <div className={styles.person}>
            <WorkerAvatar worker={worker} className="size-11 rounded-xl shrink-0" />
            <div>
              <span className={styles.personName}>{worker.name}</span>
              <span className={styles.muted}>
                {worker.jobTitle || "Sin cargo definido"}
              </span>
              <span className={styles.email}>{worker.email}</span>
            </div>
          </div>
          <div className={styles.roleState}>
            <span>
              {worker.role === "ADMIN" ? "Administrador" : "Colaborador"}
            </span>
            <StatusBadge status={worker.status} />
          </div>
          <div className={styles.assignments}>
            <span>
              <strong>{worker._count.assignedProjects}</strong>{" "}
              {worker._count.assignedProjects === 1 ? "proyecto" : "proyectos"}
            </span>
            <span>
              <strong>{worker._count.assignedTasks}</strong>{" "}
              {worker._count.assignedTasks === 1 ? "tarea" : "tareas"}
            </span>
          </div>
          <ArrowUpRight
            className={styles.rowArrow}
            size={18}
            aria-hidden="true"
          />
        </Link>
      ))}
      {!filtered.length && (
        <div className={styles.empty}>
          <Users size={26} aria-hidden="true" />
          <h2>
            {workers.length ? "No hay coincidencias" : "Tu equipo empieza aquí"}
          </h2>
          <p>
            {workers.length
              ? "Prueba con otro nombre o ajusta los filtros."
              : "Crea un trabajador para gestionar su acceso y sus asignaciones."}
          </p>
          {!workers.length && <WorkerCreateSheet />}
          {workers.length > 0 && (
            <button
              className={styles.secondary}
              onClick={() => {
                setSearch("");
                setRole("ALL");
                setStatus("ALL");
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
