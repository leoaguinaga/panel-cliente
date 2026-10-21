import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/src/lib/auth";
import { WorkerForm } from "@/src/modules/users/WorkerForms";
import styles from "@/src/modules/users/workers.module.css";

export default async function NewWorkerPage() {
  await requireAuth(["ADMIN"]);
  return (
    <section className={styles.workspace}>
      <Link href="/internal/workers" className={styles.back}>
        <ArrowLeft size={16} aria-hidden="true" />
        Todos los trabajadores
      </Link>
      <div className={styles.settingsPanel}>
        <header className={styles.pageHeader}>
          <div>
            <h1>Incorporar al equipo</h1>
            <p>Completa sus datos y define el acceso inicial.</p>
          </div>
        </header>
        <WorkerForm />
      </div>
    </section>
  );
}
