'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  LogOut,
  PiggyBank,
  Scale,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type {
  FinancialHealthResponse,
  MonthlyBalanceResponse,
  MonthlyExpenseTotalResponse,
  MonthlyIncomeTotalResponse,
  SavingsPercentageResponse,
  TransactionListResponse,
  UserProfile,
} from '@/types/api';

interface DashboardData {
  profile: UserProfile | null;
  income: MonthlyIncomeTotalResponse | null;
  expense: MonthlyExpenseTotalResponse | null;
  balance: MonthlyBalanceResponse | null;
  savings: SavingsPercentageResponse | null;
  health: FinancialHealthResponse | null;
  transactions: TransactionListResponse | null;
}

const emptyData: DashboardData = {
  profile: null,
  income: null,
  expense: null,
  balance: null,
  savings: null,
  health: null,
  transactions: null,
};

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [data, setData] = useState<DashboardData>(emptyData);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const period = useMemo(() => {
    const date = new Date();
    return {
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let mounted = true;
    setFetching(true);
    setError(null);

    Promise.all([
      apiRequest<UserProfile>('/user/me'),
      apiRequest<MonthlyIncomeTotalResponse>(
        `/dashboard-reports/monthly-income-total?year=${period.year}&month=${period.month}`,
      ),
      apiRequest<MonthlyExpenseTotalResponse>(
        `/dashboard-reports/monthly-expense-total?year=${period.year}&month=${period.month}`,
      ),
      apiRequest<MonthlyBalanceResponse>(
        `/dashboard-reports/monthly-balance?year=${period.year}&month=${period.month}`,
      ),
      apiRequest<SavingsPercentageResponse>(
        `/dashboard-reports/savings-percentage?year=${period.year}&month=${period.month}`,
      ),
      apiRequest<FinancialHealthResponse>(
        `/dashboard-reports/financial-health?year=${period.year}&month=${period.month}`,
      ),
      apiRequest<TransactionListResponse>('/transactions?limit=5&offset=0'),
    ])
      .then(
        ([
          profile,
          income,
          expense,
          balance,
          savings,
          health,
          transactions,
        ]) => {
          if (!mounted) return;
          setData({
            profile,
            income,
            expense,
            balance,
            savings,
            health,
            transactions,
          });
        },
      )
      .catch((err) => {
        if (!mounted) return;
        if (err instanceof ApiError && err.status === 401) {
          logout().finally(() => router.replace('/login'));
          return;
        }
        setError('No se pudieron cargar los datos del dashboard.');
      })
      .finally(() => {
        if (mounted) setFetching(false);
      });

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, logout, period.month, period.year, router]);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  if (loading || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f4]">
        <p className="text-sm text-slate-600">Validando sesion...</p>
      </main>
    );
  }

  const displayUser = data.profile ?? user;

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#10241f] text-emerald-300">
              <WalletCards size={22} />
            </span>
            <div>
              <p className="text-sm text-slate-500">SmartWallet</p>
              <h1 className="text-lg font-semibold">Dashboard financiero</h1>
            </div>
          </div>
          <button
            className="flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={handleLogout}
            type="button"
          >
            <LogOut size={17} />
            Salir
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              {monthName(period.month)} {period.year}
            </p>
            <h2 className="mt-1 text-3xl font-semibold">
              Hola, {displayUser?.fullName || displayUser?.email || 'usuario'}
            </h2>
          </div>
          <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Moneda principal:{' '}
            <strong className="text-slate-950">
              {displayUser?.primaryCurrency ?? 'DOP'}
            </strong>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<ArrowUpRight size={20} />}
            label="Ingresos"
            value={formatCurrency(data.income?.totalIncome)}
            detail="Total del mes"
          />
          <MetricCard
            icon={<ArrowDownLeft size={20} />}
            label="Gastos"
            value={formatCurrency(data.expense?.totalExpense)}
            detail="Total del mes"
          />
          <MetricCard
            icon={<Scale size={20} />}
            label="Balance"
            value={formatCurrency(data.balance?.balance)}
            detail="Ingresos menos gastos"
          />
          <MetricCard
            icon={<PiggyBank size={20} />}
            label="Ahorro"
            value={formatPercent(data.savings?.savingsPercentage)}
            detail={formatCurrency(data.savings?.savedAmount)}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Movimientos recientes</h3>
                <p className="text-sm text-slate-500">
                  Ultimos registros sincronizados con la API.
                </p>
              </div>
              <Activity className="text-emerald-700" size={22} />
            </div>

            {fetching ? (
              <p className="py-10 text-center text-sm text-slate-500">
                Cargando movimientos...
              </p>
            ) : data.transactions?.items.length ? (
              <div className="divide-y divide-slate-100">
                {data.transactions.items.map((transaction) => (
                  <div
                    className="grid grid-cols-[1fr_auto] gap-4 py-4"
                    key={transaction.id}
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {transaction.description || 'Movimiento sin descripcion'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {transaction.type === 'income' ? 'Ingreso' : 'Gasto'} -{' '}
                        {transaction.date ?? 'Sin fecha'}
                      </p>
                    </div>
                    <strong
                      className={
                        transaction.type === 'income'
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(Number(transaction.amount))}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-slate-300 py-10 text-center">
                <p className="text-sm font-medium text-slate-700">
                  Todavia no hay movimientos.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Registra ingresos y gastos desde Swagger o desde el proximo
                  modulo del frontend.
                </p>
              </div>
            )}
          </section>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Salud financiera</h3>
                <p className="text-sm text-slate-500">Resumen del mes actual</p>
              </div>
              <ShieldCheck className="text-emerald-700" size={24} />
            </div>

            <div className="mt-6">
              <div className="flex items-end gap-3">
                <strong className="text-5xl font-semibold">
                  {data.health?.financialHealthScore ?? 0}
                </strong>
                <span className="pb-2 text-sm font-medium uppercase text-slate-500">
                  {statusLabel(data.health?.status)}
                </span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{
                    width: `${Math.min(
                      data.health?.financialHealthScore ?? 0,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {(data.health?.recommendations ?? [
                'Carga datos financieros para obtener recomendaciones.',
              ]).map((recommendation) => (
                <p
                  className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700"
                  key={recommendation}
                >
                  {recommendation}
                </p>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <strong className="mt-2 block text-2xl font-semibold">{value}</strong>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </article>
  );
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(1)}%`;
}

function monthName(month: number) {
  return new Intl.DateTimeFormat('es', { month: 'long' }).format(
    new Date(2000, month - 1, 1),
  );
}

function statusLabel(status?: FinancialHealthResponse['status']) {
  const labels = {
    excellent: 'Excelente',
    stable: 'Estable',
    attention: 'Atencion',
    critical: 'Critica',
  };
  return labels[status ?? 'attention'];
}
