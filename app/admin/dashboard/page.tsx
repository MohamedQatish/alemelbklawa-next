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
  ChevronDown,
  X,
  SlidersHorizontal,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  PieChart,
  Activity,
  Award,
  UserCheck,
  UserX,
  Wallet,
  CreditCard,
  Landmark,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Scatter,
} from "recharts";

const CHART_COLORS = {
  primary: "#7B1E2F",
  gold: "#C5A55A",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  purple: "#8b5cf6",
  pink: "#ec4899",
  indigo: "#6366f1",
  gradient: [
    "#7B1E2F",
    "#C5A55A",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
  ],
};

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
  totalProducts: number;
  totalCategories: number;
  activeBranches: number;
  customerSatisfaction?: number;
  repeatCustomerRate?: number;
}

interface Stats {
  todaySales: number;
  todayProducts?: number;
  todayDelivery?: number;
  monthlySales: number;
  monthlyProducts?: number;
  monthlyDelivery?: number;
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
  periodComparison?: {
    previous: number;
    growth: number;
  };
  topSellingCategories?: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  recentActivity?: Array<{ type: string; count: number; trend: number }>;
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
  branch_id?: number | null;
  branch_name?: string | null;
  seconds_remaining?: number;
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
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string;
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

/* ============ Filter Types ============ */
interface AdvancedFilters {
  dateRange: {
    start: string;
    end: string;
    preset:
      | "today"
      | "yesterday"
      | "thisWeek"
      | "thisMonth"
      | "lastMonth"
      | "thisYear"
      | "custom"
      | null;
  };
  status: string[];
  paymentMethod: string[];
  orderType: string[];
  city: string[];
  minAmount: number | null;
  maxAmount: number | null;
  customerId: number | null;
  branchId: number | null;
  productId: number | null;
  searchQuery: string;
  sortBy: "date" | "amount" | "status" | "customer";
  sortOrder: "asc" | "desc";
}

interface FilterPreset {
  id: string;
  name: string;
  filters: Partial<AdvancedFilters>;
  icon?: React.ReactNode;
}

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
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});

  // Advanced Filter States
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableBranches, setAvailableBranches] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [availableProducts, setAvailableProducts] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);

  // Advanced Filters
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    dateRange: {
      start: "",
      end: "",
      preset: null,
    },
    status: [],
    paymentMethod: [],
    orderType: [],
    city: [],
    minAmount: null,
    maxAmount: null,
    customerId: null,
    branchId: null,
    productId: null,
    searchQuery: "",
    sortBy: "date",
    sortOrder: "desc",
  });

  // Date filter state (legacy, will be replaced)
  const [filterDay, setFilterDay] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterMode, setFilterMode] = useState<"dropdowns" | "range">(
    "dropdowns",
  );

  // Fetch metadata for filters
  const fetchFilterMetadata = useCallback(async () => {
    try {
      const [citiesRes, branchesRes, productsRes] = await Promise.all([
        fetch("/api/admin/filters/cities"),
        fetch("/api/admin/branches?activeOnly=true"),
        fetch("/api/admin/products?activeOnly=true&fields=id,name"),
      ]);

      const cities = await citiesRes.json();
      const branches = await branchesRes.json();
      const products = await productsRes.json();

      setAvailableCities(Array.isArray(cities) ? cities : []);
      setAvailableBranches(Array.isArray(branches) ? branches : []);
      setAvailableProducts(Array.isArray(products) ? products : []);
    } catch (error) {
      console.error("Failed to fetch filter metadata:", error);
    }
  }, []);

  // Load saved presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("admin_filter_presets");
    if (saved) {
      try {
        setSavedPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load presets:", e);
      }
    }
  }, []);

  // Save presets to localStorage
  const savePresets = (presets: FilterPreset[]) => {
    localStorage.setItem("admin_filter_presets", JSON.stringify(presets));
    setSavedPresets(presets);
  };

  // Apply filter preset
  const applyPreset = (preset: FilterPreset) => {
    setAdvancedFilters((prev) => ({
      ...prev,
      ...preset.filters,
    }));
    setShowFilterPanel(false);
  };

  // Save current filters as preset
  const saveAsPreset = () => {
    const name = prompt("أدخل اسم المجموعة:");
    if (!name) return;

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name,
      filters: { ...advancedFilters },
    };

    savePresets([...savedPresets, newPreset]);
  };

  // Delete preset
  const deletePreset = (id: string) => {
    savePresets(savedPresets.filter((p) => p.id !== id));
  };

  // Reset all filters
  const resetAdvancedFilters = () => {
    setAdvancedFilters({
      dateRange: { start: "", end: "", preset: null },
      status: [],
      paymentMethod: [],
      orderType: [],
      city: [],
      minAmount: null,
      maxAmount: null,
      customerId: null,
      branchId: null,
      productId: null,
      searchQuery: "",
      sortBy: "date",
      sortOrder: "desc",
    });
  };

  // Apply date range preset
  const applyDatePreset = (
    preset:
      | "today"
      | "yesterday"
      | "thisWeek"
      | "thisMonth"
      | "lastMonth"
      | "thisYear",
  ) => {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (preset) {
      case "today":
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "yesterday":
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case "thisWeek":
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "thisMonth":
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "lastMonth":
        start.setMonth(start.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "thisYear":
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
    }

    setAdvancedFilters((prev) => ({
      ...prev,
      dateRange: {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
        preset,
      },
    }));
  };

  const fetchStats = useCallback(async () => {
    const params = new URLSearchParams();

    // Advanced filters to params
    if (advancedFilters.dateRange.start)
      params.set("startDate", advancedFilters.dateRange.start);
    if (advancedFilters.dateRange.end)
      params.set("endDate", advancedFilters.dateRange.end);
    if (advancedFilters.status.length > 0)
      params.set("status", advancedFilters.status.join(","));
    if (advancedFilters.paymentMethod.length > 0)
      params.set("paymentMethod", advancedFilters.paymentMethod.join(","));
    if (advancedFilters.orderType.length > 0)
      params.set("orderType", advancedFilters.orderType.join(","));
    if (advancedFilters.city.length > 0)
      params.set("city", advancedFilters.city.join(","));
    if (advancedFilters.minAmount)
      params.set("minAmount", advancedFilters.minAmount.toString());
    if (advancedFilters.maxAmount)
      params.set("maxAmount", advancedFilters.maxAmount.toString());
    if (advancedFilters.customerId)
      params.set("customerId", advancedFilters.customerId.toString());
    if (advancedFilters.branchId)
      params.set("branchId", advancedFilters.branchId.toString());
    if (advancedFilters.productId)
      params.set("productId", advancedFilters.productId.toString());
    if (advancedFilters.searchQuery)
      params.set("search", advancedFilters.searchQuery);

    // Legacy filters (backward compatibility)
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
    advancedFilters,
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

      // Fetch filter metadata after data is loaded
      fetchFilterMetadata();
    } catch {
      router.push("/admin");
    } finally {
      setLoading(false);
    }
  }, [router, fetchFilterMetadata]);

  useEffect(() => {
    fetchStats();
    fetchData();
  }, [fetchStats, fetchData]);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSiteSettings(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading) {
      setFilterLoading(true);
      fetchStats().finally(() => setFilterLoading(false));
    }
  }, [
    advancedFilters,
    filterDay,
    filterMonth,
    filterYear,
    startDate,
    endDate,
    filterMode,
  ]);

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
    resetAdvancedFilters();
  }

  // Count active filters
  const getActiveFilterCount = (): number => {
    let count = 0;
    if (advancedFilters.dateRange.start && advancedFilters.dateRange.end)
      count++;
    if (advancedFilters.status.length > 0) count++;
    if (advancedFilters.paymentMethod.length > 0) count++;
    if (advancedFilters.orderType.length > 0) count++;
    if (advancedFilters.city.length > 0) count++;
    if (advancedFilters.minAmount || advancedFilters.maxAmount) count++;
    if (advancedFilters.customerId) count++;
    if (advancedFilters.branchId) count++;
    if (advancedFilters.productId) count++;
    if (advancedFilters.searchQuery) count++;
    return count;
  };

  function printInvoice(order: Order) {
    const w = window.open("", "_blank");
    if (!w) return;
    const siteName = siteSettings?.site_name || "عالم البقلاوة";
    const siteDescription = siteSettings?.site_description || "حلويات فاخرة";
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
   <div class="brand-name">{siteName}</div>
<div class="brand-sub">{siteDescription}</div>
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
        <div class="info-row"><span class="info-label">الهاتف</span><span class="info-value" dir="ltr">${order.phone}</span></div>
        
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
<div class="footer-note">{siteName.toUpperCase()} - {siteDescription}</div>
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
              {/* Active Filters Summary */}
              {getActiveFilterCount() > 0 && (
                <div
                  className="flex flex-wrap items-center gap-2 p-3 rounded-xl"
                  style={{
                    background: `${T.accent}10`,
                    border: `1px solid ${T.border}`,
                  }}
                >
                  <Filter className="h-4 w-4" style={{ color: T.accent }} />
                  <span className="text-sm" style={{ color: T.textMuted }}>
                    الفلتر النشط:
                  </span>
                  {advancedFilters.dateRange.start &&
                    advancedFilters.dateRange.end && (
                      <span
                        className="px-2 py-1 text-xs rounded-full"
                        style={{ background: T.surfaceDeep }}
                      >
                        من{" "}
                        {new Date(
                          advancedFilters.dateRange.start,
                        ).toLocaleDateString("ar-LY")}{" "}
                        إلى{" "}
                        {new Date(
                          advancedFilters.dateRange.end,
                        ).toLocaleDateString("ar-LY")}
                      </span>
                    )}
                  {advancedFilters.status.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-1 text-xs rounded-full"
                      style={{ background: T.surfaceDeep }}
                    >
                      {s === "pending"
                        ? "قيد الانتظار"
                        : s === "confirmed"
                          ? "مؤكد"
                          : s === "preparing"
                            ? "قيد التحضير"
                            : s === "delivered"
                              ? "تم التوصيل"
                              : "ملغي"}
                    </span>
                  ))}
                  {advancedFilters.paymentMethod.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-1 text-xs rounded-full"
                      style={{ background: T.surfaceDeep }}
                    >
                      {p === "cash" ? "كاش" : p === "card" ? "بطاقة" : "LYPAY"}
                    </span>
                  ))}
                  {advancedFilters.city.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-1 text-xs rounded-full"
                      style={{ background: T.surfaceDeep }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {/* --- إحصائيات الموقع المتطورة --- */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2
                    className="flex items-center gap-3 text-xl font-bold"
                    style={{ color: T.accentLight }}
                  >
                    <div
                      className="p-2 rounded-xl"
                      style={{ background: `${T.accent}20` }}
                    >
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    نظرة عامة على الأداء
                  </h2>
                </div>

                {/* بطاقات المؤشرات الرئيسية - تصميم احترافي */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div
                    className="relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group"
                    style={{ background: T.surface, borderColor: T.border }}
                  >
                    <div
                      className="absolute top-0 left-0 w-1 h-full"
                      style={{
                        background:
                          "linear-gradient(180deg, #7B1E2F 0%, #C5A55A 100%)",
                      }}
                    />
                    <div className="flex justify-between items-start">
                      <div>
                        <p
                          className="text-sm mb-1"
                          style={{ color: T.textMuted }}
                        >
                          إجمالي الإيرادات
                        </p>
                        <p
                          className="text-3xl font-bold"
                          style={{ color: T.text }}
                        >
                          {stats.storeStats.totalRevenue.toFixed(2)}{" "}
                          <span className="text-sm" style={{ color: T.accent }}>
                            د.ل
                          </span>
                        </p>
                        {stats.periodComparison && (
                          <p
                            className={`text-xs mt-2 flex items-center gap-1 ${stats.periodComparison.growth >= 0 ? "text-green-500" : "text-red-500"}`}
                          >
                            <TrendingUp
                              className={`h-3 w-3 ${stats.periodComparison.growth < 0 ? "rotate-180" : ""}`}
                            />
                            {Math.abs(stats.periodComparison.growth).toFixed(1)}
                            % عن الفترة السابقة
                          </p>
                        )}
                      </div>
                      <div
                        className="p-3 rounded-xl"
                        style={{ background: `${CHART_COLORS.primary}15` }}
                      >
                        <DollarSign
                          className="h-6 w-6"
                          style={{ color: CHART_COLORS.primary }}
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className="relative overflow-hidden rounded-2xl border p-5"
                    style={{ background: T.surface, borderColor: T.border }}
                  >
                    <div
                      className="absolute top-0 left-0 w-1 h-full"
                      style={{
                        background:
                          "linear-gradient(180deg, #10b981 0%, #34d399 100%)",
                      }}
                    />
                    <div className="flex justify-between items-start">
                      <div>
                        <p
                          className="text-sm mb-1"
                          style={{ color: T.textMuted }}
                        >
                          مبيعات اليوم
                        </p>
                        <p
                          className="text-3xl font-bold"
                          style={{ color: T.text }}
                        >
                          {stats.todaySales.toFixed(2)}{" "}
                          <span className="text-sm" style={{ color: T.accent }}>
                            د.ل
                          </span>
                        </p>
                        <div className="mt-2 flex gap-3 text-xs">
                          <span style={{ color: T.textDim }}>
                            منتجات: {stats.todayProducts?.toFixed(2) || "0"} د.ل
                          </span>
                          <span style={{ color: T.textDim }}>
                            توصيل: {stats.todayDelivery?.toFixed(2) || "0"} د.ل
                          </span>
                        </div>
                      </div>
                      <div
                        className="p-3 rounded-xl"
                        style={{ background: "#10b98120" }}
                      >
                        <TrendingUp className="h-6 w-6 text-emerald-500" />
                      </div>
                    </div>
                  </div>

                  <div
                    className="relative overflow-hidden rounded-2xl border p-5"
                    style={{ background: T.surface, borderColor: T.border }}
                  >
                    <div
                      className="absolute top-0 left-0 w-1 h-full"
                      style={{
                        background:
                          "linear-gradient(180deg, #f59e0b 0%, #fbbf24 100%)",
                      }}
                    />
                    <div className="flex justify-between items-start">
                      <div>
                        <p
                          className="text-sm mb-1"
                          style={{ color: T.textMuted }}
                        >
                          مبيعات الشهر
                        </p>
                        <p
                          className="text-3xl font-bold"
                          style={{ color: T.text }}
                        >
                          {stats.monthlySales.toFixed(2)}{" "}
                          <span className="text-sm" style={{ color: T.accent }}>
                            د.ل
                          </span>
                        </p>
                        <div className="mt-2 flex gap-3 text-xs">
                          <span style={{ color: T.textDim }}>
                            منتجات: {stats.monthlyProducts?.toFixed(2) || "0"}{" "}
                            د.ل
                          </span>
                          <span style={{ color: T.textDim }}>
                            توصيل: {stats.monthlyDelivery?.toFixed(2) || "0"}{" "}
                            د.ل
                          </span>
                        </div>
                      </div>
                      <div
                        className="p-3 rounded-xl"
                        style={{ background: "#f59e0b20" }}
                      >
                        <BarChart3 className="h-6 w-6 text-amber-500" />
                      </div>
                    </div>
                  </div>

                  <div
                    className="relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group"
                    style={{ background: T.surface, borderColor: T.border }}
                  >
                    <div
                      className="absolute top-0 left-0 w-1 h-full"
                      style={{
                        background:
                          "linear-gradient(180deg, #8b5cf6 0%, #a78bfa 100%)",
                      }}
                    />
                    <div className="flex justify-between items-start">
                      <div>
                        <p
                          className="text-sm mb-1"
                          style={{ color: T.textMuted }}
                        >
                          إجمالي العملاء
                        </p>
                        <p
                          className="text-3xl font-bold"
                          style={{ color: T.text }}
                        >
                          {stats.totalCustomers}
                        </p>
                        <p className="text-xs mt-2 flex items-center gap-1">
                          <Users
                            className="h-3 w-3"
                            style={{ color: T.accent }}
                          />
                          <span style={{ color: T.textDim }}>عميل نشط</span>
                        </p>
                      </div>
                      <div
                        className="p-3 rounded-xl"
                        style={{ background: "#8b5cf620" }}
                      >
                        <Users className="h-6 w-6 text-purple-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* بطاقات إضافية - مؤشرات متقدمة */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div
                    className="rounded-2xl border p-4"
                    style={{ background: T.surface, borderColor: T.border }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-xl"
                        style={{ background: `${CHART_COLORS.gold}20` }}
                      >
                        <Award
                          className="h-5 w-5"
                          style={{ color: CHART_COLORS.gold }}
                        />
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: T.textMuted }}>
                          متوسط قيمة الطلب
                        </p>
                        <p className="text-xl font-bold">
                          {stats.storeStats.avgOrderValue.toFixed(2)} د.ل
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="rounded-2xl border p-4"
                    style={{ background: T.surface, borderColor: T.border }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-xl"
                        style={{ background: `${CHART_COLORS.info}20` }}
                      >
                        <Truck
                          className="h-5 w-5"
                          style={{ color: CHART_COLORS.info }}
                        />
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: T.textMuted }}>
                          إجمالي رسوم التوصيل
                        </p>
                        <p className="text-xl font-bold">
                          {stats.storeStats.totalDeliveryFees.toFixed(2)} د.ل
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="rounded-2xl border p-4"
                    style={{ background: T.surface, borderColor: T.border }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-xl"
                        style={{ background: `${CHART_COLORS.success}20` }}
                      >
                        <Activity
                          className="h-5 w-5"
                          style={{ color: CHART_COLORS.success }}
                        />
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: T.textMuted }}>
                          نسبة الإنجاز
                        </p>
                        <p className="text-xl font-bold">
                          {stats.totalOrders > 0
                            ? (
                                ((stats.totalOrders - stats.cancelledOrders) /
                                  stats.totalOrders) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* الرسوم البيانية المتطورة */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* الرسم البياني للمبيعات اليومية */}
                  {/* الرسم البياني للمبيعات اليومية */}
                  <div
                    className="lg:col-span-2 rounded-2xl border p-5"
                    style={{ background: T.surface, borderColor: T.border }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: CHART_COLORS.primary }}
                        />
                        تحليل المبيعات اليومية
                      </h3>
                      <div className="flex gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: CHART_COLORS.primary }}
                          />
                          المبيعات
                        </span>
                        <span className="flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: CHART_COLORS.gold }}
                          />
                          عدد الطلبات
                        </span>
                      </div>
                    </div>

                    {stats.hourlySales && stats.hourlySales.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart data={stats.hourlySales}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                          <XAxis
                            dataKey="hour"
                            tickFormatter={(hour) => `${hour}:00`}
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value) => `${value}`}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#fff",
                              border: "1px solid #ddd",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                            formatter={(value: any, name: string) => {
                              if (name === "المبيعات")
                                return [
                                  `${Number(value).toFixed(2)} د.ل`,
                                  name,
                                ];
                              return [value, name];
                            }}
                          />
                          <Bar
                            yAxisId="right"
                            dataKey="count"
                            fill={CHART_COLORS.gold}
                            name="عدد الطلبات"
                            barSize={24}
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="total"
                            stroke={CHART_COLORS.primary}
                            strokeWidth={2}
                            name="المبيعات"
                            dot={{ r: 3 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div
                        className="flex items-center justify-center h-[280px] text-center"
                        style={{ color: T.textDim }}
                      >
                        <p>لا توجد مبيعات اليوم</p>
                      </div>
                    )}

                    {/* ملخص سريع */}
                    {stats.hourlySales && stats.hourlySales.length > 0 && (
                      <div
                        className="flex justify-between items-center mt-4 pt-3 border-t"
                        style={{ borderColor: T.border }}
                      >
                        <div>
                          <span
                            className="text-xs"
                            style={{ color: T.textDim }}
                          >
                            إجمالي المبيعات:{" "}
                          </span>
                          <span
                            className="text-sm font-bold"
                            style={{ color: CHART_COLORS.primary }}
                          >
                            {stats.hourlySales
                              .reduce((sum, h) => sum + h.total, 0)
                              .toFixed(2)}{" "}
                            د.ل
                          </span>
                        </div>
                        <div>
                          <span
                            className="text-xs"
                            style={{ color: T.textDim }}
                          >
                            إجمالي الطلبات:{" "}
                          </span>
                          <span
                            className="text-sm font-bold"
                            style={{ color: CHART_COLORS.gold }}
                          >
                            {stats.hourlySales.reduce(
                              (sum, h) => sum + h.count,
                              0,
                            )}
                          </span>
                        </div>
                        <div>
                          <span
                            className="text-xs"
                            style={{ color: T.textDim }}
                          >
                            أعلى ساعة:{" "}
                          </span>
                          <span className="text-sm font-bold">
                            {(() => {
                              const max = stats.hourlySales.reduce((a, b) =>
                                a.total > b.total ? a : b,
                              );
                              return `${max.hour}:00`;
                            })()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* الرسم البياني الدائري */}
                  <div
                    className="rounded-2xl border p-5"
                    style={{ background: T.surface, borderColor: T.border }}
                  >
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: CHART_COLORS.gold }}
                      />
                      توزيع الطلبات
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <RePieChart>
                        <Pie
                          data={[
                            {
                              name: "مكتملة",
                              value: stats.totalOrders - stats.cancelledOrders,
                              color: CHART_COLORS.success,
                            },
                            {
                              name: "قيد الانتظار",
                              value: stats.pendingOrders,
                              color: CHART_COLORS.warning,
                            },
                            {
                              name: "ملغية",
                              value: stats.cancelledOrders,
                              color: CHART_COLORS.danger,
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {[
                            stats.totalOrders - stats.cancelledOrders,
                            stats.pendingOrders,
                            stats.cancelledOrders,
                          ].map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                CHART_COLORS.gradient[
                                  index % CHART_COLORS.gradient.length
                                ]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="text-center">
                        <p className="text-xs" style={{ color: T.textDim }}>
                          مكتملة
                        </p>
                        <p
                          className="font-bold text-sm"
                          style={{ color: CHART_COLORS.success }}
                        >
                          {stats.totalOrders - stats.cancelledOrders}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs" style={{ color: T.textDim }}>
                          قيد الانتظار
                        </p>
                        <p
                          className="font-bold text-sm"
                          style={{ color: CHART_COLORS.warning }}
                        >
                          {stats.pendingOrders}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs" style={{ color: T.textDim }}>
                          ملغية
                        </p>
                        <p
                          className="font-bold text-sm"
                          style={{ color: CHART_COLORS.danger }}
                        >
                          {stats.cancelledOrders}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* إحصائيات إضافية - المتجر */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* أكثر المنتجات مبيعاً */}
                  <div
                    className="rounded-2xl border p-5"
                    style={{ background: T.surface, borderColor: T.border }}
                  >
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Star
                        className="h-4 w-4"
                        style={{ color: CHART_COLORS.gold }}
                      />
                      أفضل المنتجات مبيعاً
                    </h3>
                    {stats.storeStats.topProduct ? (
                      <div
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: `${CHART_COLORS.primary}10` }}
                      >
                        <div>
                          <p className="font-medium">
                            {stats.storeStats.topProduct.name}
                          </p>
                          <p className="text-xs" style={{ color: T.textDim }}>
                            {stats.storeStats.topProduct.qty} وحدة مباعة
                          </p>
                        </div>
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ background: `${CHART_COLORS.gold}20` }}
                        >
                          <Package
                            className="h-6 w-6"
                            style={{ color: CHART_COLORS.gold }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p
                        className="text-center py-8"
                        style={{ color: T.textDim }}
                      >
                        لا توجد بيانات كافية
                      </p>
                    )}
                  </div>

                  {/* المدن الأكثر طلباً */}
                  <div
                    className="rounded-2xl border p-5"
                    style={{ background: T.surface, borderColor: T.border }}
                  >
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <MapPin
                        className="h-4 w-4"
                        style={{ color: CHART_COLORS.info }}
                      />
                      توزيع الطلبات حسب المدينة
                    </h3>
                    {stats.storeStats.topCity ? (
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between mb-2">
                            <span className="text-sm">
                              {stats.storeStats.topCity.name}
                            </span>
                            <span className="text-sm font-bold">
                              {stats.storeStats.topCity.count} طلب
                            </span>
                          </div>
                          <div
                            className="w-full h-2 rounded-full overflow-hidden"
                            style={{ background: T.border }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: "70%",
                                background: `linear-gradient(90deg, ${CHART_COLORS.primary}, ${CHART_COLORS.gold})`,
                              }}
                            />
                          </div>
                          <p
                            className="text-xs mt-3"
                            style={{ color: T.textDim }}
                          >
                            أعلى مدينة في الطلبات
                          </p>
                        </div>
                        <div
                          className="p-4 rounded-xl"
                          style={{ background: `${CHART_COLORS.info}15` }}
                        >
                          <Building2
                            className="h-8 w-8"
                            style={{ color: CHART_COLORS.info }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p
                        className="text-center py-8"
                        style={{ color: T.textDim }}
                      >
                        لا توجد بيانات كافية
                      </p>
                    )}
                  </div>
                </div>

                {/* قسم إضافي - توزيع طرق الدفع */}
                {stats.topSellingCategories &&
                  stats.topSellingCategories.length > 0 && (
                    <div
                      className="mt-6 rounded-2xl border p-5"
                      style={{ background: T.surface, borderColor: T.border }}
                    >
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <CreditCard
                          className="h-4 w-4"
                          style={{ color: CHART_COLORS.purple }}
                        />
                        توزيع طرق الدفع
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* يمكن إضافة بيانات توزيع طرق الدفع هنا */}
                      </div>
                    </div>
                  )}
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
                    siteName={siteSettings?.site_name || "عالم البقلاوة"}
                  />
                  <PrintSalesButton
                    period="monthly"
                    label="طباعة مبيعات الشهر"
                    icon={<BarChart3 className="h-5 w-5" />}
                    siteName={siteSettings?.site_name || "عالم البقلاوة"}
                  />
                  <PrintSalesButton
                    period="yearly"
                    label="طباعة مبيعات السنة"
                    icon={<Calendar className="h-5 w-5" />}
                    siteName={siteSettings?.site_name || "عالم البقلاوة"}
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

              // تطبيق الفلاتر المتقدمة على الطلبات
              const filteredOrders = orders
                .filter((order) => {
                  // فلترة حسب النطاق الزمني
                  if (
                    advancedFilters.dateRange.start &&
                    advancedFilters.dateRange.end
                  ) {
                    const orderDate = new Date(order.created_at)
                      .toISOString()
                      .split("T")[0];
                    if (
                      orderDate < advancedFilters.dateRange.start ||
                      orderDate > advancedFilters.dateRange.end
                    ) {
                      return false;
                    }
                  }

                  // فلترة حسب الحالة
                  if (
                    advancedFilters.status.length > 0 &&
                    !advancedFilters.status.includes(order.status)
                  ) {
                    return false;
                  }

                  // فلترة حسب طريقة الدفع
                  if (
                    advancedFilters.paymentMethod.length > 0 &&
                    !advancedFilters.paymentMethod.includes(
                      order.payment_method,
                    )
                  ) {
                    return false;
                  }

                  // فلترة حسب نوع الطلب
                  if (
                    advancedFilters.orderType.length > 0 &&
                    order.order_type &&
                    !advancedFilters.orderType.includes(order.order_type)
                  ) {
                    return false;
                  }

                  // فلترة حسب المدينة
                  if (
                    advancedFilters.city.length > 0 &&
                    !advancedFilters.city.includes(order.city)
                  ) {
                    return false;
                  }

                  // فلترة حسب نطاق المبلغ
                  if (
                    advancedFilters.minAmount &&
                    order.total_amount < advancedFilters.minAmount
                  ) {
                    return false;
                  }
                  if (
                    advancedFilters.maxAmount &&
                    order.total_amount > advancedFilters.maxAmount
                  ) {
                    return false;
                  }

                  // فلترة حسب الفرع
                  if (
                    advancedFilters.branchId &&
                    order.branch_id !== advancedFilters.branchId
                  ) {
                    return false;
                  }

                  // فلترة حسب المنتج
                  if (advancedFilters.productId) {
                    const hasProduct = order.items.some(
                      (item) => item.id === advancedFilters.productId,
                    );
                    if (!hasProduct) return false;
                  }

                  // فلترة حسب البحث
                  if (advancedFilters.searchQuery) {
                    const query = advancedFilters.searchQuery.toLowerCase();
                    const matches =
                      order.customer_name.toLowerCase().includes(query) ||
                      order.phone.includes(query) ||
                      order.city.toLowerCase().includes(query) ||
                      order.items.some((item) =>
                        item.product_name.toLowerCase().includes(query),
                      );
                    if (!matches) return false;
                  }

                  return true;
                })
                .sort((a, b) => {
                  let comparison = 0;
                  switch (advancedFilters.sortBy) {
                    case "date":
                      comparison =
                        new Date(a.created_at).getTime() -
                        new Date(b.created_at).getTime();
                      break;
                    case "amount":
                      comparison = a.total_amount - b.total_amount;
                      break;
                    case "status":
                      comparison = a.status.localeCompare(b.status);
                      break;
                    case "customer":
                      comparison = a.customer_name.localeCompare(
                        b.customer_name,
                      );
                      break;
                  }
                  return advancedFilters.sortOrder === "desc"
                    ? -comparison
                    : comparison;
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
                                {/* عرض العداد التنازلي للطلبات قيد الانتظار */}
                                {/* عرض العداد التنازلي للطلبات قيد الانتظار */}
                                {order.status === "pending" &&
                                  (order.seconds_remaining ?? 0) > 0 && (
                                    <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                      <Clock className="h-4 w-4 text-amber-400" />
                                      <span className="text-xs text-amber-400">
                                        متبقي للعميل:{" "}
                                        {formatTime(
                                          order.seconds_remaining ?? 0,
                                        )}
                                      </span>
                                      <span className="text-xs text-amber-400/70 mr-auto">
                                        (يمكن للعميل إلغاء الطلب)
                                      </span>
                                    </div>
                                  )}
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
                                    <td
                                      className="px-4 py-2"
                                      style={{ color: T.text }}
                                    >
                                      <div className="font-medium">
                                        {item.product_name}
                                      </div>
                                      {(() => {
                                        // التعامل مع selected_options بأنواعها المختلفة
                                        let options = item.selected_options;

                                        // إذا كانت نصاً، نحولها لمصفوفة
                                        if (typeof options === "string") {
                                          try {
                                            options = JSON.parse(options);
                                          } catch (e) {
                                            options = [];
                                          }
                                        }

                                        // إذا كانت مصفوفة وفيها عناصر، نعرضها
                                        if (
                                          Array.isArray(options) &&
                                          options.length > 0
                                        ) {
                                          return (
                                            <div className="mt-2 space-y-1">
                                              {options.map(
                                                (opt: any, idx: number) => (
                                                  <div
                                                    key={idx}
                                                    className="flex items-center text-xs text-[var(--gold)]/80"
                                                  >
                                                    <span className="ml-2">
                                                      •
                                                    </span>
                                                    <span>{opt.name}</span>
                                                    <span className="mr-1 text-[var(--gold)]/60">
                                                      (+{opt.price} د.ل)
                                                    </span>
                                                  </div>
                                                ),
                                              )}
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
// تنسيق الوقت (دقائق:ثواني)
const formatTime = (seconds: number) => {
  const totalSeconds = Math.floor(Math.max(0, seconds));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};
/* ============ Print Sales Report Button ============ */
function PrintSalesButton({
  period,
  label,
  icon,
}: {
  period: string;
  label: string;
  icon: React.ReactNode;
  siteName: string;
}) {
  const [loading, setLoading] = useState(false);
  const periodLabels: Record<string, string> = {
    daily: "اليوم",
    monthly: "الشهر",
    yearly: "السنة",
  };

  async function handlePrint() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sales-report?period=${period}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const s = data.summary || {};
      const paymentLabels = {
        card: "بطاقة بنكية",
        cash: "الدفع عند الاستلام",
        lypay: "تحويل LYPAY",
      };
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
              `<tr><td>${paymentLabels[p.payment_method as keyof typeof paymentLabels] || p.payment_method}</td><td>${p.count}</td><td>${Number(p.revenue).toFixed(2)} د.ل</td></tr>`,
          )
          .join("")}
        </tbody></table>`
            : ""
        }

<div class="footer">تم إنشاء هذا التقرير تلقائياً من {siteName}</div>        </body></html>`);
      printWindow.document.close();
      printWindow.print();
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  // تصميم مطابق لبطاقات الإحصائيات الجديدة
  const getGradientColor = () => {
    switch (period) {
      case "daily":
        return "linear-gradient(180deg, #7B1E2F 0%, #C5A55A 100%)";
      case "monthly":
        return "linear-gradient(180deg, #f59e0b 0%, #fbbf24 100%)";
      case "yearly":
        return "linear-gradient(180deg, #10b981 0%, #34d399 100%)";
      default:
        return "linear-gradient(180deg, #7B1E2F 0%, #C5A55A 100%)";
    }
  };

  const getIconBg = () => {
    switch (period) {
      case "daily":
        return `${CHART_COLORS.primary}15`;
      case "monthly":
        return "#f59e0b20";
      case "yearly":
        return "#10b98120";
      default:
        return `${CHART_COLORS.primary}15`;
    }
  };

  const getIconColor = () => {
    switch (period) {
      case "daily":
        return CHART_COLORS.primary;
      case "monthly":
        return "#f59e0b";
      case "yearly":
        return "#10b981";
      default:
        return CHART_COLORS.primary;
    }
  };

  return (
    <button
      onClick={handlePrint}
      disabled={loading}
      className="relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group w-full text-right"
      style={{ background: T.surface, borderColor: T.border }}
    >
      {/* الشريط الجانبي الملون */}
      <div
        className="absolute top-0 left-0 w-1 h-full"
        style={{ background: getGradientColor() }}
      />

      <div className="relative z-10 flex items-center gap-4">
        {/* الأيقونة */}
        <div
          className="p-3 rounded-xl transition-transform duration-300 group-hover:scale-110"
          style={{ background: getIconBg() }}
        >
          {loading ? (
            <span
              className="h-5 w-5 animate-spin rounded-full border-2"
              style={{
                borderColor: "transparent",
                borderTopColor: getIconColor(),
              }}
            />
          ) : (
            <div style={{ color: getIconColor() }}>{icon}</div>
          )}
        </div>

        {/* النص */}
        <div>
          <p className="text-sm font-semibold" style={{ color: T.text }}>
            {label}
          </p>
          <p className="text-xs mt-1" style={{ color: T.textDim }}>
            تقرير {periodLabels[period]}
          </p>
        </div>
      </div>
    </button>
  );
}
