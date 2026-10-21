import Link from 'next/link';
import styles from '../../auth.module.css';
export default function PasswordReadyPage() {
  return <section className={styles.card}><h2 className="text-2xl font-semibold">Tu contraseña está lista</h2><p className="mt-3 text-sm text-muted-foreground">Ya puedes iniciar sesión para consultar tus proyectos.</p><Link href="/login" className="mt-6 inline-flex min-h-11 items-center text-sm underline">Ir a iniciar sesión</Link></section>;
}
