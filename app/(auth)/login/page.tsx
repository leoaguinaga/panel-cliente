'use client';

import { useState } from 'react';
import { authClient } from '@/src/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await authClient.signIn.email({
      email,
      password,
    });

    if (authError) {
      setError(authError.message || 'Invalid credentials');
      setLoading(false);
    } else {
      // Refresh the router to trigger proxy checks.
      router.refresh();
      
      // Get user session to determine role-based redirect
      const { data: session } = await authClient.getSession();
      const userRole = (session?.user as { role?: string } | undefined)?.role;
      
      if (userRole === 'CLIENT') {
        router.push('/client/dashboard');
      } else {
        // ADMIN, WORKER, or any other role goes to internal
        router.push('/internal/dashboard');
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center mb-4">
        <h1 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-gray-900">
          Inicia sesión
        </h1>
        <p className="mt-1 text-sm text-gray-500">Accede al portal de tus proyectos</p>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-2">
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo"
          required
          className="h-10 bg-gray-50 rounded border border-gray-200 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" 
        />
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          required
          className="h-10 bg-gray-50 rounded border border-gray-200 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" 
        />
        <button 
          type="submit"
          disabled={loading}
          className="h-10 bg-black text-white font-medium rounded text-sm hover:bg-gray-800 transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}
