import type { Metadata } from "next";
import Image from "next/image";
import { PortalPreview } from "@/components/auth/PortalPreview";
import styles from "./auth.module.css";

const SITE_URL = "https://foxcodepe.com";

export const metadata: Metadata = {
  title: "Inicia sesión — Foxcode",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <div className={styles.glow} aria-hidden="true" />

      <header className={styles.topbar}>
        <a href={SITE_URL} aria-label="FoxCode, ir al sitio">
          <Image src="/logos/logo-full-white.webp" alt="FoxCode" width={105} height={26} priority />
        </a>
        <a className={styles.back} href={SITE_URL}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          <span className={styles.backLabel}>Volver a foxcodepe.com</span>
        </a>
      </header>

      <main className={styles.main}>
        <section className={styles.pitch} aria-labelledby="pitch-title">
          <h1 className={styles.display} id="pitch-title">
            Tu proyecto,
            <br />
            <span>a la vista.</span>
          </h1>
          <p>Avances, entregables, documentos y pagos de lo que construimos contigo, en un solo lugar.</p>
          <PortalPreview />
        </section>

        {children}
      </main>

      <footer className={styles.foot}>
        <span>© {new Date().getFullYear()} FoxCode · Chiclayo, Perú</span>
        <a href={`${SITE_URL}/legal`}>Términos y privacidad</a>
      </footer>
    </div>
  );
}
