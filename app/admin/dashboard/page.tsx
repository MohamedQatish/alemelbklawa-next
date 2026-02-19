"use client";

import React from "react";
import ProductsManager from "@/components/admin/products-manager";
import EventsManager from "@/components/admin/events-manager";
import UsersManager from "@/components/admin/users-manager";
import BranchesManager from "@/components/admin/branches-manager";
import DeliveryManager from "@/components/admin/delivery-manager";
import CategoriesManager from "@/components/admin/categories-manager";
import OptionGroupsManager from "@/components/admin/option-groups-manager";
import SettingsManager from "@/components/admin/settings-manager";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  ShoppingBag,
  Users,
  LogOut,
  Printer,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Package,
  Search,
  Phone,
  Globe,
  Calendar,
  Store,
  DollarSign,
  MapPin,
  Star,
  Truck,
  Ban,
  Filter,
  CalendarDays,
  RotateCcw,
  Shield,
  Building2,
  FolderOpen,
  Settings2,
  ChevronDown,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Wallet,
  Smartphone,
  Award,
  Activity,
  PieChart,
  LineChart,
  BarChart,
  Target,
  Zap,
  Gift,
  Coffee,
  Utensils,
} from "lucide-react";

// استيراد مكتبة الرسوم البيانية
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector,
} from "recharts";

/* ============ Count-up Hook ============ */
function useCountUp(end: number, duration = 800) {
  const [value, setValue] = useState(0);
  const prevEnd = useRef(end);

  useEffect(() => {
    const startVal = prevEnd.current !== end ? prevEnd.current : 0;
    prevEnd.current = end;
    if (end === 0) {
      setValue(0);
      return;
    }

    const startTime = performance.now();
    let raf: number;
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(startVal + (end - startVal) * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);

  return value;
}

/* ============ Interfaces ============ */
interface HourlySale {
  hour: number;
  total: number;
  count: number;
}

interface StoreStats {
  totalRevenue: number;
  avgOrderValue: number;
  totalDeliveryFees: number;
  topCity: { name: string; count: number } | null;
  topProduct: { name: string; qty: number } | null;
}

interface Stats {
  todaySales: number;
  monthlySales: number;
  totalOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  hasFilter: boolean;
  filteredSales: number;
  filteredOrders: number;
  filteredCancelled: number;
  filteredPending: number;
  filteredLabel: string;
  hourlySales: HourlySale[];
  storeStats: StoreStats;
}

interface OrderItem {
  id: number;
  product_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  addons: string;
  selected_options: any | null;
  notes: string;
}

interface Order {
  id: number;
  customer_name: string;
  phone: string;
  secondary_phone?: string | null;
  address: string;
  city: string;
  delivery_fee: number;
  total_amount: number;
  payment_method: string;
  status: string;
  notes?: string | null;
  created_at: string;
  items: OrderItem[];
  order_type?: string | null;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

type Tab =
  | "stats"
  | "orders"
  | "customers"
  | "products"
  | "events"
  | "branches"
  | "users"
  | "delivery"
  | "categories"
  | "options"
  | "settings";

interface SessionUser {
  id: number;
  username: string;
  display_name: string | null;
  role: string;
  permissions: string[];
}

function userCan(user: SessionUser | null, perm: string): boolean {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  if (user.permissions.includes("full_access")) return true;
  return user.permissions.includes(perm);
}

/* ===== Theme helpers ===== */
const T = {
  bg: "var(--admin-bg)",
  surface: "var(--admin-surface)",
  surfaceHover: "var(--admin-surface-hover)",
  surfaceDeep: "var(--admin-surface-deep)",
  border: "var(--admin-border)",
  borderHover: "var(--admin-border-hover)",
  accent: "var(--admin-accent)",
  accentLight: "var(--admin-accent-light)",
  accentMuted: "var(--admin-accent-muted)",
  glow: "var(--admin-glow)",
  text: "var(--admin-text)",
  textMuted: "var(--admin-text-muted)",
  textDim: "var(--admin-text-dim)",
};

// ألوان المخططات
const CHART_COLORS = [
  "#7B1E2F",
  "#C5A55A",
  "#E0C97B",
  "#9F4A5A",
  "#B88B4A",
  "#5A3E2E",
  "#8B5E3C",
  "#A55D5D",
];

/* ============ Main Component ============ */
export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerSearch, setCustomerSearch] = useState("");

  const [refreshing, setRefreshing] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [orderSortDir, setOrderSortDir] = useState<"desc" | "asc">("desc");
  const [orderDateFilter, setOrderDateFilter] = useState("");
  const [filterLoading, setFilterLoading] = useState(false);
  const [tabKey, setTabKey] = useState(0);
  const printRef = useRef<HTMLDivElement>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [activeChart, setActiveChart] = useState<"line" | "bar" | "area">("line");

  // Date filter state
  const [filterDay, setFilterDay] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterMode, setFilterMode] = useState<"dropdowns" | "range">(
    "dropdowns",
  );
  const [activePreset, setActivePreset] = useState<string>("today");

  const fetchStats = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterMode === "dropdowns") {
      if (filterDay) params.set("day", filterDay);
      if (filterMonth) params.set("month", filterMonth);
      if (filterYear) params.set("year", filterYear);
    } else {
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
    }
    const res = await fetch(`/api/admin/stats?${params.toString()}`);
    if (res.status === 401) {
      router.push("/admin");
      return;
    }
    const data = await res.json();
    setStats(data);
  }, [
    filterDay,
    filterMonth,
    filterYear,
    startDate,
    endDate,
    filterMode,
    router,
  ]);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, customersRes, sessionRes] = await Promise.all([
        fetch("/api/admin/orders"),
        fetch("/api/admin/customers"),
        fetch("/api/admin/session"),
      ]);
      const [ordersData, customersData] = await Promise.all([
        ordersRes.json(),
        customersRes.json(),
      ]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      if (sessionRes.ok) {
        const sess = await sessionRes.json();
        if (sess.user) setSessionUser(sess.user);
      }
    } catch {
      router.push("/admin");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStats();
    fetchData();
  }, [fetchStats, fetchData]);

  useEffect(() => {
    if (!loading) {
      setFilterLoading(true);
      fetchStats().finally(() => setFilterLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDay, filterMonth, filterYear, startDate, endDate, filterMode]);

  // Preset filters
  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    switch (preset) {
      case "today":
        setFilterMode("dropdowns");
        setFilterDay(day.toString());
        setFilterMonth(month.toString());
        setFilterYear(year.toString());
        setStartDate("");
        setEndDate("");
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        setFilterMode("dropdowns");
        setFilterDay(yesterday.getDate().toString());
        setFilterMonth((yesterday.getMonth() + 1).toString());
        setFilterYear(yesterday.getFullYear().toString());
        setStartDate("");
        setEndDate("");
        break;
      case "thisWeek":
        const firstDay = new Date(today);
        firstDay.setDate(today.getDate() - today.getDay());
        const lastDay = new Date(firstDay);
        lastDay.setDate(firstDay.getDate() + 6);
        setFilterMode("range");
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
        setFilterDay("");
        setFilterMonth("");
        setFilterYear("");
        break;
      case "thisMonth":
        setFilterMode("dropdowns");
        setFilterDay("");
        setFilterMonth(month.toString());
        setFilterYear(year.toString());
        setStartDate("");
        setEndDate("");
        break;
      case "lastMonth":
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        setFilterMode("dropdowns");
        setFilterDay("");
        setFilterMonth((lastMonth.getMonth() + 1).toString());
        setFilterYear(lastMonth.getFullYear().toString());
        setStartDate("");
        setEndDate("");
        break;
      case "thisYear":
        setFilterMode("dropdowns");
        setFilterDay("");
        setFilterMonth("");
        setFilterYear(year.toString());
        setStartDate("");
        setEndDate("");
        break;
    }
  };

  async function updateOrderStatus(orderId: number, newStatus: string) {
    setRefreshing(true);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    );
    try {
      await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      await Promise.all([fetchStats(), fetchData()]);
    } catch {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  function handleTabSwitch(tab: Tab) {
    setActiveTab(tab);
    setTabKey((k) => k + 1);
  }

  function resetFilters() {
    setFilterDay("");
    setFilterMonth("");
    setFilterYear("");
    setStartDate("");
    setEndDate("");
    setActivePreset("");
  }

  function printInvoice(order: Order) {
    const w = window.open("", "_blank");
    if (!w) return;

    const subtotal = order.items.reduce(
      (sum, item) => sum + item.quantity * Number(item.unit_price),
      0,
    );
    const rows = order.items
      .map(
        (item, idx) => `
      <tr style="background:${idx % 2 === 0 ? "#FFF8EE" : "#FFFFFF"}">
<td style="padding:12px 16px;border-bottom:1px solid #E8D5B0;color:#3D1E1E;font-weight:500">
  ${item.product_name}
  ${
    item.selected_options &&
    Array.isArray(item.selected_options) &&
    item.selected_options.length > 0
      ? `<br/><small style="color:#8B6E6E;font-weight:normal">${item.selected_options.map((o: any) => `${o.name} (+${o.price} د.ل)`).join(" + ")}</small>`
      : ""
  }
</td>
        <td style="padding:12px 16px;border-bottom:1px solid #E8D5B0;text-align:center;color:#5A2E2E">${item.quantity}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #E8D5B0;text-align:center;color:#5A2E2E">${Number(item.unit_price).toFixed(2)}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #E8D5B0;text-align:center;color:#7B1E2F;font-weight:700">${(item.quantity * Number(item.unit_price)).toFixed(2)}</td>
      </tr>
    `,
      )
      .join("");

    w.document
      .write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>فاتورة #${order.id}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Amiri:wght@400;700&display=swap');
  @page { size: A4; margin: 15mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Cairo', 'Segoe UI', sans-serif;
    background: #FFFDF7;
    color: #3D1E1E;
    min-height: 100vh;
  }
  .invoice {
    max-width: 800px;
    margin: 0 auto;
    padding: 0;
    background: #FFFFFF;
    box-shadow: 0 0 40px rgba(123,30,47,0.08);
  }
  /* ===== Header ===== */
  .inv-header {
    background: linear-gradient(135deg, #7B1E2F 0%, #5A0F1F 40%, #7B1E2F 100%);
    padding: 40px 48px 32px;
    position: relative;
    overflow: hidden;
  }
  .inv-header::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(90deg, #C5A55A, #E0C97B, #C5A55A);
  }
  .inv-header::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, #C5A55A, transparent);
  }
  .brand-name {
    font-family: 'Amiri', serif;
    font-size: 38px;
    font-weight: 700;
    color: #E0C97B;
    text-align: center;
    letter-spacing: -0.02em;
    word-spacing: 0.02em;
    margin-bottom: 6px;
    text-shadow: 0 2px 8px rgba(0,0,0,0.2);
    font-feature-settings: "liga" 1, "calt" 1;
  }
  .brand-sub {
    text-align: center;
    color: #D4B96E;
    font-size: 14px;
    font-weight: 400;
    opacity: 0.85;
    letter-spacing: 1px;
  }
  .inv-number {
    text-align: center;
    margin-top: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
  .inv-number span {
    height: 1px;
    width: 60px;
    background: linear-gradient(90deg, transparent, #C5A55A);
  }
  .inv-number span:last-child {
    background: linear-gradient(90deg, #C5A55A, transparent);
  }
  .inv-number b {
    color: #FFFFFF;
    font-size: 15px;
    font-weight: 600;
  }

  /* ===== Body ===== */
  .inv-body { padding: 32px 48px; }

  /* ===== Info Grid ===== */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 28px;
  }
  .info-box {
    border: 1px solid #E8D5B0;
    border-radius: 10px;
    padding: 20px;
    background: #FFFBF2;
  }
  .info-box-title {
    font-size: 11px;
    font-weight: 700;
    color: #C5A55A;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 14px;
    padding-bottom: 8px;
    border-bottom: 2px solid #E8D5B0;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 13px;
  }
  .info-label { color: #8B6E6E; font-weight: 400; }
  .info-value { color: #3D1E1E; font-weight: 600; }

  /* ===== Table ===== */
  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 28px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #E8D5B0;
  }
  .items-table thead tr {
    background: linear-gradient(135deg, #7B1E2F, #5A0F1F);
  }
  .items-table th {
    padding: 14px 16px;
    color: #E0C97B;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  /* ===== Totals ===== */
  .totals-section {
    border: 1px solid #E8D5B0;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 28px;
  }
  .total-row {
    display: flex;
    justify-content: space-between;
    padding: 12px 20px;
    font-size: 14px;
    border-bottom: 1px solid #F0E4CC;
  }
  .total-row:last-child { border-bottom: none; }
  .total-row.grand {
    background: linear-gradient(135deg, #7B1E2F, #5A0F1F);
    padding: 16px 20px;
  }
  .total-row.grand .total-label,
  .total-row.grand .total-value {
    color: #E0C97B;
    font-size: 18px;
    font-weight: 800;
  }
  .total-label { color: #8B6E6E; font-weight: 500; }
  .total-value { color: #3D1E1E; font-weight: 700; }

  /* ===== Footer ===== */
  .inv-footer {
    border-top: 3px solid #E8D5B0;
    padding: 24px 48px;
    text-align: center;
    background: #FFFBF2;
  }
  .footer-gold-line {
    width: 80px;
    height: 2px;
    background: linear-gradient(90deg, transparent, #C5A55A, transparent);
    margin: 0 auto 12px;
  }
  .footer-thanks {
    font-family: 'Amiri', serif;
    color: #7B1E2F;
    font-size: 19px;
    font-weight: 700;
    margin-bottom: 4px;
    letter-spacing: -0.01em;
    font-feature-settings: "liga" 1, "calt" 1;
  }
  .footer-note {
    color: #B39B7D;
    font-size: 11px;
    letter-spacing: 1px;
  }
</style>
</head>
<body>
<div class="invoice">

  <!-- Header -->
  <div class="inv-header">
    <div class="brand-name">عَالَمُ الْبَكْلَاوَة</div>
    <div class="brand-sub">حلويات فاخرة</div>
    <div class="inv-number">
      <span></span>
      <b>فاتورة رقم #${order.id}</b>
      <span></span>
    </div>
  </div>

  <div class="inv-body">

    <!-- Info Grid -->
    <div class="info-grid">
      <div class="info-box">
        <div class="info-box-title">معلومات الطلب</div>
        <div class="info-row"><span class="info-label">رقم الطلب</span><span class="info-value">#${order.id}</span></div>
        <div class="info-row"><span class="info-label">التاريخ</span><span class="info-value">${new Date(order.created_at).toLocaleDateString("ar-LY", { year: "numeric", month: "long", day: "numeric" })}</span></div>
        <div class="info-row"><span class="info-label">الوقت</span><span class="info-value">${new Date(order.created_at).toLocaleTimeString("ar-LY", { hour: "2-digit", minute: "2-digit" })}</span></div>
        <div class="info-row"><span class="info-label">نوع الطلب</span><span class="info-value">${order.order_type === "pickup" ? "استلام من الفرع" : "توصيل"}</span></div>
        <div class="info-row"><span class="info-label">الحالة</span><span class="info-value" style="color:#C5A55A">${order.status === "delivered" ? "تم التوصيل" : order.status === "confirmed" ? "مؤكد" : order.status === "preparing" ? "قيد التحضير" : order.status === "cancelled" ? "ملغي" : "قيد الانتظار"}</span></div>
      </div>
      <div class="info-box">
        <div class="info-box-title">معلومات العميل</div>
        <div class="info-row"><span class="info-label">الاسم</span><span class="info-value">${order.customer_name}</span></div>
        <div class="info-row"><span class="info-label">ا��هاتف</span><span class="info-value" dir="ltr">${order.phone}</span></div>
        
        <div class="info-row"><span class="info-label">المدينة</span><span class="info-value">${order.city}</span></div>
        <div class="info-row"><span class="info-label">العنوان</span><span class="info-value">${order.address}</span></div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="text-align:right">المنتج</th>
          <th style="text-align:center">الكمية</th>
          <th style="text-align:center">سعر الوحدة (د.ل)</th>
          <th style="text-align:center">الإجمالي (د.ل)</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <!-- Totals -->
    <div class="totals-section">
      <div class="total-row" style="background:#FFFBF2">
        <span class="total-label">المجموع الفرعي</span>
        <span class="total-value">${subtotal.toFixed(2)} د.ل</span>
      </div>
      <div class="total-row">
        <span class="total-label">رسوم التوصيل</span>
        <span class="total-value">${Number(order.delivery_fee).toFixed(2)} د.ل</span>
      </div>
      <div class="total-row grand">
        <span class="total-label">الإجمالي الكلي</span>
        <span class="total-value">${Number(order.total_amount).toFixed(2)} د.ل</span>
      </div>
    </div>

  </div>

  <!-- Footer -->
  <div class="inv-footer">
    <div class="footer-gold-line"></div>
    <div class="footer-thanks">شكراً لاختياركم عَالَمُ الْبَكْلَاوَة</div>
    <div class="footer-note">ALAM ALBAKLAWA - PREMIUM SWEETS</div>
  </div>

</div>
<script>setTimeout(()=>window.print(),400)</script>
</body></html>`);
    w.document.close();
  }

  function getStatusBadge(status: string) {
    const s: Record<string, string> = {
      pending: "bg-amber-500/15 text-amber-400",
      confirmed: "bg-emerald-500/15 text-emerald-400",
      preparing: "bg-sky-500/15 text-sky-400",
      delivered: "bg-cyan-500/15 text-cyan-300",
      cancelled: "bg-red-500/15 text-red-400",
    };
    const l: Record<string, string> = {
      pending: "قيد الانتظار",
      confirmed: "مؤكد",
      preparing: "قيد التحضير",
      delivered: "تم التوصيل",
      cancelled: "ملغي",
    };
    return (
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300 ${s[status] || s.pending}`}
      >
        {l[status] || status}
      </span>
    );
  }

  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: T.bg }}
      >
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4"
            style={{ borderColor: `${T.border}`, borderTopColor: T.accent }}
          />
          <p className="animate-fade-in" style={{ color: T.accentLight }}>
            جاري التحميل...
          </p>
        </div>
      </div>
    );
  }

  const isFiltered = stats?.hasFilter ?? false;

  const allTabs: {
    id: Tab;
    label: string;
    icon: React.ReactNode;
    perm?: string;
  }[] = [
    {
      id: "stats",
      label: "إحصائيات الموقع",
      icon: <BarChart3 className="h-5 w-5" />,
      perm: "view_dashboard",
    },
    {
      id: "orders",
      label: "الطلبات",
      icon: <ShoppingBag className="h-5 w-5" />,
      perm: "manage_orders",
    },
    {
      id: "products",
      label: "المنتجات",
      icon: <Package className="h-5 w-5" />,
      perm: "manage_products",
    },
    {
      id: "categories",
      label: "الأقسام",
      icon: <FolderOpen className="h-5 w-5" />,
      perm: "manage_products",
    },
    {
      id: "options",
      label: "الخيارات",
      icon: <Settings2 className="h-5 w-5" />,
      perm: "manage_products",
    },
    {
      id: "events",
      label: "المناسبات",
      icon: <CalendarDays className="h-5 w-5" />,
      perm: "manage_events",
    },
    {
      id: "branches",
      label: "الفروع",
      icon: <Building2 className="h-5 w-5" />,
      perm: "manage_branches",
    },
    {
      id: "delivery",
      label: "التوصيل",
      icon: <Truck className="h-5 w-5" />,
      perm: "manage_orders",
    },
    {
      id: "customers",
      label: "العملاء",
      icon: <Users className="h-5 w-5" />,
      perm: "view_dashboard",
    },
    {
      id: "users",
      label: "المستخدمين",
      icon: <Shield className="h-5 w-5" />,
      perm: "manage_users",
    },
    {
      id: "settings",
      label: "الإعدادات",
      icon: <Settings2 className="h-5 w-5" />,
      perm: "edit_content",
    },
  ];

  // Filter tabs based on RBAC permissions
  const tabs = allTabs.filter(
    (tab) => !tab.perm || userCan(sessionUser, tab.perm),
  );

  // تحضير بيانات المخططات
  const prepareChartData = () => {
    if (!stats?.hourlySales) return [];
    
    // تحويل بيانات الساعات إلى تنسيق المخطط
    return Array.from({ length: 24 }, (_, hour) => {
      const data = stats.hourlySales.find(h => h.hour === hour);
      return {
        name: `${hour}:00`,
        الساعة: hour,
        المبيعات: data?.total || 0,
        الطلبات: data?.count || 0,
      };
    });
  };

  // بيانات المنتجات الأكثر مبيعاً (مثال - يمكن تعديلها حسب البيانات الفعلية)
  const getTopProductsData = () => {
    // هذه بيانات تجريبية - يمكن استبدالها ببيانات حقيقية من API
    return [
      { name: "بقلاوة طرابلسية", value: 45 },
      { name: "كنافة نابلسية", value: 38 },
      { name: "معمول بالتمر", value: 30 },
      { name: "غريبة", value: 25 },
      { name: "وربات", value: 20 },
    ];
  };

  // بيانات طرق الدفع
  const getPaymentMethodsData = () => {
    // هذه بيانات تجريبية - يمكن استبدالها ببيانات حقيقية
    return [
      { name: "بطاقة بنكية", value: 55 },
      { name: "الدفع عند الاستلام", value: 35 },
      { name: "LYPAY", value: 10 },
    ];
  };

  const chartData = prepareChartData();
  const topProductsData = getTopProductsData();
  const paymentMethodsData = getPaymentMethodsData();

  return (
    <div
      className="admin-inputs min-h-screen"
      style={{ background: T.bg }}
      ref={printRef}
    >
      {/* ===== Top Bar ===== */}
      <header
        className="admin-panel animate-slide-up-fade sticky top-0 z-50 backdrop-blur-xl"
        style={{
          borderRadius: 0,
          borderLeft: "none",
          borderRight: "none",
          borderTop: "none",
          background: `${T.surface}cc`,
        }}
      >
        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7B1E2F] to-[#5A0F1F] shadow-lg">
              <Store className="h-5 w-5 text-[#E0C97B]" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: T.accentLight }}>
                عالم البقلاوة
              </h1>
              <p className="text-xs" style={{ color: T.textDim }}>لوحة التحكم الإدارية</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {refreshing && (
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2"
                style={{ borderColor: "transparent", borderTopColor: T.accent }}
              />
            )}
            <button
              onClick={handleLogout}
              className="group relative flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm font-medium text-red-400 transition-all duration-300 hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-500/10"
            >
              <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> 
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===== Tabs ===== */}
      <div className="border-b sticky top-[73px] z-40 backdrop-blur-xl" style={{ borderColor: T.border, background: `${T.surface}cc` }}>
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id)}
              className="group relative flex shrink-0 items-center gap-2 border-b-2 px-5 py-4 text-sm font-semibold transition-all duration-300"
              style={{
                borderColor: activeTab === tab.id ? T.accent : "transparent",
                color: activeTab === tab.id ? T.accentLight : T.textDim,
              }}
            >
              <span
                className={`transition-all duration-300 ${activeTab === tab.id ? "scale-110" : "group-hover:scale-105"}`}
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <span
                  className="absolute inset-x-0 -bottom-px h-0.5"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${T.accent}, transparent)`,
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Content ===== */}
      <div className="mx-auto max-w-7xl p-6">
        <div key={tabKey} className="animate-tab-enter">
          {/* ========== STATS TAB - REDESIGNED WITH CHARTS ========== */}
          {activeTab === "stats" && stats && (
            <div className="flex flex-col gap-6">
              {/* --- Filter Section - Redesigned --- */}
              <section className="admin-panel overflow-hidden">
                <div className="border-b p-4" style={{ borderColor: T.border }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7B1E2F] to-[#5A0F1F]">
                        <Filter className="h-4 w-4 text-[#E0C97B]" />
                      </div>
                      <h3 className="text-sm font-bold" style={{ color: T.accentLight }}>
                        تصفية البيانات
                      </h3>
                      {filterLoading && (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-[#E0C97B]" />
                      )}
                      {isFiltered && (
                        <span className="rounded-full bg-[#7B1E2F] px-2 py-0.5 text-[10px] text-[#E0C97B]">
                          مفعل
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="rounded-lg p-1 transition-all hover:bg-white/5"
                    >
                      <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} style={{ color: T.textMuted }} />
                    </button>
                  </div>
                </div>

                {showFilters && (
                  <div className="p-4 space-y-4">
                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'today', label: 'اليوم', icon: <Calendar className="h-3 w-3" /> },
                        { id: 'yesterday', label: 'أمس', icon: <Calendar className="h-3 w-3" /> },
                        { id: 'thisWeek', label: 'هذا الأسبوع', icon: <CalendarDays className="h-3 w-3" /> },
                        { id: 'thisMonth', label: 'هذا الشهر', icon: <CalendarDays className="h-3 w-3" /> },
                        { id: 'lastMonth', label: 'الشهر الماضي', icon: <CalendarDays className="h-3 w-3" /> },
                        { id: 'thisYear', label: 'هذه السنة', icon: <Calendar className="h-3 w-3" /> },
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => applyPreset(preset.id)}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                            activePreset === preset.id 
                              ? 'bg-gradient-to-r from-[#7B1E2F] to-[#5A0F1F] text-[#E0C97B] shadow-lg' 
                              : 'hover:bg-white/5'
                          }`}
                          style={{ background: activePreset === preset.id ? '' : T.surfaceHover }}
                        >
                          {preset.icon}
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Filter Mode Toggle */}
                    <div className="flex gap-2 rounded-lg p-1" style={{ background: T.surfaceDeep }}>
                      <button
                        onClick={() => {
                          setFilterMode("dropdowns");
                          setStartDate("");
                          setEndDate("");
                        }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-all"
                        style={{
                          background: filterMode === "dropdowns" ? T.surfaceHover : "transparent",
                          color: filterMode === "dropdowns" ? T.accentLight : T.textMuted,
                        }}
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                        يوم / شهر / سنة
                      </button>
                      <button
                        onClick={() => {
                          setFilterMode("range");
                          setFilterDay("");
                          setFilterMonth("");
                          setFilterYear("");
                        }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-all"
                        style={{
                          background: filterMode === "range" ? T.surfaceHover : "transparent",
                          color: filterMode === "range" ? T.accentLight : T.textMuted,
                        }}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        نطاق مخصص
                      </button>
                    </div>

                    {/* Filter Inputs */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {filterMode === "dropdowns" ? (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium" style={{ color: T.accentMuted }}>اليوم</label>
                            <select
                              value={filterDay}
                              onChange={(e) => setFilterDay(e.target.value)}
                              className="w-full rounded-lg border px-3 py-2 text-sm transition-all focus:shadow-lg"
                              style={{
                                background: T.surfaceHover,
                                borderColor: filterDay ? T.accent : T.border,
                                color: T.text,
                              }}
                            >
                              <option value="">الكل</option>
                              {Array.from({ length: 31 }, (_, i) => (
                                <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium" style={{ color: T.accentMuted }}>الشهر</label>
                            <select
                              value={filterMonth}
                              onChange={(e) => setFilterMonth(e.target.value)}
                              className="w-full rounded-lg border px-3 py-2 text-sm transition-all focus:shadow-lg"
                              style={{
                                background: T.surfaceHover,
                                borderColor: filterMonth ? T.accent : T.border,
                                color: T.text,
                              }}
                            >
                              <option value="">الكل</option>
                              {[
                                "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                                "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
                              ].map((m, i) => (
                                <option key={i + 1} value={String(i + 1)}>{m}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium" style={{ color: T.accentMuted }}>السنة</label>
                            <select
                              value={filterYear}
                              onChange={(e) => setFilterYear(e.target.value)}
                              className="w-full rounded-lg border px-3 py-2 text-sm transition-all focus:shadow-lg"
                              style={{
                                background: T.surfaceHover,
                                borderColor: filterYear ? T.accent : T.border,
                                color: T.text,
                              }}
                            >
                              <option value="">الكل</option>
                              {[2024, 2025, 2026, 2027].map((y) => (
                                <option key={y} value={String(y)}>{y}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium" style={{ color: T.accentMuted }}>من تاريخ</label>
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="w-full rounded-lg border px-3 py-2 text-sm transition-all focus:shadow-lg"
                              style={{
                                background: T.surfaceHover,
                                borderColor: startDate ? T.accent : T.border,
                                color: T.text,
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium" style={{ color: T.accentMuted }}>إلى تاريخ</label>
                            <input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="w-full rounded-lg border px-3 py-2 text-sm transition-all focus:shadow-lg"
                              style={{
                                background: T.surfaceHover,
                                borderColor: endDate ? T.accent : T.border,
                                color: T.text,
                              }}
                            />
                          </div>
                        </>
                      )}
                      
                      {/* Reset Button */}
                      <div className="flex items-end">
                        <button
                          onClick={resetFilters}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10"
                        >
                          <RotateCcw className="h-4 w-4" />
                          إعادة تعيين
                        </button>
                      </div>
                    </div>

                    {/* Filter Summary - Now Integrated */}
                    {isFiltered && (
                      <div className="mt-4 rounded-lg border p-3" style={{ borderColor: T.border, background: T.surfaceDeep }}>
                        <p className="mb-2 text-xs font-medium" style={{ color: T.accentMuted }}>
                          {stats.filteredLabel} - نتائج الفلترة
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <CompactStat
                            label="المبيعات"
                            value={stats.filteredSales}
                            isCurrency
                            color="#7B1E2F"
                          />
                          <CompactStat
                            label="الطلبات المكتملة"
                            value={stats.filteredOrders}
                            color="#10b981"
                          />
                          <CompactStat
                            label="قيد الانتظار"
                            value={stats.filteredPending}
                            color="#f59e0b"
                          />
                          <CompactStat
                            label="ملغية"
                            value={stats.filteredCancelled}
                            color="#ef4444"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* --- Main KPI Cards - Now with Filter Integration --- */}
              <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <MainKpiCard
                  title="مبيعات اليوم"
                  value={stats.todaySales}
                  filteredValue={isFiltered ? stats.filteredSales : undefined}
                  icon={<TrendingUp className="h-4 w-4" />}
                  color="from-blue-500 to-cyan-500"
                  isCurrency
                />
                <MainKpiCard
                  title="مبيعات الشهر"
                  value={stats.monthlySales}
                  icon={<BarChart3 className="h-4 w-4" />}
                  color="from-purple-500 to-pink-500"
                  isCurrency
                />
                <MainKpiCard
                  title="الطلبات المكتملة"
                  value={stats.totalOrders}
                  filteredValue={isFiltered ? stats.filteredOrders : undefined}
                  icon={<Package className="h-4 w-4" />}
                  color="from-emerald-500 to-teal-500"
                />
                <MainKpiCard
                  title="قيد الانتظار"
                  value={stats.pendingOrders}
                  filteredValue={isFiltered ? stats.filteredPending : undefined}
                  icon={<Clock className="h-4 w-4" />}
                  color="from-amber-500 to-orange-500"
                />
                <MainKpiCard
                  title="الطلبات الملغية"
                  value={stats.cancelledOrders}
                  filteredValue={isFiltered ? stats.filteredCancelled : undefined}
                  icon={<Ban className="h-4 w-4" />}
                  color="from-rose-500 to-red-500"
                />
                <MainKpiCard
                  title="إجمالي العملاء"
                  value={stats.totalCustomers}
                  icon={<Users className="h-4 w-4" />}
                  color="from-indigo-500 to-purple-500"
                />
              </section>

              {/* --- Professional Charts Section --- */}
              <section className="grid gap-6 lg:grid-cols-3">
                {/* Line Chart - Sales Over Time */}
                <div className="admin-panel col-span-2 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-bold" style={{ color: T.accentLight }}>
                      <Activity className="h-4 w-4" />
                      تحليل المبيعات على مدار اليوم
                    </h3>
                    <div className="flex gap-1 rounded-lg p-1" style={{ background: T.surfaceDeep }}>
                      <button
                        onClick={() => setActiveChart("line")}
                        className={`rounded-md px-2 py-1 text-xs transition-all ${
                          activeChart === "line" ? 'bg-[#7B1E2F] text-[#E0C97B]' : 'hover:bg-white/5'
                        }`}
                      >
                        خطي
                      </button>
                      <button
                        onClick={() => setActiveChart("bar")}
                        className={`rounded-md px-2 py-1 text-xs transition-all ${
                          activeChart === "bar" ? 'bg-[#7B1E2F] text-[#E0C97B]' : 'hover:bg-white/5'
                        }`}
                      >
                        أعمدة
                      </button>
                      <button
                        onClick={() => setActiveChart("area")}
                        className={`rounded-md px-2 py-1 text-xs transition-all ${
                          activeChart === "area" ? 'bg-[#7B1E2F] text-[#E0C97B]' : 'hover:bg-white/5'
                        }`}
                      >
                        مساحة
                      </button>
                    </div>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {activeChart === "line" ? (
                        <RechartsLineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={`${T.border}40`} />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: T.textMuted, fontSize: 11 }}
                            axisLine={{ stroke: T.border }}
                          />
                          <YAxis 
                            tick={{ fill: T.textMuted, fontSize: 11 }}
                            axisLine={{ stroke: T.border }}
                          />
                          <Tooltip
                            contentStyle={{
                              background: T.surface,
                              borderColor: T.border,
                              borderRadius: '8px',
                              color: T.text,
                            }}
                          />
                          <Legend wrapperStyle={{ color: T.text }} />
                          <Line 
                            type="monotone" 
                            dataKey="المبيعات" 
                            stroke="#7B1E2F" 
                            strokeWidth={2}
                            dot={{ fill: "#7B1E2F", r: 4 }}
                            activeDot={{ r: 6, fill: "#E0C97B" }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="الطلبات" 
                            stroke="#C5A55A" 
                            strokeWidth={2}
                            dot={{ fill: "#C5A55A", r: 3 }}
                          />
                        </RechartsLineChart>
                      ) : activeChart === "bar" ? (
                        <RechartsBarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={`${T.border}40`} />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: T.textMuted, fontSize: 11 }}
                            axisLine={{ stroke: T.border }}
                          />
                          <YAxis 
                            tick={{ fill: T.textMuted, fontSize: 11 }}
                            axisLine={{ stroke: T.border }}
                          />
                          <Tooltip
                            contentStyle={{
                              background: T.surface,
                              borderColor: T.border,
                              borderRadius: '8px',
                              color: T.text,
                            }}
                          />
                          <Legend wrapperStyle={{ color: T.text }} />
                          <Bar dataKey="المبيعات" fill="#7B1E2F" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="الطلبات" fill="#C5A55A" radius={[4, 4, 0, 0]} />
                        </RechartsBarChart>
                      ) : (
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                          <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7B1E2F" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#7B1E2F" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#C5A55A" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#C5A55A" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={`${T.border}40`} />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: T.textMuted, fontSize: 11 }}
                            axisLine={{ stroke: T.border }}
                          />
                          <YAxis 
                            tick={{ fill: T.textMuted, fontSize: 11 }}
                            axisLine={{ stroke: T.border }}
                          />
                          <Tooltip
                            contentStyle={{
                              background: T.surface,
                              borderColor: T.border,
                              borderRadius: '8px',
                              color: T.text,
                            }}
                          />
                          <Legend wrapperStyle={{ color: T.text }} />
                          <Area 
                            type="monotone" 
                            dataKey="المبيعات" 
                            stroke="#7B1E2F" 
                            fillOpacity={1}
                            fill="url(#colorSales)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="الطلبات" 
                            stroke="#C5A55A" 
                            fillOpacity={1}
                            fill="url(#colorOrders)" 
                          />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie Charts Column */}
                <div className="space-y-6">
                  {/* Top Products Pie Chart */}
                  <div className="admin-panel p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold" style={{ color: T.accentLight }}>
                      <PieChart className="h-4 w-4" />
                      أكثر المنتجات مبيعاً
                    </h3>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={topProductsData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={{ stroke: T.textMuted }}
                          >
                            {topProductsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: T.surface,
                              borderColor: T.border,
                              borderRadius: '8px',
                              color: T.text,
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {topProductsData.slice(0, 4).map((item, i) => (
                        <div key={i} className="flex items-center gap-1 text-xs">
                          <div className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i] }} />
                          <span style={{ color: T.textMuted }}>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Methods Pie Chart */}
                  <div className="admin-panel p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold" style={{ color: T.accentLight }}>
                      <CreditCard className="h-4 w-4" />
                      طرق الدفع
                    </h3>
                    <div className="h-40 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={paymentMethodsData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={{ stroke: T.textMuted }}
                          >
                            {paymentMethodsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index + 3]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: T.surface,
                              borderColor: T.border,
                              borderRadius: '8px',
                              color: T.text,
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </section>

              {/* --- Store Statistics Section --- */}
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold" style={{ color: T.accentLight }}>
                  <Store className="h-5 w-5" />
                  إحصائيات المتجر
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <StoreStat
                    icon={<DollarSign className="h-5 w-5" />}
                    label="إجمالي الإيرادات"
                    value={stats.storeStats.totalRevenue}
                    isCurrency
                    color="#7B1E2F"
                  />
                  <StoreStat
                    icon={<BarChart3 className="h-5 w-5" />}
                    label="متوسط قيمة الطلب"
                    value={stats.storeStats.avgOrderValue}
                    isCurrency
                    color="#C5A55A"
                  />
                  <StoreStat
                    icon={<Truck className="h-5 w-5" />}
                    label="إجمالي رسوم التوصيل"
                    value={stats.storeStats.totalDeliveryFees}
                    isCurrency
                    color="#E0C97B"
                  />
                  <StoreStat
                    icon={<MapPin className="h-5 w-5" />}
                    label="أكثر مدينة طلباً"
                    value={stats.storeStats.topCity ? `${stats.storeStats.topCity.name} (${stats.storeStats.topCity.count})` : "لا بيانات"}
                    color="#9F4A5A"
                  />
                  <StoreStat
                    icon={<Star className="h-5 w-5" />}
                    label="أكثر منتج مبيعاً"
                    value={stats.storeStats.topProduct ? `${stats.storeStats.topProduct.name} (${stats.storeStats.topProduct.qty})` : "لا بيانات"}
                    color="#B88B4A"
                  />
                  <StoreStat
                    icon={<Award className="h-5 w-5" />}
                    label="تقييم المتجر"
                    value="4.8 / 5.0"
                    color="#5A3E2E"
                  />
                </div>
              </section>

              {/* --- Print Sales Reports --- */}
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold" style={{ color: T.accentLight }}>
                  <Printer className="h-5 w-5" />
                  تقارير المبيعات
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <PrintButton
                    period="daily"
                    label="تقرير اليوم"
                    sublabel="تفاصيل مبيعات اليوم"
                    icon={<TrendingUp className="h-5 w-5" />}
                    color="from-blue-500 to-cyan-500"
                  />
                  <PrintButton
                    period="monthly"
                    label="تقرير الشهر"
                    sublabel="ملخص مبيعات الشهر"
                    icon={<CalendarDays className="h-5 w-5" />}
                    color="from-purple-500 to-pink-500"
                  />
                  <PrintButton
                    period="yearly"
                    label="تقرير السنة"
                    sublabel="إحصائيات السنة"
                    icon={<Calendar className="h-5 w-5" />}
                    color="from-amber-500 to-orange-500"
                  />
                </div>
              </section>
            </div>
          )}

          {/* ========== ORDERS TAB ========== */}
          {activeTab === "orders" &&
            (() => {
              const filteredOrders = orders
                .filter(
                  (o) =>
                    !orderDateFilter ||
                    new Date(o.created_at).toISOString().slice(0, 10) ===
                      orderDateFilter,
                )
                .sort((a, b) => {
                  const da = new Date(a.created_at).getTime();
                  const db = new Date(b.created_at).getTime();
                  return orderSortDir === "desc" ? db - da : da - db;
                });
              return (
                <div className="flex flex-col gap-4">
                  {/* Date controls */}
                  <div className="admin-panel p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                        <Calendar className="h-4 w-4" style={{ color: T.accentLight }} />
                        <span className="text-xs font-medium" style={{ color: T.textMuted }}>
                          ترتيب:
                        </span>
                        <button
                          onClick={() => setOrderSortDir(orderSortDir === "desc" ? "asc" : "desc")}
                          className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs transition-all hover:bg-white/20"
                          style={{ color: T.accentLight }}
                        >
                          {orderSortDir === "desc" ? "الأحدث ↓" : "الأقدم ↑"}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={orderDateFilter}
                          onChange={(e) => setOrderDateFilter(e.target.value)}
                          className="rounded-lg border px-3 py-2 text-xs outline-none"
                          style={{
                            borderColor: T.border,
                            background: T.surface,
                            color: T.text,
                          }}
                        />
                        {orderDateFilter && (
                          <button
                            onClick={() => setOrderDateFilter("")}
                            className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 transition-all hover:bg-red-500/10"
                          >
                            <RotateCcw className="h-3 w-3" /> مسح
                          </button>
                        )}
                      </div>
                      <span className="mr-auto text-xs" style={{ color: T.textDim }}>
                        {filteredOrders.length === orders.length
                          ? `إجمالي: ${orders.length} طلب`
                          : `${filteredOrders.length} من ${orders.length} طلب`}
                      </span>
                    </div>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <EmptyState
                      text={
                        orderDateFilter
                          ? "لا توجد طلبات في هذا التاريخ"
                          : "لا توجد طلبات حتى الآن"
                      }
                    />
                  ) : (
                    filteredOrders.map((order, idx) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        index={idx}
                        onStatusChange={updateOrderStatus}
                        onPrint={printInvoice}
                      />
                    ))
                  )}
                </div>
              );
            })()}

          {/* ========== PRODUCTS TAB ========== */}
          {activeTab === "products" && (
            <div className="animate-slide-up-fade">
              <ProductsManager />
            </div>
          )}

          {/* ========== CATEGORIES TAB ========== */}
          {activeTab === "categories" && (
            <div className="animate-slide-up-fade">
              <CategoriesManager />
            </div>
          )}

          {/* ========== OPTIONS TAB ========== */}
          {activeTab === "options" && (
            <div className="animate-slide-up-fade">
              <OptionGroupsManager />
            </div>
          )}

          {/* ========== EVENTS TAB ========== */}
          {activeTab === "events" && (
            <div className="animate-slide-up-fade">
              <EventsManager />
            </div>
          )}

          {/* ========== BRANCHES TAB ========== */}
          {activeTab === "branches" && (
            <div className="animate-slide-up-fade">
              <BranchesManager />
            </div>
          )}

          {/* ========== USERS TAB ========== */}
          {activeTab === "users" && (
            <div className="animate-slide-up-fade">
              <UsersManager />
            </div>
          )}

          {/* ========== DELIVERY TAB ========== */}
          {activeTab === "delivery" && (
            <div className="animate-slide-up-fade">
              <DeliveryManager />
            </div>
          )}

          {/* ========== SETTINGS TAB ========== */}
          {activeTab === "settings" && (
            <div className="animate-slide-up-fade">
              <SettingsManager />
            </div>
          )}

          {/* ========== CUSTOMERS TAB ========== */}
          {activeTab === "customers" && (
            <CustomerList
              customers={customers}
              filteredCustomers={filteredCustomers}
              customerSearch={customerSearch}
              setCustomerSearch={setCustomerSearch}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ New Components ============ */

// Compact Stat for Filter Summary
function CompactStat({ label, value, isCurrency, color }: { label: string; value: number; isCurrency?: boolean; color: string }) {
  const animated = useCountUp(value, 700);
  return (
    <div className="rounded-lg p-2 text-center" style={{ background: `${color}15` }}>
      <p className="text-[10px]" style={{ color: `${color}cc` }}>{label}</p>
      <p className="text-sm font-bold" style={{ color }}>
        {isCurrency ? `${animated.toFixed(2)} د.ل` : Math.round(animated)}
      </p>
    </div>
  );
}

// Main KPI Card with Filter Integration
function MainKpiCard({ 
  title, 
  value, 
  filteredValue, 
  icon, 
  color, 
  isCurrency 
}: { 
  title: string; 
  value: number; 
  filteredValue?: number; 
  icon: React.ReactNode; 
  color: string; 
  isCurrency?: boolean; 
}) {
  const animated = useCountUp(value, 900);
  const filteredAnimated = filteredValue !== undefined ? useCountUp(filteredValue, 900) : null;

  return (
    <div className="admin-card relative overflow-hidden p-4 transition-all hover:scale-[1.02]">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5`} />
      <div className="relative z-10">
        <div className="mb-2 flex items-center justify-between">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${color} bg-opacity-20`}>
            <div className="text-white">{icon}</div>
          </div>
          {filteredValue !== undefined && (
            <span className="rounded-full bg-[#7B1E2F] px-2 py-0.5 text-[8px] text-[#E0C97B]">
              مفلتر
            </span>
          )}
        </div>
        <p className="text-xs" style={{ color: T.textMuted }}>{title}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-lg font-bold" style={{ color: T.text }}>
            {isCurrency ? `${animated.toFixed(2)} د.ل` : Math.round(animated)}
          </p>
          {filteredValue !== undefined && (
            <>
              <span className="text-xs" style={{ color: T.textDim }}>→</span>
              <p className="text-sm font-bold" style={{ color: '#7B1E2F' }}>
                {isCurrency ? `${filteredAnimated?.toFixed(2)} د.ل` : Math.round(filteredAnimated || 0)}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Store Stat Card
function StoreStat({ icon, label, value, isCurrency, color }: { icon: React.ReactNode; label: string; value: number | string; isCurrency?: boolean; color: string }) {
  const animated = typeof value === 'number' ? useCountUp(value, 900) : null;
  
  return (
    <div className="admin-card p-5 transition-all hover:scale-[1.02]">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl`} style={{ background: `${color}20` }}>
          <div style={{ color }}>{icon}</div>
        </div>
        <div>
          <p className="text-sm" style={{ color: T.textMuted }}>{label}</p>
          <p className="text-xl font-bold" style={{ color: T.text }}>
            {typeof value === 'number' 
              ? (isCurrency ? `${animated?.toFixed(2)} د.ل` : Math.round(animated || 0))
              : value}
          </p>
        </div>
      </div>
    </div>
  );
}

// Order Card Component
function OrderCard({ order, index, onStatusChange, onPrint }: { order: Order; index: number; onStatusChange: (id: number, status: string) => void; onPrint: (order: Order) => void }) {
  function getStatusBadge(status: string) {
    const s: Record<string, string> = {
      pending: "bg-amber-500/15 text-amber-400",
      confirmed: "bg-emerald-500/15 text-emerald-400",
      preparing: "bg-sky-500/15 text-sky-400",
      delivered: "bg-cyan-500/15 text-cyan-300",
      cancelled: "bg-red-500/15 text-red-400",
    };
    const l: Record<string, string> = {
      pending: "قيد الانتظار",
      confirmed: "مؤكد",
      preparing: "قيد التحضير",
      delivered: "تم التوصيل",
      cancelled: "ملغي",
    };
    return (
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300 ${s[status] || s.pending}`}
      >
        {l[status] || status}
      </span>
    );
  }

  return (
    <div
      className="admin-card animate-card-enter overflow-hidden p-6"
      style={{
        animationDelay: `${index * 60}ms`,
        animationFillMode: "backwards",
      }}
    >
      <div className="relative z-10">
        {/* Order Header */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#7B1E2F] to-[#5A0F1F]">
              <span className="text-lg font-bold text-[#E0C97B]">#{order.id}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold" style={{ color: T.text }}>
                  {order.customer_name}
                </h3>
                {getStatusBadge(order.status)}
              </div>
              <p className="mt-1 text-sm" style={{ color: T.textDim }}>
                {new Date(order.created_at).toLocaleString("ar-LY", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
            </div>
          </div>
          <button
            onClick={() => onPrint(order)}
            className="group flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-all hover:bg-white/5"
            style={{ borderColor: T.border }}
          >
            <Printer className="h-4 w-4 transition-transform group-hover:scale-110" style={{ color: T.accentLight }} />
            <span style={{ color: T.accentLight }}>طباعة الفاتورة</span>
          </button>
        </div>

        {/* Customer Info Grid */}
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoBadge icon={<Phone className="h-3.5 w-3.5" />} label="الهاتف" value={order.phone} />
          {order.secondary_phone && (
            <InfoBadge icon={<Phone className="h-3.5 w-3.5" />} label="هاتف ثانوي" value={order.secondary_phone} />
          )}
          <InfoBadge icon={<MapPin className="h-3.5 w-3.5" />} label="المدينة" value={order.city} />
          <InfoBadge icon={<Wallet className="h-3.5 w-3.5" />} label="الدفع" value={
            order.payment_method === "card" ? "بطاقة" :
            order.payment_method === "cash" ? "نقدي" : "LYPAY"
          } />
        </div>

        {/* Order Items Table */}
        <div className="mb-4 overflow-x-auto rounded-xl border" style={{ borderColor: T.border }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: T.surfaceDeep }}>
                <th className="px-4 py-3 text-right" style={{ color: T.accentLight }}>المنتج</th>
                <th className="px-4 py-3 text-center" style={{ color: T.accentLight }}>الكمية</th>
                <th className="px-4 py-3 text-center" style={{ color: T.accentLight }}>السعر</th>
                <th className="px-4 py-3 text-center" style={{ color: T.accentLight }}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id} className="border-t" style={{ borderColor: T.border }}>
                  <td className="px-4 py-3">
                    <div>
                      <span style={{ color: T.text }}>{item.product_name}</span>
                      {item.selected_options && Array.isArray(item.selected_options) && item.selected_options.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.selected_options.map((opt: any, idx: number) => (
                            <span key={idx} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px]" style={{ color: T.accentMuted }}>
                              {opt.name} +{opt.price} د.ل
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center" style={{ color: T.text }}>{item.quantity}</td>
                  <td className="px-4 py-3 text-center" style={{ color: T.text }}>{Number(item.unit_price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center font-bold" style={{ color: T.accentLight }}>
                    {(item.quantity * Number(item.unit_price)).toFixed(2)} د.ل
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="text-sm">
              <span style={{ color: T.textMuted }}>توصيل: </span>
              <span className="font-bold" style={{ color: T.accentLight }}>
                {Number(order.delivery_fee).toFixed(2)} د.ل
              </span>
            </div>
            <div className="text-sm">
              <span style={{ color: T.textMuted }}>الإجمالي: </span>
              <span className="text-lg font-bold" style={{ color: T.text }}>
                {Number(order.total_amount).toFixed(2)} د.ل
              </span>
            </div>
          </div>
          
          {/* Status Actions */}
          <div className="flex gap-2">
            {order.status === "pending" && (
              <>
                <StatusButton
                  onClick={() => onStatusChange(order.id, "confirmed")}
                  label="تأكيد"
                  icon={<CheckCircle className="h-3.5 w-3.5" />}
                  color="emerald"
                />
                <StatusButton
                  onClick={() => onStatusChange(order.id, "cancelled")}
                  label="إلغاء"
                  icon={<XCircle className="h-3.5 w-3.5" />}
                  color="red"
                />
              </>
            )}
            {order.status === "confirmed" && (
              <StatusButton
                onClick={() => onStatusChange(order.id, "preparing")}
                label="قيد التحضير"
                icon={<Clock className="h-3.5 w-3.5" />}
                color="sky"
              />
            )}
            {order.status === "preparing" && (
              <StatusButton
                onClick={() => onStatusChange(order.id, "delivered")}
                label="تم التوصيل"
                icon={<CheckCircle className="h-3.5 w-3.5" />}
                color="cyan"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Customer List Component
function CustomerList({ customers, filteredCustomers, customerSearch, setCustomerSearch }: { customers: Customer[]; filteredCustomers: Customer[]; customerSearch: string; setCustomerSearch: (s: string) => void }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Header with stats */}
      <div className="admin-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: T.accentLight }}>
              إدارة العملاء
            </h2>
            <p className="mt-1 text-sm" style={{ color: T.textDim }}>
              إجمالي: {customers.length} عميل
              {customerSearch && ` | نتائج البحث: ${filteredCustomers.length}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-[#7B1E2F] to-[#5A0F1F] px-4 py-2">
              <p className="text-xs text-[#E0C97B]">مسجلين</p>
              <p className="text-xl font-bold text-[#E0C97B]">{customers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: T.textDim }} />
        <input
          type="text"
          value={customerSearch}
          onChange={(e) => setCustomerSearch(e.target.value)}
          placeholder="بحث بالاسم، الهاتف، البريد الإلكتروني..."
          className="w-full rounded-xl border py-4 pr-11 pl-4 text-sm outline-none transition-all duration-300 focus:shadow-lg"
          style={{
            borderColor: T.border,
            background: T.surface,
            color: T.text,
          }}
        />
      </div>

      {filteredCustomers.length === 0 ? (
        <EmptyState text={customerSearch ? "لا توجد نتائج مطابقة" : "لا يوجد عملاء مسجلين"} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer, i) => (
            <CustomerCard key={customer.id} customer={customer} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// Customer Card Component
function CustomerCard({ customer, index }: { customer: Customer; index: number }) {
  return (
    <div
      className="admin-card group animate-card-enter overflow-hidden p-5 transition-all duration-300 hover:scale-[1.02]"
      style={{
        animationDelay: `${index * 40}ms`,
        animationFillMode: "backwards",
      }}
    >
      <div className="relative z-10">
        {/* Customer Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#7B1E2F] to-[#5A0F1F]">
              <span className="text-lg font-bold text-[#E0C97B]">
                {customer.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-bold" style={{ color: T.text }}>
                {customer.name}
              </h3>
              <p className="font-mono text-sm" style={{ color: T.accentMuted }} dir="ltr">
                {customer.phone}
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              customer.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
            }`}
          >
            {customer.is_active ? 'نشط' : 'معطل'}
          </span>
        </div>

        {/* Customer Details */}
        <div className="space-y-2 text-sm">
          {customer.email && (
            <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
              <Globe className="h-4 w-4" style={{ color: T.accentMuted }} />
              <span style={{ color: T.textMuted }}>{customer.email}</span>
            </div>
          )}
          {customer.city && (
            <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
              <MapPin className="h-4 w-4" style={{ color: T.accentMuted }} />
              <span style={{ color: T.textMuted }}>{customer.city}</span>
            </div>
          )}
          {customer.address && (
            <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
              <Store className="h-4 w-4" style={{ color: T.accentMuted }} />
              <span style={{ color: T.textMuted }}>{customer.address}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: T.border }}>
          <span className="text-xs" style={{ color: T.textDim }}>
            <Calendar className="ml-1 inline h-3 w-3" />
            {new Date(customer.created_at).toLocaleDateString("ar-LY", {
              year: "numeric",
              month: "short",
              day: "numeric"
            })}
          </span>
          <span className="text-xs" style={{ color: T.textDim }}>
            #{customer.id}
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function InfoBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
      <div style={{ color: T.accentMuted }}>{icon}</div>
      <div>
        <span className="text-xs" style={{ color: T.textDim }}>{label}: </span>
        <span className="text-sm" style={{ color: T.text }}>{value}</span>
      </div>
    </div>
  );
}

function StatusButton({ onClick, label, icon, color }: { onClick: () => void; label: string; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
    red: { bg: 'bg-red-500/15', text: 'text-red-400' },
    sky: { bg: 'bg-sky-500/15', text: 'text-sky-400' },
    cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all hover:scale-105 ${colorMap[color].bg} ${colorMap[color].text}`}
    >
      {icon}
      {label}
    </button>
  );
}

function PrintButton({ period, label, sublabel, icon, color }: { period: string; label: string; sublabel: string; icon: React.ReactNode; color: string }) {
  const [loading, setLoading] = useState(false);
  const periodLabels: Record<string, string> = {
    daily: "اليوم",
    monthly: "هذا الشهر",
    yearly: "هذه السنة",
  };
  const paymentLabels: Record<string, string> = {
    card: "بطاقة بنكية",
    cash: "الدفع عند الاستلام",
    lypay: "تحويل LYPAY",
  };

  async function handlePrint() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sales-report?period=${period}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const s = data.summary || {};
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      printWindow.document
        .write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
        <title>تقرير مبيعات ${periodLabels[period]}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 30px; color: #1a1a2e; background: #fff; }
          h1 { text-align: center; color: #16213e; font-size: 22px; border-bottom: 3px solid #0f3460; padding-bottom: 10px; }
          h2 { color: #0f3460; font-size: 16px; margin-top: 25px; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 15px 0; }
          .stat-box { border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; text-align: center; }
          .stat-box .value { font-size: 20px; font-weight: bold; color: #0f3460; }
          .stat-box .label { font-size: 11px; color: #666; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
          th { background: #f5f5f5; padding: 8px 12px; text-align: right; font-weight: 600; border: 1px solid #ddd; }
          td { padding: 8px 12px; border: 1px solid #eee; }
          .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
          @media print { body { padding: 15px; } }
        </style></head><body>
        <h1>تقرير مبيعات ${periodLabels[period]}</h1>
        <p style="text-align:center;color:#666;font-size:12px">${new Date().toLocaleString("ar-LY")}</p>

        <h2>ملخص عام</h2>
        <div class="stats-grid">
          <div class="stat-box"><div class="value">${Number(s.total_orders || 0)}</div><div class="label">إجمالي الطلبات</div></div>
          <div class="stat-box"><div class="value">${Number(s.total_revenue || 0).toFixed(2)} د.ل</div><div class="label">إجمالي المبيعات</div></div>
          <div class="stat-box"><div class="value">${Number(s.avg_order || 0).toFixed(2)} د.ل</div><div class="label">متوسط قيمة الطلب</div></div>
          <div class="stat-box"><div class="value">${Number(s.completed_orders || 0)}</div><div class="label">طلبات مكتملة</div></div>
          <div class="stat-box"><div class="value">${Number(s.pending_orders || 0)}</div><div class="label">قيد الانتظار</div></div>
          <div class="stat-box"><div class="value">${Number(s.cancelled_orders || 0)}</div><div class="label">ملغية</div></div>
        </div>

        ${
          (data.breakdown || []).length > 0
            ? `
        <h2>التفاصيل حسب الفترة</h2>
        <table><thead><tr><th>الفترة</th><th>عدد الطلبات</th><th>المبيعات</th></tr></thead><tbody>
        ${(data.breakdown || [])
          .map(
            (r: { time_label: string; order_count: number; revenue: number }) =>
              `<tr><td>${r.time_label}</td><td>${r.order_count}</td><td>${Number(r.revenue).toFixed(2)} د.ل</td></tr>`,
          )
          .join("")}
        </tbody></table>`
            : ""
        }

        ${
          (data.topProducts || []).length > 0
            ? `
        <h2>أكثر المنتجات مبيعاً</h2>
        <table><thead><tr><th>المنتج</th><th>الكمية</th><th>الإيرادات</th></tr></thead><tbody>
        ${(data.topProducts || [])
          .map(
            (p: {
              product_name: string;
              total_qty: number;
              total_revenue: number;
            }) =>
              `<tr><td>${p.product_name}</td><td>${p.total_qty}</td><td>${Number(p.total_revenue).toFixed(2)} د.ل</td></tr>`,
          )
          .join("")}
        </tbody></table>`
            : ""
        }

        ${
          (data.paymentBreakdown || []).length > 0
            ? `
        <h2>طرق الدفع</h2>
        <table><thead><tr><th>الطريقة</th><th>العدد</th><th>المبلغ</th></tr></thead><tbody>
        ${(data.paymentBreakdown || [])
          .map(
            (p: { payment_method: string; count: number; revenue: number }) =>
              `<tr><td>${paymentLabels[p.payment_method] || p.payment_method}</td><td>${p.count}</td><td>${Number(p.revenue).toFixed(2)} د.ل</td></tr>`,
          )
          .join("")}
        </tbody></table>`
            : ""
        }

        <div class="footer">تم إنشاء هذا التقرير تلقائياً من لوحة التحكم</div>
        </body></html>`);
      printWindow.document.close();
      printWindow.print();
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePrint}
      disabled={loading}
      className="admin-card group relative overflow-hidden p-5 transition-all duration-300 hover:scale-[1.02]"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10 transition-opacity duration-300 group-hover:opacity-20`} />
      
      <div className="relative z-10 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <div className="text-white">{icon}</div>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold" style={{ color: T.text }}>{label}</p>
          <p className="text-xs" style={{ color: T.textDim }}>{sublabel}</p>
        </div>
      </div>
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
        <ShoppingBag className="h-10 w-10" style={{ color: T.textDim }} />
      </div>
      <p style={{ color: T.textMuted }}>{text}</p>
    </div>
  );
}