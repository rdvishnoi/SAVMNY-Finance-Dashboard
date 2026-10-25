export type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  note: string;
};

export type Budget = { id: string; category: string; monthlyLimit: number };
export type Holding = {
  id: string;
  name: string;
  type: string;
  quantity: number;
  investedAmount: number;
  currentValue: number;
};
export type Store = {
  transactions: Transaction[];
  budgets: Budget[];
  holdings: Holding[];
  openingCash: number;
};
export type RecordKind = 'transaction' | 'budget' | 'holding';
