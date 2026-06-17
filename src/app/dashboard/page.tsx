'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Check,
  CreditCard,
  LogOut,
  Plus,
  Tag,
  WalletCards,
  X,
} from 'lucide-react';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type {
  FinancialHealthResponse,
  MonthlyBalanceResponse,
  MonthlyExpenseTotalResponse,
  MonthlyIncomeTotalResponse,
  SavingsPercentageResponse,
  Transaction,
  TransactionListResponse,
  UserProfile,
} from '@/types/api';

type PeriodKey = 'today' | 'week' | 'month' | 'year';

interface DashboardData {
  profile: UserProfile | null;
  income: MonthlyIncomeTotalResponse | null;
  expense: MonthlyExpenseTotalResponse | null;
  balance: MonthlyBalanceResponse | null;
  savings: SavingsPercentageResponse | null;
  health: FinancialHealthResponse | null;
  transactions: TransactionListResponse | null;
}

interface ChartPoint {
  label: string;
  amount: number;
}

interface CategoryPoint {
  label: string;
  amount: number;
  percent: number;
}

interface TransactionFormState {
  detail: string;
  amount: string;
  date: string;
  type: 'income' | 'expense';
  description: string;
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

const periodOptions: Array<{ key: PeriodKey; label: string }> = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: 'year', label: 'Ano' },
];

const initialForm: TransactionFormState = {
  detail: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  type: 'expense',
  description: '',
};

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [data, setData] = useState<DashboardData>(emptyData);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('today');
  const [selectedBar, setSelectedBar] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [form, setForm] = useState<TransactionFormState>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentDate = useMemo(() => new Date(), []);
  const period = useMemo(
    () => ({
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    }),
    [currentDate],
  );

  const loadDashboard = useCallback(async () => {
    setFetching(true);
    setError(null);

    try {
      const [
        profile,
        income,
        expense,
        balance,
        savings,
        health,
        transactions,
      ] = await Promise.all([
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
        apiRequest<TransactionListResponse>('/transactions?limit=100&offset=0'),
      ]);

      setData({
        profile,
        income,
        expense,
        balance,
        savings,
        health,
        transactions,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await logout();
        router.replace('/login');
        return;
      }
      setError('No se pudieron cargar los datos del dashboard.');
    } finally {
      setFetching(false);
    }
  }, [logout, period.month, period.year, router]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadDashboard();
  }, [isAuthenticated, loadDashboard]);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  async function handleSaveTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      setFormError('El monto debe ser mayor a cero.');
      return;
    }

    setSaving(true);
    try {
      await apiRequest<Transaction>('/transactions', {
        method: 'POST',
        body: {
          type: form.type,
          amount,
          currency: 'DOP',
          description: form.description || form.detail || undefined,
          date: form.date,
        },
      });
      setShowAddModal(false);
      setShowSuccessModal(true);
      setForm(initialForm);
      await loadDashboard();
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo guardar el movimiento.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f1f4f8]">
        <p className="text-sm text-[#667085]">Validando sesion...</p>
      </main>
    );
  }

  const transactions = data.transactions?.items ?? [];
  const displayUser = data.profile ?? user;
  const chartData = buildChartData(transactions, selectedPeriod, currentDate);
  const categoryData = buildCategoryData(transactions, selectedPeriod, currentDate);
  const maxChartAmount = Math.max(...chartData.map((point) => point.amount), 0);
  const selectedPoint = chartData[selectedBar] ?? chartData[0];
  const hasMovements = transactions.length > 0;
  const topCategory = categoryData[0];

  return (
    <main className="min-h-screen bg-[#f1f4f8] text-[#101828]">
      <header className="border-b border-[#e4e7ec] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#3f2bd8] text-white shadow-lg shadow-indigo-200">
              <WalletCards size={23} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-[#2f20bf]">MONI</h1>
              <p className="text-xs text-[#667085]">
                Resumen de tus ingresos y gastos
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid h-11 grid-cols-4 rounded-xl bg-[#ebe8ff] p-1 text-xs font-semibold text-[#667085]">
              {periodOptions.map((option) => (
                <button
                  className={
                    selectedPeriod === option.key
                      ? 'rounded-lg bg-white px-5 text-[#2f20bf] shadow-sm'
                      : 'px-5 transition hover:text-[#2f20bf]'
                  }
                  key={option.key}
                  onClick={() => {
                    setSelectedPeriod(option.key);
                    setSelectedBar(0);
                  }}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#3f2bd8] px-5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-[#2f20bf]"
              onClick={() => setShowAddModal(true)}
              type="button"
            >
              <Plus size={16} />
              Agregar Registro
            </button>
            <button
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#d0d5dd] bg-white px-4 text-sm font-semibold text-[#667085] transition hover:bg-[#f8f7ff]"
              onClick={handleLogout}
              type="button"
            >
              <LogOut size={16} />
              Salir
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#667085]">
            {monthName(period.month)} {period.year}
          </p>
          <h2 className="mt-2 text-2xl font-bold">
            Hola, {displayUser?.fullName || displayUser?.email || 'usuario'}
          </h2>
        </div>

        {error ? (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-4">
          <BalanceCard value={formatCurrency(data.balance?.balance ?? 0)} />
          <MetricCard
            label="Ingresos"
            value={formatCurrency(data.income?.totalIncome ?? 0)}
            detail="Periodo actual"
            tone="positive"
          />
          <MetricCard
            label="Gastos Totales"
            value={formatCurrency(data.expense?.totalExpense ?? 0)}
            detail="Periodo actual"
            tone="negative"
          />
          <MetricCard
            label="Mayor Categoria"
            value={topCategory?.label ?? 'Sin datos'}
            detail={formatCurrency(topCategory?.amount ?? 0)}
            icon={<Tag size={24} />}
          />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_300px]">
          <section className="rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,0.08)]">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-bold">Gastos del Periodo</h3>
                <p className="text-sm text-[#667085]">
                  Toca una barra para ver el detalle.
                </p>
              </div>
              <strong className="text-sm text-[#2f20bf]">
                {selectedPoint
                  ? `${selectedPoint.label}: ${formatCurrency(selectedPoint.amount)}`
                  : formatCurrency(0)}
              </strong>
            </div>

            <div className="mt-6 grid min-h-[300px] grid-cols-[56px_1fr] gap-4">
              <div className="flex flex-col justify-between pb-10 text-xs text-[#667085]">
                {buildAxis(maxChartAmount).map((value) => (
                  <span key={value}>{formatCompactCurrency(value)}</span>
                ))}
              </div>
              <div className="relative">
                <div className="absolute inset-0 grid grid-rows-4">
                  {[1, 2, 3, 4].map((line) => (
                    <span className="border-t border-[#eef0f5]" key={line} />
                  ))}
                </div>
                <div className="relative z-10 grid h-full grid-cols-7 items-end gap-4 pb-10">
                  {chartData.map((point, index) => {
                    const height =
                      maxChartAmount > 0
                        ? Math.max((point.amount / maxChartAmount) * 88, 7)
                        : 7;
                    const active = selectedBar === index;

                    return (
                      <button
                        className="group flex h-full flex-col items-center justify-end gap-3"
                        key={`${point.label}-${index}`}
                        onClick={() => setSelectedBar(index)}
                        title={`${point.label}: ${formatCurrency(point.amount)}`}
                        type="button"
                      >
                        <span
                          className={
                            active
                              ? 'w-full max-w-[54px] rounded-lg bg-[#3f2bd8] shadow-lg shadow-indigo-200 transition'
                              : 'w-full max-w-[54px] rounded-lg bg-[#d8d3f8] transition group-hover:bg-[#bdb6f4]'
                          }
                          style={{ height }}
                        />
                        <span
                          className={
                            active
                              ? 'text-xs font-bold text-[#2f20bf]'
                              : 'text-xs text-[#475467]'
                          }
                        >
                          {point.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {!hasMovements ? (
              <EmptyState text="No hay gastos registrados para graficar." />
            ) : null}
          </section>

          <aside className="rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,0.08)]">
            <h3 className="text-lg font-bold">Gastos por Categoria</h3>
            <div className="mt-5 space-y-5">
              {categoryData.length ? (
                categoryData.map((category) => (
                  <div key={category.label}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-semibold text-[#344054]">
                        {category.label}
                      </span>
                      <span className="font-bold text-[#3f2bd8]">
                        {category.percent}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#edf0f5]">
                      <div
                        className="h-2 rounded-full bg-[#3f2bd8]"
                        style={{ width: `${category.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="Sin categorias aun." compact />
              )}
            </div>
            <button
              className="mt-6 w-full text-center text-sm font-bold text-[#2f20bf]"
              type="button"
            >
              Ver Reporte Completo
            </button>
          </aside>
        </div>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,0.08)]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Movimientos Recientes</h3>
            {fetching ? (
              <span className="text-xs font-semibold text-[#667085]">
                Sincronizando...
              </span>
            ) : null}
          </div>

          {transactions.length ? (
            <>
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-[860px] w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-[#fbfaff] text-xs font-bold uppercase text-[#101828]">
                      <th className="rounded-l-xl px-4 py-4">
                        Comercio / Detalle
                      </th>
                      <th className="px-4 py-4">Categoria</th>
                      <th className="px-4 py-4">Fecha</th>
                      <th className="px-4 py-4">Metodo</th>
                      <th className="px-4 py-4">Monto</th>
                      <th className="rounded-r-xl px-4 py-4">
                        Tipo Movimiento
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 6).map((transaction) => (
                      <tr
                        className="border-b border-[#e4e7ec]"
                        key={transaction.id}
                      >
                        <td className="px-4 py-4 text-[#344054]">
                          {transaction.description || 'Movimiento sin detalle'}
                        </td>
                        <td className="px-4 py-4">
                          <Badge label={categoryName(transaction)} />
                        </td>
                        <td className="px-4 py-4 text-[#344054]">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-4 py-4">
                          <MethodBadge label="API" />
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#344054]">
                          {formatCurrency(Number(transaction.amount))}
                        </td>
                        <td className="px-4 py-4">
                          <MovementBadge type={transaction.type} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-5 flex items-center justify-between text-xs text-[#98a2b3]">
                <span>
                  Mostrando {Math.min(transactions.length, 6)} de{' '}
                  {data.transactions?.total ?? transactions.length} movimientos
                </span>
                <button className="font-bold text-[#2f20bf]" type="button">
                  Mostrar mas
                </button>
              </div>
            </>
          ) : (
            <EmptyState text="Todavia no hay movimientos. Agrega el primero para llenar la tabla y la grafica." />
          )}
        </section>
      </section>

      {showAddModal ? (
        <AddTransactionModal
          form={form}
          formError={formError}
          saving={saving}
          onCancel={() => setShowAddModal(false)}
          onChange={setForm}
          onSubmit={handleSaveTransaction}
        />
      ) : null}

      {showSuccessModal ? (
        <SuccessModal onClose={() => setShowSuccessModal(false)} />
      ) : null}
    </main>
  );
}

function BalanceCard({ value }: { value: string }) {
  return (
    <article className="rounded-2xl bg-[#3f2bd8] p-6 text-white shadow-[0_18px_34px_rgba(63,43,216,0.28)]">
      <p className="text-sm font-medium text-white/80">Balance disponible</p>
      <strong className="mt-3 block text-4xl font-bold tracking-tight">
        {value}
      </strong>
    </article>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'positive' | 'negative';
  icon?: React.ReactNode;
}) {
  const toneClass = tone === 'positive' ? 'text-[#00875a]' : 'text-[#f04438]';

  return (
    <article className="rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#98a2b3]">{label}</p>
          <strong className="mt-3 block text-2xl font-bold">{value}</strong>
          <p className={`mt-2 text-xs ${tone ? toneClass : 'text-[#3f2bd8]'}`}>
            {detail}
          </p>
        </div>
        <span className={tone ? toneClass : 'text-[#3f2bd8]'}>
          {icon ?? (tone === 'positive' ? <ArrowUpRight /> : <ArrowDownRight />)}
        </span>
      </div>
    </article>
  );
}

function AddTransactionModal({
  form,
  formError,
  saving,
  onCancel,
  onChange,
  onSubmit,
}: {
  form: TransactionFormState;
  formError: string | null;
  saving: boolean;
  onCancel: () => void;
  onChange: (state: TransactionFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#111827]/60 px-4 backdrop-blur-sm">
      <form
        className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between border-b border-[#e4e7ec] px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-[#2f20bf]">Agregar Registro</h2>
            <p className="mt-1 text-sm text-[#667085]">
              Este formulario guarda movimientos reales en la API.
            </p>
          </div>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#101828] hover:bg-[#f2f4f7]"
            onClick={onCancel}
            type="button"
          >
            <X size={22} />
          </button>
        </div>

        <div className="grid gap-5 px-6 py-6 sm:grid-cols-2">
          {formError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
              {formError}
            </div>
          ) : null}
          <ModalField
            label="Comercio/Detalle"
            onChange={(value) => onChange({ ...form, detail: value })}
            placeholder="Ej: Zara Agora Mall"
            value={form.detail}
          />
          <ModalField
            icon={<Calendar size={18} />}
            label="Fecha de la Transaccion"
            onChange={(value) => onChange({ ...form, date: value })}
            type="date"
            value={form.date}
          />
          <ModalField
            label="Monto"
            onChange={(value) => onChange({ ...form, amount: value })}
            placeholder="RD$0.00"
            type="number"
            value={form.amount}
          />
          <label className="block">
            <span className="text-sm font-bold text-[#101828]">
              Tipo de Movimiento
            </span>
            <select
              className="mt-2 h-11 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm outline-none focus:border-[#3f2bd8] focus:ring-4 focus:ring-[#ebe8ff]"
              onChange={(event) =>
                onChange({
                  ...form,
                  type: event.target.value as TransactionFormState['type'],
                })
              }
              value={form.type}
            >
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-bold text-[#101828]">
              Descripcion (Opcional)
            </span>
            <textarea
              className="mt-2 h-28 w-full resize-none rounded-lg border border-[#d0d5dd] bg-white px-4 py-3 text-sm outline-none focus:border-[#3f2bd8] focus:ring-4 focus:ring-[#ebe8ff]"
              onChange={(event) =>
                onChange({ ...form, description: event.target.value })
              }
              placeholder="Agrega una nota opcional..."
              value={form.description}
            />
          </label>
        </div>

        <div className="flex justify-end gap-5 px-6 pb-6">
          <button
            className="h-11 rounded-lg px-5 text-sm font-bold text-[#2f20bf]"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="h-11 rounded-lg bg-[#3f2bd8] px-8 text-sm font-bold text-white shadow-lg shadow-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/60 px-4 backdrop-blur-sm">
      <section className="w-full max-w-md rounded-2xl bg-[#eef2ff] px-8 py-9 text-center shadow-2xl">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#3f2bd8] text-white">
          <Check size={28} />
        </span>
        <h2 className="mt-7 text-2xl font-bold text-[#2f20bf]">
          Registro agregado con exito
        </h2>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-[#667085]">
          El movimiento se guardo y el dashboard se actualizo con datos reales.
        </p>
        <button
          className="mt-7 h-11 rounded-lg bg-[#3f2bd8] px-10 text-sm font-bold text-white shadow-lg shadow-indigo-200"
          onClick={onClose}
          type="button"
        >
          Entendido
        </button>
      </section>
    </div>
  );
}

function ModalField({
  label,
  value,
  placeholder,
  type = 'text',
  icon,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-[#101828]">{label}</span>
      <div className="mt-2 flex h-11 items-center rounded-lg border border-[#d0d5dd] bg-white px-3 shadow-sm focus-within:border-[#3f2bd8] focus-within:ring-4 focus-within:ring-[#ebe8ff]">
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#98a2b3]"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={type !== 'text' || label === 'Comercio/Detalle'}
          step={type === 'number' ? '0.01' : undefined}
          type={type}
          value={value}
        />
        {icon ? <span className="text-[#667085]">{icon}</span> : null}
      </div>
    </label>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#d8d3f8] bg-[#f4f2ff] px-3 py-1 text-xs font-semibold text-[#3f2bd8]">
      <Tag size={13} />
      {label}
    </span>
  );
}

function MethodBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#b7ddff] bg-[#eff8ff] px-3 py-1 text-xs font-semibold text-[#175cd3]">
      <CreditCard size={13} />
      {label}
    </span>
  );
}

function MovementBadge({ type }: { type: Transaction['type'] }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold text-white ${
        type === 'income' ? 'bg-[#00875a]' : 'bg-[#f9703e]'
      }`}
    >
      {type === 'income' ? 'Ingreso' : 'Gasto'}
    </span>
  );
}

function EmptyState({
  text,
  compact = false,
}: {
  text: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-dashed border-[#d0d5dd] bg-[#fbfcff] text-center text-sm text-[#667085] ${
        compact ? 'px-3 py-6' : 'mt-5 px-4 py-8'
      }`}
    >
      {text}
    </div>
  );
}

function buildChartData(
  transactions: Transaction[],
  period: PeriodKey,
  now: Date,
): ChartPoint[] {
  const labels =
    period === 'year'
      ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul']
      : ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
  const points = labels.map((label) => ({ label, amount: 0 }));

  transactions
    .filter((transaction) => transaction.type === 'expense')
    .forEach((transaction) => {
      const date = transactionDate(transaction);
      const index = chartIndex(date, period, now);
      if (index >= 0 && index < points.length) {
        points[index].amount += Number(transaction.amount);
      }
    });

  return points;
}

function buildCategoryData(
  transactions: Transaction[],
  period: PeriodKey,
  now: Date,
): CategoryPoint[] {
  const totals = new Map<string, number>();

  transactions
    .filter((transaction) => transaction.type === 'expense')
    .filter((transaction) => chartIndex(transactionDate(transaction), period, now) >= 0)
    .forEach((transaction) => {
      const name = categoryName(transaction);
      totals.set(name, (totals.get(name) ?? 0) + Number(transaction.amount));
    });

  const total = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
  if (!total) return [];

  return Array.from(totals.entries())
    .map(([label, amount]) => ({
      label,
      amount,
      percent: Math.round((amount / total) * 100),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);
}

function chartIndex(date: Date, period: PeriodKey, now: Date) {
  if (period === 'year') {
    return date.getFullYear() === now.getFullYear() ? date.getMonth() : -1;
  }

  const start = startOfWeek(now);
  const diff = Math.floor(
    (startOfDay(date).getTime() - start.getTime()) / 86_400_000,
  );

  if (period === 'today') {
    return isSameDay(date, now) ? now.getDay() === 0 ? 6 : now.getDay() - 1 : -1;
  }

  if (period === 'week') return diff;

  if (period === 'month') {
    return date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
      ? Math.min(Math.floor((date.getDate() - 1) / 5), 6)
      : -1;
  }

  return -1;
}

function buildAxis(maxValue: number) {
  if (!maxValue) return [40000, 30000, 20000, 10000, 0];
  const top = Math.ceil(maxValue / 1000) * 1000;
  return [top, top * 0.75, top * 0.5, top * 0.25, 0];
}

function transactionDate(transaction: Transaction) {
  return new Date(transaction.date ?? transaction.createdAt ?? Date.now());
}

function categoryName(transaction: Transaction) {
  return transaction.category?.name || 'Sin categoria';
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const day = date.getDay() === 0 ? 6 : date.getDay() - 1;
  const start = startOfDay(date);
  start.setDate(start.getDate() - day);
  return start;
}

function isSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

function formatCompactCurrency(value: number) {
  if (!value) return 'RD$0';
  return `RD$${Math.round(value / 1000)}k`;
}

function formatDate(value?: string) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function monthName(month: number) {
  return new Intl.DateTimeFormat('es', { month: 'long' }).format(
    new Date(2000, month - 1, 1),
  );
}
