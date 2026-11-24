'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch('/api/client-access/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!response.ok) throw new Error('request');
      setSent(true);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent)
    return (
      <section className={styles.card} aria-labelledby="forgot-title">
        <h2 className={styles.display} id="forgot-title">Revisa tu correo</h2>
        <p className={styles.sub} role="status">
          Si <strong>{email.trim()}</strong> tiene una cuenta en FoxCode, te enviamos un enlace para crear una contraseña nueva. Vence en 1 hora; revisa también la carpeta de spam.
        </p>
        <p className={styles.aside}>
          <Link href="/login">Volver a iniciar sesión</Link>
        </p>
      </section>
    );

  return (
    <section className={styles.card} aria-labelledby="forgot-title">
      <h2 className={styles.display} id="forgot-title">Restablece tu contraseña</h2>
      <p className={styles.sub}>Escribe tu correo y te enviaremos un enlace para elegir una contraseña nueva.</p>

      <form method="post" className={styles.form} onSubmit={submit}>
        {failed && (
          <div className={styles.alert} role="alert">
            <div>
              <strong>No pudimos procesar tu solicitud.</strong> Revisa tu conexión e inténtalo de nuevo.
            </div>
          </div>
        )}
        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <label htmlFor="email">Correo</label>
          </div>
          <div className={styles.control}>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="tu@empresa.com"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFailed(false);
              }}
            />
          </div>
        </div>
        <button className={styles.submit} type="submit" disabled={loading} aria-busy={loading}>
          {loading ? 'Enviando…' : 'Enviar enlace'}
        </button>
      </form>

      <p className={styles.aside}>
        <Link href="/login">Volver a iniciar sesión</Link>
      </p>
    </section>
  );
}
