'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getLoginDestination } from '@/src/lib/login-redirect';
import { authClient } from '@/src/lib/auth-client';
import styles from '../auth.module.css';

// El equipo recibe la solicitud y envía el enlace de restablecimiento por correo.
const FORGOT_URL = `https://wa.me/51907280391?text=${encodeURIComponent(
  'Hola, olvidé mi contraseña del portal de FoxCode.',
)}`;
const SITE_URL = 'https://foxcodepe.com';

type LoginError = { title: string; detail: string };

const INVALID_CREDENTIALS: LoginError = {
  title: 'Correo o contraseña incorrectos.',
  detail: 'Revísalos e inténtalo de nuevo.',
};

function describeError(error: { status?: number; code?: string }): LoginError {
  if (error.status === 429) {
    return { title: 'Demasiados intentos.', detail: 'Espera un minuto y vuelve a intentarlo.' };
  }
  if (error.status === 401 || error.code === 'INVALID_EMAIL_OR_PASSWORD') return INVALID_CREDENTIALS;
  return { title: 'No pudimos iniciar sesión.', detail: 'Revisa tu conexión e inténtalo de nuevo.' };
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await authClient.signIn.email({ email, password });

      if (authError) {
        setError(describeError(authError));
        setLoading(false);
        return;
      }

      const { data: session } = await authClient.getSession();
      const userRole = (session?.user as { role?: string } | undefined)?.role;
      router.replace(getLoginDestination(window.location.search, userRole));
      router.refresh();
    } catch {
      setError(describeError({}));
      setLoading(false);
    }
  };

  const clearError = () => {
    if (error) setError(null);
  };

  return (
    <section className={styles.card} aria-labelledby="login-title">
      <h2 className={styles.display} id="login-title">Inicia sesión</h2>
      <p className={styles.sub}>Accede al portal de tus proyectos.</p>

      <form method="post" className={styles.form} onSubmit={handleLogin}>
        {error && (
          <div className={styles.alert} role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16.5v.01" />
            </svg>
            <div>
              <strong>{error.title}</strong> {error.detail}
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
              aria-invalid={error ? true : undefined}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError();
              }}
            />
          </div>
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <label htmlFor="password">Contraseña</label>
            <a className={styles.forgot} href={FORGOT_URL} target="_blank" rel="noopener noreferrer">
              ¿La olvidaste?
            </a>
          </div>
          <div className={`${styles.control} ${styles.withToggle}`}>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              aria-invalid={error ? true : undefined}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
              }}
            />
            <button
              type="button"
              className={styles.toggle}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 3l18 18M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.8M6.2 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button className={styles.submit} type="submit" disabled={loading} aria-busy={loading}>
          {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          {loading ? (
            <svg className={styles.spin} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-6.2-8.56" />
            </svg>
          ) : (
            <svg className={styles.arrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          )}
        </button>
      </form>

      <p className={styles.aside}>
        ¿Aún no trabajas con FoxCode? <a href={SITE_URL}>Compártenos tu idea</a>
      </p>
    </section>
  );
}
