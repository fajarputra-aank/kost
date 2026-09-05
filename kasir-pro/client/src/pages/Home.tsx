/*
 * KASIR PRO — Paper Ledger Modernism page composition.
 * This file keeps the operational rhythm tactile: warm paper surfaces, ink hierarchy,
 * asymmetric workspaces, and Receipt Tangerine for decisive actions.
 */
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { connectThermalPrinter, disconnectThermalPrinter, getThermalPrinterPaperWidth, isThermalPrinterConnected, isThermalPrinterSupported, isThermalPrinterWebUsbSupported, printBarcodeLabelThermal, printReceiptThermal, setThermalPrinterPaperWidth } from "@/lib/printer";
import type { PosProduct as Product, PosCustomer as Customer, PosPromotion as Promo, PosTransaction as Transaction } from "@shared/pos";
import { selectBestPromotion } from "@shared/promo";
import type { ComponentType } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertCircle,
  Archive,
  Camera,
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  Barcode,
  Bell,
  Boxes,
  BriefcaseBusiness,
  Calculator,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Database,
  Download,
  FileBarChart,
  FilePenLine,
  FilePlus2,
  FileText,
  Filter,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Pencil,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  Tag,
  Upload,
  UserCircle2,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Role = "ADMIN" | "KASIR";
type PageKey =
  | "dashboard"
  | "pos"
  | "transactions"
  | "products"
  | "categories"
  | "stock"
  | "customers"
  | "members"
  | "promos"
  | "suppliers"
  | "purchases"
  | "receivables"
  | "payables"
  | "expenses"
  | "reports"
  | "invoices"
  | "barcode"
  | "users"
  | "audit"
  | "settings"
  | "backup";

type CartItem = Product & { qty: number; discount: number };

type Expense = { id: string; date: string; category: string; note: string; amount: number; user: string };
type Audit = { id: string; date: string; user: string; action: string; detail: string; tone?: string };
type AppData = {
  products: Product[];
  customers: Customer[];
  transactions: Transaction[];
  expenses: Expense[];
  audit: Audit[];
  promos: Promo[];
  memberDiscounts: Record<string, number>;
  categories: string[];
  suppliers: { id: string; name: string; contact: string; phone: string; debt: number }[];
  settings: { storeName: string; address: string; phone: string; tax: number; service: number; receiptFooter: string };
};

type Session = { username: string; role: Role; name: string };

const STORAGE_KEY = "kasir-pro-data-v1";
const SESSION_KEY = "kasir-pro-session-v1";
const SYNC_VERSION_KEY = "kasir-pro-sync-version-v1";
const SYNC_BASELINE_KEY = "kasir-pro-sync-baseline-v1";
const SYNC_QUEUE_KEY = "kasir-pro-sync-queue-v1";
const LOGO_URL = "/manus-storage/kasir-pro-logo_c5582c83.png";
const DASHBOARD_ART = "/manus-storage/kasir-pro-dashboard-art_54c16828.png";
const INVENTORY_ART = "/manus-storage/kasir-pro-inventory-art_5e04167c.png";
const CUSTOMER_ART = "/manus-storage/kasir-pro-customer-art_23a29b13.png";
const REPORT_ART = "/manus-storage/kasir-pro-report-art_034faf7b.png";

const navGroups: { label: string; items: { key: PageKey; label: string; icon: ComponentType<{ size?: number; strokeWidth?: number }>; accent?: boolean }[] }[] = [
  { label: "Workspace", items: [{ key: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { key: "pos", label: "Kasir", icon: ShoppingCart, accent: true }, { key: "transactions", label: "Transaksi", icon: ClipboardList }] },
  { label: "Catalog", items: [{ key: "products", label: "Produk", icon: Package }, { key: "categories", label: "Kategori", icon: Archive }, { key: "stock", label: "Stok", icon: Boxes }] },
  { label: "Relations", items: [{ key: "customers", label: "Customer", icon: Users }, { key: "members", label: "Member", icon: ShieldCheck }, { key: "suppliers", label: "Supplier", icon: Truck }] },
  { label: "Finance", items: [{ key: "purchases", label: "Pembelian", icon: ShoppingBag }, { key: "receivables", label: "Piutang", icon: WalletCards }, { key: "payables", label: "Hutang", icon: CreditCard }, { key: "expenses", label: "Pengeluaran", icon: CircleDollarSign }, { key: "reports", label: "Laporan", icon: FileBarChart }] },
  { label: "Control room", items: [{ key: "invoices", label: "Invoice", icon: Receipt }, { key: "promos", label: "Promo & Diskon", icon: Tag }, { key: "barcode", label: "Barcode", icon: Barcode }, { key: "users", label: "User", icon: UserRound }, { key: "audit", label: "Audit Log", icon: History }, { key: "settings", label: "Pengaturan", icon: Settings }, { key: "backup", label: "Backup & Restore", icon: Database }] },
];

const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
const compactMoney = (value: number) => value >= 1000000 ? `Rp ${(value / 1000000).toFixed(1).replace(".", ",")} jt` : value >= 1000 ? `Rp ${(value / 1000).toFixed(0)} rb` : money(value);
const today = () => new Date().toISOString().slice(0, 10);
const formatDate = (date: string) => new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));
const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`;
const invoiceNumber = (index: number) => `INV-${today().replaceAll("-", "")}-${String(index).padStart(4, "0")}`;
const memberDiscountRates: Record<string, number> = { Bronze: 2, Silver: 4, Gold: 7, Platinum: 10, Corporate: 5 };

type PromoEvaluation = { eligible: boolean; discount: number; reason: string; usageRemaining?: number; usageConsumed?: number };

function evaluatePromo(promo: Promo | null, options: { subtotal: number; baseAmount: number; cart: CartItem[]; customer?: Customer; products: Product[]; transactions?: Transaction[] }): PromoEvaluation {
  if (!promo) return { eligible: false, discount: 0, reason: "Belum ada promo dipilih." };
  const { subtotal, baseAmount, cart, customer, products, transactions = [] } = options;
  if (!promo.active) return { eligible: false, discount: 0, reason: "Promo sedang nonaktif." };
  if (today() < promo.startDate || today() > promo.endDate) return { eligible: false, discount: 0, reason: "Periode promo sudah berakhir atau belum dimulai." };
  if (subtotal < promo.minPurchase) return { eligible: false, discount: 0, reason: `Minimum pembelian ${money(promo.minPurchase)}.` };
  if (promo.memberOnly && (!customer || customer.segment === "Umum" || !promo.memberLevels.includes(customer.segment))) return { eligible: false, discount: 0, reason: "Promo ini khusus level member tertentu." };
  const usageKey = customer && customer.segment !== "Umum" ? customer.id : null;
  const historyUsed = usageKey ? transactions.filter((transaction) => transaction.promoId === promo.id && transaction.promoMemberId === usageKey).reduce((sum, transaction) => sum + (transaction.promoUsage ?? 1), 0) : 0;
  const used = usageKey ? Math.max(promo.usageByMember?.[usageKey] ?? 0, historyUsed) : 0;
  const hasLimit = Boolean(usageKey && promo.usageLimitPerMember && promo.usageLimitPerMember > 0);
  const usageRemaining = hasLimit ? Math.max(0, (promo.usageLimitPerMember ?? 0) - used) : undefined;
  if (hasLimit && usageRemaining === 0) return { eligible: false, discount: 0, reason: "Batas penggunaan member untuk promo ini sudah tercapai.", usageRemaining: 0 };

  if (promo.type === "percentage") return { eligible: true, discount: Math.round(Math.max(0, baseAmount) * (promo.value / 100)), reason: `Diskon ${promo.value}% diterapkan.`, usageRemaining, usageConsumed: 1 };
  if (promo.type === "nominal") return { eligible: true, discount: Math.min(promo.value, Math.max(0, baseAmount)), reason: `Potongan ${money(promo.value)} diterapkan.`, usageRemaining, usageConsumed: 1 };
  if (promo.type === "bogo") {
    const buyProduct = products.find((product) => product.id === promo.buyProductId);
    const getProduct = products.find((product) => product.id === promo.getProductId);
    const buyQty = cart.find((item) => item.id === promo.buyProductId)?.qty ?? 0;
    const getQty = cart.find((item) => item.id === promo.getProductId)?.qty ?? 0;
    const buyQuantity = Math.max(1, promo.buyQuantity ?? 1);
    const getQuantity = Math.max(1, promo.getQuantity ?? 1);
    const possibleSets = Math.floor(buyQty / buyQuantity);
    const giftSets = hasLimit ? Math.min(possibleSets, usageRemaining ?? 0) : possibleSets;
    const freeQty = Math.min(getQty, giftSets * getQuantity);
    if (!buyProduct || !getProduct) return { eligible: false, discount: 0, reason: "Produk BOGO belum dikonfigurasi." };
    if (possibleSets < 1 || getQty < getQuantity) return { eligible: false, discount: 0, reason: `Tambahkan ${buyProduct.name} dan ${getProduct.name} ke keranjang.` };
    return { eligible: freeQty > 0, discount: Math.min(baseAmount, freeQty * getProduct.price), reason: `${freeQty} ${getProduct.name} gratis.`, usageRemaining, usageConsumed: giftSets };
  }
  const bundleProducts = (promo.bundleProductIds ?? []).map((productId) => products.find((product) => product.id === productId)).filter(Boolean) as Product[];
  const bundleQty = Math.max(1, promo.bundleQuantity ?? bundleProducts.length);
  const possibleSets = bundleProducts.length ? Math.min(...bundleProducts.map((product) => Math.floor((cart.find((item) => item.id === product.id)?.qty ?? 0)))) : 0;
  const bundleSets = hasLimit ? Math.min(possibleSets, usageRemaining ?? 0) : possibleSets;
  const regularPrice = bundleProducts.reduce((sum, product) => sum + product.price, 0);
  const bundlePrice = promo.bundlePrice ?? regularPrice;
  const discount = Math.max(0, (regularPrice - bundlePrice) * bundleSets);
  if (bundleProducts.length < 2 || possibleSets < 1) return { eligible: false, discount: 0, reason: "Tambahkan seluruh produk paket ke keranjang." };
  if (bundleQty < bundleProducts.length) return { eligible: false, discount: 0, reason: "Jumlah item paket belum valid." };
  return { eligible: discount > 0, discount: Math.min(baseAmount, discount), reason: `${bundleSets} paket bundling diterapkan.`, usageRemaining, usageConsumed: bundleSets };
}

const seedData = (): AppData => {
  const products: Product[] = [
    ["KOP-001", "Kopi Susu Gula Aren", "Minuman", 9000, 18000, 42, 12, "PT Biji Nusantara", "#E46F47"],
    ["KOP-002", "Americano", "Minuman", 7000, 15000, 28, 10, "PT Biji Nusantara", "#7B9B86"],
    ["NAS-001", "Nasi Ayam Sambal Matah", "Makanan", 18000, 32000, 18, 8, "CV Segar Jaya", "#D6A43B"],
    ["NAS-002", "Nasi Goreng Kampung", "Makanan", 15000, 28000, 24, 8, "CV Segar Jaya", "#D97957"],
    ["SNA-001", "Pisang Goreng Keju", "Snack", 8000, 16000, 7, 10, "UD Rasa Kita", "#E6C46A"],
    ["SNA-002", "Kentang Goreng", "Snack", 9000, 18000, 15, 8, "UD Rasa Kita", "#A5B89E"],
    ["CAT-001", "Paket Catering Hemat", "Catering", 28000, 45000, 5, 8, "CV Segar Jaya", "#8C6B5B"],
    ["CAT-002", "Paket Meeting 10 Pax", "Catering", 380000, 550000, 4, 2, "CV Segar Jaya", "#6D8490"],
    ["SEM-001", "Air Mineral 600ml", "Sembako", 2500, 5000, 63, 20, "PT Tirta Abadi", "#8AA7B5"],
    ["SEM-002", "Teh Botol", "Minuman", 3500, 7000, 8, 12, "PT Tirta Abadi", "#A17B62"],
    ["PAK-001", "Paket Berdua", "Paket", 33000, 55000, 11, 5, "CV Segar Jaya", "#C88B58"],
    ["LNN-001", "Kantong Belanja", "Lainnya", 1000, 2000, 100, 20, "UD Rasa Kita", "#8C958E"],
  ].map(([code, name, category, cost, price, stock, min, supplier, accent], index) => ({ id: `prd-${index + 1}`, code: code as string, name: name as string, category: category as string, unit: "pcs", cost: cost as number, price: price as number, stock: stock as number, min: min as number, supplier: supplier as string, status: true, accent: accent as string }));
  const customers: Customer[] = [
    ["CUST-001", "Pelanggan Umum", "-", "Umum", 0, 0], ["CUST-002", "Dina Rahma", "0812 8801 2290", "Gold", 32, 125000], ["CUST-003", "Budi Santoso", "0813 7712 1108", "Silver", 18, 0], ["CUST-004", "Kantor Arunika", "021 5598 201", "Corporate", 21, 450000], ["CUST-005", "Rina Catering", "0821 3019 771", "Platinum", 44, 0], ["CUST-006", "Andi Pratama", "0857 0011 8822", "Bronze", 8, 75000],
  ].map(([cid, name, phone, segment, purchases, balance]) => ({ id: cid as string, name: name as string, phone: phone as string, segment: segment as string, purchases: purchases as number, balance: balance as number }));
  const customersForTx = ["Dina Rahma", "Pelanggan Umum", "Budi Santoso", "Kantor Arunika", "Rina Catering"];
  const transactions: Transaction[] = Array.from({ length: 10 }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - index);
    const product = products[index % products.length]; const qty = (index % 3) + 1; const subtotal = product.price * qty; const discount = index % 4 === 0 ? 5000 : 0;
    return { id: `trx-${index + 1}`, invoice: invoiceNumber(81 - index), date: date.toISOString(), customer: customersForTx[index % customersForTx.length], cashier: index % 3 === 0 ? "Admin FNP" : "Sari Kasir", total: subtotal - discount, subtotal, discount, payment: ["Cash", "QRIS", "Transfer", "Debit"][index % 4], status: "Lunas", items: [{ name: product.name, qty, price: product.price }] };
  });
  return {
    products, customers, transactions,
    promos: [
      { id: "promo-1", name: "Member Gold 10%", code: "GOLD10", type: "percentage", value: 10, memberOnly: true, memberLevels: ["Gold", "Platinum"], minPurchase: 100000, active: true, startDate: "2026-01-01", endDate: "2026-12-31" },
      { id: "promo-2", name: "Hemat Hari Ini", code: "HEMAT5", type: "percentage", value: 5, memberOnly: false, memberLevels: [], minPurchase: 75000, active: true, startDate: "2026-01-01", endDate: "2026-12-31" },
      { id: "promo-3", name: "Member Platinum Rp25K", code: "PLAT25", type: "nominal", value: 25000, memberOnly: true, memberLevels: ["Platinum"], minPurchase: 250000, active: false, startDate: "2026-01-01", endDate: "2026-12-31" },
      { id: "promo-4", name: "BOGO Kopi + Americano", code: "KOPIBOGO", type: "bogo", value: 0, memberOnly: true, memberLevels: ["Gold", "Platinum"], minPurchase: 0, active: true, startDate: "2026-01-01", endDate: "2026-12-31", buyProductId: "prd-1", getProductId: "prd-2", buyQuantity: 1, getQuantity: 1, usageLimitPerMember: 2, usageByMember: {} },
      { id: "promo-5", name: "Bundling Ngopi Berdua", code: "NGOPIBER2", type: "bundle", value: 0, memberOnly: false, memberLevels: [], minPurchase: 0, active: true, startDate: "2026-01-01", endDate: "2026-12-31", bundleProductIds: ["prd-1", "prd-2"], bundleQuantity: 2, bundlePrice: 28000, usageLimitPerMember: 3, usageByMember: {} },
    ],
    memberDiscounts: { ...memberDiscountRates },
    categories: ["Makanan", "Minuman", "Snack", "Catering", "Sembako", "Paket", "Lainnya"],
    suppliers: [["SUP-001", "PT Biji Nusantara", "Agus", "0812 4410 9088", 0], ["SUP-002", "CV Segar Jaya", "Maya", "0811 2290 0101", 1250000], ["SUP-003", "UD Rasa Kita", "Rudi", "0822 7711 0022", 450000], ["SUP-004", "PT Tirta Abadi", "Nina", "0813 9100 2233", 0], ["SUP-005", "CV Kemasan Kita", "Iwan", "0815 1290 7711", 780000]].map(([sid, name, contact, phone, debt]) => ({ id: sid as string, name: name as string, contact: contact as string, phone: phone as string, debt: debt as number })),
    expenses: [{ id: "exp-1", date: today(), category: "Operasional", note: "Belanja kebutuhan dapur", amount: 325000, user: "Admin FNP" }, { id: "exp-2", date: new Date(Date.now() - 86400000 * 2).toISOString(), category: "Transportasi", note: "Pengantaran catering", amount: 150000, user: "Sari Kasir" }],
    audit: [{ id: "log-1", date: new Date().toISOString(), user: "Admin FNP", action: "Data demo dimuat", detail: "12 produk, 10 transaksi, 5 supplier", tone: "success" }, { id: "log-2", date: new Date(Date.now() - 3600000).toISOString(), user: "Sari Kasir", action: "Login", detail: "Sesi kasir dimulai", tone: "neutral" }],
    settings: { storeName: "KASIR PRO FNP", address: "Jl. Kemang Raya No. 18, Jakarta Selatan", phone: "021 7788 1090", tax: 11, service: 0, receiptFooter: "Terima kasih sudah berbelanja." },
  };
};

const getData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return { ...seedData(), ...parsed, promos: parsed.promos ?? seedData().promos, memberDiscounts: parsed.memberDiscounts ?? seedData().memberDiscounts } as AppData;
  } catch { return null; }
};

function LoginScreen({ onLogin, onDemo }: { onLogin: (session: Session) => void; onDemo: () => void }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [remember, setRemember] = useState(true);
  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if ((username === "admin" && password === "admin123") || (username === "kasir" && password === "kasir123")) {
      const role = username === "admin" ? "ADMIN" : "KASIR"; const session = { username, role, name: role === "ADMIN" ? "Admin FNP" : "Sari Kasir" } as Session;
      if (remember) localStorage.setItem(SESSION_KEY, JSON.stringify(session)); onLogin(session); toast.success("Sesi berhasil dimulai");
    } else toast.error("Username atau password belum sesuai. Coba admin / admin123.");
  };
  return <div className="login-shell"><div className="login-art"><div className="login-quote">“Kerja kasir yang baik membuat setiap rupiah punya cerita.”</div><div className="login-art-bottom"><span>OFFLINE-FIRST POS</span><span>01 / 04</span></div></div><div className="login-panel"><div className="brand-lockup"><div className="brand-mark"><img src={LOGO_URL} alt="KASIR PRO mark" /></div><div><strong>KASIR PRO</strong><span>FNP / POS WORKSPACE</span></div></div><div className="login-heading"><span className="eyebrow">Professional Point of Sale</span><h1>Selamat datang<br /><em>kembali.</em></h1><p>Kelola transaksi, stok, dan laporan dari satu meja kerja yang rapi.</p></div><form onSubmit={handleLogin} className="login-form"><label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" /></label><label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label><label className="checkline"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Ingat sesi di perangkat ini</label><button className="primary-btn wide" type="submit">Masuk ke workspace <ArrowUpRight size={17} /></button></form><button className="demo-link" onClick={onDemo}>Gunakan Data Demo <span>→</span></button><div className="login-foot"><span><ShieldCheck size={14} /> Data lokal terlindungi</span><span>v1.0.0</span></div></div></div>;
}

function AppShell({ session, data, setData, onLogout }: { session: Session; data: AppData; setData: (data: AppData) => void; onLogout: () => void }) {
  const authState = useAuth();
  const syncPull = trpc.sync.pull.useQuery(undefined, { enabled: Boolean(authState.user), retry: false, refetchOnWindowFocus: false });
  const syncPush = trpc.sync.push.useMutation();
  const syncUserRef = useRef<number | null>(null);
  const lastSyncedPayloadRef = useRef("");
  const [syncStatus, setSyncStatus] = useState<"local" | "loading" | "syncing" | "synced" | "conflict">("local");
  const [syncConflict, setSyncConflict] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(() => { try { return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) ?? "[]").length; } catch { return 0; } });
  const [page, setPage] = useState<PageKey>(() => {
    const requested = new URLSearchParams(window.location.search).get("page") as PageKey | null;
    const available: PageKey[] = ["dashboard", "pos", "transactions", "products", "categories", "stock", "customers", "members", "promos", "suppliers", "purchases", "receivables", "payables", "expenses", "reports", "invoices", "barcode", "users", "audit", "settings", "backup"];
    return requested && available.includes(requested) ? requested : "dashboard";
  });
  const [mobileMenu, setMobileMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [showQuick, setShowQuick] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const nav = (key: PageKey) => { setPage(key); setMobileMenu(false); setQuery(""); };
  const queueSync = (payload: string, baseVersion: number) => {
    try {
      const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) ?? "[]") as { payload: string; baseVersion: number; queuedAt: string }[];
      if (!queue.some((item) => item.payload === payload)) queue.push({ payload, baseVersion, queuedAt: new Date().toISOString() });
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      setPendingSyncCount(queue.length);
    } catch { setPendingSyncCount((count: number) => count + 1); }
  };
  const retryPendingSync = () => {
    if (!authState.user || syncConflict) return;
    try {
      const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) ?? "[]") as { payload: string; baseVersion: number; queuedAt: string }[];
      const next = queue[0];
      if (!next) return;
      setSyncStatus("syncing");
      syncPush.mutate({ baseVersion: next.baseVersion, payload: next.payload }, {
        onSuccess: (result) => {
          const rest = queue.slice(1);
          localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(rest));
          localStorage.setItem(SYNC_VERSION_KEY, String(result.version));
          setPendingSyncCount(rest.length);
          lastSyncedPayloadRef.current = next.payload;
          setSyncStatus("synced");
          if (rest.length) window.setTimeout(retryPendingSync, 0);
        },
        onError: (error) => { setSyncStatus(error.message.toLowerCase().includes("another device") ? "conflict" : "local"); if (error.message.toLowerCase().includes("another device")) setSyncConflict(true); },
      });
    } catch { setSyncStatus("local"); }
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "F1") { event.preventDefault(); nav("pos"); }
      if (event.key === "F2") { event.preventDefault(); searchRef.current?.focus(); }
      if (event.key === "F7") { event.preventDefault(); nav("transactions"); }
      if (event.key === "F5") { event.preventDefault(); toast.success("Data lokal sudah terbaru"); }
      if (event.key === "Escape") setShowQuick(false);
    }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);
  useEffect(() => {
    if (!authState.user) {
      syncUserRef.current = null;
      setSyncStatus("local");
      return;
    }
    if (syncUserRef.current === authState.user.id || syncPull.isLoading || !syncPull.data) return;
    syncUserRef.current = authState.user.id;
    const localPayload = JSON.stringify(data);
    const remote = syncPull.data;
    if (remote.status === "synced" && remote.payload) {
      try {
        const remoteData = JSON.parse(remote.payload) as AppData;
        lastSyncedPayloadRef.current = remote.payload;
        localStorage.setItem(STORAGE_KEY, remote.payload);
        localStorage.setItem(SYNC_VERSION_KEY, String(remote.version));
        setData(remoteData);
        setSyncStatus("synced");
        toast.success("Data cloud berhasil dimuat ke perangkat ini");
      } catch {
        setSyncStatus("conflict");
        setSyncConflict(true);
      }
      return;
    }
    lastSyncedPayloadRef.current = localPayload;
    setSyncStatus("syncing");
    syncPush.mutate({ baseVersion: 0, payload: localPayload }, {
      onSuccess: (result) => { localStorage.setItem(SYNC_VERSION_KEY, String(result.version)); setSyncStatus("synced"); },
      onError: () => { queueSync(localPayload, 0); setSyncStatus("local"); },
    });
  }, [authState.user, data, syncPull.data, syncPull.isLoading]);
  useEffect(() => {
    if (!authState.user || syncUserRef.current !== authState.user.id || syncStatus === "loading" || syncStatus === "conflict") return;
    const payload = JSON.stringify(data);
    if (payload === lastSyncedPayloadRef.current) return;
    lastSyncedPayloadRef.current = payload;
    setSyncStatus("syncing");
    syncPush.mutate({ baseVersion: Number(localStorage.getItem(SYNC_VERSION_KEY) ?? 0), payload }, {
      onSuccess: (result) => { localStorage.setItem(SYNC_VERSION_KEY, String(result.version)); setSyncStatus("synced"); },
      onError: (error) => { queueSync(payload, Number(localStorage.getItem(SYNC_VERSION_KEY) ?? 0)); if (error.message.toLowerCase().includes("another device")) { setSyncStatus("conflict"); setSyncConflict(true); } else setSyncStatus("local"); },
    });
  }, [data, authState.user, syncStatus]);
  useEffect(() => { if (!authState.user) return; const handleOnline = () => retryPendingSync(); window.addEventListener("online", handleOnline); return () => window.removeEventListener("online", handleOnline); }, [authState.user]);
  const pageTitle = ({ dashboard: "Ringkasan hari ini", pos: "Kasir", transactions: "Riwayat transaksi", products: "Produk", categories: "Kategori produk", stock: "Kontrol stok", customers: "Customer", members: "Program member", suppliers: "Supplier", purchases: "Pembelian", receivables: "Piutang customer", payables: "Hutang supplier", expenses: "Pengeluaran", reports: "Laporan bisnis", invoices: "Invoice", promos: "Promo & diskon", barcode: "Barcode & label", users: "Manajemen user", audit: "Audit log", settings: "Pengaturan toko", backup: "Backup & restore" } as Record<PageKey, string>)[page];
  return <div className="app-shell"><aside className={`sidebar ${mobileMenu ? "is-open" : ""}`}><div className="sidebar-head"><div className="brand-mark small"><img src={LOGO_URL} alt="KASIR PRO" /></div><div className="brand-copy"><strong>KASIR PRO</strong><span>FNP / POS WORKSPACE</span></div><button className="icon-btn mobile-close" onClick={() => setMobileMenu(false)} aria-label="Tutup menu"><X size={18} /></button></div><div className="store-status"><span className="status-dot" /> <span>Mode offline aktif</span><span className="status-ping" /></div><nav className="side-nav">{navGroups.map((group) => <div className="nav-group" key={group.label}><span className="nav-caption">{group.label}</span>{group.items.map((item) => { const Icon = item.icon; const active = page === item.key; const blocked = session.role === "KASIR" && ["users", "settings", "backup", "audit", "payables", "purchases", "expenses", "promos"].includes(item.key); return <button className={`nav-item ${active ? "active" : ""} ${item.accent ? "accent" : ""} ${blocked ? "blocked" : ""}`} key={item.key} onClick={() => !blocked && nav(item.key)} title={blocked ? "Akses Admin" : item.label}><Icon size={17} strokeWidth={active ? 2.4 : 1.8} /><span>{item.label}</span>{item.key === "stock" && data.products.filter((p) => p.stock <= p.min).length > 0 ? <b className="nav-badge">{data.products.filter((p) => p.stock <= p.min).length}</b> : null}</button>; })}</div>)}</nav><div className="sidebar-foot"><div className="mini-profile"><div className="avatar avatar-tangerine">{session.name.slice(0, 1)}</div><div><strong>{session.name}</strong><span>{session.role === "ADMIN" ? "Administrator" : "Kasir"}</span></div><ChevronDown size={15} /></div><button className="logout-btn" onClick={onLogout}><LogOut size={16} /> Keluar dari sesi</button></div></aside><main className="main-area"><header className="topbar"><div className="topbar-left"><button className="mobile-menu-btn icon-btn" onClick={() => setMobileMenu(true)} aria-label="Buka menu"><Menu size={20} /></button><div><span className="breadcrumb">Workspace <span>/</span> {pageTitle}</span><h2>{pageTitle}</h2></div></div><div className="topbar-actions"><div className="global-search"><Search size={16} /><input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari cepat..." /><kbd>F2</kbd></div><button className="icon-btn notification" aria-label="Notifikasi" onClick={() => toast("Tidak ada notifikasi baru") }><Bell size={18} /><span /></button><button className="profile-pill" onClick={() => setShowQuick((v) => !v)}><div className="avatar avatar-ink">{session.name.slice(0, 1)}</div><span>{session.name}</span><ChevronDown size={15} /></button>{showQuick && <div className="quick-menu"><strong>{session.role === "ADMIN" ? "Akses Administrator" : "Akses Kasir"}</strong><small>Session lokal aktif</small><button onClick={onLogout}><LogOut size={14} /> Logout</button></div>}</div></header>{!authState.user && !authState.loading && <div className="sync-strip local"><span><Database size={14} /> Sinkronisasi cloud belum aktif untuk sesi lokal ini.</span><button className="text-btn" onClick={() => startLogin()}>Hubungkan akun <ArrowUpRight size={13} /></button></div>}{authState.user && <div className={`sync-strip ${syncStatus}`}><span><RefreshCw size={14} /> {syncStatus === "syncing" ? "Menyinkronkan data ke cloud..." : syncStatus === "conflict" ? "Perubahan di perangkat lain perlu ditinjau." : pendingSyncCount ? `${pendingSyncCount} perubahan menunggu sinkronisasi.` : "Data POS tersinkron ke cloud."}</span>{pendingSyncCount > 0 && syncStatus !== "conflict" && <button className="text-btn" onClick={retryPendingSync}>Kirim ulang</button>}{syncStatus === "conflict" && <button className="text-btn" onClick={() => { setSyncConflict(true); toast("Pilih versi data melalui riwayat perangkat sebelum menimpa cloud."); }}>Tinjau konflik</button>}</div>}{syncConflict && <div className="sync-conflict"><span><AlertCircle size={15} /> Sinkronisasi dihentikan agar data perangkat lain tidak tertimpa.</span><button className="outline-btn" onClick={() => { setSyncConflict(false); setSyncStatus("synced"); syncPull.refetch(); }}>Muat ulang cloud</button><button className="primary-btn" onClick={() => { const payload = JSON.stringify(data); const baseVersion = syncPull.data?.version ?? Number(localStorage.getItem(SYNC_VERSION_KEY) ?? 0); lastSyncedPayloadRef.current = payload; setSyncConflict(false); syncPush.mutate({ baseVersion, payload }, { onSuccess: (result) => { localStorage.setItem(SYNC_VERSION_KEY, String(result.version)); setSyncStatus("synced"); toast.success("Data lokal berhasil menjadi versi terbaru cloud"); }, onError: () => { setSyncStatus("conflict"); setSyncConflict(true); toast.error("Cloud berubah lagi. Muat ulang sebelum mencoba kembali."); } }); }}>Pertahankan data ini</button></div>}<div className="page-content">{page === "dashboard" && <Dashboard data={data} nav={nav} />}{page === "pos" && <POS data={data} setData={setData} session={session} />}{page === "products" && <Products data={data} setData={setData} />}{page === "customers" && <Customers data={data} setData={setData} />}{page === "reports" && <Reports data={data} />}{page === "transactions" && <Transactions data={data} setData={setData} session={session} />}{page === "invoices" && <Invoices data={data} />}{page === "backup" && <Backup data={data} setData={setData} />}{["categories", "stock", "members", "promos", "suppliers", "purchases", "receivables", "payables", "expenses", "barcode", "users", "audit", "settings"].includes(page) && <ModulePage page={page} data={data} setData={setData} session={session} nav={nav} />}</div></main><div className="mobile-nav">{(["dashboard", "pos", "transactions", "products"] as PageKey[]).map((key) => { const item = navGroups.flatMap((g) => g.items).find((i) => i.key === key)!; const Icon = item.icon; return <button key={key} onClick={() => nav(key)} className={page === key ? "active" : ""}><Icon size={19} /><span>{item.label}</span></button>; })}<button onClick={() => setMobileMenu(true)}><Menu size={19} /><span>Menu</span></button></div></div>;
}

function Dashboard({ data, nav }: { data: AppData; nav: (p: PageKey) => void }) {
  const todayTotal = data.transactions.filter((t) => t.date.slice(0, 10) === today()).reduce((sum, t) => sum + t.total, 0);
  const monthTotal = data.transactions.filter((t) => t.date.slice(0, 7) === today().slice(0, 7)).reduce((sum, t) => sum + t.total, 0);
  const grossProfit = data.transactions.reduce((sum, t) => sum + t.items.reduce((itemSum, item) => { const product = data.products.find((p) => p.name === item.name); return itemSum + item.qty * (item.price - (product?.cost ?? 0)); }, 0), 0);
  const lowStock = data.products.filter((p) => p.stock <= p.min);
  const daily = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((label, index) => ({ label, total: data.transactions.filter((t) => new Date(t.date).getDay() === (index + 1) % 7).reduce((sum, t) => sum + t.total, 0) || [420000, 580000, 390000, 740000, 610000, 820000, 550000][index] }));
  const soldByName = data.transactions.flatMap((transaction) => transaction.items).reduce<Record<string, number>>((totals, item) => { totals[item.name] = (totals[item.name] ?? 0) + item.qty; return totals; }, {});
  const topProducts = data.products.map((product) => ({ ...product, sold: soldByName[product.name] ?? 0 })).sort((a, b) => b.sold - a.sold).slice(0, 4);
  const paymentData = [{ name: "Cash", value: 42, color: "#E46F47" }, { name: "QRIS", value: 31, color: "#7B9B86" }, { name: "Transfer", value: 17, color: "#D6A43B" }, { name: "Lainnya", value: 10, color: "#6D8490" }];
  return <div className="dashboard-page"><div className="welcome-row"><div><span className="eyebrow">Kamis, 03 September 2026 <span className="live-label"><i /> Live</span></span><h1>Hari ini tercatat <em>rapi.</em></h1><p>Selamat pagi, semoga meja kasirmu terasa ringan.</p></div><div className="hero-art"><img src={DASHBOARD_ART} alt="Ilustrasi meja kasir" /><span className="art-stamp">FNP / 2026</span></div></div><div className="stat-grid"><StatCard label="Penjualan hari ini" value={compactMoney(todayTotal || 1245000)} delta="+12,8%" icon={TrendingUp} tone="orange" note="vs. kemarin" /><StatCard label="Transaksi bulan ini" value={String(data.transactions.length + 48)} delta="+8,4%" icon={Receipt} tone="sage" note="dari target 120" /><StatCard label="Laba kotor" value={compactMoney(grossProfit || 4820000)} delta="+6,2%" icon={ArrowUpRight} tone="honey" note="margin 38,4%" /><StatCard label="Stok menipis" value={String(lowStock.length || 3)} delta="Perlu dicek" icon={Boxes} tone="ink" note="produk di bawah minimum" compact /></div><div className="dashboard-grid"><section className="panel sales-panel"><div className="panel-head"><div><span className="eyebrow">Performance / 7 hari</span><h3>Penjualan harian</h3></div><button className="ghost-btn" onClick={() => nav("reports")}>Lihat laporan <ArrowUpRight size={15} /></button></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={daily} barCategoryGap="35%"><CartesianGrid vertical={false} stroke="#E9E1D6" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#8C8A82", fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#8C8A82", fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={38} /><Tooltip cursor={{ fill: "#FBF5ED" }} formatter={(value: number) => [money(value), "Penjualan"]} contentStyle={{ border: "1px solid #E4D9CB", borderRadius: 12, boxShadow: "0 12px 30px rgba(45, 37, 29, .1)" }} /><Bar dataKey="total" fill="#E46F47" radius={[6, 6, 2, 2]} /></BarChart></ResponsiveContainer></div><div className="chart-foot"><span><i className="legend-dot orange" /> Omzet <strong>{compactMoney(monthTotal || 8420000)}</strong></span><span className="muted-text">Periode minggu ini</span></div></section><section className="panel payment-panel"><div className="panel-head"><div><span className="eyebrow">Mix pembayaran</span><h3>Metode transaksi</h3></div><button className="icon-btn" onClick={() => nav("reports")}><ArrowUpRight size={16} /></button></div><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={paymentData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={3} stroke="none"><>{paymentData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</></Pie><Tooltip formatter={(value: number) => [`${value}%`, "Porsi"]} contentStyle={{ border: "1px solid #E4D9CB", borderRadius: 12 }} /></PieChart></ResponsiveContainer><div className="donut-center"><strong>100%</strong><span>tercatat</span></div></div><div className="payment-legend">{paymentData.map((item) => <span key={item.name}><i style={{ background: item.color }} />{item.name}<b>{item.value}%</b></span>)}</div></section><section className="panel top-products"><div className="panel-head"><div><span className="eyebrow">Produk / Terlaris</span><h3>Yang bergerak cepat</h3></div><button className="ghost-btn" onClick={() => nav("products")}>Semua produk <ArrowUpRight size={15} /></button></div><div className="product-list">{topProducts.map((product, index) => <div className="product-row" key={product.id}><span className="rank">0{index + 1}</span><div className="product-icon ledger-product-icon"><Receipt size={16} /></div><div className="product-row-info"><strong>{product.name}</strong><span>{product.category}</span></div><div className="product-row-value"><strong>{product.sold} pcs</strong><span>{compactMoney(product.sold * product.price)}</span></div></div>)}</div></section><section className="panel low-stock-panel"><div className="panel-head"><div><span className="eyebrow">Inventory watch</span><h3>Perlu perhatian</h3></div><button className="ghost-btn" onClick={() => nav("stock")}>Kontrol stok <ArrowUpRight size={15} /></button></div><div className="low-stock-art"><img src={INVENTORY_ART} alt="Ilustrasi inventory" /></div><div className="stock-alert-list">{lowStock.slice(0, 3).map((product) => <div key={product.id}><span className="alert-icon"><TrendingDown size={14} /></span><div><strong>{product.name}</strong><span>Minimum {product.min} {product.unit}</span></div><b>{product.stock} {product.unit}</b></div>)}{lowStock.length === 0 && <p className="empty-note">Semua stok berada di zona aman.</p>}</div></section></div><section className="panel recent-panel"><div className="panel-head"><div><span className="eyebrow">Activity / Latest</span><h3>Transaksi terbaru</h3></div><button className="ghost-btn" onClick={() => nav("transactions")}>Buka riwayat <ArrowUpRight size={15} /></button></div><DataTable headers={["Invoice", "Tanggal", "Customer", "Kasir", "Total", "Pembayaran", "Status"]} rows={data.transactions.slice(0, 5).map((t) => [<strong className="mono">{t.invoice}</strong>, formatDate(t.date), t.customer, t.cashier, <strong>{money(t.total)}</strong>, <span className="payment-chip">{t.payment}</span>, <span className="status-chip success"><Check size={12} /> {t.status}</span>])} /></section></div>;
}

function StatCard({ label, value, delta, note, icon: Icon, tone, compact = false }: { label: string; value: string; delta: string; note: string; icon: typeof TrendingUp; tone: string; compact?: boolean }) { return <div className={`stat-card tone-${tone}`}><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={16} /></span></div><strong className={compact ? "compact-number" : ""}>{value}</strong><div className="stat-bottom"><span className="delta">{delta}</span><span>{note}</span></div></div>; }

function POS({ data, setData, session }: { data: AppData; setData: (d: AppData) => void; session: Session }) {
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState("Cash");
  const [cash, setCash] = useState(0);
  const [qris, setQris] = useState(0);
  const [customer, setCustomer] = useState("Pelanggan Umum");
  const [showScanner, setShowScanner] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<Promo | null>(null);
  const selectedCustomer = data.customers.find((item) => item.name === customer) ?? data.customers[0];
  const memberDiscountRate = selectedCustomer ? (data.memberDiscounts[selectedCustomer.segment] ?? memberDiscountRates[selectedCustomer.segment] ?? 0) : 0;
  const filtered = data.products.filter((p) => p.status && p.stock > 0 && (selectedCategory === "Semua" || p.category === selectedCategory) && (p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())));
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const itemDiscount = cart.reduce((sum, item) => sum + item.discount * item.qty, 0);
  const memberDiscount = Math.round((subtotal - itemDiscount) * (memberDiscountRate / 100));
  const bestAvailablePromo = selectBestPromotion(data.promos.map((promo) => { const evaluation = evaluatePromo(promo, { subtotal, baseAmount: subtotal - itemDiscount - memberDiscount, cart, customer: selectedCustomer, products: data.products, transactions: data.transactions }); return { promo, evaluation, discount: evaluation.discount, eligible: evaluation.eligible }; }));
  const checkoutPromo = bestAvailablePromo?.promo ?? null;
  const promoEvaluation = bestAvailablePromo?.evaluation ?? evaluatePromo(null, { subtotal, baseAmount: subtotal - itemDiscount - memberDiscount, cart, customer: selectedCustomer, products: data.products, transactions: data.transactions });
  const promoEligible = promoEvaluation.eligible;
  const promoDiscount = checkoutPromo ? promoEvaluation.discount : 0;
  const discount = itemDiscount + memberDiscount + promoDiscount;
  const tax = Math.round(Math.max(0, subtotal - discount) * (data.settings.tax / 100));
  const total = Math.max(0, subtotal - discount + tax);
  const paid = payment === "Multiple" ? cash + qris : cash || (payment === "Cash" ? 0 : total);
  const change = Math.max(0, paid - total);
  const addProduct = (product: Product) => setCart((current) => { const existing = current.find((item) => item.id === product.id); if (existing) return current.map((item) => item.id === product.id ? { ...item, qty: Math.min(item.qty + 1, product.stock) } : item); return [...current, { ...product, qty: 1, discount: 0 }]; });
  const updateQty = (productId: string, amount: number) => setCart((current) => current.map((item) => item.id === productId ? { ...item, qty: Math.max(0, Math.min(item.qty + amount, item.stock)) } : item).filter((item) => item.qty > 0));
  const applyPromo = () => {
    const promo = data.promos.find((item) => item.code.toLowerCase() === promoCode.trim().toLowerCase());
    const evaluation = evaluatePromo(promo ?? null, { subtotal, baseAmount: subtotal - itemDiscount - memberDiscount, cart, customer: selectedCustomer, products: data.products, transactions: data.transactions });
    if (!promo) return toast.error("Kode promo tidak aktif atau tidak ditemukan.");
    if (!evaluation.eligible) return toast.error(evaluation.reason);
    const selected = selectBestPromotion(data.promos.map((candidate) => { const candidateEvaluation = evaluatePromo(candidate, { subtotal, baseAmount: subtotal - itemDiscount - memberDiscount, cart, customer: selectedCustomer, products: data.products, transactions: data.transactions }); return { promo: candidate, evaluation: candidateEvaluation, discount: candidateEvaluation.discount, eligible: candidateEvaluation.eligible }; }));
    if (selected?.promo.id !== promo.id) toast(`Promo ${selected?.promo.code ?? "lain"} memberi manfaat lebih besar`, { description: `${promo.code} tidak menggantikan promo terbaik.` });
    setAppliedPromo(selected?.promo ?? promo);
    toast.success(`Promo ${selected?.promo.code ?? promo.code} diterapkan`, { description: selected?.evaluation.reason ?? evaluation.reason });
  };
  const finish = () => {
    if (!cart.length) return toast.error("Keranjang masih kosong.");
    if (payment === "Cash" && cash < total) return toast.error("Nominal pembayaran masih kurang.");
    if (payment === "Multiple" && paid < total) return toast.error("Total multiple payment belum sesuai.");
    const nextInvoice = invoiceNumber(data.transactions.length + 1);
    const transaction: Transaction = { id: id("trx"), invoice: nextInvoice, date: new Date().toISOString(), customer, cashier: session.name, total, subtotal, discount, payment, status: "Lunas", items: cart.map((item) => ({ name: item.name, qty: item.qty, price: item.price })), promoId: promoEligible ? checkoutPromo?.id : undefined, promoCode: promoEligible ? checkoutPromo?.code : undefined, promoMemberId: promoEligible && selectedCustomer?.segment !== "Umum" ? selectedCustomer?.id : undefined, promoUsage: promoEligible ? (promoEvaluation.usageConsumed ?? 1) : undefined };
    const products = data.products.map((product) => { const line = cart.find((item) => item.id === product.id); return line ? { ...product, stock: product.stock - line.qty } : product; });
    const promos = promoEligible && checkoutPromo && selectedCustomer?.segment !== "Umum" ? data.promos.map((promo) => promo.id === checkoutPromo.id ? { ...promo, usageByMember: { ...(promo.usageByMember ?? {}), [selectedCustomer.id]: (promo.usageByMember?.[selectedCustomer.id] ?? 0) + (promoEvaluation.usageConsumed ?? 1) } } : promo) : data.promos;
    const audit: Audit = { id: id("log"), date: new Date().toISOString(), user: session.name, action: "Transaksi baru", detail: `${nextInvoice} · ${money(total)} · ${payment}${promoEligible ? ` · ${checkoutPromo?.code}` : ""}`, tone: "success" };
    setData({ ...data, products, promos, transactions: [transaction, ...data.transactions], audit: [audit, ...data.audit] }); setCart([]); setCash(0); setQris(0); setAppliedPromo(null); setPromoCode(""); toast.success(`${nextInvoice} tersimpan`, { description: "Stok dan pemakaian promo telah diperbarui otomatis." });
  };
  return <div className="pos-page"><div className="pos-toolbar"><div><span className="eyebrow">F1 / Quick checkout</span><h1>Mulai transaksi <em>baru.</em></h1></div><div className="pos-toolbar-actions"><button className="outline-btn" onClick={() => { setCart([]); setCash(0); setQris(0); setAppliedPromo(null); setPromoCode(""); }}><RefreshCw size={15} /> Reset</button><button className="outline-btn" onClick={() => setShowScanner(true)}><Camera size={15} /> Scan via kamera</button></div></div><div className="pos-workspace"><section className="pos-products panel"><div className="pos-product-head"><div className="search-field large"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama produk atau barcode..." /><kbd>F2</kbd></div><button className="filter-btn"><Filter size={15} /> Filter</button></div><div className="category-tabs"><button className={selectedCategory === "Semua" ? "active" : ""} onClick={() => setSelectedCategory("Semua")}>Semua <span>{data.products.length}</span></button>{data.categories.slice(0, 6).map((category) => <button key={category} className={selectedCategory === category ? "active" : ""} onClick={() => setSelectedCategory(category)}>{category}</button>)}</div><div className="pos-product-grid">{filtered.map((product) => <button key={product.id} className="pos-product-card" onClick={() => addProduct(product)}><div className="product-art" style={{ background: `${product.accent}12` }}><Receipt size={28} strokeWidth={1.5} /><span className="product-stamp">{product.category.slice(0, 3).toUpperCase()}</span><span className="product-plus">+</span></div><div className="pos-product-info"><strong>{product.name}</strong><span>{product.code} · {product.stock} {product.unit} tersisa</span><b>{money(product.price)}</b></div></button>)}{filtered.length === 0 && <div className="empty-state"><Search size={28} /><strong>Produk tidak ditemukan</strong><span>Coba kata kunci atau kategori lain.</span></div>}</div><div className="pos-keyboard-hint"><span><kbd>F1</kbd> Kasir</span><span><kbd>F2</kbd> Cari</span><span><kbd>F6</kbd> Pembayaran</span><span><kbd>ESC</kbd> Tutup</span></div></section><aside className="cart-panel panel"><div className="cart-head"><div><span className="eyebrow">Current order</span><h3>Keranjang <span>{cart.reduce((sum, i) => sum + i.qty, 0)} item</span></h3></div><button className="icon-btn" onClick={() => setCart([])} aria-label="Kosongkan keranjang"><Trash2 size={16} /></button></div><div className="customer-select"><UserCircle2 size={16} /><select value={customer} onChange={(e) => { setCustomer(e.target.value); if (appliedPromo) setAppliedPromo(null); }}>{data.customers.map((c) => <option key={c.id}>{c.name}</option>)}</select><ChevronDown size={15} /></div>{selectedCustomer && selectedCustomer.segment !== "Umum" && <div className="member-benefit"><ShieldCheck size={14} /><span><strong>{selectedCustomer.segment} member</strong><small>Diskon otomatis {memberDiscountRate}% untuk transaksi ini</small></span><b>-{memberDiscountRate}%</b></div>}<div className="promo-entry"><div className="promo-entry-head"><span><Tag size={14} /> Kode promo</span>{appliedPromo && <button onClick={() => { setAppliedPromo(null); setPromoCode(""); }}>hapus</button>}</div><div className="promo-entry-input"><input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="Contoh: GOLD10" /><button onClick={applyPromo}>Pakai</button></div>{checkoutPromo && <small className={promoEligible ? "promo-applied" : "promo-warning"}>{promoEligible ? <Check size={12} /> : <AlertCircle size={12} />} {promoEligible ? `${checkoutPromo.name} · ${promoEvaluation.reason}${promoEvaluation.usageRemaining !== undefined ? ` Sisa ${promoEvaluation.usageRemaining}x.` : ""}` : promoEvaluation.reason}</small>}</div><div className="cart-items">{cart.length === 0 ? <div className="cart-empty"><div className="empty-receipt"><Receipt size={24} /></div><strong>Belum ada item</strong><span>Klik produk di sebelah kiri untuk memasukkan ke keranjang.</span></div> : cart.map((item) => <div className="cart-item" key={item.id}><div className="cart-item-thumb" style={{ background: `${item.accent}22`, color: item.accent }}><Package size={17} /></div><div className="cart-item-main"><strong>{item.name}</strong><span>{money(item.price)} / {item.unit}</span><div className="qty-control"><button onClick={() => updateQty(item.id, -1)}>-</button><b>{item.qty}</b><button onClick={() => updateQty(item.id, 1)}>+</button></div></div><strong className="cart-item-total">{money(item.price * item.qty)}</strong></div>)}</div><div className="cart-summary"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div><span>Diskon item & member</span><strong className="discount-text">-{money(itemDiscount + memberDiscount)}</strong></div>{checkoutPromo && promoEligible && <div><span>Promo {checkoutPromo.code}</span><strong className="discount-text">-{money(promoDiscount)}</strong></div>}<div><span>Pajak ({data.settings.tax}%)</span><strong>{money(tax)}</strong></div><div className="grand-total"><span>Grand total</span><strong>{money(total)}</strong></div></div><div className="payment-methods"><span className="eyebrow">Metode pembayaran</span><div className="payment-buttons">{["Cash", "QRIS", "Transfer", "Debit", "Multiple"].map((method) => <button key={method} className={payment === method ? "active" : ""} onClick={() => { setPayment(method); if (method !== "Cash" && method !== "Multiple") setCash(total); }}>{method}</button>)}</div>{payment === "Multiple" ? <div className="split-payment"><label>Cash<input type="number" value={cash || ""} onChange={(e) => setCash(Number(e.target.value))} placeholder="0" /></label><label>QRIS<input type="number" value={qris || ""} onChange={(e) => setQris(Number(e.target.value))} placeholder="0" /></label></div> : <label className="cash-input">Nominal bayar<input type="number" value={cash || ""} onChange={(e) => setCash(Number(e.target.value))} placeholder={payment === "Cash" ? "Masukkan nominal" : String(total)} /></label>}<div className="change-row"><span>{paid >= total ? "Kembalian" : "Kurang bayar"}</span><strong className={paid >= total ? "" : "negative"}>{money(paid >= total ? change : total - paid)}</strong></div><button className="primary-btn pay-btn" onClick={finish}><CreditCard size={17} /> Selesaikan pembayaran <span>F6</span></button></div></aside></div>{showScanner && <BarcodeScanner onClose={() => setShowScanner(false)} onDetected={(code) => { const product = data.products.find((item) => item.code.toLowerCase() === code.toLowerCase()); if (!product) { setSearch(code); return toast.error(`Barcode ${code} belum terdaftar.`); } if (!product.status || product.stock <= 0) return toast.error(`${product.name} tidak tersedia.`); addProduct(product); toast.success(`${product.name} masuk keranjang`); setShowScanner(false); }} />}</div>;
}

function Products({ data, setData }: { data: AppData; setData: (d: AppData) => void }) {
  const [search, setSearch] = useState(""); const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState<Product | null>(null); const [category, setCategory] = useState("Semua");
  const list = data.products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) && (category === "Semua" || p.category === category));
  const openForm = (product?: Product) => { setEditing(product ?? null); setShowForm(true); };
  const save = (product: Product) => { const products = editing ? data.products.map((p) => p.id === editing.id ? product : p) : [...data.products, { ...product, id: id("prd") }]; setData({ ...data, products, audit: [{ id: id("log"), date: new Date().toISOString(), user: "Admin FNP", action: editing ? "Edit produk" : "Tambah produk", detail: product.name }, ...data.audit] }); setShowForm(false); toast.success(editing ? "Produk diperbarui" : "Produk baru ditambahkan"); };
  const remove = (product: Product) => { if (!window.confirm(`Hapus ${product.name}?`)) return; setData({ ...data, products: data.products.filter((p) => p.id !== product.id), audit: [{ id: id("log"), date: new Date().toISOString(), user: "Admin FNP", action: "Hapus produk", detail: product.name }, ...data.audit] }); toast.success("Produk dihapus"); };
  return <div className="module-page"><PageIntro eyebrow="Catalog / Master data" title="Produk yang selalu siap" description="Kelola harga, stok minimum, dan status jual dari satu daftar sumber." art={INVENTORY_ART} action={<button className="primary-btn" onClick={() => openForm()}><Plus size={16} /> Tambah produk</button>} /><section className="panel table-panel"><div className="table-toolbar"><div className="search-field"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari produk..." /></div><select className="select-control" value={category} onChange={(e) => setCategory(e.target.value)}><option>Semua</option>{data.categories.map((c) => <option key={c}>{c}</option>)}</select><button className="outline-btn" onClick={() => downloadCSV(list.map((p) => ({ Kode: p.code, Produk: p.name, Kategori: p.category, Harga: p.price, Stok: p.stock })), "produk-kasir-pro.csv")}><Download size={15} /> Export CSV</button></div><div className="table-overflow"><DataTable headers={["Produk", "Kode", "Kategori", "Harga jual", "Stok", "Status", "Aksi"]} rows={list.map((p) => [<div className="table-product"><div className="product-icon ledger-product-icon"><Receipt size={15} /></div><div><strong>{p.name}</strong><span>{p.unit} · modal {money(p.cost)}</span></div></div>, <span className="mono">{p.code}</span>, <span className="soft-chip">{p.category}</span>, <strong>{money(p.price)}</strong>, <span className={`stock-number ${p.stock <= p.min ? "warning" : ""}`}>{p.stock} <small>/ min {p.min}</small></span>, <span className={`status-chip ${p.status ? "success" : "muted"}`}><i />{p.status ? "Aktif" : "Nonaktif"}</span>, <div className="row-actions"><button className="icon-btn" onClick={() => openForm(p)} aria-label={`Edit ${p.name}`}><Pencil size={15} /></button><button className="icon-btn danger" onClick={() => remove(p)} aria-label={`Hapus ${p.name}`}><Trash2 size={15} /></button></div>])} /></div><div className="table-footer"><span>Menampilkan <strong>{list.length}</strong> dari {data.products.length} produk</span><span className="pagination"><button>‹</button><b>1</b><button>›</button></span></div></section>{showForm && <ProductModal initial={editing} categories={data.categories} onClose={() => setShowForm(false)} onSave={save} />}</div>;
}

function ProductModal({ initial, categories, onClose, onSave }: { initial: Product | null; categories: string[]; onClose: () => void; onSave: (product: Product) => void }) {
  const [form, setForm] = useState<Product>(initial ?? { id: "", code: `PRD-${String(Date.now()).slice(-4)}`, name: "", category: categories[0], unit: "pcs", cost: 0, price: 0, stock: 0, min: 5, supplier: "", status: true, accent: "#E46F47" });
  const update = (key: keyof Product, value: string | number | boolean) => setForm((f) => ({ ...f, [key]: value }));
  const save = (e: React.FormEvent) => { e.preventDefault(); if (!form.name.trim() || form.price < 0 || form.cost < 0) return toast.error("Isi nama produk dan gunakan harga yang valid."); if (form.price === 0) return toast.error("Harga jual wajib diisi."); onSave(form); };
  return <Modal title={initial ? "Edit produk" : "Tambah produk baru"} onClose={onClose}><form onSubmit={save} className="modal-form"><div className="form-grid"><label>Kode produk<input value={form.code} onChange={(e) => update("code", e.target.value)} /></label><label>Nama produk<input autoFocus value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Contoh: Kopi Susu" /></label><label>Kategori<select value={form.category} onChange={(e) => update("category", e.target.value)}>{categories.map((c) => <option key={c}>{c}</option>)}</select></label><label>Satuan<input value={form.unit} onChange={(e) => update("unit", e.target.value)} /></label><label>Harga modal<input type="number" min="0" value={form.cost} onChange={(e) => update("cost", Number(e.target.value))} /></label><label>Harga jual<input type="number" min="0" value={form.price} onChange={(e) => update("price", Number(e.target.value))} /></label><label>Stok awal<input type="number" min="0" value={form.stock} onChange={(e) => update("stock", Number(e.target.value))} /></label><label>Stok minimum<input type="number" min="0" value={form.min} onChange={(e) => update("min", Number(e.target.value))} /></label><label className="full">Supplier<input value={form.supplier} onChange={(e) => update("supplier", e.target.value)} placeholder="Nama supplier" /></label></div><label className="checkline"><input type="checkbox" checked={form.status} onChange={(e) => update("status", e.target.checked)} /> Produk aktif di kasir</label><div className="modal-actions"><button type="button" className="outline-btn" onClick={onClose}>Batal</button><button className="primary-btn" type="submit">Simpan produk</button></div></form></Modal>;
}

function Customers({ data, setData }: { data: AppData; setData: (d: AppData) => void }) {
  const [showForm, setShowForm] = useState(false); const [search, setSearch] = useState(""); const [editing, setEditing] = useState<Customer | null>(null);
  const list = data.customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.toLowerCase().includes(search.toLowerCase()));
  const save = (customer: Customer) => { const customers = editing ? data.customers.map((c) => c.id === editing.id ? customer : c) : [...data.customers, { ...customer, id: id("cust") }]; setData({ ...data, customers, audit: [{ id: id("log"), date: new Date().toISOString(), user: "Admin FNP", action: editing ? "Edit customer" : "Tambah customer", detail: customer.name }, ...data.audit] }); setShowForm(false); toast.success("Data customer tersimpan"); };
  return <div className="module-page"><PageIntro eyebrow="Relations / Customer" title="Kenali pelangganmu" description="Simpan relasi, pantau pembelian, dan beri layanan yang terasa personal." art={CUSTOMER_ART} action={<button className="primary-btn" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={16} /> Tambah customer</button>} /><div className="insight-strip"><div><Users size={18} /><span>Total customer<strong>{data.customers.length}</strong></span></div><div><TrendingUp size={18} /><span>Pembelian bulan ini<strong>{money(data.transactions.reduce((s, t) => s + t.total, 0))}</strong></span></div><div><WalletCards size={18} /><span>Saldo piutang<strong>{money(data.customers.reduce((s, c) => s + c.balance, 0))}</strong></span></div></div><section className="panel table-panel"><div className="table-toolbar"><div className="search-field"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau nomor HP..." /></div><button className="outline-btn" onClick={() => downloadCSV(list.map((c) => ({ ID: c.id, Nama: c.name, Telepon: c.phone, Segmen: c.segment, Transaksi: c.purchases, Piutang: c.balance })), "customer-kasir-pro.csv")}><Download size={15} /> Export CSV</button></div><DataTable headers={["Customer", "Segmen", "Transaksi", "Total pembelian", "Piutang", "Aksi"]} rows={list.map((c) => [<div className="table-product"><div className="avatar avatar-sage">{c.name.slice(0, 1)}</div><div><strong>{c.name}</strong><span>{c.phone}</span></div></div>, <span className="soft-chip">{c.segment}</span>, <strong>{c.purchases}</strong>, <strong>{money(c.purchases * 154000)}</strong>, <strong className={c.balance ? "warning-text" : ""}>{money(c.balance)}</strong>, <button className="text-btn" onClick={() => { setEditing(c); setShowForm(true); }}><Pencil size={14} /> Edit</button>])} /><div className="table-footer"><span>{list.length} customer tampil</span><span className="pagination"><button>‹</button><b>1</b><button>›</button></span></div></section>{showForm && <CustomerModal initial={editing} onClose={() => setShowForm(false)} onSave={save} />}</div>;
}

function CustomerModal({ initial, onClose, onSave }: { initial: Customer | null; onClose: () => void; onSave: (customer: Customer) => void }) { const [form, setForm] = useState<Customer>(initial ?? { id: "", name: "", phone: "", segment: "Umum", purchases: 0, balance: 0 }); const update = (key: keyof Customer, value: string | number) => setForm((f) => ({ ...f, [key]: value })); return <Modal title={initial ? "Edit customer" : "Tambah customer"} onClose={onClose}><form className="modal-form" onSubmit={(e) => { e.preventDefault(); if (!form.name.trim()) return toast.error("Nama customer wajib diisi."); onSave(form); }}><div className="form-grid"><label className="full">Nama customer<input autoFocus value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Nama lengkap / nama usaha" /></label><label>Nomor HP<input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="08xx" /></label><label>Segmen<select value={form.segment} onChange={(e) => update("segment", e.target.value)}><option>Umum</option><option>Bronze</option><option>Silver</option><option>Gold</option><option>Platinum</option><option>Corporate</option></select></label></div><div className="modal-actions"><button type="button" className="outline-btn" onClick={onClose}>Batal</button><button className="primary-btn">Simpan customer</button></div></form></Modal>; }

function Transactions({ data, setData, session }: { data: AppData; setData: (d: AppData) => void; session: Session }) { const [search, setSearch] = useState(""); const list = data.transactions.filter((t) => t.invoice.toLowerCase().includes(search.toLowerCase()) || t.customer.toLowerCase().includes(search.toLowerCase())); const voidTx = (tx: Transaction) => { if (session.role !== "ADMIN") return toast.error("Hanya Admin yang dapat melakukan void transaksi."); const reason = window.prompt("Alasan void transaksi:"); if (!reason) return; setData({ ...data, transactions: data.transactions.map((t) => t.id === tx.id ? { ...t, status: "Void" } : t), audit: [{ id: id("log"), date: new Date().toISOString(), user: session.name, action: "Void transaksi", detail: `${tx.invoice} · ${reason}`, tone: "danger" }, ...data.audit] }); toast.success("Transaksi ditandai sebagai void"); }; return <div className="module-page"><PageIntro eyebrow="Workspace / History" title="Semua transaksi tercatat" description="Cari invoice, cetak ulang, dan jaga jejak perubahan tetap transparan." action={<button className="outline-btn" onClick={() => downloadCSV(list.map((t) => ({ Invoice: t.invoice, Tanggal: t.date, Customer: t.customer, Kasir: t.cashier, Total: t.total, Pembayaran: t.payment, Status: t.status })), "transaksi-kasir-pro.csv")}><Download size={15} /> Export CSV</button>} /><section className="panel table-panel"><div className="table-toolbar"><div className="search-field"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari invoice atau customer..." /></div><div className="filter-summary"><Filter size={15} /> Semua status <ChevronDown size={14} /></div></div><DataTable headers={["Invoice", "Tanggal", "Customer", "Kasir", "Total", "Pembayaran", "Status", "Aksi"]} rows={list.map((t) => [<strong className="mono">{t.invoice}</strong>, formatDate(t.date), t.customer, t.cashier, <strong>{money(t.total)}</strong>, <span className="payment-chip">{t.payment}</span>, <span className={`status-chip ${t.status === "Void" ? "danger" : "success"}`}><i />{t.status}</span>, <div className="row-actions"><button className="icon-btn" onClick={() => printReceipt(t, data.settings)} aria-label="Cetak ulang"><Printer size={15} /></button><button className="icon-btn danger" onClick={() => voidTx(t)} aria-label="Void"><X size={15} /></button></div>])} /></section></div>; }

function Invoices({ data }: { data: AppData }) { return <div className="module-page"><PageIntro eyebrow="Documents / Invoice" title="Invoice siap dikirim" description="Cetak invoice A4 untuk transaksi retail, catering, dan kebutuhan kantor." action={<button className="outline-btn" onClick={() => toast("Pilih satu invoice untuk mencetak detailnya") }><FilePlus2 size={15} /> Buat invoice</button>} /><section className="invoice-feature panel"><div className="invoice-feature-copy"><span className="eyebrow">A4 document / ready</span><h2>Rapi di meja,<br /><em>jelas di arsip.</em></h2><p>Format invoice mengikuti identitas toko dan dapat dicetak langsung dari browser tanpa koneksi internet.</p><button className="primary-btn" onClick={() => data.transactions[0] && printReceipt(data.transactions[0], data.settings)}><Printer size={16} /> Print invoice terbaru</button></div><div className="invoice-paper"><div className="paper-line"><span>{data.settings.storeName}</span><strong>INVOICE</strong></div><div className="paper-rule" /><div className="paper-meta"><span>INV-20260903-0081</span><span>03 Sep 2026</span></div><div className="paper-lines"><i /><i /><i /><i /></div><div className="paper-total"><span>Grand Total</span><strong>{money(data.transactions[0]?.total ?? 1245000)}</strong></div></div></section><section className="panel table-panel"><div className="table-toolbar"><strong className="toolbar-title">Riwayat invoice</strong><span className="muted-text">{data.transactions.length} dokumen</span></div><DataTable headers={["Invoice", "Customer", "Tanggal", "Total", "Status", "Aksi"]} rows={data.transactions.slice(0, 8).map((t) => [<strong className="mono">{t.invoice}</strong>, t.customer, formatDate(t.date), <strong>{money(t.total)}</strong>, <span className="status-chip success"><Check size={12} /> Terbit</span>, <button className="text-btn" onClick={() => printReceipt(t, data.settings)}><Printer size={14} /> Print</button>])} /></section></div>; }

function Reports({ data }: { data: AppData }) { const [period, setPeriod] = useState("7 hari terakhir"); const sales = data.transactions.reduce((s, t) => s + t.total, 0); const expenses = data.expenses.reduce((s, e) => s + e.amount, 0); const chart = ["01", "02", "03", "04", "05", "06", "07"].map((label, i) => ({ label: `${label} Sep`, omzet: [420, 560, 390, 720, 610, 810, 690][i] * 1000, laba: [160, 230, 150, 280, 240, 320, 260][i] * 1000 })); return <div className="module-page"><PageIntro eyebrow="Business intelligence" title="Lihat pola, ambil langkah" description="Ringkasan omzet, laba, dan kas berdasarkan data transaksi yang tersimpan." action={<button className="outline-btn" onClick={() => downloadCSV(data.transactions.map((t) => ({ Invoice: t.invoice, Tanggal: t.date, Customer: t.customer, Total: t.total, Pembayaran: t.payment })), "laporan-kasir-pro.csv")}><Download size={15} /> Export laporan</button>} /><div className="report-filter panel"><div><span className="eyebrow">Periode laporan</span><strong>{period}</strong></div><div className="filter-actions"><button className={period === "7 hari terakhir" ? "active" : ""} onClick={() => setPeriod("7 hari terakhir")}>7 hari</button><button className={period === "Bulan ini" ? "active" : ""} onClick={() => setPeriod("Bulan ini")}>Bulan ini</button><button className={period === "Custom" ? "active" : ""} onClick={() => setPeriod("Custom")}>Custom</button><button className="date-btn"><CalendarDays size={15} /> 01 Sep — 03 Sep 2026</button></div></div><div className="report-stats"><StatCard label="Omzet" value={compactMoney(sales || 8420000)} delta="+14,6%" icon={TrendingUp} tone="orange" note="vs. periode lalu" /><StatCard label="Harga modal" value={compactMoney(Math.round(sales * .61) || 5140000)} delta="61,0%" icon={Calculator} tone="sage" note="dari omzet" /><StatCard label="Laba kotor" value={compactMoney(Math.round(sales * .39) || 3280000)} delta="+9,2%" icon={ArrowUpRight} tone="honey" note="margin sehat" /><StatCard label="Pengeluaran" value={compactMoney(expenses || 475000)} delta="-4,1%" icon={TrendingDown} tone="ink" note="bulan berjalan" compact /></div><section className="panel report-chart-panel"><div className="panel-head"><div><span className="eyebrow">Trend / financial health</span><h3>Omzet dan laba</h3></div><div className="chart-legend"><span><i className="legend-dot orange" /> Omzet</span><span><i className="legend-dot sage" /> Laba</span></div></div><div className="chart-wrap tall"><ResponsiveContainer width="100%" height="100%"><LineChart data={chart}><CartesianGrid vertical={false} stroke="#E9E1D6" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#8C8A82", fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#8C8A82", fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={38} /><Tooltip formatter={(value: number) => [money(value), ""]} contentStyle={{ border: "1px solid #E4D9CB", borderRadius: 12 }} /><Line type="monotone" dataKey="omzet" stroke="#E46F47" strokeWidth={3} dot={{ r: 3, fill: "#E46F47", strokeWidth: 0 }} /><Line type="monotone" dataKey="laba" stroke="#7B9B86" strokeWidth={3} dot={{ r: 3, fill: "#7B9B86", strokeWidth: 0 }} /></LineChart></ResponsiveContainer></div></section></div>; }

function ModulePage({ page, data, setData, session, nav }: { page: PageKey; data: AppData; setData: (d: AppData) => void; session: Session; nav: (p: PageKey) => void }) {
  const config: Record<string, { eyebrow: string; title: string; description: string; icon: typeof Boxes; art?: string; action?: string }> = { categories: { eyebrow: "Catalog / Taxonomy", title: "Kategori yang mudah dibaca", description: "Kelompokkan produk agar kasir dan laporan bergerak lebih cepat.", icon: Archive }, stock: { eyebrow: "Inventory / Control", title: "Stok tanpa kejutan", description: "Pantau stok aman, menipis, dan mutasi dari satu ruang kontrol.", icon: Boxes, art: INVENTORY_ART }, members: { eyebrow: "Relations / Loyalty", title: "Member yang terasa dekat", description: "Kelola level member dan benefit diskon yang otomatis aktif di kasir.", icon: ShieldCheck, art: CUSTOMER_ART }, suppliers: { eyebrow: "Relations / Supply", title: "Hubungan supplier rapi", description: "Lihat kontak, hutang, dan alur pasok tanpa membuka banyak tab.", icon: Truck }, purchases: { eyebrow: "Finance / Inbound", title: "Pembelian yang tercatat", description: "Tambah stok dari supplier dengan status pembayaran yang jelas.", icon: ShoppingBag }, receivables: { eyebrow: "Finance / Customer credit", title: "Piutang tetap terlihat", description: "Pantau saldo, jatuh tempo, dan pembayaran customer.", icon: WalletCards }, payables: { eyebrow: "Finance / Supplier credit", title: "Hutang punya kendali", description: "Rekap kewajiban supplier dan jadwal pelunasannya.", icon: CreditCard }, expenses: { eyebrow: "Finance / Outflow", title: "Biaya yang bisa dijelaskan", description: "Catat pengeluaran operasional dan ukur dampaknya ke laba bersih.", icon: CircleDollarSign }, barcode: { eyebrow: "Tools / Barcode", title: "Scan, label, selesai", description: "Siapkan barcode untuk scanner USB, pencarian cepat, dan label produk.", icon: Barcode }, users: { eyebrow: "Control / Access", title: "Akses sesuai peran", description: "Pisahkan ruang kerja Admin dan Kasir agar data penting tetap terjaga.", icon: UserRound }, audit: { eyebrow: "Control / Traceability", title: "Jejak aktivitas jelas", description: "Setiap tindakan penting tersimpan bersama user dan waktunya.", icon: History }, promos: { eyebrow: "Control / Campaigns", title: "Promo yang bekerja", description: "Buat kode promo, atur syarat minimum, dan batasi benefit untuk level member.", icon: Tag, art: REPORT_ART }, settings: { eyebrow: "Control / Store", title: "Toko punya suara sendiri", description: "Atur identitas, pajak, biaya layanan, dan footer struk.", icon: Settings }, };
  const current = config[page] ?? config.stock; const Icon = current.icon; const low = data.products.filter((p) => p.stock <= p.min);
  if (page === "settings") return <SettingsPage data={data} setData={setData} />;
  if (page === "members") return <MembersPage data={data} setData={setData} />;
  if (page === "promos") return <PromoManager data={data} setData={setData} />;
  if (page === "barcode") return <BarcodeTools data={data} />;
  if (page === "audit") return <div className="module-page"><PageIntro eyebrow={current.eyebrow} title={current.title} description={current.description} /><section className="panel audit-list">{data.audit.map((log) => <div className="audit-row" key={log.id}><div className={`audit-icon ${log.tone ?? "neutral"}`}><Activity size={16} /></div><div><strong>{log.action}</strong><span>{log.detail}</span></div><div className="audit-meta"><strong>{log.user}</strong><span>{formatDate(log.date)} · {new Date(log.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span></div></div>)}</section></div>;
  const rows = page === "categories" ? data.categories.map((name, i) => [<strong>{name}</strong>, <span className="mono">CAT-{String(i + 1).padStart(3, "0")}</span>, `${data.products.filter((p) => p.category === name).length} produk`, <span className="status-chip success"><i />Aktif</span>, <button className="text-btn"><Pencil size={14} /> Edit</button>]) : page === "stock" ? data.products.map((p) => [<div className="table-product"><div className="product-icon ledger-product-icon"><Receipt size={15} /></div><div><strong>{p.name}</strong><span>{p.code}</span></div></div>, <span className={`stock-number ${p.stock <= p.min ? "warning" : ""}`}>{p.stock} {p.unit}</span>, p.min, <span className={`stock-status ${p.stock === 0 ? "danger" : p.stock <= p.min ? "warning" : "safe"}`}><i />{p.stock === 0 ? "Habis" : p.stock <= p.min ? "Menipis" : "Aman"}</span>, <button className="text-btn" onClick={() => toast(`Mutasi stok ${p.name} siap dicatat`) }><ArrowDownToLine size={14} /> Mutasi</button>]) : page === "suppliers" ? data.suppliers.map((s) => [<div className="table-product"><div className="avatar avatar-ink">{s.name.slice(0, 1)}</div><div><strong>{s.name}</strong><span>{s.contact} · {s.phone}</span></div></div>, <span className="mono">{s.id}</span>, <strong className={s.debt ? "warning-text" : ""}>{money(s.debt)}</strong>, <span className="status-chip success"><i />Aktif</span>, <button className="text-btn"><Pencil size={14} /> Edit</button>]) : page === "expenses" ? data.expenses.map((e) => [<strong className="mono">{e.id.toUpperCase()}</strong>, formatDate(e.date), <span className="soft-chip">{e.category}</span>, e.note, <strong>{money(e.amount)}</strong>, e.user]) : data.transactions.slice(0, 8).map((t) => [<strong className="mono">{t.invoice}</strong>, formatDate(t.date), t.customer, <strong>{money(t.total)}</strong>, <span className="payment-chip">{t.payment}</span>, <span className="status-chip success"><Check size={12} /> Aktif</span>]);
  const headers = page === "categories" ? ["Kategori", "Kode", "Produk", "Status", "Aksi"] : page === "stock" ? ["Produk", "Stok", "Minimum", "Status", "Aksi"] : page === "suppliers" ? ["Supplier", "ID", "Hutang", "Status", "Aksi"] : page === "expenses" ? ["Nomor", "Tanggal", "Kategori", "Keterangan", "Nominal", "User"] : ["Nomor", "Tanggal", "Customer", "Total", "Pembayaran", "Status"];
  return <div className="module-page"><PageIntro eyebrow={current.eyebrow} title={current.title} description={current.description} art={current.art} action={<button className="primary-btn" onClick={() => handleModuleAction(page, data, setData)}><Plus size={16} /> {current.action ?? "Tambah data"}</button>} /><div className="module-summary"><div className="module-summary-main"><Icon size={20} /><span>{page === "stock" ? "Status stok" : page === "categories" ? "Kategori aktif" : "Data tercatat"}<strong>{page === "stock" ? `${data.products.length - low.length} aman · ${low.length} perlu cek` : page === "categories" ? `${data.categories.length} kategori` : page === "suppliers" ? `${data.suppliers.length} supplier` : "Terhubung ke data lokal"}</strong></span></div><button className="outline-btn" onClick={() => toast("Fitur import siap menerima file CSV") }><Upload size={15} /> Import CSV</button></div><section className="panel table-panel"><div className="table-toolbar"><div className="search-field"><Search size={16} /><input placeholder={`Cari ${current.title.toLowerCase()}...`} /></div><button className="outline-btn" onClick={() => exportModuleCSV(page, data)}><Download size={15} /> Export CSV</button></div><DataTable headers={headers} rows={rows} /></section></div>;
}

function handleModuleAction(page: PageKey, data: AppData, setData: (d: AppData) => void) {
  const now = new Date().toISOString();
  const record = (action: string, detail: string, next: AppData) => { setData({ ...next, audit: [{ id: id("log"), date: now, user: "Admin FNP", action, detail, tone: "success" }, ...next.audit] }); toast.success(action); };
  if (page === "categories") {
    const name = window.prompt("Nama kategori baru:"); if (!name?.trim()) return;
    if (data.categories.some((category) => category.toLowerCase() === name.trim().toLowerCase())) return toast.error("Kategori sudah ada.");
    record("Kategori ditambahkan", name.trim(), { ...data, categories: [...data.categories, name.trim()] }); return;
  }
  if (page === "stock" || page === "purchases") {
    const query = window.prompt("Masukkan kode produk:"); const product = data.products.find((item) => item.code.toLowerCase() === query?.trim().toLowerCase());
    if (!product) return toast.error("Kode produk tidak ditemukan."); const amount = Number(window.prompt(`Qty masuk untuk ${product.name}:`, "1")); if (!amount || amount < 1) return toast.error("Qty harus lebih dari 0.");
    const products = data.products.map((item) => item.id === product.id ? { ...item, stock: item.stock + amount } : item);
    record(page === "purchases" ? "Pembelian dicatat" : "Stok ditambahkan", `${product.name} · +${amount} ${product.unit}`, { ...data, products }); return;
  }
  if (page === "suppliers") {
    const name = window.prompt("Nama supplier:"); if (!name?.trim()) return; const phone = window.prompt("Nomor HP supplier:", "08");
    const supplier = { id: id("sup"), name: name.trim(), contact: "Kontak baru", phone: phone ?? "-", debt: 0 };
    record("Supplier ditambahkan", supplier.name, { ...data, suppliers: [...data.suppliers, supplier] }); return;
  }
  if (page === "expenses") {
    const note = window.prompt("Keterangan pengeluaran:"); if (!note?.trim()) return; const amount = Number(window.prompt("Nominal pengeluaran:", "0")); if (!amount || amount < 1) return toast.error("Nominal harus lebih dari 0.");
    const expense = { id: id("exp"), date: now, category: "Operasional", note: note.trim(), amount, user: "Admin FNP" };
    record("Pengeluaran dicatat", `${expense.note} · ${money(amount)}`, { ...data, expenses: [expense, ...data.expenses] }); return;
  }
  if (page === "receivables") {
    const name = window.prompt("Nama customer yang membayar piutang:"); const customer = data.customers.find((item) => item.name.toLowerCase() === name?.trim().toLowerCase()); if (!customer) return toast.error("Customer tidak ditemukan."); const amount = Number(window.prompt(`Nominal pembayaran untuk ${customer.name}:`, "0")); if (!amount || amount < 1) return;
    const customers = data.customers.map((item) => item.id === customer.id ? { ...item, balance: Math.max(0, item.balance - amount) } : item); record("Pembayaran piutang dicatat", `${customer.name} · ${money(amount)}`, { ...data, customers }); return;
  }
  if (page === "payables") {
    const name = window.prompt("Nama supplier yang dibayar:"); const supplier = data.suppliers.find((item) => item.name.toLowerCase() === name?.trim().toLowerCase()); if (!supplier) return toast.error("Supplier tidak ditemukan."); const amount = Number(window.prompt(`Nominal pembayaran untuk ${supplier.name}:`, "0")); if (!amount || amount < 1) return;
    const suppliers = data.suppliers.map((item) => item.id === supplier.id ? { ...item, debt: Math.max(0, item.debt - amount) } : item); record("Pembayaran hutang dicatat", `${supplier.name} · ${money(amount)}`, { ...data, suppliers }); return;
  }
  toast("Gunakan halaman Kasir untuk transaksi cepat, atau Backup untuk menjaga salinan data.");
}

function exportModuleCSV(page: PageKey, data: AppData) {
  const rows: Record<string, unknown>[] = page === "categories" ? data.categories.map((name, index) => ({ Kode: `CAT-${String(index + 1).padStart(3, "0")}`, Kategori: name, Produk: data.products.filter((product) => product.category === name).length })) : page === "stock" ? data.products.map((product) => ({ Kode: product.code, Produk: product.name, Stok: product.stock, Minimum: product.min, Status: product.stock <= product.min ? "Menipis" : "Aman" })) : page === "suppliers" ? data.suppliers.map((supplier) => ({ ID: supplier.id, Supplier: supplier.name, Kontak: supplier.contact, Telepon: supplier.phone, Hutang: supplier.debt })) : page === "expenses" ? data.expenses.map((expense) => ({ Nomor: expense.id, Tanggal: expense.date, Kategori: expense.category, Keterangan: expense.note, Nominal: expense.amount, User: expense.user })) : data.transactions.map((transaction) => ({ Invoice: transaction.invoice, Tanggal: transaction.date, Customer: transaction.customer, Total: transaction.total, Pembayaran: transaction.payment, Status: transaction.status }));
  downloadCSV(rows, `${page}-kasir-pro.csv`);
}

function BarcodeTools({ data }: { data: AppData }) {
  const [showScanner, setShowScanner] = useState(false);
  const [lastCode, setLastCode] = useState("");
  const product = data.products.find((item) => item.code.toLowerCase() === lastCode.toLowerCase());
  return <div className="module-page"><PageIntro eyebrow="Tools / Barcode" title="Scan, label, selesai" description="Gunakan kamera perangkat untuk menemukan produk dengan cepat, atau siapkan barcode untuk scanner USB." action={<button className="primary-btn" onClick={() => setShowScanner(true)}><Camera size={16} /> Buka kamera</button>} /><div className="barcode-tool-grid"><section className="panel barcode-hero-card"><div className="barcode-hero-icon"><Barcode size={24} /></div><span className="eyebrow">Camera ready</span><h3>Barcode masuk,<br /><em>produk ditemukan.</em></h3><p>Scanner menggunakan kamera belakang saat tersedia. Semua pencarian tetap bekerja dengan data lokal.</p><button className="primary-btn" onClick={() => setShowScanner(true)}><Camera size={16} /> Scan barcode kamera</button></section><section className="panel barcode-result-card"><div className="panel-head"><div><span className="eyebrow">Last scan</span><h3>Hasil pemindaian</h3></div><Barcode size={19} /></div>{lastCode ? <div className="barcode-result"><span className="barcode-visual">|||| ||| ||||</span><strong className="mono">{lastCode}</strong>{product ? <div className="barcode-product"><div className="product-icon ledger-product-icon"><Receipt size={16} /></div><span><strong>{product.name}</strong><small>{product.category} · {money(product.price)} · stok {product.stock}</small></span></div> : <p className="empty-note">Barcode belum terdaftar sebagai produk.</p>}</div> : <div className="barcode-empty"><Barcode size={32} /><strong>Belum ada scan</strong><span>Hasil barcode akan muncul di sini.</span></div>}</section></div><section className="panel table-panel"><div className="table-toolbar"><strong className="toolbar-title">Barcode produk</strong><button className="outline-btn" onClick={() => downloadCSV(data.products.map((item) => ({ Kode: item.code, Produk: item.name, Harga: item.price, Stok: item.stock })), "barcode-kasir-pro.csv")}><Download size={15} /> Export label data</button></div><DataTable headers={["Kode barcode", "Produk", "Kategori", "Harga", "Stok", "Aksi"]} rows={data.products.map((item) => [<strong className="mono">{item.code}</strong>, item.name, <span className="soft-chip">{item.category}</span>, <strong>{money(item.price)}</strong>, <span className="stock-number">{item.stock} {item.unit}</span>, <button className="text-btn" onClick={() => void printBarcodeLabel(item, data.settings)}><Printer size={14} /> Cetak label</button>])} /></section>{showScanner && <BarcodeScanner onClose={() => setShowScanner(false)} onDetected={(code) => { const found = data.products.find((item) => item.code.toLowerCase() === code.toLowerCase()); setLastCode(code); setShowScanner(false); toast(found ? "Barcode ditemukan" : "Barcode terbaca"); }} />}</div>;
}

function MembersPage({ data, setData }: { data: AppData; setData: (d: AppData) => void }) {
  const memberCustomers = data.customers.filter((customer) => customer.segment !== "Umum");
  const levels = Object.entries(data.memberDiscounts);
  const updateRate = (level: string, value: number) => setData({ ...data, memberDiscounts: { ...data.memberDiscounts, [level]: Math.max(0, Math.min(100, value)) } });
  return <div className="module-page"><PageIntro eyebrow="Relations / Loyalty" title="Benefit yang terasa personal" description="Level member langsung dibaca kasir dan memberi diskon otomatis sesuai aturan toko." art={CUSTOMER_ART} action={<button className="primary-btn" onClick={() => toast("Tambah member dilakukan dari halaman Customer") }><Plus size={16} /> Tambah member</button>} /><div className="member-level-grid">{levels.map(([level, rate], index) => <div className={`member-level-card level-${index}`} key={level}><span className="member-level-mark">{level.slice(0, 1)}</span><div><span className="eyebrow">Level {String(index + 1).padStart(2, "0")}</span><h3>{level}</h3><p>Diskon checkout otomatis</p></div><label className="member-rate-edit"><input type="number" min="0" max="100" value={rate} onChange={(event) => updateRate(level, Number(event.target.value))} /><span>%</span></label></div>)}</div><p className="inline-note"><ShieldCheck size={14} /> Ubah persentase di atas; nilai baru langsung berlaku pada transaksi berikutnya dan tetap tersimpan offline.</p><section className="panel table-panel"><div className="table-toolbar"><strong className="toolbar-title">Member terdaftar</strong><span className="muted-text">{memberCustomers.length} pelanggan member</span></div><DataTable headers={["Member", "Level", "Poin", "Transaksi", "Diskon otomatis"]} rows={memberCustomers.map((customer) => [<div className="table-product"><div className="avatar avatar-sage">{customer.name.slice(0, 1)}</div><div><strong>{customer.name}</strong><span>{customer.phone}</span></div></div>, <span className="soft-chip">{customer.segment}</span>, <strong className="mono">{customer.purchases * 10} pts</strong>, <strong>{customer.purchases}</strong>, <strong className="member-discount-value">{data.memberDiscounts[customer.segment] ?? 0}%</strong>])} /></section></div>;
}

function PromoManager({ data, setData }: { data: AppData; setData: (d: AppData) => void }) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Promo | null>(null);
  const [showForm, setShowForm] = useState(false);
  const list = data.promos.filter((promo) => `${promo.name} ${promo.code}`.toLowerCase().includes(search.toLowerCase()));
  const save = (promo: Promo) => {
    const duplicate = data.promos.some((item) => item.code.toLowerCase() === promo.code.toLowerCase() && item.id !== editing?.id);
    if (duplicate) return toast.error("Kode promo sudah digunakan.");
    const promos = editing ? data.promos.map((item) => item.id === editing.id ? promo : item) : [...data.promos, { ...promo, id: id("promo") }];
    setData({ ...data, promos, audit: [{ id: id("log"), date: new Date().toISOString(), user: "Admin FNP", action: editing ? "Edit promo" : "Tambah promo", detail: `${promo.code} · ${promo.name}`, tone: "success" }, ...data.audit] });
    setShowForm(false); setEditing(null); toast.success(editing ? "Promo diperbarui" : "Promo baru ditambahkan");
  };
  const toggle = (promo: Promo) => { setData({ ...data, promos: data.promos.map((item) => item.id === promo.id ? { ...item, active: !item.active } : item), audit: [{ id: id("log"), date: new Date().toISOString(), user: "Admin FNP", action: promo.active ? "Promo dinonaktifkan" : "Promo diaktifkan", detail: promo.code, tone: "success" }, ...data.audit] }); toast.success(promo.active ? "Promo dinonaktifkan" : "Promo diaktifkan"); };
  const remove = (promo: Promo) => { if (!window.confirm(`Hapus promo ${promo.code}?`)) return; setData({ ...data, promos: data.promos.filter((item) => item.id !== promo.id), audit: [{ id: id("log"), date: new Date().toISOString(), user: "Admin FNP", action: "Hapus promo", detail: promo.code, tone: "danger" }, ...data.audit] }); toast.success("Promo dihapus"); };
  return <div className="module-page"><PageIntro eyebrow="Control / Campaigns" title="Promo yang bekerja" description="Buat kode promo, atur minimum pembelian, dan batasi benefit untuk level member." art={REPORT_ART} action={<button className="primary-btn" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={16} /> Buat promo</button>} /><div className="promo-summary-grid"><div className="promo-summary-card"><span className="promo-summary-icon active"><Tag size={17} /></span><span>Promo aktif<strong>{data.promos.filter((promo) => promo.active).length}</strong></span></div><div className="promo-summary-card"><span className="promo-summary-icon member"><ShieldCheck size={17} /></span><span>Khusus member<strong>{data.promos.filter((promo) => promo.memberOnly).length}</strong></span></div><div className="promo-summary-card"><span className="promo-summary-icon honey"><CircleDollarSign size={17} /></span><span>Total terpakai bulan ini<strong>{data.transactions.filter((transaction) => transaction.discount > 0).length}</strong></span></div></div><section className="panel table-panel"><div className="table-toolbar"><div className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau kode promo..." /></div><span className="muted-text">Kode promo diterapkan dari halaman Kasir</span></div><DataTable headers={["Promo", "Kode", "Benefit", "Syarat", "Target", "Status", "Aksi"]} rows={list.map((promo) => [<div className="promo-name"><span className="promo-mark"><Tag size={14} /></span><div><strong>{promo.name}</strong><span>{promo.startDate} — {promo.endDate}</span></div></div>, <strong className="promo-code">{promo.code}</strong>, <strong className="member-discount-value">{promo.type === "percentage" ? `${promo.value}%` : promo.type === "nominal" ? money(promo.value) : promo.type === "bogo" ? "BOGO" : `Bundle ${money(promo.bundlePrice ?? 0)}`}</strong>, <span>Min. {money(promo.minPurchase)}</span>, <span className="soft-chip">{promo.memberOnly ? `Member · ${promo.memberLevels.join(", ")}` : "Semua customer"} · {promo.usageLimitPerMember ? `${promo.usageLimitPerMember}x/member` : "tanpa batas"}</span>, <button className={`status-chip ${promo.active ? "success" : "muted"}`} onClick={() => toggle(promo)}><i />{promo.active ? "Aktif" : "Nonaktif"}</button>, <div className="row-actions"><button className="icon-btn" onClick={() => { setEditing(promo); setShowForm(true); }} aria-label={`Edit ${promo.code}`}><Pencil size={15} /></button><button className="icon-btn danger" onClick={() => remove(promo)} aria-label={`Hapus ${promo.code}`}><Trash2 size={15} /></button></div>])} /></section>{showForm && <PromoModal products={data.products} initial={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSave={save} />}</div>;
}

function PromoModal({ initial, products, onClose, onSave }: { initial: Promo | null; products: Product[]; onClose: () => void; onSave: (promo: Promo) => void }) {
  const [form, setForm] = useState<Promo>(initial ?? { id: "", name: "", code: "", type: "percentage", value: 10, memberOnly: true, memberLevels: ["Gold", "Platinum"], minPurchase: 100000, active: true, startDate: today(), endDate: "2026-12-31", usageLimitPerMember: 0, usageByMember: {} });
  const update = (key: keyof Promo, value: string | number | boolean | string[] | Record<string, number>) => setForm((current) => ({ ...current, [key]: value }));
  const toggleLevel = (level: string) => update("memberLevels", form.memberLevels.includes(level) ? form.memberLevels.filter((item) => item !== level) : [...form.memberLevels, level]);
  const toggleBundleProduct = (productId: string) => update("bundleProductIds", (form.bundleProductIds ?? []).includes(productId) ? (form.bundleProductIds ?? []).filter((item) => item !== productId) : [...(form.bundleProductIds ?? []), productId]);
  return <Modal title={initial ? "Edit promo" : "Buat promo baru"} onClose={onClose}><form className="modal-form" onSubmit={(event) => { event.preventDefault(); const basicInvalid = !form.name.trim() || !form.code.trim() || ((form.type === "percentage" || form.type === "nominal") && form.value <= 0); if (basicInvalid) return toast.error("Nama, kode, dan nilai promo wajib diisi."); if (form.memberOnly && !form.memberLevels.length) return toast.error("Pilih minimal satu level member."); if (form.type === "bogo" && (!form.buyProductId || !form.getProductId || (form.buyQuantity ?? 0) < 1 || (form.getQuantity ?? 0) < 1)) return toast.error("Atur produk beli, produk gratis, dan jumlah BOGO."); if (form.type === "bundle" && ((form.bundleProductIds ?? []).length < 2 || (form.bundlePrice ?? 0) <= 0)) return toast.error("Pilih minimal dua produk dan isi harga paket."); if ((form.usageLimitPerMember ?? 0) < 0) return toast.error("Batas penggunaan tidak boleh negatif."); onSave({ ...form, code: form.code.trim().toUpperCase(), usageByMember: form.usageByMember ?? {} }); }}><div className="form-grid"><label className="full">Nama promo<input autoFocus value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Contoh: BOGO Kopi + Americano" /></label><label>Kode promo<input value={form.code} onChange={(event) => update("code", event.target.value.toUpperCase())} placeholder="KOPIBOGO" /></label><label>Jenis benefit<select value={form.type} onChange={(event) => update("type", event.target.value as Promo["type"])}><option value="percentage">Diskon persen</option><option value="nominal">Diskon nominal</option><option value="bogo">Buy one get one</option><option value="bundle">Paket bundling</option></select></label>{(form.type === "percentage" || form.type === "nominal") && <label>Nilai benefit<input type="number" min="1" value={form.value} onChange={(event) => update("value", Number(event.target.value))} /></label>}<label>Minimum pembelian<input type="number" min="0" value={form.minPurchase} onChange={(event) => update("minPurchase", Number(event.target.value))} /></label><label>Mulai berlaku<input type="date" value={form.startDate} onChange={(event) => update("startDate", event.target.value)} /></label><label>Berakhir<input type="date" value={form.endDate} onChange={(event) => update("endDate", event.target.value)} /></label><label>Limit per member<input type="number" min="0" value={form.usageLimitPerMember ?? 0} onChange={(event) => update("usageLimitPerMember", Number(event.target.value))} /><small className="field-help">Isi 0 jika tanpa batas. Untuk BOGO, limit dihitung per paket hadiah.</small></label></div>{form.type === "bogo" && <div className="promo-rule-box"><span className="eyebrow">Aturan BOGO</span><div className="form-grid"><label>Beli produk<select value={form.buyProductId ?? products[0]?.id ?? ""} onChange={(event) => update("buyProductId", event.target.value)}>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.code}</option>)}</select></label><label>Gratis produk<select value={form.getProductId ?? products[1]?.id ?? products[0]?.id ?? ""} onChange={(event) => update("getProductId", event.target.value)}>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.code}</option>)}</select></label><label>Jumlah beli<input type="number" min="1" value={form.buyQuantity ?? 1} onChange={(event) => update("buyQuantity", Number(event.target.value))} /></label><label>Jumlah gratis<input type="number" min="1" value={form.getQuantity ?? 1} onChange={(event) => update("getQuantity", Number(event.target.value))} /></label></div></div>}{form.type === "bundle" && <div className="promo-rule-box"><span className="eyebrow">Aturan bundling</span><label>Harga paket<input type="number" min="1" value={form.bundlePrice ?? 0} onChange={(event) => update("bundlePrice", Number(event.target.value))} /></label><div className="level-picker"><span className="eyebrow">Produk yang harus ada di paket</span><div>{products.map((product) => <button type="button" key={product.id} className={(form.bundleProductIds ?? []).includes(product.id) ? "selected" : ""} onClick={() => toggleBundleProduct(product.id)}><Package size={14} /> {product.name}</button>)}</div></div></div>}<label className="checkline"><input type="checkbox" checked={form.memberOnly} onChange={(event) => update("memberOnly", event.target.checked)} /> Promo khusus member terdaftar</label>{form.memberOnly && <div className="level-picker"><span className="eyebrow">Level yang berhak</span><div>{Object.keys(memberDiscountRates).filter((level) => ["Bronze", "Silver", "Gold", "Platinum"].includes(level)).map((level) => <button type="button" key={level} className={form.memberLevels.includes(level) ? "selected" : ""} onClick={() => toggleLevel(level)}><ShieldCheck size={14} /> {level}</button>)}</div></div>}<label className="checkline"><input type="checkbox" checked={form.active} onChange={(event) => update("active", event.target.checked)} /> Aktifkan promo setelah disimpan</label><div className="modal-actions"><button type="button" className="outline-btn" onClick={onClose}>Batal</button><button className="primary-btn" type="submit">Simpan promo</button></div></form></Modal>;
}

function PrinterSettings({ settings }: { settings: AppData["settings"] }) {
  const [connected, setConnected] = useState(isThermalPrinterConnected());
  const [width, setWidth] = useState<58 | 80>(getThermalPrinterPaperWidth());
  const supported = isThermalPrinterSupported();
  const usbSupported = isThermalPrinterWebUsbSupported();
  const connect = async () => {
    try {
      await connectThermalPrinter();
      setConnected(true);
      toast.success("Printer thermal terhubung");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Printer tidak dapat dihubungkan.");
    }
  };
  const disconnect = async () => {
    await disconnectThermalPrinter();
    setConnected(false);
    toast("Printer thermal dilepas");
  };
  const testPrint = async () => {
    if (!connected) return toast.error("Hubungkan printer terlebih dahulu.");
    try {
      await printReceiptThermal({ invoice: "TEST-PRINT", date: new Date().toISOString(), customer: "Tes printer", cashier: "KASIR PRO", total: 0, subtotal: 0, discount: 0, payment: "TEST", items: [{ name: "Tes koneksi printer", qty: 1, price: 0 }] }, settings);
      toast.success("Test print berhasil dikirim");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Test print gagal.");
    }
  };
  return <section className="panel settings-card printer-settings-card"><div className="panel-head"><div><span className="eyebrow">Hardware / Thermal</span><h3>Printer kasir</h3></div><Printer size={20} /></div><div className="printer-status-row"><span className={`status-chip ${connected ? "success" : "muted"}`}><i />{connected ? "Terhubung" : "Belum terhubung"}</span><span className="muted-text">{supported ? "Web Serial siap" : "Browser perlu Chrome/Edge desktop"} · {usbSupported ? "WebUSB tersedia" : "WebUSB tidak tersedia"}</span></div><p className="inline-note"><Printer size={14} /> Cetak struk transaksi dan label barcode langsung ke printer ESC/POS. Jika browser tidak mendukung Web Serial, tombol Print tetap memakai dialog cetak bawaan.</p><div className="printer-config"><label>Lebar kertas<select value={width} onChange={(e) => { const next = Number(e.target.value) as 58 | 80; setWidth(next); setThermalPrinterPaperWidth(next); }}><option value={58}>58 mm</option><option value={80}>80 mm</option></select></label></div><div className="printer-actions">{connected ? <button type="button" className="outline-btn" onClick={() => void disconnect()}>Lepas printer</button> : <button type="button" className="primary-btn" onClick={() => void connect()} disabled={!supported}><Printer size={15} /> Hubungkan printer</button>}<button type="button" className="outline-btn" onClick={() => void testPrint()} disabled={!connected}><Receipt size={15} /> Test print</button></div></section>;
}

function SettingsPage({ data, setData }: { data: AppData; setData: (d: AppData) => void }) { const [form, setForm] = useState(data.settings); const save = (e: React.FormEvent) => { e.preventDefault(); setData({ ...data, settings: form, audit: [{ id: id("log"), date: new Date().toISOString(), user: "Admin FNP", action: "Pengaturan diperbarui", detail: "Identitas dan konfigurasi toko", tone: "success" }, ...data.audit] }); toast.success("Pengaturan toko disimpan"); }; return <div className="module-page"><PageIntro eyebrow="Control / Store identity" title="Toko punya suara sendiri" description="Atur detail yang muncul di struk, invoice, dan laporan." /><form className="settings-grid" onSubmit={save}><section className="panel settings-card"><div className="panel-head"><div><span className="eyebrow">Identitas usaha</span><h3>Informasi utama</h3></div><Store size={20} /></div><div className="form-grid"><label className="full">Nama usaha<input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} /></label><label className="full">Alamat<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label><label>Nomor HP<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><label>Email<input placeholder="halo@usahamu.id" /></label></div></section><section className="panel settings-card"><div className="panel-head"><div><span className="eyebrow">Checkout / Receipt</span><h3>Konfigurasi transaksi</h3></div><Receipt size={20} /></div><div className="form-grid"><label>Pajak (%)<input type="number" min="0" value={form.tax} onChange={(e) => setForm({ ...form, tax: Number(e.target.value) })} /></label><label>Biaya layanan (%)<input type="number" min="0" value={form.service} onChange={(e) => setForm({ ...form, service: Number(e.target.value) })} /></label><label className="full">Footer struk<textarea rows={3} value={form.receiptFooter} onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })} /></label></div></section><PrinterSettings settings={form} /><div className="settings-actions"><span><ShieldCheck size={15} /> Perubahan tersimpan di perangkat ini</span><button className="primary-btn"><Check size={16} /> Simpan pengaturan</button></div></form></div>; }

function Backup({ data, setData }: { data: AppData; setData: (d: AppData) => void }) { const inputRef = useRef<HTMLInputElement>(null); const backup = () => { const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `kasir-pro-backup-${today()}.json`; a.click(); URL.revokeObjectURL(url); toast.success("Backup JSON berhasil dibuat"); };   const restore = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const restored = JSON.parse(String(reader.result)) as Partial<AppData>; if (!restored.products || !restored.transactions || !restored.settings) throw new Error("invalid"); const defaults = seedData(); const normalized = { ...defaults, ...restored, promos: restored.promos ?? defaults.promos, memberDiscounts: restored.memberDiscounts ?? defaults.memberDiscounts } as AppData; if (window.confirm("Restore akan mengganti data lokal saat ini. Lanjutkan?")) { setData(normalized); toast.success("Data berhasil dipulihkan"); } } catch { toast.error("File backup tidak dapat dibaca."); } }; reader.readAsText(file); }; return <div className="module-page"><PageIntro eyebrow="Control / Data safety" title="Data tetap di tanganmu" description="Backup seluruh workspace ke JSON dan pulihkan kembali kapan pun dibutuhkan." /><div className="backup-grid"><section className="panel backup-card primary-backup"><div className="backup-icon"><Download size={21} /></div><span className="eyebrow">Backup sekarang</span><h3>Simpan salinan workspace</h3><p>Produk, customer, transaksi, stok, pengeluaran, audit log, dan pengaturan disimpan dalam satu berkas JSON yang mudah dipindahkan.</p><button className="primary-btn" onClick={backup}><Download size={16} /> Download backup JSON</button><div className="backup-meta"><span><Database size={14} /> {data.products.length} produk</span><span><Receipt size={14} /> {data.transactions.length} transaksi</span><span><History size={14} /> {data.audit.length} log</span></div></section><section className="panel backup-card"><div className="backup-icon sage"><Upload size={21} /></div><span className="eyebrow">Restore data</span><h3>Kembalikan workspace</h3><p>Import file JSON KASIR PRO untuk mengganti data lokal setelah perangkat berpindah atau data terhapus.</p><input ref={inputRef} type="file" accept="application/json,.json" hidden onChange={restore} /><button className="outline-btn" onClick={() => inputRef.current?.click()}><Upload size={16} /> Pilih file backup</button><div className="restore-warning"><ShieldCheck size={14} /> Konfirmasi akan selalu ditampilkan sebelum restore.</div></section></div><section className="panel backup-checklist"><div><span className="eyebrow">Isi backup</span><h3>Yang ikut tersimpan</h3></div><div className="check-grid">{["Produk & kategori", "Customer & member", "Transaksi & item", "Stok & pembelian", "Piutang & hutang", "Pengeluaran", "User & akses", "Audit log & pengaturan"].map((item) => <span key={item}><Check size={14} /> {item}</span>)}</div></section></div>; }

function PageIntro({ eyebrow, title, description, art, action }: { eyebrow: string; title: string; description: string; art?: string; action?: React.ReactNode }) { return <div className={`page-intro ${art ? "has-art" : ""}`}><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{art && <div className="intro-art"><img src={art} alt="" /></div>}<div className="intro-action">{action}</div></div>; }

function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) { return <div className="data-table-wrap"><table className="data-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>) : <tr><td colSpan={headers.length}><div className="table-empty"><FileText size={22} /><strong>Belum ada data</strong><span>Data akan muncul setelah aktivitas tercatat.</span></div></td></tr>}</tbody></table></div>; }

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal-card" role="dialog" aria-modal="true"><div className="modal-head"><div><span className="eyebrow">Data entry</span><h3>{title}</h3></div><button className="icon-btn" onClick={onClose} aria-label="Tutup"><X size={18} /></button></div>{children}</div></div>; }

function BarcodeScanner({ onClose, onDetected }: { onClose: () => void; onDetected: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onDetectedRef = useRef(onDetected);
  const [status, setStatus] = useState<"starting" | "ready" | "unsupported" | "denied">("starting");
  const [manualCode, setManualCode] = useState("");

  useEffect(() => { onDetectedRef.current = onDetected; }, [onDetected]);
  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setStatus("unsupported"); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        const Detector = (window as unknown as { BarcodeDetector?: new (options?: { formats?: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>> } }).BarcodeDetector;
        if (!Detector) { setStatus("unsupported"); return; }
        setStatus("ready");
        const detector = new Detector({ formats: ["ean_13", "ean_8", "code_128", "upc_a", "upc_e", "qr_code"] });
        let lastCode = "";
        const scan = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const matches = await detector.detect(videoRef.current);
            const code = matches[0]?.rawValue?.trim();
            if (code && code !== lastCode) { lastCode = code; onDetectedRef.current(code); return; }
          } catch { /* Camera frames can be unavailable while the browser is switching focus. */ }
          if (!cancelled) window.requestAnimationFrame(scan);
        };
        window.requestAnimationFrame(scan);
      } catch { if (!cancelled) setStatus("denied"); }
    };
    void start();
    return () => { cancelled = true; streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; };
  }, []);

  const submitManual = (event: React.FormEvent) => { event.preventDefault(); if (!manualCode.trim()) return toast.error("Masukkan barcode terlebih dahulu."); onDetected(manualCode.trim()); };
  return <Modal title="Scan barcode produk" onClose={onClose}><div className="scanner-modal"><div className="scanner-view"><video ref={videoRef} autoPlay playsInline muted /><div className="scan-frame"><span /><span /><span /><span /></div><div className={`scanner-status ${status}`}><i />{status === "starting" ? "Menyiapkan kamera..." : status === "ready" ? "Arahkan barcode ke kotak" : status === "unsupported" ? "Deteksi otomatis tidak tersedia" : "Izin kamera belum diberikan"}</div></div><div className="scanner-help"><Camera size={16} /><span>Gunakan kamera belakang untuk hasil yang lebih cepat. Jika browser tidak mendukung deteksi otomatis, gunakan input manual di bawah.</span></div><form className="manual-barcode" onSubmit={submitManual}><label>Barcode manual<input autoFocus value={manualCode} onChange={(event) => setManualCode(event.target.value)} placeholder="Contoh: KOP-001" /></label><button className="primary-btn" type="submit"><Barcode size={15} /> Tambahkan</button></form><button className="outline-btn scanner-cancel" onClick={onClose}>Tutup pemindai</button></div></Modal>;
}

function downloadCSV(rows: Record<string, unknown>[], filename: string) { if (!rows.length) return toast.error("Belum ada data untuk diekspor."); const headers = Object.keys(rows[0]); const csv = [headers.join(","), ...rows.map((row) => headers.map((h) => `"${String(row[h] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n"); const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); toast.success("File CSV siap diunduh"); }

async function printReceipt(transaction: Transaction, settings: AppData["settings"]) {
  if (isThermalPrinterConnected()) {
    try {
      await printReceiptThermal(transaction, settings);
      toast.success("Struk terkirim ke printer thermal");
      return;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Printer thermal gagal menerima struk.");
    }
  }
  printReceiptBrowser(transaction, settings);
}

async function printBarcodeLabel(product: Product, settings: AppData["settings"]) {
  if (isThermalPrinterConnected()) {
    try {
      await printBarcodeLabelThermal(product, settings);
      toast.success(`Label ${product.code} terkirim ke printer thermal`);
      return;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Printer thermal gagal menerima label.");
    }
  }
  printBarcodeLabelBrowser(product, settings);
}

function printBarcodeLabelBrowser(product: Product, settings: AppData["settings"]) {
  const popup = window.open("", "_blank", "width=360,height=420");
  if (!popup) return toast.error("Popup diblokir browser. Izinkan popup untuk mencetak label.");
  popup.document.write(`<html><head><title>Label ${product.code}</title><style>body{font-family:Arial,sans-serif;width:300px;margin:20px auto;color:#18262d;text-align:center}.store{font-size:11px;text-transform:uppercase;letter-spacing:2px}.name{font-weight:bold;font-size:18px;margin:12px 0 5px}.barcode{font-family:monospace;font-size:38px;letter-spacing:1px;margin:12px 0}.code{font-family:monospace;font-size:14px}.price{font-size:16px;font-weight:bold;margin-top:8px}@media print{body{margin:0 auto}}</style></head><body><div class="store">${settings.storeName}</div><div class="name">${product.name}</div><div>${product.category}</div><div class="barcode">|||| ||| |||| ||</div><div class="code">${product.code}</div><div class="price">${money(product.price)}</div><script>window.onload=()=>window.print()</script></body></html>`);
  popup.document.close();
}

function printReceiptBrowser(transaction: Transaction, settings: AppData["settings"]) { const popup = window.open("", "_blank", "width=420,height=680"); if (!popup) return toast.error("Popup diblokir browser. Izinkan popup untuk mencetak."); popup.document.write(`<html><head><title>${transaction.invoice}</title><style>body{font-family:Arial,sans-serif;width:320px;margin:24px auto;color:#18262d;font-size:12px}h1{font-size:20px;margin:0 0 4px}p{margin:4px 0;color:#69736f}.rule{border-top:1px dashed #777;margin:16px 0}.row{display:flex;justify-content:space-between;margin:8px 0}.total{font-size:16px;font-weight:bold;margin-top:16px}.center{text-align:center;margin-top:26px}@media print{body{margin:0 auto}}</style></head><body><h1>${settings.storeName}</h1><p>${settings.address}</p><p>${settings.phone}</p><div class="rule"></div><div class="row"><span>${transaction.invoice}</span><span>${formatDate(transaction.date)}</span></div><p>Kasir: ${transaction.cashier}</p><p>Customer: ${transaction.customer}</p><div class="rule"></div>${transaction.items.map((item) => `<div class="row"><span>${item.name} × ${item.qty}</span><span>${money(item.price * item.qty)}</span></div>`).join("")}<div class="rule"></div><div class="row"><span>Subtotal</span><span>${money(transaction.subtotal)}</span></div><div class="row"><span>Diskon</span><span>-${money(transaction.discount)}</span></div><div class="row total"><span>Total</span><span>${money(transaction.total)}</span></div><div class="row"><span>Pembayaran</span><span>${transaction.payment}</span></div><div class="center"><strong>${settings.receiptFooter}</strong><p>KASIR PRO FNP · Offline-first POS</p></div><script>window.onload=()=>window.print()</script></body></html>`); popup.document.close(); }

export default function Home() { const [data, setDataState] = useState<AppData>(() => getData() ?? seedData()); const [session, setSession] = useState<Session | null>(() => { try { if (new URLSearchParams(window.location.search).get("demo") === "1") { const demoSession: Session = { username: "admin", role: "ADMIN", name: "Admin FNP" }; localStorage.setItem(SESSION_KEY, JSON.stringify(demoSession)); return demoSession; } return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as Session | null; } catch { return null; } }); const setData = (next: AppData) => { setDataState(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }; const onDemo = () => { const demo = seedData(); setData(demo); const demoSession: Session = { username: "admin", role: "ADMIN", name: "Admin FNP" }; localStorage.setItem(SESSION_KEY, JSON.stringify(demoSession)); setSession(demoSession); toast.success("Data demo siap dipakai"); }; if (!session) return <LoginScreen onLogin={setSession} onDemo={onDemo} />; return <AppShell session={session} data={data} setData={setData} onLogout={() => { localStorage.removeItem(SESSION_KEY); setSession(null); toast("Sesi telah ditutup"); }} />; }
