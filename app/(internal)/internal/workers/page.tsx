import { requireAuth } from "@/src/lib/auth";
import { getWorkers } from "@/src/modules/users/server/queries";
import { WorkerDirectory } from "@/src/modules/users/WorkerDirectory";
import { WorkerCreateSheet } from "@/src/modules/users/WorkerCreateSheet";
import styles from "@/src/modules/users/workers.module.css";

export default async function WorkersPage() {
  await requireAuth(["ADMIN"]);
  const workers = await getWorkers();
  return (
    <section className={styles.workspace}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Trabajadores</h1>
          <p>Personas, acceso y trabajo del equipo, en un solo lugar.</p>
        </div>
        <div className={styles.teamSummary}>
          <span>
            {workers.filter((w) => w.status === "ACTIVE").length} activos
          </span>
          <span>
            {workers.filter((w) => w.role === "ADMIN").length} administradores
          </span>
        </div>
      </header>
      <WorkerCreateSheet />
      <WorkerDirectory workers={workers} />
    </section>
  );
}
