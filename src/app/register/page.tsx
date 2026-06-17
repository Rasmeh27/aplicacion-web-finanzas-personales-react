'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { StatusMessage } from '@/components/status-message';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, loading, register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [primaryCurrency, setPrimaryCurrency] = useState('DOP');
  const [monthlyIncomeEstimate, setMonthlyIncomeEstimate] = useState('45000');
  const [monthlySavingTargetPct, setMonthlySavingTargetPct] = useState('20');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, loading, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);

    try {
      const signedIn = await register({
        fullName,
        email,
        password,
        primaryCurrency: primaryCurrency.toUpperCase(),
        monthlyIncomeEstimate: Number(monthlyIncomeEstimate),
        monthlySavingTargetPct: Number(monthlySavingTargetPct),
      });

      if (signedIn) {
        router.replace('/dashboard');
        return;
      }

      setInfo('Cuenta creada. Confirma tu correo e inicia sesion.');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo crear la cuenta. Intentalo de nuevo.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Configura tu perfil base para que MONI pueda calcular tus indicadores."
      footerText="Ya tienes cuenta?"
      footerHref="/login"
      footerLabel="Iniciar sesion"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <StatusMessage message={error} />
        <StatusMessage message={info} tone="info" />
        <FormField
          label="Nombre completo"
          name="fullName"
          value={fullName}
          placeholder="Usuario MONI"
          onChange={setFullName}
        />
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
          placeholder="Minimo 8 caracteres"
          onChange={setPassword}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            label="Moneda"
            name="currency"
            value={primaryCurrency}
            placeholder="DOP"
            onChange={setPrimaryCurrency}
          />
          <FormField
            label="Ingreso"
            name="income"
            type="number"
            value={monthlyIncomeEstimate}
            min={0}
            step={500}
            onChange={setMonthlyIncomeEstimate}
          />
          <FormField
            label="Ahorro %"
            name="saving"
            type="number"
            value={monthlySavingTargetPct}
            min={0}
            max={100}
            step={1}
            onChange={setMonthlySavingTargetPct}
          />
        </div>
        <button
          disabled={submitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#3f2bd8] px-4 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-[#2f20bf] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
        >
          <UserPlus size={18} />
          {submitting ? 'Creando...' : 'Crear cuenta'}
        </button>
      </form>
    </AuthShell>
  );
}
