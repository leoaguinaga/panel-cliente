"use client";

import { useRef } from "react";
import styles from "@/app/(auth)/auth.module.css";

/**
 * Vista previa decorativa del portal con datos ficticios («Acme Inc»).
 * Se dibuja como boceto y luego «compila», igual que el hero de la landing.
 */
export function PortalPreview() {
  const stageRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  // Inclinación sutil siguiendo al puntero (solo puntero fino y sin reduced motion).
  const canTilt = () =>
    matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;

  const handleMove = (e: React.PointerEvent) => {
    if (!stageRef.current || !innerRef.current || !canTilt()) return;
    const r = stageRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    innerRef.current.style.transform = `rotateY(${x * 6}deg) rotateX(${-y * 5}deg)`;
  };

  const handleLeave = () => {
    if (innerRef.current) innerRef.current.style.transform = "";
  };

  const check = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );

  return (
    <div ref={stageRef} className={styles.stage} aria-hidden="true" onPointerMove={handleMove} onPointerLeave={handleLeave}>
      <div ref={innerRef} className={styles.stageIn}>
        <svg className={styles.wire} viewBox="0 0 560 384" preserveAspectRatio="none">
          <rect pathLength={1} x="0.5" y="0.5" width="559" height="383" rx="16" style={{ "--d": 0 } as React.CSSProperties} />
          <line pathLength={1} x1="0" y1="48" x2="560" y2="48" style={{ "--d": 120 } as React.CSSProperties} />
          <line pathLength={1} x1="22" y1="102" x2="538" y2="102" style={{ "--d": 200 } as React.CSSProperties} />
          <rect pathLength={1} x="16" y="160" width="308" height="208" rx="12" style={{ "--d": 280 } as React.CSSProperties} />
          <rect pathLength={1} x="28" y="196" width="284" height="112" rx="8" style={{ "--d": 360 } as React.CSSProperties} />
          <rect pathLength={1} x="336" y="160" width="208" height="208" rx="12" style={{ "--d": 420 } as React.CSSProperties} />
          <line pathLength={1} x1="348" y1="200" x2="532" y2="200" style={{ "--d": 480 } as React.CSSProperties} />
          <line pathLength={1} x1="348" y1="232" x2="532" y2="232" style={{ "--d": 520 } as React.CSSProperties} />
          <line pathLength={1} x1="348" y1="264" x2="532" y2="264" style={{ "--d": 560 } as React.CSSProperties} />
        </svg>

        <div className={styles.portal}>
          <div className={styles.pHead}>
            <div className={styles.crumb}>
              <span className={styles.mono}>A</span>
              <b>Acme Inc</b>
              <i>/</i>
              Sitio web y reservas
            </div>
            <span className={styles.status}>En desarrollo</span>
          </div>

          <div className={styles.pBody}>
            <div>
              <div className={styles.pRow}>
                <strong>Avance del proyecto</strong>
                <span>Entrega estimada · 14 nov</span>
              </div>
              <div className={styles.track}>
                <i className={styles.fill} />
                <i className={`${styles.dot} ${styles.done}`} style={{ left: "0%" }} />
                <i className={`${styles.dot} ${styles.done}`} style={{ left: "33.33%" }} />
                <i className={`${styles.dot} ${styles.now}`} style={{ left: "66.66%" }} />
                <i className={styles.dot} style={{ left: "100%" }} />
              </div>
              <div className={styles.steps}>
                <span><b>Descubrimiento</b><small>2 sep</small></span>
                <span><b>Diseño</b><small>26 sep</small></span>
                <span className={styles.cur}><b>Desarrollo</b><small>En curso</small></span>
                <span><b>Lanzamiento</b><small>14 nov</small></span>
              </div>
            </div>

            <div className={styles.pGrid}>
              <div className={styles.pCard}>
                <div className={styles.pRow}>
                  <strong>Para tu revisión</strong>
                  <span className={styles.new}>Nuevo</span>
                </div>
                <div className={styles.thumb}>
                  <div className={styles.tNav}><i /><i /><i /><i /></div>
                  <div className={styles.tCopy}><i /><i /><i /><i /><em /></div>
                  <div className={styles.tArt} />
                </div>
                <div className={styles.pFoot}>
                  <span><b>Prototipo v3</b>12 pantallas · hace 2 min</span>
                  <span className={styles.btnMini}>
                    Revisar
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </div>

              <div className={styles.pCard}>
                <span className={styles.pTitle}>Pagos</span>
                <div className={styles.pay}>
                  <div><b>Anticipo</b><span className={styles.ok}>{check}Pagado</span><span className={styles.amount}>S/ 3,600</span></div>
                  <div><b>Cuota 2</b><span className={styles.ok}>{check}Pagado</span><span className={styles.amount}>S/ 2,400</span></div>
                  <div><b>Saldo</b><span className={styles.later}>Al lanzar</span><span className={styles.amount}>S/ 2,000</span></div>
                </div>
                <div className={styles.meet}>
                  <b>Próxima reunión</b>
                  Jue 24 · 10:00 · Demo de reservas
                </div>
              </div>
            </div>
          </div>
        </div>
        <span className={styles.scan} />

        <div className={styles.toast}>
          <span className={styles.toastIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
              <path d="M14 3v5h5M9 14l2 2 4-4" />
            </svg>
          </span>
          <span>
            <b>Prototipo v3 listo</b>
            Tu revisión desbloquea el desarrollo
          </span>
        </div>
      </div>
    </div>
  );
}
