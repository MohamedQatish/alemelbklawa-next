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
} from "lucide-react";

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

  // Date filter state
  const [filterDay, setFilterDay] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterMode, setFilterMode] = useState<"dropdowns" | "range">(
    "dropdowns",
  );

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

  return (
    <div
      className="admin-inputs min-h-screen"
      style={{ background: T.bg }}
      ref={printRef}
    >
      {/* ===== Top Bar ===== */}
      <header
        className="admin-panel animate-slide-up-fade"
        style={{
          borderRadius: 0,
          borderLeft: "none",
          borderRight: "none",
          borderTop: "none",
        }}
      >
        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold" style={{ color: T.accentLight }}>
            لوحة التحكم
          </h1>
          <div className="flex items-center gap-3">
            {refreshing && (
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2"
                style={{ borderColor: "transparent", borderTopColor: T.accent }}
              />
            )}
            <button
              onClick={handleLogout}
              className="admin-btn-glow flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors hover:bg-red-500/10"
              style={{
                borderColor: "hsl(0 70% 55% / 0.25)",
                color: "hsl(0 70% 65%)",
              }}
            >
              <LogOut className="h-4 w-4" /> خروج
            </button>
          </div>
        </div>
      </header>

      {/* ===== Tabs ===== */}
      <div className="border-b" style={{ borderColor: T.border }}>
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6">
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
                className={`transition-transform duration-300 ${activeTab === tab.id ? "scale-110" : "group-hover:scale-105"}`}
              >
                {tab.icon}
              </span>
              {tab.label}
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
          {/* ========== STATS TAB ========== */}
          {activeTab === "stats" && stats && (
            <div className="flex flex-col gap-8">
              {/* --- FILTER SECTION --- */}
              <section className="admin-panel animate-card-enter relative p-4 sm:p-5">
                <div className="relative z-10">
                  <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
                    <h3
                      className="flex items-center gap-2 text-sm font-bold"
                      style={{ color: T.accentLight }}
                    >
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-md"
                        style={{ background: "hsl(200 80% 55% / 0.15)" }}
                      >
                        <Filter
                          className="h-3 w-3"
                          style={{ color: T.accentLight }}
                        />
                      </div>
                      تصفية المبيعات حسب التاريخ
                      {filterLoading && (
                        <span
                          className="mr-1.5 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-transparent"
                          style={{ borderTopColor: T.accent }}
                        />
                      )}
                    </h3>

                    <div
                      className="flex gap-0.5 rounded-md p-0.5"
                      style={{ background: T.surfaceHover }}
                    >
                      <button
                        onClick={() => {
                          setFilterMode("dropdowns");
                          setStartDate("");
                          setEndDate("");
                        }}
                        className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-300"
                        style={{
                          background:
                            filterMode === "dropdowns"
                              ? "hsl(200 80% 55% / 0.2)"
                              : "transparent",
                          color:
                            filterMode === "dropdowns"
                              ? T.accentLight
                              : T.textMuted,
                          boxShadow:
                            filterMode === "dropdowns"
                              ? `0 0 8px ${T.glow}`
                              : "none",
                        }}
                      >
                        <CalendarDays className="h-3 w-3" /> يوم / شهر / سنة
                      </button>
                      <button
                        onClick={() => {
                          setFilterMode("range");
                          setFilterDay("");
                          setFilterMonth("");
                          setFilterYear("");
                        }}
                        className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-300"
                        style={{
                          background:
                            filterMode === "range"
                              ? "hsl(200 80% 55% / 0.2)"
                              : "transparent",
                          color:
                            filterMode === "range"
                              ? T.accentLight
                              : T.textMuted,
                          boxShadow:
                            filterMode === "range"
                              ? `0 0 8px ${T.glow}`
                              : "none",
                        }}
                      >
                        <Calendar className="h-3 w-3" /> نطاق مخصص
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-end gap-3">
                    {filterMode === "dropdowns" ? (
                      <>
                        <FilterSelect
                          label="اليوم"
                          value={filterDay}
                          onChange={setFilterDay}
                          options={Array.from({ length: 31 }, (_, i) => ({
                            value: String(i + 1),
                            label: String(i + 1),
                          }))}
                        />
                        <FilterSelect
                          label="الشهر"
                          value={filterMonth}
                          onChange={setFilterMonth}
                          options={[
                            "يناير",
                            "فبراير",
                            "مارس",
                            "أبريل",
                            "مايو",
                            "يونيو",
                            "يوليو",
                            "أغسطس",
                            "سبتمبر",
                            "أكتوبر",
                            "نوفمبر",
                            "ديسمبر",
                          ].map((m, i) => ({
                            value: String(i + 1),
                            label: m,
                          }))}
                        />
                        <FilterSelect
                          label="السنة"
                          value={filterYear}
                          onChange={setFilterYear}
                          options={[2024, 2025, 2026, 2027].map((y) => ({
                            value: String(y),
                            label: String(y),
                          }))}
                        />
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col gap-1">
                          <label
                            className="text-[11px] font-medium"
                            style={{ color: T.accentMuted }}
                          >
                            من تاريخ
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={`rounded-md border text-xs transition-all duration-300 ${startDate ? "filter-active-glow" : ""}`}
                            style={{
                              background: T.surfaceHover,
                              borderColor: T.border,
                              color: T.text,
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label
                            className="text-[11px] font-medium"
                            style={{ color: T.accentMuted }}
                          >
                            إلى تاريخ
                          </label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className={`rounded-md border text-xs transition-all duration-300 ${endDate ? "filter-active-glow" : ""}`}
                            style={{
                              background: T.surfaceHover,
                              borderColor: T.border,
                              color: T.text,
                            }}
                          />
                        </div>
                      </>
                    )}

                    <button
                      onClick={resetFilters}
                      className="admin-btn-glow flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-all duration-300"
                      style={{
                        borderColor: "hsl(0 70% 55% / 0.25)",
                        color: "hsl(0 70% 65%)",
                        background: "hsl(0 70% 55% / 0.08)",
                      }}
                    >
                      <RotateCcw className="h-3 w-3" /> إعادة تعيين
                    </button>
                  </div>

                  {/* Filtered Result Summary */}
                  {isFiltered && (
                    <div
                      className="mt-4 animate-slide-up-fade rounded-lg border p-4"
                      style={{
                        borderColor: T.border,
                        background: T.surfaceDeep,
                      }}
                    >
                      <p
                        className="mb-1.5 text-xs"
                        style={{ color: T.accentMuted }}
                      >
                        {stats.filteredLabel}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-4">
                        <FilterResultCard
                          label="المبيعات"
                          value={stats.filteredSales}
                          isCurrency
                          color="hsl(200 80% 65%)"
                        />
                        <FilterResultCard
                          label="الطلبات المكتملة"
                          value={stats.filteredOrders}
                          color="hsl(150 70% 55%)"
                        />
                        <FilterResultCard
                          label="قيد الانتظار"
                          value={stats.filteredPending}
                          color="hsl(45 90% 55%)"
                        />
                        <FilterResultCard
                          label="ملغية"
                          value={stats.filteredCancelled}
                          color="hsl(0 70% 60%)"
                        />
                      </div>
                    </div>
                  )}

                  {/* Hourly Breakdown */}
                  {stats.hourlySales.length > 0 && (
                    <div className="mt-4 animate-slide-up-fade">
                      <h4
                        className="mb-2 text-xs font-semibold"
                        style={{ color: T.accentMuted }}
                      >
                        المبيعات بالساعة
                      </h4>
                      <div
                        className="flex items-end gap-0.5 rounded-lg border p-3"
                        style={{
                          borderColor: T.border,
                          background: T.surfaceDeep,
                          height: "160px",
                        }}
                      >
                        {Array.from({ length: 24 }, (_, hour) => {
                          const data = stats.hourlySales.find(
                            (h) => h.hour === hour,
                          );
                          const total = data?.total ?? 0;
                          const maxTotal = Math.max(
                            ...stats.hourlySales.map((h) => h.total),
                            1,
                          );
                          const heightPct =
                            total > 0
                              ? Math.max((total / maxTotal) * 100, 8)
                              : 2;
                          return (
                            <div
                              key={hour}
                              className="group relative flex flex-1 flex-col items-center justify-end"
                              style={{ height: "100%" }}
                            >
                              <div
                                className="pointer-events-none absolute -top-8 z-10 rounded-md px-2 py-1 text-xs opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"
                                style={{
                                  background: T.surfaceHover,
                                  color: T.accentLight,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {`${hour}:00 — ${total.toFixed(2)} د.ل`}
                              </div>
                              <div
                                className="hourly-bar w-full"
                                style={{
                                  height: `${heightPct}%`,
                                  background:
                                    total > 0
                                      ? `linear-gradient(180deg, ${T.accent} 0%, hsl(200 80% 35%) 100%)`
                                      : T.surfaceHover,
                                }}
                              />
                              <span
                                className="mt-1 text-[9px]"
                                style={{ color: T.textDim }}
                              >
                                {hour % 3 === 0 ? `${hour}` : ""}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* --- Website Statistics --- */}
              <section>
                <h2
                  className="mb-4 flex items-center gap-2 text-lg font-bold"
                  style={{ color: T.accentLight }}
                >
                  <BarChart3 className="h-5 w-5" />
                  إحصائيات الموقع
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatedStatCard
                    index={0}
                    icon={<TrendingUp className="h-6 w-6" />}
                    label="مبيعات اليوم"
                    value={stats.todaySales}
                    isCurrency
                  />
                  <AnimatedStatCard
                    index={1}
                    icon={<BarChart3 className="h-6 w-6" />}
                    label="مبيعات الشهر"
                    value={stats.monthlySales}
                    isCurrency
                  />
                  <AnimatedStatCard
                    index={2}
                    icon={<Package className="h-6 w-6" />}
                    label="الطلبات المكتملة"
                    value={stats.totalOrders}
                  />
                  <AnimatedStatCard
                    index={3}
                    icon={<Clock className="h-6 w-6" />}
                    label="طلبات قيد الانتظار"
                    value={stats.pendingOrders}
                    accent="amber"
                  />
                  <AnimatedStatCard
                    index={4}
                    icon={<Ban className="h-6 w-6" />}
                    label="الطلبات الملغية"
                    value={stats.cancelledOrders}
                    accent="red"
                  />
                  <AnimatedStatCard
                    index={5}
                    icon={<Users className="h-6 w-6" />}
                    label="إجمالي العملاء"
                    value={stats.totalCustomers}
                  />
                </div>
              </section>

              {/* --- Store Statistics --- */}
              <section>
                <h2
                  className="mb-4 flex items-center gap-2 text-lg font-bold"
                  style={{ color: T.accentLight }}
                >
                  <Store className="h-5 w-5" /> إحصائيات المتجر
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatedStatCard
                    index={0}
                    icon={<DollarSign className="h-6 w-6" />}
                    label="إجمالي الإيرادات"
                    value={stats.storeStats.totalRevenue}
                    isCurrency
                    accent="green"
                  />
                  <AnimatedStatCard
                    index={1}
                    icon={<BarChart3 className="h-6 w-6" />}
                    label="متوسط قيمة الطلب"
                    value={stats.storeStats.avgOrderValue}
                    isCurrency
                  />
                  <AnimatedStatCard
                    index={2}
                    icon={<Truck className="h-6 w-6" />}
                    label="إجمالي رسوم التوصيل"
                    value={stats.storeStats.totalDeliveryFees}
                    isCurrency
                  />
                  <StatCardText
                    index={3}
                    icon={<MapPin className="h-6 w-6" />}
                    label="أكثر مدينة طلباً"
                    value={
                      stats.storeStats.topCity
                        ? `${stats.storeStats.topCity.name} (${stats.storeStats.topCity.count})`
                        : "لا بيانات"
                    }
                  />
                  <StatCardText
                    index={4}
                    icon={<Star className="h-6 w-6" />}
                    label="أكثر منتج مبيعاً"
                    value={
                      stats.storeStats.topProduct
                        ? `${stats.storeStats.topProduct.name} (${stats.storeStats.topProduct.qty})`
                        : "لا بيانات"
                    }
                  />
                </div>
              </section>

              {/* --- Print Sales Reports --- */}
              <section>
                <h2
                  className="mb-4 flex items-center gap-2 text-lg font-bold"
                  style={{ color: T.accentLight }}
                >
                  <Printer className="h-5 w-5" /> تقارير المبيعات
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <PrintSalesButton
                    period="daily"
                    label="طباعة مبيعات اليوم"
                    icon={<TrendingUp className="h-5 w-5" />}
                  />
                  <PrintSalesButton
                    period="monthly"
                    label="طباعة مبيعات الشهر"
                    icon={<BarChart3 className="h-5 w-5" />}
                  />
                  <PrintSalesButton
                    period="yearly"
                    label="طباعة مبيعات السنة"
                    icon={<Calendar className="h-5 w-5" />}
                  />
                </div>
              </section>
            </div>
          )}

          {/* ========== ORDERS TAB ========== */}
          {activeTab === "orders" &&
            (() => {
              console.log("📦 جميع الطلبات:", orders);
              if (orders.length > 0) {
                console.log("📋 الطلب الأول:", orders[0]);
                console.log("🛒 عناصر الطلب الأول:", orders[0].items);
                if (orders[0].items?.length > 0) {
                  console.log("🔍 أول عنصر:", orders[0].items[0]);
                  console.log(
                    "✨ الخيارات:",
                    orders[0].items[0].selected_options,
                  );
                }
              }
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
              console.log("جميع الطلبات:", orders);
              console.log("الطلب الأول:", orders[0]?.items);

              return (
                <div className="flex flex-col gap-4">
                  {/* Date controls */}
                  <div className="admin-panel animate-slide-up-fade">
                    <div className="relative z-10 flex flex-wrap items-center gap-3 p-4">
                      <div className="flex items-center gap-2">
                        <Calendar
                          className="h-4 w-4"
                          style={{ color: T.accentLight }}
                        />
                        <span
                          className="text-xs font-semibold"
                          style={{ color: T.textMuted }}
                        >
                          ترتيب حسب التاريخ:
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setOrderSortDir(
                            orderSortDir === "desc" ? "asc" : "desc",
                          )
                        }
                        className="admin-btn-glow flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors"
                        style={{ borderColor: T.border, color: T.accentLight }}
                      >
                        {orderSortDir === "desc"
                          ? "الأحدث أولاً ↓"
                          : "الأقدم أولاً ↑"}
                      </button>
                      <input
                        type="date"
                        value={orderDateFilter}
                        onChange={(e) => setOrderDateFilter(e.target.value)}
                        className="rounded-lg border px-3 py-1.5 text-xs outline-none"
                        style={{
                          borderColor: T.border,
                          background: T.surface,
                          color: T.text,
                        }}
                      />
                      {orderDateFilter && (
                        <button
                          onClick={() => setOrderDateFilter("")}
                          className="admin-btn-glow flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-colors"
                          style={{ borderColor: T.border, color: T.textMuted }}
                        >
                          <RotateCcw className="h-3 w-3" /> مسح الفلتر
                        </button>
                      )}
                      <span
                        className="mr-auto text-xs"
                        style={{ color: T.textDim }}
                      >
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
                      <div
                        key={order.id}
                        className="admin-card animate-card-enter p-6"
                        style={{
                          animationDelay: `${idx * 60}ms`,
                          animationFillMode: "backwards",
                        }}
                      >
                        <div className="relative z-10">
                          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3">
                                <h3
                                  className="text-lg font-bold"
                                  style={{ color: T.text }}
                                >
                                  {"طلب #"}
                                  {order.id}
                                </h3>
                                {getStatusBadge(order.status)}
                              </div>
                              <p
                                className="mt-1 text-sm"
                                style={{ color: T.textDim }}
                              >
                                {new Date(order.created_at).toLocaleString(
                                  "ar-LY",
                                )}
                              </p>
                            </div>
                            <button
                              onClick={() => printInvoice(order)}
                              className="admin-btn-glow flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors"
                              style={{
                                borderColor: T.border,
                                color: T.accentLight,
                              }}
                            >
                              <Printer className="h-4 w-4" /> طباعة الفاتورة
                            </button>
                          </div>

                          <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                            <InfoItem
                              label="العميل"
                              value={order.customer_name}
                            />
                            <InfoItem
                              label="الهاتف"
                              value={order.phone}
                              dir="ltr"
                            />
                            {order.secondary_phone && (
                              <InfoItem
                                label="هاتف ثانوي"
                                value={order.secondary_phone}
                                dir="ltr"
                              />
                            )}
                            <InfoItem label="العنوان" value={order.address} />
                            <InfoItem label="المدينة" value={order.city} />
                            <InfoItem
                              label="الدفع"
                              value={
                                order.payment_method === "card"
                                  ? "بطاقة بنكية"
                                  : order.payment_method === "cash"
                                    ? "الدفع عند الاستلام"
                                    : "تحويل LYPAY"
                              }
                            />
                          </div>

                          <div
                            className="mb-4 overflow-x-auto rounded-xl border"
                            style={{ borderColor: T.border }}
                          >
                            <table className="w-full text-sm">
                              <thead>
                                <tr
                                  style={{
                                    background: T.surfaceDeep,
                                    borderBottom: `1px solid ${T.border}`,
                                  }}
                                >
                                  <th
                                    className="px-4 py-2 text-right"
                                    style={{ color: T.accentLight }}
                                  >
                                    المنتج
                                  </th>
                                  <th
                                    className="px-4 py-2 text-center"
                                    style={{ color: T.accentLight }}
                                  >
                                    الكمية
                                  </th>
                                  <th
                                    className="px-4 py-2 text-center"
                                    style={{ color: T.accentLight }}
                                  >
                                    السعر
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items?.map((item) => (
                                  <tr
                                    key={item.id}
                                    className="admin-row-hover"
                                    style={{
                                      borderBottom: `1px solid hsl(200 80% 55% / 0.05)`,
                                    }}
                                  >
                                  <td className="px-4 py-2" style={{ color: T.text }}>
  <div className="font-medium">{item.product_name}</div>
  {(() => {
    // التعامل مع selected_options بأنواعها المختلفة
    let options = item.selected_options;
    
    // إذا كانت نصاً، نحولها لمصفوفة
    if (typeof options === 'string') {
      try {
        options = JSON.parse(options);
      } catch (e) {
        options = [];
      }
    }
    
    // إذا كانت مصفوفة وفيها عناصر، نعرضها
    if (Array.isArray(options) && options.length > 0) {
      return (
        <div className="mt-2 space-y-1">
          {options.map((opt: any, idx: number) => (
            <div key={idx} className="flex items-center text-xs text-[var(--gold)]/80">
              <span className="ml-2">•</span>
              <span>{opt.name}</span>
              <span className="mr-1 text-[var(--gold)]/60">
                (+{opt.price} د.ل)
              </span>
            </div>
          ))}
        </div>
      );
    }
    
    return null;
  })()}
</td>
                                    <td
                                      className="px-4 py-2 text-center"
                                      style={{ color: T.text }}
                                    >
                                      {item.quantity}
                                    </td>
                                    <td
                                      className="px-4 py-2 text-center"
                                      style={{ color: T.accentLight }}
                                    >
                                      {Number(item.unit_price).toFixed(2)} د.ل
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-6 text-sm">
                              <span style={{ color: T.textMuted }}>
                                {"توصيل: "}
                                <b style={{ color: T.accentLight }}>
                                  {Number(order.delivery_fee).toFixed(2)} د.ل
                                </b>
                              </span>
                              <span style={{ color: T.textMuted }}>
                                {"الإجمالي: "}
                                <b
                                  className="text-base"
                                  style={{ color: T.text }}
                                >
                                  {Number(order.total_amount).toFixed(2)} د.ل
                                </b>
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {order.status === "pending" && (
                                <>
                                  <button
                                    onClick={() =>
                                      updateOrderStatus(order.id, "confirmed")
                                    }
                                    className="admin-btn-glow flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/25"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5" />{" "}
                                    تأكيد
                                  </button>
                                  <button
                                    onClick={() =>
                                      updateOrderStatus(order.id, "cancelled")
                                    }
                                    className="admin-btn-glow flex items-center gap-1 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/25"
                                  >
                                    <XCircle className="h-3.5 w-3.5" /> إلغاء
                                  </button>
                                </>
                              )}
                              {order.status === "confirmed" && (
                                <button
                                  onClick={() =>
                                    updateOrderStatus(order.id, "preparing")
                                  }
                                  className="admin-btn-glow flex items-center gap-1 rounded-lg bg-sky-500/15 px-3 py-1.5 text-xs text-sky-400 hover:bg-sky-500/25"
                                >
                                  <Clock className="h-3.5 w-3.5" /> قيد التحضير
                                </button>
                              )}
                              {order.status === "preparing" && (
                                <button
                                  onClick={() =>
                                    updateOrderStatus(order.id, "delivered")
                                  }
                                  className="admin-btn-glow flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs hover:opacity-80"
                                  style={{
                                    background: "hsl(200 80% 55% / 0.15)",
                                    color: T.accentLight,
                                  }}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" /> تم
                                  التوصيل
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
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
            <div className="flex flex-col gap-5">
              {/* Header with stats */}
              <div className="admin-panel animate-slide-up-fade">
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <h2
                      className="text-lg font-bold"
                      style={{ color: T.accentLight }}
                    >
                      إدارة العملاء
                    </h2>
                    <p className="mt-1 text-xs" style={{ color: T.textDim }}>
                      {"إجمالي: "}
                      {customers.length}
                      {" عميل"}
                      {customerSearch &&
                        ` | نتائج البحث: ${filteredCustomers.length}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-lg px-3 py-1.5 text-center"
                      style={{
                        background: "hsl(200 80% 55% / 0.1)",
                        border: `1px solid hsl(200 80% 55% / 0.15)`,
                      }}
                    >
                      <p className="text-xs" style={{ color: T.textDim }}>
                        مسجلين
                      </p>
                      <p
                        className="text-base font-bold"
                        style={{ color: T.accentLight }}
                      >
                        {customers.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search bar */}
              <div className="relative animate-slide-up-fade">
                <Search
                  className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2"
                  style={{ color: T.textDim }}
                />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="بحث بالاسم، الهاتف، الموقع، البريد، أو عنوان IP..."
                  className="w-full rounded-xl border py-3 pr-11 pl-4 text-sm outline-none transition-all duration-300 focus:shadow-lg"
                  style={{
                    borderColor: T.border,
                    background: T.surface,
                    color: T.text,
                  }}
                />
              </div>

              {filteredCustomers.length === 0 ? (
                <EmptyState
                  text={
                    customerSearch
                      ? "لا توجد نتائج مطابقة"
                      : "لا يوجد عملاء مسجلين"
                  }
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCustomers.map((customer, i) => (
                    <div
                      key={customer.id}
                      className="admin-card animate-card-enter p-5"
                      style={{
                        animationDelay: `${i * 40}ms`,
                        animationFillMode: "backwards",
                      }}
                    >
                      <div className="relative z-10">
                        {/* Customer name and number */}
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                              style={{ background: "hsl(200 80% 55% / 0.12)" }}
                            >
                              <span
                                className="text-sm font-bold"
                                style={{ color: T.accentLight }}
                              >
                                {customer.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3
                                className="text-sm font-bold"
                                style={{ color: T.text }}
                              >
                                {customer.name}
                              </h3>
                              <p
                                className="font-mono text-xs"
                                style={{ color: T.textMuted }}
                                dir="ltr"
                              >
                                {customer.phone}
                              </p>
                            </div>
                          </div>
                          <span
                            className="rounded-md px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              background: "hsl(200 80% 55% / 0.1)",
                              color: T.accentMuted,
                            }}
                          >
                            {"#"}
                            {i + 1}
                          </span>
                        </div>

                        {/* Info grid */}
                        <div className="space-y-2 text-xs">
                          {customer.city && (
                            <div className="flex items-center gap-2">
                              <MapPin
                                className="h-3.5 w-3.5 shrink-0"
                                style={{ color: T.textDim }}
                              />
                              <span style={{ color: T.textMuted }}>
                                {customer.city}
                              </span>
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center gap-2" dir="ltr">
                              <Globe
                                className="h-3.5 w-3.5 shrink-0"
                                style={{ color: T.textDim }}
                              />
                              <span style={{ color: T.textMuted }}>
                                {customer.email}
                              </span>
                            </div>
                          )}
                          {customer.address && (
                            <div className="flex items-center gap-2">
                              <Store
                                className="h-3.5 w-3.5 shrink-0"
                                style={{ color: T.textDim }}
                              />
                              <span style={{ color: T.textMuted }}>
                                {customer.address}
                              </span>
                            </div>
                          )}
                          {/* Status and date */}
                          <div
                            className="flex items-center justify-between pt-1"
                            style={{
                              borderTop: `1px solid hsl(200 80% 55% / 0.06)`,
                            }}
                          >
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${customer.is_active ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}
                            >
                              {customer.is_active ? "نشط" : "معطل"}
                            </span>
                            <span
                              className="text-[10px]"
                              style={{ color: T.textDim }}
                            >
                              <Calendar className="mr-1 inline h-3 w-3" />
                              {new Date(customer.created_at).toLocaleDateString(
                                "ar-LY",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ Filter Sub-Components ============ */
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-[11px] font-medium"
        style={{ color: T.accentMuted }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-md border text-xs transition-all duration-300 ${value ? "filter-active-glow" : ""}`}
        style={{
          background: T.surfaceHover,
          borderColor: T.border,
          color: T.text,
        }}
      >
        <option value="">الكل</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FilterResultCard({
  label,
  value,
  isCurrency,
  color,
}: {
  label: string;
  value: number;
  isCurrency?: boolean;
  color: string;
}) {
  const animated = useCountUp(value, 700);
  return (
    <div
      className="rounded-md border p-2.5 text-center transition-all duration-300"
      style={{ borderColor: `${color}20`, background: `${color}08` }}
    >
      <p className="mb-0.5 text-[11px]" style={{ color: `${color}99` }}>
        {label}
      </p>
      <p className="text-base font-bold" style={{ color }}>
        {isCurrency
          ? `${animated.toFixed(2)} د.ل`
          : String(Math.round(animated))}
      </p>
    </div>
  );
}

/* ============ Animated Stat Card ============ */
function AnimatedStatCard({
  icon,
  label,
  value,
  isCurrency,
  accent,
  index = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  isCurrency?: boolean;
  accent?: "red" | "green" | "amber";
  index?: number;
}) {
  const animated = useCountUp(value, 900);
  const accentColors: Record<string, string> = {
    red: "bg-red-500/10 text-red-400",
    green: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
  };
  const cls = accent
    ? accentColors[accent]
    : "text-[var(--admin-accent-light)]";
  const iconBg = accent ? "" : "bg-[hsl(200_80%_55%_/_0.1)]";
  return (
    <div
      className="admin-card group animate-card-enter cursor-default p-6"
      style={{
        animationDelay: `${index * 80}ms`,
        animationFillMode: "backwards",
      }}
    >
      <div className="relative z-10 flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${cls} ${iconBg}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm" style={{ color: T.textMuted }}>
            {label}
          </p>
          <p
            className="animate-number-pop text-2xl font-bold"
            style={{ color: T.text }}
          >
            {isCurrency
              ? `${animated.toFixed(2)} د.ل`
              : String(Math.round(animated))}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCardText({
  icon,
  label,
  value,
  index = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  index?: number;
}) {
  return (
    <div
      className="admin-card group animate-card-enter cursor-default p-6"
      style={{
        animationDelay: `${index * 80}ms`,
        animationFillMode: "backwards",
      }}
    >
      <div className="relative z-10 flex items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(200_80%_55%_/_0.1)] transition-transform duration-300 group-hover:scale-110"
          style={{ color: T.accentLight }}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm" style={{ color: T.textMuted }}>
            {label}
          </p>
          <p className="text-2xl font-bold" style={{ color: T.text }}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============ Helpers ============ */
function InfoItem({
  label,
  value,
  dir,
}: {
  label: string;
  value: string;
  dir?: string;
}) {
  return (
    <div
      className="rounded-lg px-3 py-2 transition-all duration-200"
      style={{ background: T.surfaceDeep }}
    >
      <span className="text-xs" style={{ color: T.textDim }}>
        {label}:{" "}
      </span>
      <span style={{ color: T.text }} dir={dir}>
        {value}
      </span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex animate-fade-in flex-col items-center justify-center py-16">
      <div
        className="mb-4 flex h-16 w-16 animate-glow-breathe items-center justify-center rounded-full"
        style={{ background: "hsl(200 80% 55% / 0.1)" }}
      >
        <ShoppingBag className="h-8 w-8" style={{ color: T.textDim }} />
      </div>
      <p style={{ color: T.textMuted }}>{text}</p>
    </div>
  );
}

/* ============ Print Sales Report Button ============ */
function PrintSalesButton({
  period,
  label,
  icon,
}: {
  period: string;
  label: string;
  icon: React.ReactNode;
}) {
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
      className="admin-card group flex cursor-pointer items-center gap-4 p-5 transition-all duration-300 hover:scale-[1.02]"
      style={{ border: "none" }}
    >
      <div className="relative z-10 flex w-full items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
          style={{ background: "hsl(200 80% 55% / 0.1)", color: T.accentLight }}
        >
          {loading ? (
            <span
              className="h-5 w-5 animate-spin rounded-full border-2"
              style={{ borderColor: "transparent", borderTopColor: T.accent }}
            />
          ) : (
            icon
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold" style={{ color: T.text }}>
            {label}
          </p>
          <p className="text-xs" style={{ color: T.textDim }}>
            تقرير {periodLabels[period]}
          </p>
        </div>
      </div>
    </button>
  );
}
