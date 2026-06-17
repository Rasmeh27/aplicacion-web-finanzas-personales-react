export interface AuthUser {
  id: string;
  email: string;
  fullName?: string | null;
  primaryCurrency?: string | null;
  monthlyIncomeEstimate?: number | null;
  monthlySavingTargetPct?: number | null;
}

export interface AuthResponse {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser;
}

export interface UserProfile extends AuthUser {
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number | string;
  currency: string;
  description?: string | null;
  date?: string;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  createdAt?: string;
}

export interface TransactionListResponse {
  items: Transaction[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface MonthlyIncomeTotalResponse {
  periodMonth: string;
  totalIncome: number;
  currency: string;
}

export interface MonthlyExpenseTotalResponse {
  periodMonth: string;
  totalExpense: number;
  currency: string;
}

export interface MonthlyBalanceResponse {
  periodMonth: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  currency: string;
}

export interface SavingsPercentageResponse {
  periodMonth: string;
  totalIncome: number;
  totalExpense: number;
  savedAmount: number;
  savingsPercentage: number | null;
  currency: string;
}

export interface FinancialHealthResponse {
  periodMonth: string;
  totalIncome: number;
  totalExpense: number;
  monthlyBalance: number;
  savingsPercentage: number | null;
  debtIncomeRatio: number | null;
  totalDebtRemaining: number;
  goalsProgressPercentage: number;
  financialHealthScore: number;
  status: 'excellent' | 'stable' | 'attention' | 'critical';
  recommendations: string[];
  currency: string;
}
