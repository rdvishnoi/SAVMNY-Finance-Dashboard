import type { Budget, Holding, Store, Transaction } from '@/types/finance';

export const STORAGE_KEY = 'savmny-personal-finance-v1';
export const CATEGORIES = ['Home & bills', 'Food & dining', 'Travel', 'Shopping', 'Health', 'Lifestyle', 'Salary', 'Freelance', 'Other'];
export const HOLDING_TYPES = ['Mutual fund', 'Stocks', 'Gold', 'Fixed deposit', 'Other'];

export const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const monthKey = (date = new Date()) => dateKey(date).slice(0, 7);
export const todayKey = () => dateKey(new Date());
export const formatINR = (amount: number, compact = false) => {
  const abs = Math.abs(amount);
  if (compact && abs >= 100000) return `₹${(abs / 100000).toLocaleString('en-IN', { maximumFractionDigits: 1 })}L`;
  return `₹${abs.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};
export const formatDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};
export const makeId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;

const past = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return dateKey(date);
};
export function createSeed(): Store {
  return {
    openingCash: 184500,
    transactions: [
      { id: 't1', title: 'Salary from Aster Labs', amount: 148000, type: 'income', category: 'Salary', date: past(0), note: 'Monthly salary' },
      { id: 't2', title: 'BigBasket', amount: 1846, type: 'expense', category: 'Food & dining', date: past(0), note: 'Groceries' },
      { id: 't3', title: 'Rent payment', amount: 28500, type: 'expense', category: 'Home & bills', date: past(1), note: 'Monthly rent' },
      { id: 't4', title: 'Third Wave Coffee', amount: 540, type: 'expense', category: 'Food & dining', date: past(2), note: 'Coffee with a friend' },
      { id: 't5', title: 'Metro card recharge', amount: 1200, type: 'expense', category: 'Travel', date: past(3), note: '' },
      { id: 't6', title: 'Electricity bill', amount: 2360, type: 'expense', category: 'Home & bills', date: past(5), note: 'BESCOM' },
      { id: 't7', title: 'Weekend bookstore', amount: 1480, type: 'expense', category: 'Shopping', date: past(6), note: '' },
      { id: 't8', title: 'Consulting project', amount: 18000, type: 'income', category: 'Freelance', date: past(8), note: 'Design review' },
      { id: 't9', title: 'Health check-up', amount: 2200, type: 'expense', category: 'Health', date: past(10), note: '' },
      { id: 't10', title: 'Internet & mobile', amount: 1299, type: 'expense', category: 'Home & bills', date: past(12), note: '' },
      { id: 't11', title: 'Dinner at Oota', amount: 1860, type: 'expense', category: 'Food & dining', date: past(14), note: '' },
    ],
    budgets: [
      { id: 'b1', category: 'Home & bills', monthlyLimit: 38000 },
      { id: 'b2', category: 'Food & dining', monthlyLimit: 16000 },
      { id: 'b3', category: 'Travel', monthlyLimit: 12000 },
      { id: 'b4', category: 'Shopping', monthlyLimit: 10000 },
      { id: 'b5', category: 'Health', monthlyLimit: 8000 },
      { id: 'b6', category: 'Lifestyle', monthlyLimit: 9000 },
    ],
    holdings: [
      { id: 'h1', name: 'Parag Parikh Flexi Cap', type: 'Mutual fund', quantity: 112.4, investedAmount: 92000, currentValue: 103780 },
      { id: 'h2', name: 'Nifty 50 Index Fund', type: 'Mutual fund', quantity: 86.2, investedAmount: 68000, currentValue: 74650 },
      { id: 'h3', name: 'HDFC Bank', type: 'Stocks', quantity: 24, investedAmount: 38600, currentValue: 42360 },
      { id: 'h4', name: 'Sovereign Gold Bond', type: 'Gold', quantity: 10, investedAmount: 51000, currentValue: 57400 },
    ],
  };
}

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const validTxn = (v: unknown): v is Transaction => record(v) && typeof v.id === 'string' && typeof v.title === 'string'
  && typeof v.amount === 'number' && Number.isFinite(v.amount) && (v.type === 'income' || v.type === 'expense')
  && typeof v.category === 'string' && typeof v.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.date) && typeof v.note === 'string';
const validBudget = (v: unknown): v is Budget => record(v) && typeof v.id === 'string' && typeof v.category === 'string'
  && typeof v.monthlyLimit === 'number' && Number.isFinite(v.monthlyLimit) && v.monthlyLimit > 0;
const validHolding = (v: unknown): v is Holding => record(v) && typeof v.id === 'string' && typeof v.name === 'string'
  && typeof v.type === 'string' && typeof v.quantity === 'number' && Number.isFinite(v.quantity)
  && typeof v.investedAmount === 'number' && Number.isFinite(v.investedAmount)
  && typeof v.currentValue === 'number' && Number.isFinite(v.currentValue);
export const validStore = (v: unknown): v is Store => record(v) && typeof v.openingCash === 'number'
  && Number.isFinite(v.openingCash) && Array.isArray(v.transactions) && v.transactions.every(validTxn)
  && Array.isArray(v.budgets) && v.budgets.every(validBudget) && Array.isArray(v.holdings) && v.holdings.every(validHolding);
