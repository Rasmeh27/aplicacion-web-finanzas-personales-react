'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { StatusMessage } from '@/components/status-message';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, loading, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login({ email, password });
      router.replace('/dashboard');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo iniciar sesion. Revisa tus datos.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Iniciar sesion"
      subtitle="Entra con tu correo y contrasena para revisar tu dashboard financiero."
      footerText="No tienes cuenta?"
      footerHref="/register"
      footerLabel="Crear cuenta"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <StatusMessage message={error} />
        <FormField
          label="Correo"
          name="email"
          type="email"
          value={email}
          placeholder="usuario@gmail.com"
          onChange={setEmail}
        />
        <FormField
          label="Contrasena"
          name="password"
          type="password"
          value={password}
          placeholder="Tu contrasena"
          onChange={setPassword}
        />
        <button
          disabled={submitting}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#10241f] px-4 text-sm font-semibold text-white transition hover:bg-[#18382f] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
        >
          <LogIn size={18} />
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </AuthShell>
  );
}
