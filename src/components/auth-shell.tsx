import Link from 'next/link';
import { ArrowUpRight, WalletCards } from 'lucide-react';

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
    <main className="min-h-screen bg-[#eef2f7] px-4 py-6 text-[#101828] sm:px-6 lg:py-10">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white shadow-[0_24px_70px_rgba(16,24,40,0.12)] lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden bg-[#f7f5ff] p-10 lg:block">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#3f2bd8] text-white shadow-lg shadow-indigo-200">
              <WalletCards size={23} />
            </span>
            <div>
              <strong className="block text-xl font-bold text-[#2f20bf]">
                MONI
              </strong>
              <span className="text-xs text-[#667085]">
                Finanzas personales
              </span>
            </div>
          </div>

          <div className="mt-20 max-w-lg">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#3f2bd8]">
              Gestion financiera
            </p>
            <h1 className="mt-5 text-5xl font-bold leading-tight">
              Tu dinero claro desde el primer vistazo.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-[#667085]">
              Inicia sesion para revisar balance, movimientos y categorias con
              datos conectados a la API.
            </p>
          </div>

          <div className="mt-14 max-w-xl rounded-2xl border border-[#e7e3ff] bg-white p-5 shadow-[0_20px_50px_rgba(63,43,216,0.12)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#98a2b3]">Vista previa</p>
                <strong className="mt-2 block text-3xl font-bold">
                  RD$0.00
                </strong>
                <p className="mt-1 text-sm text-[#667085]">
                  Sin movimientos registrados
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ebe8ff] text-[#3f2bd8]">
                <ArrowUpRight size={20} />
              </span>
            </div>
            <div className="mt-7 grid h-24 grid-cols-7 items-end gap-3">
              {Array.from({ length: 7 }).map((_, index) => (
                <span
                  className="rounded-md bg-[#ebe8ff]"
                  key={index}
                  style={{ height: 10 }}
                />
              ))}
            </div>
          </div>
        </aside>

        <section className="flex min-h-full items-center justify-center bg-white px-5 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3f2bd8] text-white">
                <WalletCards size={22} />
              </span>
              <span className="text-xl font-bold text-[#2f20bf]">MONI</span>
            </div>

            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#3f2bd8]">
                Acceso seguro
              </p>
              <h1 className="mt-3 text-4xl font-bold">{title}</h1>
              <p className="mt-3 text-sm leading-6 text-[#667085]">
                {subtitle}
              </p>
            </div>

            <div className="rounded-2xl border border-[#e4e7ec] bg-white p-6 shadow-[0_14px_36px_rgba(16,24,40,0.08)]">
              {children}
            </div>

            <p className="mt-6 text-center text-sm text-[#667085]">
              {footerText}{' '}
              <Link className="font-bold text-[#2f20bf]" href={footerHref}>
                {footerLabel}
              </Link>
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
