import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import {
  ArrowDownLeft, ArrowDownRight, ArrowRight, BadgeIndianRupee,
  BriefcaseBusiness, CalendarDays, Check, ChevronDown, CircleHelp, Download,
  Eye, EyeOff, FileText, Home, Landmark, Menu, Pencil, Plus, Search, Trash2,
  TrendingUp, Wallet, X,
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';

type Txn = { id: string; title: string; amount: number; type: 'income' | 'expense'; category: string; date: string; note: string };
type Budget = { id: string; category: string; monthlyLimit: number };
type Holding = { id: string; name: string; type: string; quantity: number; investedAmount: number; currentValue: number };
type Store = { transactions: Txn[]; budgets: Budget[]; holdings: Holding[]; openingCash: number };
type Kind = 'transaction' | 'budget' | 'holding';
type Notice = { text: string; kind?: 'success' | 'error' } | null;

const STORAGE_KEY = 'savmny-personal-finance-v1';
const palette = ['#3a6b5a', '#9fbb6e', '#e7ad82', '#c3a8c4', '#d9d5c8', '#7295a4', '#c68473'];
const categories = ['Home & bills', 'Food & dining', 'Travel', 'Shopping', 'Health', 'Lifestyle', 'Salary', 'Freelance', 'Other'];
const fmt = (n: number, compact = false) => compact && Math.abs(n) >= 100000
  ? `₹${(Math.abs(n) / 100000).toLocaleString('en-IN', { maximumFractionDigits: 1 })}L`
  : `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const localMonthKey = (date = new Date()) => localDateKey(date).slice(0, 7);
const todayIso = () => localDateKey(new Date());
const ago = (days: number) => { const d = new Date(); d.setDate(d.getDate() - days); return localDateKey(d); };
const id = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function seed(): Store {
  return {
    openingCash: 184500,
    transactions: [
      { id: 't1', title: 'Salary from Aster Labs', amount: 148000, type: 'income', category: 'Salary', date: ago(0), note: 'Monthly salary' },
      { id: 't2', title: 'BigBasket', amount: 1846, type: 'expense', category: 'Food & dining', date: ago(0), note: 'Groceries' },
      { id: 't3', title: 'Rent payment', amount: 28500, type: 'expense', category: 'Home & bills', date: ago(1), note: 'Monthly rent' },
      { id: 't4', title: 'Third Wave Coffee', amount: 540, type: 'expense', category: 'Food & dining', date: ago(2), note: 'Coffee with a friend' },
      { id: 't5', title: 'Metro card recharge', amount: 1200, type: 'expense', category: 'Travel', date: ago(3), note: '' },
      { id: 't6', title: 'Electricity bill', amount: 2360, type: 'expense', category: 'Home & bills', date: ago(5), note: 'BESCOM' },
      { id: 't7', title: 'Weekend bookstore', amount: 1480, type: 'expense', category: 'Shopping', date: ago(6), note: '' },
      { id: 't8', title: 'Consulting project', amount: 18000, type: 'income', category: 'Freelance', date: ago(8), note: 'Design review' },
      { id: 't9', title: 'Health check-up', amount: 2200, type: 'expense', category: 'Health', date: ago(10), note: '' },
      { id: 't10', title: 'Internet & mobile', amount: 1299, type: 'expense', category: 'Home & bills', date: ago(12), note: '' },
      { id: 't11', title: 'Dinner at Oota', amount: 1860, type: 'expense', category: 'Food & dining', date: ago(14), note: '' },
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

type StoreRead = { store: Store; issue?: string; unreadableValue?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTxn(value: unknown): value is Txn {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' && typeof value.title === 'string'
    && typeof value.amount === 'number' && Number.isFinite(value.amount)
    && (value.type === 'income' || value.type === 'expense')
    && typeof value.category === 'string' && typeof value.date === 'string'
    && typeof value.note === 'string';
}

function isBudget(value: unknown): value is Budget {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' && typeof value.category === 'string'
    && typeof value.monthlyLimit === 'number' && Number.isFinite(value.monthlyLimit);
}

function isHolding(value: unknown): value is Holding {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' && typeof value.name === 'string'
    && typeof value.type === 'string' && typeof value.quantity === 'number'
    && Number.isFinite(value.quantity) && typeof value.investedAmount === 'number'
    && Number.isFinite(value.investedAmount) && typeof value.currentValue === 'number'
    && Number.isFinite(value.currentValue);
}

function isStore(value: unknown): value is Store {
  return isRecord(value) && typeof value.openingCash === 'number'
    && Number.isFinite(value.openingCash) && Array.isArray(value.transactions)
    && value.transactions.every(isTxn) && Array.isArray(value.budgets)
    && value.budgets.every(isBudget) && Array.isArray(value.holdings)
    && value.holdings.every(isHolding);
}

function readStore(): StoreRead {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return { store: seed(), issue: 'Browser storage is unavailable. Changes are not being saved, and existing data will not be overwritten.' };
  }
  if (raw === null) return { store: seed() };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isStore(parsed)) return { store: parsed };
  } catch { /* Keep the original value available for recovery below. */ }
  return {
    store: seed(),
    issue: 'SAVMNY could not read saved data. Saving is paused so the original browser data is not overwritten.',
    unreadableValue: raw,
  };
}

function App() {
  const [initial] = useState(readStore);
  const [store, setStore] = useState<Store>(initial.store);
  const [storageIssue, setStorageIssue] = useState<string | null>(initial.issue ?? null);
  const [storagePaused, setStoragePaused] = useState(Boolean(initial.issue));
  const [unreadableValue, setUnreadableValue] = useState(initial.unreadableValue);
  const [path, setLocation] = useLocation();
  const [modal, setModal] = useState<{ kind: Kind; record?: Txn | Budget | Holding } | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [hideMoney, setHideMoney] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    if (storagePaused) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      setStorageIssue('SAVMNY could not save to this browser. Your current changes may be lost when you leave this page.');
      setStoragePaused(true);
    }
  }, [store, storagePaused]);
  useEffect(() => {
    document.title = 'SAVMNY — your money, in perspective';
    const desc = document.querySelector('meta[name="description"]');
    desc?.setAttribute('content', 'A calm, personal view of your everyday money, monthly budgets and investment holdings.');
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  const transactions = store.transactions;
  const budgets = store.budgets;
  const holdings = store.holdings;
  const currentMonth = localMonthKey();
  const monthTransactions = useMemo(() => transactions.filter(t => t.date.slice(0, 7) === currentMonth), [transactions, currentMonth]);
  const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const cash = store.openingCash + transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
  const portfolioValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const invested = holdings.reduce((sum, h) => sum + h.investedAmount, 0);
  const gain = portfolioValue - invested;
  const monthSpent = (category: string) => monthTransactions.filter(t => t.type === 'expense' && t.category === category).reduce((sum, t) => sum + t.amount, 0);

  const saveRecord = (kind: Kind, record: Txn | Budget | Holding) => {
    setStore(prev => {
      if (kind === 'transaction') {
        const item = record as Txn;
        const exists = prev.transactions.some(t => t.id === item.id);
        return { ...prev, transactions: exists ? prev.transactions.map(t => t.id === item.id ? item : t) : [item, ...prev.transactions] };
      }
      if (kind === 'budget') {
        const item = record as Budget;
        const exists = prev.budgets.some(t => t.id === item.id);
        return { ...prev, budgets: exists ? prev.budgets.map(t => t.id === item.id ? item : t) : [...prev.budgets, item] };
      }
      const item = record as Holding;
      const exists = prev.holdings.some(t => t.id === item.id);
      return { ...prev, holdings: exists ? prev.holdings.map(t => t.id === item.id ? item : t) : [...prev.holdings, item] };
    });
    setModal(null);
    setNotice({ text: 'Saved to your SAVMNY workspace.' });
  };
  const removeRecord = (kind: Kind, recordId: string) => {
    const noun = kind === 'transaction' ? 'transaction' : kind === 'budget' ? 'budget' : 'holding';
    if (!window.confirm(`Delete this ${noun}? This cannot be undone.`)) return;
    setStore(prev => kind === 'transaction'
      ? { ...prev, transactions: prev.transactions.filter(item => item.id !== recordId) }
      : kind === 'budget'
        ? { ...prev, budgets: prev.budgets.filter(item => item.id !== recordId) }
        : { ...prev, holdings: prev.holdings.filter(item => item.id !== recordId) });
    setNotice({ text: `${noun[0].toUpperCase()}${noun.slice(1)} deleted.` });
  };
  const exportCsv = () => {
    const rows = [['Title', 'Amount (INR)', 'Type', 'Category', 'Date', 'Note'], ...transactions.map(t => [t.title, String(t.amount), t.type, t.category, t.date, t.note])];
    const csv = rows.map(row => row.map(cell => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const downloadUrl = URL.createObjectURL(blob);
    link.href = downloadUrl;
    link.download = `savmny-transactions-${todayIso()}.csv`;
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    setNotice({ text: 'Your transactions CSV is ready.' });
  };
  const downloadUnreadableData = () => {
    if (unreadableValue === undefined) return;
    const url = URL.createObjectURL(new Blob([unreadableValue], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `savmny-recovery-copy-${todayIso()}.json`;
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const startFreshWorkspace = () => {
    if (!window.confirm('This replaces the unreadable SAVMNY data saved in this browser. Download a recovery copy first if you may need the original. Continue?')) return;
    const fresh = seed();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      setStore(fresh);
      setUnreadableValue(undefined);
      setStorageIssue(null);
      setStoragePaused(false);
      setNotice({ text: 'A fresh SAVMNY workspace is ready.' });
    } catch {
      setStorageIssue('Browser storage is still unavailable. The unreadable data has not been replaced.');
      setStoragePaused(true);
    }
  };
  const nav = [
    { label: 'Overview', href: '/', icon: Home },
    { label: 'Transactions', href: '/transactions', icon: ArrowDownLeft },
    { label: 'Budgets', href: '/budgets', icon: BadgeIndianRupee },
    { label: 'Investments', href: '/investments', icon: BriefcaseBusiness },
  ];
  const active = nav.find(item => item.href === path)?.label ?? 'Overview';

  return (
    <div className="savmny-app">
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <Link href="/" className="brand" onClick={() => setMobileMenu(false)}>
          <span className="brand-mark" aria-hidden="true" /><span className="brand-word">SAV<span>MNY</span></span>
        </Link>
        <div className="workspace-label">Your money</div>
        <nav className="nav-list" aria-label="Main navigation">
          {nav.map(({ label, href, icon: Icon }) => (
            <Link href={href} className={`nav-link ${active === label ? 'active' : ''}`} key={href} onClick={() => setMobileMenu(false)}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
              {label === 'Investments' && <span className="nav-count">{holdings.length}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="side-help"><div className="help-title"><CircleHelp size={15} /> A note on SAVMNY</div><p>Your numbers are yours. Everything stays in this browser.</p></div>
          <div className="profile"><div className="avatar">S</div><div><div className="profile-name">My workspace</div><div className="profile-plan">Personal finance</div></div></div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Toggle navigation" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={18} /></button>
          <div className="breadcrumb"><span>Your money</span><span className="crumb-slash">/</span><strong>{active}</strong></div>
          <div className="top-actions">
            <div className={`local-badge ${storageIssue ? 'storage-problem' : ''}`}><span className="local-dot" /> {storageIssue ? 'Saving paused' : 'Saved on this device'}</div>
            <button className="icon-button privacy-button" onClick={() => setHideMoney(v => !v)} title={hideMoney ? 'Show amounts' : 'Hide amounts'} aria-label={hideMoney ? 'Show amounts' : 'Hide amounts'}>{hideMoney ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </div>
        </header>
        <div className="page-content">
          {storageIssue && <div className="storage-warning" role="alert">
            <div><strong>Local data needs attention</strong><p>{storageIssue}</p></div>
            {unreadableValue !== undefined && <div className="storage-warning-actions">
              <button onClick={downloadUnreadableData}><Download size={14} /> Download recovery copy</button>
              <button onClick={startFreshWorkspace}>Start with sample data</button>
            </div>}
          </div>}
          <Switch>
            <Route path="/transactions">
              <TransactionsPage data={transactions} onAdd={() => setModal({ kind: 'transaction' })} onEdit={(item) => setModal({ kind: 'transaction', record: item })} onDelete={(item) => removeRecord('transaction', item.id)} onExport={exportCsv} hideMoney={hideMoney} />
            </Route>
            <Route path="/budgets">
              <BudgetsPage budgets={budgets} spent={monthSpent} onAdd={() => setModal({ kind: 'budget' })} onEdit={(item) => setModal({ kind: 'budget', record: item })} onDelete={(item) => removeRecord('budget', item.id)} hideMoney={hideMoney} />
            </Route>
            <Route path="/investments">
              <InvestmentsPage holdings={holdings} total={portfolioValue} invested={invested} gain={gain} onAdd={() => setModal({ kind: 'holding' })} onEdit={(item) => setModal({ kind: 'holding', record: item })} onDelete={(item) => removeRecord('holding', item.id)} hideMoney={hideMoney} />
            </Route>
            <Route path="/">
              <OverviewPage transactions={transactions} budgets={budgets} holdings={holdings} monthIncome={monthIncome} monthExpense={monthExpense} cash={cash} portfolioValue={portfolioValue} invested={invested} gain={gain} spent={monthSpent} hideMoney={hideMoney} onAdd={() => setModal({ kind: 'transaction' })} onTransactions={() => setLocation('/transactions')} />
            </Route>
            <Route><NotFound /></Route>
          </Switch>
        </div>
      </main>
      {modal && <RecordModal modal={modal} budgets={budgets} onClose={() => setModal(null)} onSave={saveRecord} />}
      {notice && <div className={`toast ${notice.kind ?? ''}`} role="status"><Check size={15} />{notice.text}<button onClick={() => setNotice(null)} aria-label="Dismiss notification"><X size={14} /></button></div>}
      {mobileMenu && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileMenu(false)} />}
    </div>
  );
}

function PageHeading({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children?: ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p className="heading-sub">{subtitle}</p></div>{children && <div className="heading-actions">{children}</div>}</div>;
}

function Button({ children, onClick, variant = 'primary', className = '', type = 'button' }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'quiet' | 'danger'; className?: string; type?: 'button' | 'submit' }) {
  return <button type={type} className={`button ${variant} ${className}`} onClick={onClick}>{children}</button>;
}

function OverviewPage(props: {
  transactions: Txn[]; budgets: Budget[]; holdings: Holding[]; monthIncome: number; monthExpense: number; cash: number;
  portfolioValue: number; invested: number; gain: number; spent: (category: string) => number; hideMoney: boolean; onAdd: () => void; onTransactions: () => void;
}) {
  const { transactions, budgets, holdings, monthIncome, monthExpense, cash, portfolioValue, invested, gain, spent, hideMoney, onAdd, onTransactions } = props;
  const mask = (value: number) => hideMoney ? '₹ ••••••' : fmt(value, true);
  const budgetRows = budgets.slice(0, 4).map(b => ({ ...b, spent: spent(b.category) }));
  const categoryData = useMemo(() => {
    const sums = new Map<string, number>();
    transactions.filter(t => t.type === 'expense' && t.date.slice(0, 7) === localMonthKey()).forEach(t => sums.set(t.category, (sums.get(t.category) ?? 0) + t.amount));
    return [...sums.entries()].map(([name, amount]) => ({ name, amount }));
  }, [transactions]);
  const trendData = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(); date.setMonth(date.getMonth() - (5 - index));
      const month = localMonthKey(date);
      return { month: date.toLocaleDateString('en-IN', { month: 'short' }), income: transactions.filter(t => t.date.slice(0, 7) === month && t.type === 'income').reduce((s, t) => s + t.amount, 0), spending: transactions.filter(t => t.date.slice(0, 7) === month && t.type === 'expense').reduce((s, t) => s + t.amount, 0) };
    });
  }, [transactions]);
  const latest = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  return <>
    <PageHeading eyebrow="A little more clarity" title="Your money, in perspective." subtitle="A quiet look at what came in, what went out, and what’s growing.">
      <Button variant="secondary" onClick={onTransactions}><FileText size={15} /> All transactions</Button><Button onClick={onAdd}><Plus size={16} /> Add transaction</Button>
    </PageHeading>
    <section className="overview-grid">
      <div className="balance-card">
        <div className="balance-orbit orbit-one" /><div className="balance-orbit orbit-two" />
        <div className="balance-top"><div><div className="balance-label"><Wallet size={15} /> Cash & savings</div><div className="balance-total">{mask(cash)}</div><div className="balance-caption">Estimated from your saved transactions</div></div><span className="balance-chip"><span className="balance-dot" /> Personal view</span></div>
        <div className="balance-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData} margin={{ left: 0, right: 4, top: 10, bottom: 0 }}><defs><linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c7e36c" stopOpacity={0.25} /><stop offset="100%" stopColor="#c7e36c" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="rgba(255,255,255,.12)" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#a2b9a9', fontSize: 10 }} /><Tooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="income" stroke="#c7e36c" strokeWidth={2} fill="url(#cashFill)" name="Income" /><Area type="monotone" dataKey="spending" stroke="#e7ad82" strokeWidth={1.8} fill="transparent" name="Spending" /></AreaChart></ResponsiveContainer></div>
        <div className="balance-footer"><div><span>This month in</span><strong>{mask(monthIncome)}</strong></div><div className="footer-divider" /><div><span>This month out</span><strong>{mask(monthExpense)}</strong></div><div className="footer-note">Across your entries</div></div>
      </div>
      <div className="right-stack">
        <div className="card spend-card"><div className="card-head"><div><h2>This month’s spending</h2><p>Compared with your category budgets</p></div><span className="soft-icon"><ArrowDownRight size={17} /></span></div>
          <div className="spend-flex"><div className="donut-holder">{categoryData.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="amount" nameKey="name" innerRadius={29} outerRadius={41} paddingAngle={3} stroke="none">{categoryData.map((item, i) => <Cell key={item.name} fill={palette[i % palette.length]} />)}</Pie><Tooltip content={<ChartTooltip />} /></PieChart></ResponsiveContainer> : <div className="empty-donut" /> }<div className="donut-center"><strong>{mask(monthExpense)}</strong><span>spent</span></div></div>
            <div className="spend-info"><div className="spend-amount">{mask(monthExpense)}</div><div className="spend-trend"><span>{monthIncome > 0 ? `${Math.round(monthExpense / monthIncome * 100)}%` : '—'}</span> of income so far</div><Link href="/budgets" className="text-link">View budgets <ArrowRight size={12} /></Link></div>
          </div>
        </div>
        <div className="card investment-summary"><div className="card-head"><div><h2>Investments</h2><p>{holdings.length} holdings, maintained by you</p></div><span className="soft-icon"><TrendingUp size={17} /></span></div><div className="summary-value">{mask(portfolioValue)}</div><div className={`summary-gain ${gain >= 0 ? '' : 'negative'}`}><TrendingUp size={13} /> {hideMoney ? '••••' : `${gain >= 0 ? '+' : '−'}${fmt(gain)} (${invested ? `${((gain / invested) * 100).toFixed(1)}%` : '0%'})`} <span>overall change</span></div></div>
      </div>
    </section>
    <section className="lower-grid">
      <div className="card chart-card"><div className="section-head"><div><h2>Income & spending</h2><p>Your entries over the last six months</p></div><span className="chart-period"><CalendarDays size={13} /> 6 months</span></div>
        <div className="main-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData} margin={{ top: 10, right: 10, left: -14, bottom: 0 }}><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9fbb6e" stopOpacity={0.25} /><stop offset="100%" stopColor="#9fbb6e" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#edf0e9" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#98a29b', fontSize: 10 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#98a29b', fontSize: 9 }} tickFormatter={(v) => v ? `₹${Math.round(v / 1000)}k` : '₹0'} /><Tooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="income" stroke="#698d62" strokeWidth={2.4} fill="url(#incomeFill)" name="Income" /><Area type="monotone" dataKey="spending" stroke="#d49a79" strokeWidth={2} fill="transparent" name="Spending" /></AreaChart></ResponsiveContainer></div>
        <div className="legend"><span><i className="legend-income" /> Income</span><span><i className="legend-spend" /> Spending</span></div>
      </div>
      <div className="card budget-preview"><div className="section-head"><div><h2>Budget check-in</h2><p>A few categories for this month</p></div><Link href="/budgets" className="round-arrow" aria-label="View all budgets"><ArrowRight size={15} /></Link></div>
        {budgetRows.length ? <div className="budget-preview-list">{budgetRows.map((b, i) => <BudgetProgress key={b.id} category={b.category} spent={b.spent} limit={b.monthlyLimit} color={palette[i % palette.length]} hideMoney={hideMoney} compact />)}</div> : <EmptyMessage title="No budgets yet" text="Add a monthly limit to make a plan." />}
        <Link href="/budgets" className="budget-link">See all budgets <ArrowRight size={13} /></Link>
      </div>
    </section>
    <section className="card recent-card"><div className="section-head"><div><h2>Recent activity</h2><p>Your latest manually recorded transactions</p></div><Link href="/transactions" className="text-link">See all <ArrowRight size={13} /></Link></div>
      {latest.length ? <div className="activity-list">{latest.map(t => <TransactionRow key={t.id} txn={t} hideMoney={hideMoney} />)}</div> : <EmptyMessage title="A fresh start" text="Add your first transaction to see it here." />}</section>
    <p className="disclaimer">SAVMNY is a personal tracking tool. Numbers are entered by you and are not financial advice.</p>
  </>;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number | string; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><span className="tooltip-label">{label}</span>{payload.map((row, i) => <div key={`${row.name}-${i}`}><i style={{ background: row.color }} />{row.name}<strong>{fmt(Number(row.value ?? 0))}</strong></div>)}</div>;
}

function BudgetProgress({ category, spent, limit, color, hideMoney, compact = false }: { category: string; spent: number; limit: number; color: string; hideMoney: boolean; compact?: boolean }) {
  const pct = limit > 0 ? Math.min(100, spent / limit * 100) : 0;
  return <div className={`budget-progress ${compact ? 'compact' : ''}`}><div className="budget-progress-head"><span><i style={{ background: color }} />{category}</span><strong>{hideMoney ? '••••' : fmt(spent)} <small>of {hideMoney ? '••••' : fmt(limit)}</small></strong></div><div className="progress-track"><div className={`progress-fill ${pct >= 100 ? 'over' : ''}`} style={{ width: `${pct}%`, background: color }} /></div><div className="budget-progress-foot"><span>{pct >= 100 ? 'Limit reached' : `${Math.round(pct)}% used`}</span><span>{hideMoney ? '•••• left' : `${fmt(Math.max(limit - spent, 0))} left`}</span></div></div>;
}

function TransactionsPage({ data, onAdd, onEdit, onDelete, onExport, hideMoney }: { data: Txn[]; onAdd: () => void; onEdit: (item: Txn) => void; onDelete: (item: Txn) => void; onExport: () => void; hideMoney: boolean }) {
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('all');
  const [category, setCategory] = useState('all');
  const [period, setPeriod] = useState('all');
  const filtered = useMemo(() => data.filter(t => {
    const term = search.trim().toLowerCase();
    return (!term || `${t.title} ${t.category} ${t.note}`.toLowerCase().includes(term))
      && (kind === 'all' || t.type === kind)
      && (category === 'all' || t.category === category)
      && (period === 'all' || t.date.slice(0, 7) === period);
  }).sort((a, b) => b.date.localeCompare(a.date)), [data, search, kind, category, period]);
  const months = [...new Set(data.map(t => t.date.slice(0, 7)))].sort().reverse();
  return <>
    <PageHeading eyebrow="Everyday money" title="Transactions" subtitle="Keep the small details in view. Add, edit, or remove entries whenever you like.">
      <Button variant="secondary" onClick={onExport}><Download size={15} /> Export CSV</Button><Button onClick={onAdd}><Plus size={16} /> Add transaction</Button>
    </PageHeading>
    <div className="card transaction-panel">
      <div className="filter-bar"><label className="search-field"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions" aria-label="Search transactions" /></label>
        <label className="select-field"><span>Type</span><select value={kind} onChange={e => setKind(e.target.value)}><option value="all">All types</option><option value="income">Income</option><option value="expense">Expense</option></select><ChevronDown size={13} /></label>
        <label className="select-field"><span>Category</span><select value={category} onChange={e => setCategory(e.target.value)}><option value="all">All categories</option>{[...new Set(data.map(t => t.category))].sort().map(c => <option key={c}>{c}</option>)}</select><ChevronDown size={13} /></label>
        <label className="select-field"><span>Month</span><select value={period} onChange={e => setPeriod(e.target.value)}><option value="all">All time</option>{months.map(m => <option key={m} value={m}>{new Date(`${m}-02`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</option>)}</select><ChevronDown size={13} /></label>
      </div>
      <div className="table-meta">{filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}<span>Amounts in Indian rupees</span></div>
      {filtered.length ? <div className="transaction-table-wrap"><table className="data-table"><thead><tr><th>Transaction</th><th>Category</th><th>Date</th><th>Type</th><th className="align-right">Amount</th><th aria-label="Actions" /></tr></thead><tbody>{filtered.map(t => <tr key={t.id}><td><div className="transaction-title">{t.title}</div>{t.note && <div className="transaction-note">{t.note}</div>}</td><td><span className="category-tag">{t.category}</span></td><td>{formatDate(t.date)}</td><td><span className={`type-tag ${t.type}`}>{t.type}</span></td><td className={`amount-cell align-right ${t.type}`}>{hideMoney ? '₹ •••••' : `${t.type === 'income' ? '+' : '−'}${fmt(t.amount)}`}</td><td><div className="row-actions"><button title="Edit transaction" aria-label={`Edit ${t.title}`} onClick={() => onEdit(t)}><Pencil size={14} /></button><button title="Delete transaction" aria-label={`Delete ${t.title}`} onClick={() => onDelete(t)}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div> : <EmptyMessage title={data.length ? 'No matches just yet' : 'Nothing recorded yet'} text={data.length ? 'Try changing the search or filters.' : 'Your transactions will be waiting here once you add the first one.'} action={data.length ? undefined : onAdd} actionLabel="Add a transaction" />}
    </div>
    <p className="disclaimer">Entries are manually maintained and saved only in this browser. Export a CSV any time to keep a copy.</p>
  </>;
}

function TransactionRow({ txn, hideMoney }: { txn: Txn; hideMoney: boolean }) {
  const Icon = txn.type === 'income' ? ArrowDownLeft : txn.category === 'Home & bills' ? Landmark : txn.category === 'Food & dining' ? ArrowDownRight : Wallet;
  return <div className="activity-row"><div className={`activity-icon ${txn.type}`}><Icon size={16} /></div><div className="activity-main"><div className="activity-name">{txn.title}</div><div className="activity-detail">{txn.category} · {formatDate(txn.date)}</div></div><div className={`activity-amount ${txn.type}`}>{hideMoney ? '₹ •••••' : `${txn.type === 'income' ? '+' : '−'}${fmt(txn.amount)}`}</div></div>;
}

function BudgetsPage({ budgets, spent, onAdd, onEdit, onDelete, hideMoney }: { budgets: Budget[]; spent: (category: string) => number; onAdd: () => void; onEdit: (item: Budget) => void; onDelete: (item: Budget) => void; hideMoney: boolean }) {
  const totalLimit = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((s, b) => s + spent(b.category), 0);
  return <>
    <PageHeading eyebrow="A plan that can flex" title="Monthly budgets" subtitle="Set gentle limits for the categories that matter to you.">
      <Button onClick={onAdd}><Plus size={16} /> Add category</Button>
    </PageHeading>
    <div className="budget-overview-strip"><div><span>Planned this month</span><strong>{hideMoney ? '₹ ••••••' : fmt(totalLimit)}</strong></div><div><span>Spent so far</span><strong>{hideMoney ? '₹ ••••••' : fmt(totalSpent)}</strong></div><div><span>Across {budgets.length} categories</span><strong>{hideMoney ? '••••' : fmt(Math.max(totalLimit - totalSpent, 0))} <small>remaining</small></strong></div><div className="budget-strip-mark"><span>{totalLimit ? Math.round(totalSpent / totalLimit * 100) : 0}%</span><small>of plan used</small></div></div>
    <div className="budget-page-head"><div><h2>Category limits</h2><p>Progress reflects expense entries dated this month.</p></div><span className="month-label"><CalendarDays size={14} /> {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span></div>
    {budgets.length ? <div className="budget-grid">{budgets.map((b, i) => {
      const amount = spent(b.category);
      return <article className="card budget-card" key={b.id}><div className="budget-card-top"><div className="budget-category-icon" style={{ background: `${palette[i % palette.length]}1c`, color: palette[i % palette.length] }}><BadgeIndianRupee size={18} /></div><div className="row-actions"><button title={`Edit ${b.category} limit`} aria-label={`Edit ${b.category} budget`} onClick={() => onEdit(b)}><Pencil size={14} /></button><button title={`Delete ${b.category} budget`} aria-label={`Delete ${b.category} budget`} onClick={() => onDelete(b)}><Trash2 size={14} /></button></div></div><h3>{b.category}</h3><div className="budget-card-numbers"><strong>{hideMoney ? '₹ •••••' : fmt(amount)}</strong><span>of {hideMoney ? '₹ •••••' : fmt(b.monthlyLimit)}</span></div><BudgetProgress category="" spent={amount} limit={b.monthlyLimit} color={palette[i % palette.length]} hideMoney={hideMoney} /><div className="budget-card-foot"><span>{amount > b.monthlyLimit ? 'Over by' : 'Available'}</span><strong className={amount > b.monthlyLimit ? 'over-text' : ''}>{hideMoney ? '••••' : fmt(Math.abs(b.monthlyLimit - amount))}</strong></div></article>;
    })}</div> : <div className="card empty-panel"><EmptyMessage title="Start with one category" text="A budget is just a monthly limit you choose. It never moves money or connects to an account." action={onAdd} actionLabel="Add your first budget" /></div>}
    <p className="disclaimer">Budgets are personal planning tools, not spending restrictions. You can change a limit at any time.</p>
  </>;
}

function InvestmentsPage({ holdings, total, invested, gain, onAdd, onEdit, onDelete, hideMoney }: { holdings: Holding[]; total: number; invested: number; gain: number; onAdd: () => void; onEdit: (item: Holding) => void; onDelete: (item: Holding) => void; hideMoney: boolean }) {
  const pct = invested ? gain / invested * 100 : 0;
  return <>
    <PageHeading eyebrow="What you’re building" title="Investments" subtitle="A manually maintained snapshot of the holdings you choose to track.">
      <Button onClick={onAdd}><Plus size={16} /> Add holding</Button>
    </PageHeading>
    <section className="investment-hero">
      <div className="investment-main"><div className="balance-label"><BriefcaseBusiness size={15} /> Portfolio value</div><strong>{hideMoney ? '₹ ••••••' : fmt(total)}</strong><p>Across {holdings.length} {holdings.length === 1 ? 'holding' : 'holdings'}</p></div>
      <div className="investment-hero-stats"><div><span>Invested amount</span><strong>{hideMoney ? '₹ ••••••' : fmt(invested)}</strong></div><div><span>Change recorded</span><strong className={gain < 0 ? 'loss-color' : 'gain-color'}>{hideMoney ? '₹ •••••' : `${gain >= 0 ? '+' : '−'}${fmt(gain)}`}</strong><small>{hideMoney ? '•••' : `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`} overall</small></div><div className="portfolio-note"><span className="local-dot" /> Values entered by you</div></div>
      <div className="hero-decoration"><span /><span /><span /></div>
    </section>
    <div className="investment-note"><CircleHelp size={15} /><span>Holdings are for your personal reference. Values are not live market prices, and nothing here is investment advice.</span></div>
    <div className="section-head holdings-heading"><div><h2>Your holdings</h2><p>Update quantities and values whenever you like.</p></div><span className="holdings-count">{holdings.length} tracked</span></div>
    {holdings.length ? <div className="card holdings-table-wrap"><table className="data-table holdings-table"><thead><tr><th>Holding</th><th>Type</th><th>Quantity</th><th>Invested</th><th>Current value</th><th>Change</th><th /></tr></thead><tbody>{holdings.map(h => { const delta = h.currentValue - h.investedAmount; const rate = h.investedAmount ? delta / h.investedAmount * 100 : 0; return <tr key={h.id}><td><div className="holding-name"><span className="holding-mark">{h.name.slice(0, 1).toUpperCase()}</span><strong>{h.name}</strong></div></td><td><span className="category-tag">{h.type}</span></td><td>{h.quantity.toLocaleString('en-IN', { maximumFractionDigits: 4 })}</td><td>{hideMoney ? '₹ •••••' : fmt(h.investedAmount)}</td><td className="holding-current">{hideMoney ? '₹ •••••' : fmt(h.currentValue)}</td><td><span className={`change-pill ${delta < 0 ? 'negative' : ''}`}>{delta >= 0 ? '+' : '−'}{hideMoney ? '₹ •••' : fmt(delta)} <small>({hideMoney ? '•••' : `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}%`})</small></span></td><td><div className="row-actions"><button title={`Edit ${h.name}`} aria-label={`Edit ${h.name}`} onClick={() => onEdit(h)}><Pencil size={14} /></button><button title={`Delete ${h.name}`} aria-label={`Delete ${h.name}`} onClick={() => onDelete(h)}><Trash2 size={14} /></button></div></td></tr>; })}</tbody></table></div> : <div className="card empty-panel"><EmptyMessage title="Your portfolio, your pace" text="Add holdings manually for a simple snapshot of your investments." action={onAdd} actionLabel="Add your first holding" /></div>}
    <p className="disclaimer">No brokerage or market connection. SAVMNY does not buy, sell, or recommend investments.</p>
  </>;
}

function EmptyMessage({ title, text, action, actionLabel }: { title: string; text: string; action?: () => void; actionLabel?: string }) {
  return <div className="empty-state"><div className="empty-mark"><Wallet size={20} /></div><strong>{title}</strong><p>{text}</p>{action && <Button variant="secondary" onClick={action}><Plus size={14} /> {actionLabel ?? 'Add entry'}</Button>}</div>;
}

function NotFound() {
  return <div className="card empty-panel"><EmptyMessage title="This page isn’t here" text="Head back to your overview to find your way." action={() => { window.location.href = '/'; }} actionLabel="Return to overview" /></div>;
}

function RecordModal({ modal, budgets, onClose, onSave }: { modal: { kind: Kind; record?: Txn | Budget | Holding }; budgets: Budget[]; onClose: () => void; onSave: (kind: Kind, record: Txn | Budget | Holding) => void }) {
  const kind = modal.kind;
  const editing = Boolean(modal.record);
  const [type, setType] = useState<Txn['type']>((modal.record as Txn | undefined)?.type ?? 'expense');
  const [error, setError] = useState('');
  const record = modal.record;
  const title = kind === 'transaction' ? (editing ? 'Edit transaction' : 'Add a transaction') : kind === 'budget' ? (editing ? 'Edit category limit' : 'Add a budget category') : (editing ? 'Edit holding' : 'Add a holding');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    const fd = new FormData(event.currentTarget);
    if (kind === 'transaction') {
      const amount = Number(fd.get('amount'));
      const name = String(fd.get('title') ?? '').trim();
      const date = String(fd.get('date') ?? '');
      if (!name || !date || !Number.isFinite(amount) || amount <= 0) { setError('Add a title, valid date, and amount above ₹0.'); return; }
      onSave(kind, { id: (record as Txn | undefined)?.id ?? id(), title: name, amount, type, category: String(fd.get('category')), date, note: String(fd.get('note') ?? '').trim() });
    } else if (kind === 'budget') {
      const amount = Number(fd.get('limit'));
      const category = String(fd.get('category') ?? '').trim();
      if (!category || !Number.isFinite(amount) || amount <= 0) { setError('Choose a category and enter a monthly limit above ₹0.'); return; }
      if (!editing && budgets.some(b => b.category.toLowerCase() === category.toLowerCase())) { setError('A budget for this category already exists. Edit its current limit instead.'); return; }
      onSave(kind, { id: (record as Budget | undefined)?.id ?? id(), category, monthlyLimit: amount });
    } else {
      const name = String(fd.get('name') ?? '').trim();
      const quantityText = String(fd.get('quantity') ?? '');
      const investedText = String(fd.get('investedAmount') ?? '');
      const currentText = String(fd.get('currentValue') ?? '');
      const quantity = Number(quantityText);
      const investedAmount = Number(investedText);
      const currentValue = Number(currentText);
      if (!name || !quantityText || !investedText || !currentText || !Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(investedAmount) || investedAmount < 0 || !Number.isFinite(currentValue) || currentValue < 0) { setError('Add a name and valid zero-or-greater values for each amount.'); return; }
      onSave(kind, { id: (record as Holding | undefined)?.id ?? id(), name, type: String(fd.get('type')), quantity, investedAmount, currentValue });
    }
  };
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><section className="record-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div className="modal-head"><div className="modal-icon">{kind === 'transaction' ? <ArrowDownLeft size={18} /> : kind === 'budget' ? <BadgeIndianRupee size={18} /> : <BriefcaseBusiness size={18} />}</div><button className="modal-close" onClick={onClose} aria-label="Close dialog"><X size={17} /></button></div>
    <h2 id="modal-title">{title}</h2><p className="modal-copy">{kind === 'transaction' ? 'Keep your records up to date. No money moves from this screen.' : kind === 'budget' ? 'Choose a monthly amount that feels right for you.' : 'Enter the figures you want to keep in your personal snapshot.'}</p>
    <form onSubmit={submit} noValidate>
      {kind === 'transaction' && <>
        <div className="segmented"><button type="button" className={type === 'expense' ? 'selected expense' : ''} onClick={() => setType('expense')}>Expense</button><button type="button" className={type === 'income' ? 'selected income' : ''} onClick={() => setType('income')}>Income</button></div>
        <label className="form-label">Description<input name="title" defaultValue={(record as Txn | undefined)?.title ?? ''} placeholder="e.g. Groceries" required maxLength={80} autoFocus /></label>
        <div className="form-grid"><label className="form-label">Amount <span>(₹)</span><input name="amount" type="number" min="0.01" step="0.01" defaultValue={(record as Txn | undefined)?.amount ?? ''} placeholder="0.00" required /></label><label className="form-label">Date<input name="date" type="date" defaultValue={(record as Txn | undefined)?.date ?? todayIso()} required /></label></div>
        <label className="form-label">Category<select name="category" defaultValue={(record as Txn | undefined)?.category ?? (type === 'income' ? 'Salary' : 'Food & dining')}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="form-label">Note <span>(optional)</span><input name="note" defaultValue={(record as Txn | undefined)?.note ?? ''} placeholder="Add a small detail" maxLength={120} /></label>
      </>}
      {kind === 'budget' && <>
        <label className="form-label">Category<select name="category" defaultValue={(record as Budget | undefined)?.category ?? ''}><option value="" disabled>Choose a category</option>{categories.filter(c => !budgets.some(b => b.category === c) || c === (record as Budget | undefined)?.category).map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="form-label">Monthly limit <span>(₹)</span><input name="limit" type="number" min="1" step="1" defaultValue={(record as Budget | undefined)?.monthlyLimit ?? ''} placeholder="e.g. 12000" required /></label>
      </>}
      {kind === 'holding' && <>
        <label className="form-label">Holding name<input name="name" defaultValue={(record as Holding | undefined)?.name ?? ''} placeholder="e.g. Nifty 50 Index Fund" maxLength={80} required autoFocus /></label>
        <label className="form-label">Type<select name="type" defaultValue={(record as Holding | undefined)?.type ?? 'Mutual fund'}>{['Mutual fund', 'Stocks', 'Fixed deposit', 'Gold', 'Bonds', 'Other'].map(t => <option key={t}>{t}</option>)}</select></label>
        <div className="form-grid"><label className="form-label">Quantity<input name="quantity" type="number" min="0" step="any" defaultValue={(record as Holding | undefined)?.quantity ?? ''} placeholder="0" required /></label><label className="form-label">Invested (₹)<input name="investedAmount" type="number" min="0" step="0.01" defaultValue={(record as Holding | undefined)?.investedAmount ?? ''} placeholder="0" required /></label></div>
        <label className="form-label">Current value (₹)<input name="currentValue" type="number" min="0" step="0.01" defaultValue={(record as Holding | undefined)?.currentValue ?? ''} placeholder="0" required /></label>
      </>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="modal-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit"><Check size={15} /> {editing ? 'Save changes' : 'Save entry'}</Button></div>
    </form>
    {kind === 'transaction' && <p className="modal-footnote"><CircleHelp size={12} /> Stored only in this browser, not shared with a bank.</p>}
  </section></div>;
}

function formatDate(value: string) {
  if (value === todayIso()) return 'Today';
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default App;
