export interface Client {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  billingType: "retainer" | "fixed";
  status: "proposal" | "active" | "delivered" | "invoiced" | "completed" | "paused";
  amount: number;
  currency?: string;
  dueDate: string | null;
  createdAt: number;
  completedAt: number | null;
}

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "in-progress" | "done";
  deadline: string | null;
  reportedBy: "client" | "self";
  createdAt: number;
}

export interface Invoice {
  id: string;
  /** @deprecated Use projectIds instead */
  projectId?: string;
  projectIds: string[];
  amount: number;
  estimatedFees: number;
  feesCurrency?: string;
  currency?: string;
  status: "draft" | "sent" | "paid" | "overdue";
  issuedDate: string;
  dueDate: string;
  paidDate: string | null;
  items: InvoiceItem[];
  createdAt: number;
}

export interface InvoiceItem {
  description: string;
  amount: number;
  currency?: string;
}

export interface Expense {
  id: string;
  amount: number;
  currency?: string;
  name: string;
  categoryId: string;
  date: string;
  subscriptionId: string | null;
  createdAt: number;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency?: string;
  categoryId: string;
  cycle: "monthly" | "yearly";
  nextDate: string;
  active: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
}

export interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  currency?: string;
  monthlyContribution: number;
  isEmergency: boolean;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  category: "system" | "finance" | "health" | "growth" | "work";
  active: boolean;
  createdAt: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  duration: number;
  type: "meeting" | "focus" | "personal";
  clientId: string | null;
  projectId: string | null;
  googleEventId: string | null;
  createdAt: number;
}

export interface CurrencyWallet {
  currency: string;
  label: string;
}

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  lastFetched: number;
}
