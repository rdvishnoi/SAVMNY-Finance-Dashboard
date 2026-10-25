import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownLeft,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  CreditCard,
  Download,
  Ellipsis,
  Eye,
  EyeOff,
  FileText,
  Home,
  IndianRupee,
  Landmark,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Activity = {
  name: string;
  detail: string;
  date: string;
  amount: number;
  kind: "income" | "expense" | "invest";
  icon: typeof ShoppingBag;
  color: string;
};

const trendData = [
  { month: "Jan", savings: 184000, investments: 204000 },
  { month: "Feb", savings: 188000, investments: 212000 },
  { month: "Mar", savings: 194000, investments: 219000 },
  { month: "Apr", savings: 190000, investments: 227000 },
  { month: "May", savings: 207000, investments: 232000 },
  { month: "Jun", savings: 215000, investments: 240000 },
  { month: "Jul", savings: 220000, investments: 254000 },
  { month: "Aug", savings: 226000, investments: 262000 },
  { month: "Sep", savings: 231000, investments: 276000 },
  { month: "Oct", savings: 243000, investments: 283000 },
  { month: "Nov", savings: 252000, investments: 297000 },
  { month: "Dec", savings: 264000, investments: 318000 },
];

const categoryData = [
  { name: "Home & bills", amount: 18450, color: "#3a6b5a" },
  { name: "Food & dining", amount: 12680, color: "#9fbb6e" },
  { name: "Travel", amount: 8940, color: "#e7ad82" },
  { name: "Shopping", amount: 7120, color: "#c3a8c4" },
  { name: "Other", amount: 5600, color: "#d9d5c8" },
];

const initialActivity: Activity[] = [
  {
    name: "Salary from Aster Labs",
    detail: "Monthly income · HDFC Bank",
    date: "Today, 9:42 am",
    amount: 148000,
    kind: "income",
    icon: BriefcaseBusiness,
    color: "mint",
  },
  {
    name: "BigBasket",
    detail: "Groceries · HDFC Millennia",
    date: "Today, 8:16 am",
    amount: -1846,
    kind: "expense",
    icon: ShoppingBag,
    color: "peach",
  },
  {
    name: "SIP · Parag Parikh Flexi Cap",
    detail: "Investment · Mutual funds",
    date: "Yesterday",
    amount: -12000,
    kind: "invest",
    icon: ArrowUpRight,
    color: "lilac",
  },
  {
    name: "Third Wave Coffee",
    detail: "Food & dining · UPI",
    date: "Yesterday",
    amount: -540,
    kind: "expense",
    icon: Utensils,
    color: "peach",
  },
  {
    name: "Rent payment",
    detail: "Home · UPI transfer",
    date: "12 Dec 2024",
    amount: -28500,
    kind: "expense",
    icon: Landmark,
    color: "sage",
  },
];

const formatRupees = (amount: number, compact = false) => {
  if (compact && amount >= 100000) {
    return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  }
  return `₹${Math.abs(amount).toLocaleString("en-IN")}`;
};

function MoneyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="savmny-tooltip">
      <span className="tooltip-date">{label} 2024</span>
      {payload.map((item) => (
        <div className="tooltip-line" key={item.name}>
          <span className="tooltip-dot" style={{ background: item.color }} />
          <span>{item.name}</span>
          <strong>{formatRupees(item.value)}</strong>
        </div>
      ))}
    </div>
  );
}

export function Dashboard() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [period, setPeriod] = useState("This year");
  const [showBalance, setShowBalance] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAction, setShowAction] = useState(false);
  const [actionType, setActionType] = useState("Add money");
  const [amount, setAmount] = useState("");
  const [notice, setNotice] = useState("");
  const [activityFilter, setActivityFilter] = useState("All activity");
  const [activities, setActivities] = useState(initialActivity);
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesSearch = `${activity.name} ${activity.detail}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesFilter =
        activityFilter === "All activity" ||
        (activityFilter === "Income" && activity.kind === "income") ||
        (activityFilter === "Spending" && activity.kind === "expense") ||
        (activityFilter === "Investments" && activity.kind === "invest");
      return matchesSearch && matchesFilter;
    });
  }, [activities, activityFilter, searchTerm]);

  const handleActionSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericAmount = Number(amount.replace(/,/g, ""));
    if (!numericAmount || numericAmount <= 0) {
      setNotice("Enter an amount greater than ₹0.");
      return;
    }
    const newItem: Activity = {
      name: actionType === "Add money" ? "Money added" : "New expense",
      detail: actionType === "Add money" ? "Added to HDFC Bank" : "Added manually · UPI",
      date: "Just now",
      amount: actionType === "Add money" ? numericAmount : -numericAmount,
      kind: actionType === "Add money" ? "income" : "expense",
      icon: actionType === "Add money" ? Wallet : CreditCard,
      color: actionType === "Add money" ? "mint" : "peach",
    };
    setActivities((current) => [newItem, ...current]);
    setShowAction(false);
    setAmount("");
    setNotice(`${actionType} recorded in your activity.`);
    window.setTimeout(() => setNotice(""), 3200);
  };

  const openAction = (type: string) => {
    setActionType(type);
    setAmount("");
    setShowAction(true);
    setNotice("");
  };

  const navItems = [
    { label: "Overview", icon: Home },
    { label: "Transactions", icon: ArrowDownLeft },
    { label: "Accounts", icon: Landmark },
    { label: "Investments", icon: BriefcaseBusiness },
  ];

  return (
    <div className="savmny">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');
        .savmny {
          --ink: #1c302a;
          --muted: #819089;
          --line: #e8ece6;
          --paper: #f7f8f4;
          --card: #fffefa;
          --green: #315f4f;
          --green-dark: #244a3c;
          --lime: #c7e36c;
          --warm: #f1f3ed;
          min-height: 100vh;
          background: var(--paper);
          color: var(--ink);
          font-family: 'DM Sans', 'Aptos', sans-serif;
          font-size: 14px;
          -webkit-font-smoothing: antialiased;
        }
        .savmny * { box-sizing: border-box; }
        .savmny button, .savmny input, .savmny select { font: inherit; }
        .savmny button { cursor: pointer; }
        .app-shell { min-height: 100vh; display: flex; }
        .sidebar {
          width: 238px; flex-shrink: 0; background: #fbfcf8;
          border-right: 1px solid #e9ede7; padding: 27px 16px 20px;
          display: flex; flex-direction: column; position: sticky; top: 0;
          height: 100vh; z-index: 5;
        }
        .brand { display:flex; align-items:center; gap:10px; padding: 0 12px 36px; }
        .brand-mark { width:31px; height:31px; border-radius:11px 11px 11px 4px; background:var(--green); display:grid; place-items:center; position:relative; transform:rotate(-4deg); }
        .brand-mark:before { content:""; width:12px; height:12px; border:2px solid var(--lime); border-radius:50%; border-right-color:transparent; transform:rotate(-35deg); }
        .brand-word { font: 800 19px 'Manrope', sans-serif; letter-spacing: -.9px; }
        .brand-word span { color:#86a454; }
        .workspace-label { padding:0 12px; margin-bottom:10px; color:#a0aaa2; text-transform:uppercase; font-size:10px; font-weight:700; letter-spacing:1.25px; }
        .nav-list { display:flex; flex-direction:column; gap:4px; }
        .nav-button { border:0; background:transparent; width:100%; display:flex; align-items:center; gap:13px; text-align:left; padding:11px 12px; color:#78847c; border-radius:10px; font-size:13px; font-weight:600; transition:background .18s, color .18s, transform .18s; }
        .nav-button:hover { background:#f0f4eb; color:var(--green); transform:translateX(2px); }
        .nav-button.active { background:#eaf0e5; color:#315f4f; }
        .nav-button svg { width:17px; height:17px; stroke-width:1.8; }
        .nav-pill { margin-left:auto; font-size:10px; background:#e5edcf; color:#587149; padding:3px 7px; border-radius:6px; font-weight:700; }
        .side-divider { border-top:1px solid var(--line); margin:25px 10px 19px; }
        .sidebar-spacer { flex:1; }
        .side-help { border:1px solid #e9ece6; border-radius:12px; background:#fffefa; padding:13px 13px 12px; margin:0 2px 17px; }
        .help-head { display:flex; align-items:center; gap:7px; font-weight:700; font-size:12px; }
        .help-head svg { color:#8ea368; width:15px; height:15px; }
        .side-help p { color:#88938c; margin:7px 0 10px; font-size:11px; line-height:1.5; }
        .side-help button { color:#315f4f; background:none; border:0; font-size:11px; font-weight:700; padding:0; display:flex; align-items:center; gap:4px; }
        .profile { display:flex; gap:10px; align-items:center; padding:10px 9px 0; border-top:1px solid var(--line); }
        .avatar { height:34px; width:34px; background:#e4d8c8; color:#684f41; display:grid; place-items:center; font-weight:700; border-radius:50%; font-size:11px; }
        .profile-name { font-size:12px; font-weight:700; }
        .profile-plan { font-size:10px; color:#929c94; margin-top:2px; }
        .profile-more { margin-left:auto; border:0; background:transparent; color:#9aa49d; padding:4px; }
        .main-area { flex:1; min-width:0; }
        .topbar { height:76px; padding:0 44px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e9ede7; background:rgba(251,252,248,.88); }
        .breadcrumb { color:#98a29b; font-size:12px; display:flex; align-items:center; gap:9px; }
        .breadcrumb strong { color:#3f554b; font-weight:600; }
        .top-actions { display:flex; align-items:center; gap:12px; }
        .icon-button { width:36px; height:36px; border-radius:10px; display:grid; place-items:center; background:transparent; color:#748078; border:1px solid transparent; transition:all .18s; }
        .icon-button:hover { background:#eff3eb; color:var(--green); border-color:#e4e9df; }
        .icon-button svg { width:17px; height:17px; }
        .search-wrap { position:relative; }
        .search-box { width:186px; height:36px; border-radius:9px; border:1px solid #e8ece6; background:#fffefa; display:flex; align-items:center; padding:0 10px; gap:8px; }
        .search-box svg { color:#9aa49d; width:15px; height:15px; flex-shrink:0; }
        .search-box input { min-width:0; width:100%; border:0; outline:0; background:transparent; font-size:11px; color:var(--ink); }
        .search-box input::placeholder { color:#a2aaa4; }
        .notify { position:relative; }
        .notify:after { content:""; position:absolute; width:5px; height:5px; border-radius:50%; background:#d98c70; top:7px; right:7px; border:1px solid #fbfcf8; }
        .page-content { max-width:1440px; padding:31px 44px 48px; margin:0 auto; }
        .welcome-row { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:24px; }
        .eyebrow { font-size:10px; font-weight:700; color:#97a29a; text-transform:uppercase; letter-spacing:1.2px; margin-bottom:8px; }
        h1 { font:700 27px 'Manrope', sans-serif; letter-spacing:-1.15px; margin:0; color:#213a30; }
        .welcome-sub { margin:6px 0 0; font-size:12px; color:#87928a; }
        .welcome-sub strong { color:#53675c; font-weight:600; }
        .welcome-actions { display:flex; gap:9px; }
        .button-secondary, .button-primary { height:38px; padding:0 14px; border-radius:9px; display:flex; align-items:center; justify-content:center; gap:8px; font-size:11px; font-weight:700; transition:transform .18s, background .18s, box-shadow .18s; }
        .button-secondary { background:#fffefa; color:#496257; border:1px solid #e2e8de; }
        .button-primary { background:var(--green); border:1px solid var(--green); color:white; box-shadow:0 4px 10px rgba(49,95,79,.12); }
        .button-primary:hover { background:#244b3c; box-shadow:0 7px 16px rgba(49,95,79,.18); transform:translateY(-1px); }
        .button-secondary:hover { background:#f0f4eb; transform:translateY(-1px); }
        .button-primary svg, .button-secondary svg { width:14px; height:14px; }
        .overview-grid { display:grid; grid-template-columns:minmax(0, 1.65fr) minmax(275px, .88fr); gap:18px; align-items:stretch; }
        .card { background:var(--card); border:1px solid #e9ede6; border-radius:15px; box-shadow:0 3px 12px rgba(34,54,43,.025); }
        .balance-card { background:var(--green-dark); border:1px solid #254d3e; color:#fff; padding:21px 24px 18px; position:relative; overflow:hidden; min-height:242px; }
        .balance-card:before { content:""; position:absolute; width:250px; height:250px; border:1px solid rgba(205,231,138,.11); border-radius:50%; right:-49px; top:-157px; }
        .balance-card:after { content:""; position:absolute; width:185px; height:185px; border:1px solid rgba(205,231,138,.10); border-radius:50%; right:-18px; top:-121px; }
        .balance-top { display:flex; justify-content:space-between; align-items:flex-start; position:relative; z-index:1; }
        .balance-label { font-size:11px; color:#b2c6b9; font-weight:500; display:flex; gap:7px; align-items:center; }
        .balance-label svg { width:14px; height:14px; color:#c7e36c; }
        .balance-total { font:700 32px 'Manrope', sans-serif; letter-spacing:-1.1px; margin-top:10px; color:#fffefa; }
        .balance-total.hidden-value { letter-spacing:3px; font-size:26px; }
        .balance-change { display:flex; gap:5px; align-items:center; color:#d3e99c; font-size:10px; margin-top:6px; }
        .balance-change svg { width:12px; height:12px; }
        .balance-change span { color:#aac1b2; margin-left:3px; }
        .balance-meta { background:rgba(255,255,255,.09); border:1px solid rgba(255,255,255,.10); border-radius:9px; display:flex; align-items:center; gap:7px; color:#d0dfd3; padding:8px 10px; font-size:10px; }
        .balance-meta svg { width:13px; height:13px; }
        .balance-chart { height:82px; position:relative; margin-top:9px; }
        .balance-chart .recharts-cartesian-grid-horizontal line { stroke:rgba(255,255,255,.12); }
        .balance-chart .recharts-cartesian-axis-tick-value { fill:#a2b9a9; font-size:9px; }
        .balance-chart .recharts-tooltip-wrapper { outline:0; }
        .balance-footer { display:flex; gap:24px; position:relative; z-index:1; margin-top:2px; }
        .balance-stat { font-size:10px; color:#a9c0b1; }
        .balance-stat strong { display:block; color:#f7faf1; font-size:12px; margin-top:4px; font-weight:600; }
        .divider-vertical { height:25px; border-left:1px solid rgba(255,255,255,.17); }
        .eye-toggle { border:0; background:rgba(255,255,255,.1); color:#d0dfd3; width:30px; height:30px; display:grid; place-items:center; border-radius:8px; }
        .eye-toggle svg { width:15px; height:15px; }
        .right-stack { display:flex; flex-direction:column; gap:14px; }
        .spend-card { padding:18px 19px 15px; min-height:151px; }
        .card-heading { display:flex; justify-content:space-between; align-items:center; }
        .card-heading h2 { margin:0; font:700 13px 'Manrope', sans-serif; letter-spacing:-.2px; }
        .card-kicker { color:#99a39c; font-size:10px; margin-top:4px; }
        .small-menu { border:0; color:#929d95; background:transparent; padding:3px; display:grid; place-items:center; border-radius:6px; }
        .small-menu:hover { background:#f1f4ed; color:#4e6c5a; }
        .small-menu svg { width:16px; height:16px; }
        .spend-flex { display:flex; align-items:center; gap:12px; margin-top:7px; }
        .donut-holder { width:88px; height:88px; flex-shrink:0; position:relative; }
        .donut-center { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; flex-direction:column; pointer-events:none; }
        .donut-center strong { font:700 13px 'Manrope', sans-serif; }
        .donut-center span { color:#99a39c; font-size:8px; margin-top:1px; }
        .spend-info { flex:1; min-width:0; }
        .spend-amount { font:700 19px 'Manrope', sans-serif; letter-spacing:-.6px; }
        .spend-trend { font-size:9px; color:#6c9a6d; display:flex; gap:4px; align-items:center; margin-top:4px; }
        .spend-trend svg { width:11px; height:11px; }
        .spend-trend span { color:#99a39c; }
        .spend-link { font-size:9px; font-weight:700; color:#526c5c; display:flex; gap:4px; align-items:center; margin-top:9px; }
        .spend-link svg { width:11px; height:11px; }
        .lower-grid { display:grid; grid-template-columns:minmax(0, 1.42fr) minmax(300px, .92fr); gap:18px; margin-top:18px; }
        .invest-card { padding:20px 22px 16px; min-height:249px; }
        .invest-header { display:flex; justify-content:space-between; gap:15px; align-items:flex-start; }
        .invest-value { font:700 23px 'Manrope',sans-serif; letter-spacing:-.8px; margin-top:8px; }
        .invest-delta { color:#659367; font-size:10px; font-weight:700; display:inline-flex; align-items:center; gap:4px; margin-left:9px; }
        .invest-delta svg { width:12px; height:12px; }
        .invest-description { color:#98a29b; font-size:10px; margin-top:3px; }
        .period-select { color:#6e7d73; border:1px solid #e8ece6; border-radius:7px; background:#fffefa; padding:7px 9px; display:flex; align-items:center; gap:7px; font-size:10px; font-weight:600; }
        .period-select:hover { border-color:#cdd8c8; }
        .period-select svg { width:12px; height:12px; }
        .invest-chart { height:139px; margin:12px -8px 0 -10px; }
        .chart-legend { display:flex; gap:17px; font-size:9px; color:#87938b; margin:5px 0 0 4px; }
        .legend-item { display:flex; align-items:center; gap:6px; }
        .legend-dot { width:7px; height:7px; border-radius:50%; background:#b5d875; }
        .legend-dot.second { background:#d9e7c1; }
        .activity-card { padding:20px 20px 5px; min-height:249px; }
        .activity-head { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; }
        .activity-head h2 { font:700 13px 'Manrope',sans-serif; margin:0; }
        .activity-head p { margin:4px 0 0; color:#98a29b; font-size:10px; }
        .activity-filter { appearance:none; border:1px solid #e8ece6; border-radius:7px; padding:7px 22px 7px 9px; color:#6f7c73; background:#fffefa; font-size:9px; outline:none; }
        .activity-filter-wrap { position:relative; }
        .activity-filter-wrap:after { content:""; position:absolute; border:4px solid transparent; border-top-color:#98a39b; right:8px; top:11px; pointer-events:none; }
        .activity-list { margin-top:12px; }
        .activity-row { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid #f0f2ed; animation: row-in .25s ease-out both; }
        .activity-row:last-child { border-bottom:0; }
        @keyframes row-in { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }
        .activity-icon { width:32px; height:32px; border-radius:10px; display:grid; place-items:center; flex-shrink:0; }
        .activity-icon svg { width:15px; height:15px; }
        .activity-icon.mint { color:#4f7a5c; background:#eaf1e4; }
        .activity-icon.peach { color:#af745a; background:#f7eee7; }
        .activity-icon.lilac { color:#8a7290; background:#f1edf4; }
        .activity-icon.sage { color:#6d8262; background:#eef1e9; }
        .activity-info { flex:1; min-width:0; }
        .activity-name { font-size:10px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .activity-detail { font-size:9px; color:#99a29b; margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .activity-right { text-align:right; flex-shrink:0; }
        .activity-amount { font-size:10px; font-weight:700; color:#32473d; }
        .activity-amount.positive { color:#5f8c61; }
        .activity-date { font-size:8px; color:#a1aaa3; margin-top:4px; }
        .activity-empty { padding:30px 12px; text-align:center; color:#89968c; font-size:11px; }
        .activity-empty svg { width:20px; height:20px; color:#b6c2ad; margin-bottom:7px; }
        .bottom-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin-top:18px; }
        .mini-card { padding:14px 16px; display:flex; align-items:center; gap:12px; min-height:72px; transition:transform .18s, box-shadow .18s; }
        .mini-card:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(34,54,43,.06); }
        .mini-icon { width:34px; height:34px; display:grid; place-items:center; border-radius:10px; background:#edf2e7; color:#65825e; flex-shrink:0; }
        .mini-icon svg { width:16px; height:16px; }
        .mini-meta { flex:1; }
        .mini-label { color:#89958c; font-size:9px; }
        .mini-value { color:#344b3f; font:700 14px 'Manrope',sans-serif; margin-top:4px; }
        .mini-arrow { color:#a4aea6; width:14px; height:14px; }
        .notice { position:fixed; z-index:20; bottom:22px; left:50%; transform:translateX(-50%); border-radius:10px; padding:11px 15px; background:#233f34; color:#f7faf2; box-shadow:0 8px 28px rgba(24,49,38,.2); display:flex; align-items:center; gap:8px; font-size:11px; animation:notice-in .2s ease-out; }
        .notice svg { color:#c7e36c; width:14px; height:14px; }
        @keyframes notice-in { from { opacity:0; transform:translate(-50%, 8px) } to { opacity:1; transform:translate(-50%, 0) } }
        .modal-backdrop { position:fixed; inset:0; z-index:30; background:rgba(24,40,32,.35); backdrop-filter:blur(3px); display:grid; place-items:center; padding:20px; animation:fade-in .18s ease-out; }
        @keyframes fade-in { from { opacity:0 } to { opacity:1 } }
        .action-modal { width:min(420px, 100%); background:#fffefa; border:1px solid #e9ede6; border-radius:17px; padding:24px; box-shadow:0 24px 70px rgba(24,49,38,.2); }
        .modal-top { display:flex; align-items:flex-start; justify-content:space-between; }
        .modal-icon { width:40px; height:40px; border-radius:12px; background:#eaf0e5; color:#456e54; display:grid; place-items:center; }
        .modal-icon svg { width:19px; height:19px; }
        .modal-close { border:0; background:transparent; color:#8a978e; padding:4px; }
        .modal-close svg { width:17px; height:17px; }
        .action-modal h2 { font:700 19px 'Manrope',sans-serif; margin:17px 0 5px; letter-spacing:-.5px; }
        .modal-copy { color:#8a968e; font-size:11px; margin:0; }
        .action-tabs { display:grid; grid-template-columns:1fr 1fr; gap:5px; border-radius:9px; background:#f0f3ed; padding:4px; margin:20px 0 17px; }
        .action-tab { border:0; border-radius:7px; background:transparent; color:#7e8a82; padding:8px; font-size:10px; font-weight:700; }
        .action-tab.active { background:#fffefa; color:#365a48; box-shadow:0 1px 4px rgba(42,67,51,.1); }
        .amount-label { font-size:10px; font-weight:700; color:#52645a; margin-bottom:7px; display:block; }
        .amount-field { display:flex; align-items:center; border:1px solid #dfe6dc; background:#fffefa; border-radius:10px; height:52px; padding:0 13px; }
        .amount-field span { color:#78857c; font:600 18px 'Manrope',sans-serif; margin-right:8px; }
        .amount-field input { width:100%; border:0; outline:0; background:transparent; color:#284337; font:700 20px 'Manrope',sans-serif; }
        .amount-field:focus-within { border-color:#90ae7d; box-shadow:0 0 0 3px rgba(144,174,125,.13); }
        .modal-error { color:#bd735e; font-size:10px; margin-top:7px; }
        .modal-submit { width:100%; margin-top:18px; height:42px; }
        .modal-footnote { color:#9ca59e; text-align:center; font-size:9px; margin:11px 0 0; display:flex; align-items:center; justify-content:center; gap:5px; }
        .modal-footnote svg { width:12px; height:12px; }
        @media (max-width: 1100px) {
          .sidebar { width:205px; }
          .topbar, .page-content { padding-left:28px; padding-right:28px; }
          .overview-grid { grid-template-columns:minmax(0, 1.35fr) minmax(250px, .9fr); }
          .lower-grid { grid-template-columns:minmax(0, 1.15fr) minmax(290px, .95fr); }
        }
        @media (max-width: 820px) {
          .sidebar { width:70px; padding:22px 10px 15px; align-items:center; }
          .brand { padding:0 0 32px; }
          .brand-word, .workspace-label, .nav-button span, .nav-pill, .side-divider, .side-help, .profile > div:not(.avatar), .profile-more { display:none; }
          .nav-list { width:100%; }
          .nav-button { justify-content:center; padding:12px 0; }
          .nav-button svg { width:18px; height:18px; }
          .profile { padding:13px 0 0; justify-content:center; width:100%; }
          .topbar, .page-content { padding-left:22px; padding-right:22px; }
          .overview-grid { grid-template-columns:1fr; }
          .right-stack { display:grid; grid-template-columns:1fr 1fr; }
          .lower-grid { grid-template-columns:1fr; }
          .activity-card { min-height:0; }
        }
        @media (max-width: 600px) {
          .app-shell { display:block; padding-bottom:68px; }
          .sidebar { position:fixed; top:auto; bottom:0; left:0; width:100%; height:62px; padding:6px 12px; border-right:0; border-top:1px solid #e7ebe4; flex-direction:row; background:rgba(251,252,248,.97); backdrop-filter:blur(12px); }
          .brand, .workspace-label, .sidebar-spacer, .side-help, .profile, .side-divider { display:none; }
          .nav-list { flex-direction:row; justify-content:space-around; gap:2px; }
          .nav-button { flex:1; flex-direction:column; gap:3px; padding:5px 1px; font-size:8px; border-radius:8px; }
          .nav-button span { display:block; }
          .nav-button svg { width:17px; height:17px; }
          .main-area { width:100%; }
          .topbar { height:59px; padding:0 17px; }
          .breadcrumb { font-size:11px; }
          .search-box { width:34px; padding:0 9px; border:0; background:transparent; }
          .search-box:focus-within { position:absolute; top:0; right:0; width:180px; border:1px solid #e8ece6; background:#fffefa; z-index:2; }
          .search-box input { opacity:0; }
          .search-box:focus-within input { opacity:1; }
          .top-actions { gap:5px; }
          .top-actions .icon-button { width:32px; height:32px; }
          .page-content { padding:23px 16px 30px; }
          .welcome-row { display:block; margin-bottom:17px; }
          h1 { font-size:23px; }
          .welcome-sub { font-size:11px; }
          .welcome-actions { margin-top:15px; }
          .welcome-actions .button-secondary, .welcome-actions .button-primary { flex:1; }
          .balance-card { min-height:225px; padding:18px 18px 15px; }
          .balance-total { font-size:29px; }
          .balance-meta { font-size:9px; }
          .right-stack { grid-template-columns:1fr; gap:12px; }
          .spend-card { min-height:145px; }
          .lower-grid { margin-top:12px; gap:12px; }
          .invest-card, .activity-card { padding:17px 15px 13px; }
          .invest-value { font-size:21px; }
          .invest-chart { height:135px; }
          .bottom-row { grid-template-columns:1fr; gap:9px; margin-top:12px; }
          .mini-card { min-height:64px; }
          .notice { width:calc(100% - 32px); justify-content:center; bottom:75px; }
        }
      `}</style>

      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true" />
            <div className="brand-word">SAV<span>MNY</span></div>
          </div>
          <div className="workspace-label">Your money</div>
          <nav className="nav-list" aria-label="Main navigation">
            {navItems.map(({ label, icon: Icon }) => (
              <button
                className={`nav-button ${activeNav === label ? "active" : ""}`}
                key={label}
                onClick={() => {
                  setActiveNav(label);
                  if (label !== "Overview") {
                    setNotice(`${label} view selected. Your overview stays right here.`);
                    window.setTimeout(() => setNotice(""), 2600);
                  }
                }}
              >
                <Icon />
                <span>{label}</span>
                {label === "Investments" && <span className="nav-pill">4</span>}
              </button>
            ))}
          </nav>
          <div className="side-divider" />
          <div className="workspace-label">Make it yours</div>
          <nav className="nav-list">
            <button
              className={`nav-button ${activeNav === "Goals" ? "active" : ""}`}
              onClick={() => setActiveNav("Goals")}
            >
              <Sparkles />
              <span>Goals</span>
            </button>
            <button
              className={`nav-button ${activeNav === "Reports" ? "active" : ""}`}
              onClick={() => setActiveNav("Reports")}
            >
              <FileText />
              <span>Reports</span>
            </button>
            <button
              className={`nav-button ${activeNav === "Settings" ? "active" : ""}`}
              onClick={() => setActiveNav("Settings")}
            >
              <Settings2 />
              <span>Settings</span>
            </button>
          </nav>
          <div className="sidebar-spacer" />
          <div className="side-help">
            <div className="help-head"><CircleHelp /> A little help?</div>
            <p>Make sense of your money, one small step at a time.</p>
            <button onClick={() => setNotice("Help centre is ready whenever you need it.")}>
              Visit help centre <ArrowRight />
            </button>
          </div>
          <div className="profile">
            <div className="avatar">AK</div>
            <div>
              <div className="profile-name">Aarav Kulkarni</div>
              <div className="profile-plan">Personal account</div>
            </div>
            <button className="profile-more" aria-label="Profile options" onClick={() => setMenuOpen(!menuOpen)}>
              <MoreHorizontal size={17} />
            </button>
          </div>
        </aside>

        <main className="main-area">
          <header className="topbar">
            <div className="breadcrumb"><span>My space</span><span>/</span><strong>{activeNav}</strong></div>
            <div className="top-actions">
              <div className="search-wrap">
                <label className="search-box">
                  <Search />
                  <input
                    aria-label="Search money activity"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search anything"
                  />
                </label>
              </div>
              <button className="icon-button notify" aria-label="Notifications" onClick={() => setNotice("You're all caught up.")}>
                <Bell />
              </button>
              <button className="icon-button" aria-label="Quick menu" onClick={() => setMenuOpen(!menuOpen)}>
                <Ellipsis />
              </button>
            </div>
          </header>

          <div className="page-content">
            <section className="welcome-row">
              <div>
                <div className="eyebrow">Tuesday, 17 December 2024</div>
                <h1>Good morning, Aarav</h1>
                <p className="welcome-sub">Your money is moving with purpose. <strong>Here’s the little picture.</strong></p>
              </div>
              <div className="welcome-actions">
                <button className="button-secondary" onClick={() => setNotice("Your December money summary is ready to export.")}>
                  <Download /> Export
                </button>
                <button className="button-primary" onClick={() => openAction("Add money")}>
                  <Plus /> Add transaction
                </button>
              </div>
            </section>

            <section className="overview-grid">
              <article className="balance-card">
                <div className="balance-top">
                  <div>
                    <div className="balance-label"><Wallet /> Total money, across accounts</div>
                    <div className={`balance-total ${showBalance ? "" : "hidden-value"}`}>
                      {showBalance ? "₹12,84,560" : "••••••••"}
                    </div>
                    <div className="balance-change"><ArrowUpRight /> 8.4% <span>vs. last month</span></div>
                  </div>
                  <button className="eye-toggle" aria-label={showBalance ? "Hide balances" : "Show balances"} onClick={() => setShowBalance(!showBalance)}>
                    {showBalance ? <Eye /> : <EyeOff />}
                  </button>
                </div>
                <div className="balance-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 8, right: 2, left: 0, bottom: -3 }}>
                      <defs>
                        <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#c7e36c" stopOpacity={0.24} />
                          <stop offset="100%" stopColor="#c7e36c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 5" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} interval={2} />
                      <Area type="monotone" dataKey="savings" stroke="#c7e36c" strokeWidth={2} fill="url(#cashFill)" dot={false} activeDot={{ r: 4, fill: "#c7e36c", stroke: "#244a3c", strokeWidth: 2 }} />
                      <Tooltip content={<MoneyTooltip />} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="balance-footer">
                  <div className="balance-stat">Cash & savings<strong>{showBalance ? "₹4,26,800" : "••••••"}</strong></div>
                  <div className="divider-vertical" />
                  <div className="balance-stat">Investments<strong>{showBalance ? "₹8,57,760" : "••••••"}</strong></div>
                  <div className="divider-vertical" />
                  <div className="balance-stat">Monthly change<strong>+₹38,240</strong></div>
                </div>
              </article>

              <div className="right-stack">
                <article className="card spend-card">
                  <div className="card-heading">
                    <div><h2>This month’s spending</h2><div className="card-kicker">A thoughtful look at where it went</div></div>
                    <button className="small-menu" aria-label="Spending options" onClick={() => setActivityFilter(activityFilter === "Spending" ? "All activity" : "Spending")}><Ellipsis /></button>
                  </div>
                  <div className="spend-flex">
                    <div className="donut-holder">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoryData} dataKey="amount" nameKey="name" innerRadius={29} outerRadius={41} paddingAngle={3} stroke="none" startAngle={90} endAngle={-270}>
                            {categoryData.map((item) => <Cell key={item.name} fill={item.color} />)}
                          </Pie>
                          <Tooltip formatter={(value) => formatRupees(Number(value))} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="donut-center"><strong>₹52.8k</strong><span>spent</span></div>
                    </div>
                    <div className="spend-info">
                      <div className="spend-amount">₹52,790</div>
                      <div className="spend-trend"><ArrowDownRight /> 6.2% <span>less than Nov</span></div>
                      <div className="spend-link" onClick={() => setActivityFilter("Spending")} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && setActivityFilter("Spending")}>See spending details <ArrowRight /></div>
                    </div>
                  </div>
                </article>
                <article className="card spend-card">
                  <div className="card-heading">
                    <div><h2>Room to spend</h2><div className="card-kicker">After bills, plans & essentials</div></div>
                    <button className="small-menu" aria-label="Budget options" onClick={() => setNotice("Your monthly budget is looking steady.")}><MoreHorizontal /></button>
                  </div>
                  <div className="spend-flex">
                    <div className="donut-holder">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[{ value: 64 }, { value: 36 }]} dataKey="value" innerRadius={30} outerRadius={41} startAngle={90} endAngle={-270} stroke="none" paddingAngle={0}>
                            <Cell fill="#c7e36c" /><Cell fill="#edf0e8" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="donut-center"><strong>64%</strong><span>on track</span></div>
                    </div>
                    <div className="spend-info">
                      <div className="spend-amount">₹31,210</div>
                      <div className="spend-trend"><Check /> of ₹48,500 monthly plan</div>
                      <div className="spend-link" onClick={() => setNotice("Budget plan opened for this month.")} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && setNotice("Budget plan opened for this month.")}>View budget <ArrowRight /></div>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <section className="lower-grid">
              <article className="card invest-card">
                <div className="invest-header">
                  <div>
                    <div className="eyebrow">Your investments</div>
                    <div className="invest-value">₹8,57,760 <span className="invest-delta"><ArrowUpRight /> 12.6%</span></div>
                    <div className="invest-description">Your invested money, growing at its own pace</div>
                  </div>
                  <button className="period-select" onClick={() => setPeriod(period === "This year" ? "6 months" : period === "6 months" ? "3 months" : "This year")}>
                    <CalendarDays /> {period} <ChevronDown />
                  </button>
                </div>
                <div className="invest-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={period === "This year" ? trendData : trendData.slice(period === "6 months" ? 6 : 9)} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="investmentFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#b7d679" stopOpacity={0.26} />
                          <stop offset="100%" stopColor="#b7d679" stopOpacity={0.015} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#eef1eb" vertical={false} strokeDasharray="3 5" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9aa49c", fontSize: 9 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#a3aca5", fontSize: 8 }} tickFormatter={(value) => `₹${Math.round(value / 100000)}L`} width={34} />
                      <Tooltip content={<MoneyTooltip />} />
                      <Area type="monotone" dataKey="investments" name="Investments" stroke="#7a9b56" strokeWidth={2.2} fill="url(#investmentFill)" activeDot={{ r: 4, fill: "#7a9b56", stroke: "#fffefa", strokeWidth: 2 }} />
                      <Area type="monotone" dataKey="savings" name="Savings" stroke="#c9d9b0" strokeWidth={1.5} fill="transparent" activeDot={{ r: 3, fill: "#c9d9b0", stroke: "#fffefa", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-legend">
                  <span className="legend-item"><i className="legend-dot" /> Investments</span>
                  <span className="legend-item"><i className="legend-dot second" /> Savings</span>
                  <span style={{ marginLeft: "auto", color: "#9aa49d" }}>Updated today</span>
                </div>
              </article>

              <article className="card activity-card">
                <div className="activity-head">
                  <div><h2>Recent activity</h2><p>Your money, in motion</p></div>
                  <div className="activity-filter-wrap">
                    <select className="activity-filter" value={activityFilter} onChange={(event) => setActivityFilter(event.target.value)} aria-label="Filter activity">
                      <option>All activity</option><option>Income</option><option>Spending</option><option>Investments</option>
                    </select>
                  </div>
                </div>
                <div className="activity-list">
                  {filteredActivities.slice(0, 5).map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div className="activity-row" key={`${activity.name}-${activity.date}-${index}`}>
                        <div className={`activity-icon ${activity.color}`}><Icon /></div>
                        <div className="activity-info">
                          <div className="activity-name">{activity.name}</div>
                          <div className="activity-detail">{activity.detail}</div>
                        </div>
                        <div className="activity-right">
                          <div className={`activity-amount ${activity.amount > 0 ? "positive" : ""}`}>
                            {activity.amount > 0 ? "+" : "−"}{formatRupees(activity.amount)}
                          </div>
                          <div className="activity-date">{activity.date}</div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredActivities.length === 0 && (
                    <div className="activity-empty"><Search /><div>No activity found. Try another search.</div></div>
                  )}
                </div>
              </article>
            </section>

            <section className="bottom-row" aria-label="Accounts at a glance">
              <button className="card mini-card" onClick={() => setNotice("HDFC Bank account · balance ₹2,84,560")}>
                <span className="mini-icon"><Landmark /></span>
                <span className="mini-meta"><span className="mini-label">HDFC Bank · Savings</span><span className="mini-value">₹2,84,560</span></span>
                <ArrowRight className="mini-arrow" />
              </button>
              <button className="card mini-card" onClick={() => setNotice("ICICI Bank account · balance ₹1,42,240")}>
                <span className="mini-icon"><IndianRupee /></span>
                <span className="mini-meta"><span className="mini-label">ICICI Bank · Salary</span><span className="mini-value">₹1,42,240</span></span>
                <ArrowRight className="mini-arrow" />
              </button>
              <button className="card mini-card" onClick={() => setNotice("Credit card due date · 24 December")}>
                <span className="mini-icon"><CreditCard /></span>
                <span className="mini-meta"><span className="mini-label">HDFC Millennia · Due 24 Dec</span><span className="mini-value">₹8,460 due</span></span>
                <ArrowRight className="mini-arrow" />
              </button>
            </section>
          </div>
        </main>
      </div>

      {notice && (
        <div className="notice" role="status"><Check /> {notice}</div>
      )}

      {menuOpen && (
        <div className="modal-backdrop" onClick={() => setMenuOpen(false)}>
          <div className="action-modal" style={{ width: 340 }} onClick={(event) => event.stopPropagation()}>
            <div className="modal-top"><div className="modal-icon"><Settings2 /></div><button className="modal-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X /></button></div>
            <h2>Your SAVMNY space</h2>
            <p className="modal-copy">Aarav Kulkarni · Personal account</p>
            <div style={{ display: "grid", gap: 8, marginTop: 20 }}>
              <button className="button-secondary" style={{ justifyContent: "flex-start" }} onClick={() => { setMenuOpen(false); setNotice("Profile settings are ready to explore."); }}><Settings2 /> Profile & preferences</button>
              <button className="button-secondary" style={{ justifyContent: "flex-start" }} onClick={() => { setMenuOpen(false); setNotice("Your data is protected with bank-grade security."); }}><ShieldCheck /> Privacy & security</button>
              <button className="button-secondary" style={{ justifyContent: "flex-start" }} onClick={() => { setMenuOpen(false); setNotice("Your December report is ready to export."); }}><Download /> Download report</button>
            </div>
          </div>
        </div>
      )}

      {showAction && (
        <div className="modal-backdrop" onClick={() => setShowAction(false)}>
          <form className="action-modal" onSubmit={handleActionSubmit} onClick={(event) => event.stopPropagation()}>
            <div className="modal-top">
              <div className="modal-icon">{actionType === "Add money" ? <Wallet /> : <CreditCard />}</div>
              <button type="button" className="modal-close" aria-label="Close" onClick={() => setShowAction(false)}><X /></button>
            </div>
            <h2>{actionType === "Add money" ? "Add money to your picture" : "Add an expense"}</h2>
            <p className="modal-copy">Keep your money story up to date. You can change this anytime.</p>
            <div className="action-tabs">
              {["Add money", "Add expense"].map((type) => (
                <button type="button" key={type} className={`action-tab ${actionType === type ? "active" : ""}`} onClick={() => { setActionType(type); setNotice(""); }}>
                  {type}
                </button>
              ))}
            </div>
            <label className="amount-label" htmlFor="amount-entry">Amount</label>
            <div className="amount-field"><span>₹</span><input id="amount-entry" inputMode="decimal" autoFocus placeholder="0" value={amount} onChange={(event) => setAmount(event.target.value)} /></div>
            {notice && <div className="modal-error">{notice}</div>}
            <button type="submit" className="button-primary modal-submit"><Check /> Save transaction</button>
            <p className="modal-footnote"><ShieldCheck /> This is a private visual demo; nothing leaves this screen.</p>
          </form>
        </div>
      )}
    </div>
  );
}
