import Link from 'next/link';
import { WalletCards } from 'lucide-react';

interface AuthShellProps {
  title: string;
  subtitle: string;
  footerText: string;
  footerHref: string;
  footerLabel: string;
  children: React.ReactNode;
}

export function AuthShell({
  title,
  subtitle,
  footerText,
  footerHref,
  footerLabel,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#f5f7f4] text-slate-950">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 lg:grid-cols-[1fr_460px]">
        <div className="hidden flex-col justify-between bg-[#10241f] p-10 text-white lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-400 text-[#10241f]">
                <WalletCards size={24} />
              </span>
              <span className="text-xl font-semibold">SmartWallet</span>
            </div>
            <div className="mt-24 max-w-md">
              <p className="text-sm uppercase tracking-[0.22em] text-emerald-300">
                Finanzas personales
              </p>
              <h1 className="mt-5 text-5xl font-semibold leading-tight">
                Control claro para decisiones con calma.
              </h1>
              <p className="mt-5 text-base leading-7 text-slate-200">
                Registra ingresos, revisa gastos y mira tu salud financiera desde
                un tablero conectado al backend real.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm text-slate-200">
            <div className="rounded-md border border-white/10 bg-white/5 p-4">
              <strong className="block text-lg text-white">JWT</strong>
              Sesion segura
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 p-4">
              <strong className="block text-lg text-white">26</strong>
              Casos API
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 p-4">
              <strong className="block text-lg text-white">DOP</strong>
              Moneda base
            </div>
          </div>
        </div>

        <div className="flex min-h-screen items-center justify-center px-5 py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#10241f] text-emerald-300">
                <WalletCards size={22} />
              </span>
              <span className="text-xl font-semibold">SmartWallet</span>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-7">
                <h1 className="text-2xl font-semibold">{title}</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
              </div>
              {children}
            </div>

            <p className="mt-5 text-center text-sm text-slate-600">
              {footerText}{' '}
              <Link className="font-semibold text-emerald-700" href={footerHref}>
                {footerLabel}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
