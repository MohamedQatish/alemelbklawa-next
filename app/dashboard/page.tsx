"use client";

import React from "react";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart3,
  ShoppingBag,
  CalendarDays,
  LogOut,
  Printer,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  Package,
} from "lucide-react";
import { toast } from "sonner";

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
  secondary_phone: string;
  address: string;
  city: string;
  delivery_fee: number;
  total_amount: number;
  payment_method: string;
  status: string;
  notes: string;
  created_at: string;
  items: OrderItem[];
}

interface Reservation {
  id: number;
  full_name: string;
  phone: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  notes: string;
  status: string;
  created_at: string;
}

interface Stats {
  todaySales: number;
  monthlySales: number;
  totalOrders: number;
  pendingOrders: number;
  pendingReservations: number;
}

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "stats" | "orders" | "reservations"
  >("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, reservationsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/orders"),
        fetch("/api/admin/reservations"),
      ]);

      if (statsRes.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      if (statsRes.ok) setStats(await statsRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (reservationsRes.ok) setReservations(await reservationsRes.json());
    } catch {
      toast.error("خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, fetchData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        toast.success("تم تسجيل الدخول بنجاح");
      } else {
        toast.error("بيانات الدخول غير صحيحة");
      }
    } catch {
      toast.error("خطأ في الاتصال");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
    setStats(null);
    setOrders([]);
    setReservations([]);
  }

  async function updateOrderStatus(orderId: number, status: string) {
    try {
      await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      toast.success("تم تحديث حالة الطلب");
      fetchData();
    } catch {
      toast.error("خطأ في تحديث الطلب");
    }
  }

  async function updateReservationStatus(
    reservationId: number,
    status: string,
  ) {
    try {
      await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, status }),
      });
      toast.success("تم تحديث حالة الحجز");
      fetchData();
    } catch {
      toast.error("خطأ في تحديث الحجز");
    }
  }

  function printInvoice(order: Order) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>فاتورة #${order.id}</title>
          <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { font-family: 'Amiri', serif; color: #6B0F1A; margin: 0; font-size: 34px; font-weight: 700; letter-spacing: -0.02em; }
            .header p { color: #888; margin: 5px 0; }
            .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .info div { flex: 1; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #6B0F1A; color: #D4AF37; padding: 10px; text-align: right; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .total { text-align: left; font-size: 20px; font-weight: bold; color: #6B0F1A; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>عَالَمُ الْبَكْلَاوَة</h1>
            <p>فاتورة طلب رقم #${order.id}</p>
            <p>${new Date(order.created_at).toLocaleDateString("ar-LY")}</p>
          </div>
          <div class="info">
            <div>
              <strong>العميل:</strong> ${order.customer_name}<br/>
              <strong>الهاتف:</strong> ${order.phone}<br/>
              <strong>العنوان:</strong> ${order.address}
            </div>
            <div>
              <strong>المدينة:</strong> ${order.city}<br/>
              <strong>الدفع:</strong> ${order.payment_method === "card" ? "بطاقة بنكية" : order.payment_method === "cash" ? "الدفع عند الاستلام" : "تحويل LYPAY"}<br/>
              <strong>الحالة:</strong> ${order.status}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>المنتج</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .map(
                  (item) => `
                <tr>
             <td>
  ${item.product_name}
  ${
    item.selected_options &&
    Array.isArray(item.selected_options) &&
    item.selected_options.length > 0
      ? `<br/><small style="color:#888">${item.selected_options.map((o: any) => `${o.name} (+${o.price} د.ل)`).join(" + ")}</small>`
      : ""
  }
</td>
                  <td>${item.quantity}</td>
                  <td>${Number(item.unit_price).toFixed(2)} د.ل</td>
                  <td>${(Number(item.unit_price) * item.quantity).toFixed(2)} د.ل</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <div style="border-top: 1px solid #eee; padding-top: 10px;">
            <p>رسوم التوصيل: ${Number(order.delivery_fee).toFixed(2)} د.ل</p>
            <p class="total">الإجمالي: ${Number(order.total_amount).toFixed(2)} د.ل</p>
          </div>
          <div class="footer">
            <p style="font-family: 'Amiri', serif; font-weight: 700; font-size: 15px; letter-spacing: -0.02em;">شكراً لاختياركم عَالَمُ الْبَكْلَاوَة</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
      completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    const labels: Record<string, string> = {
      pending: "قيد الانتظار",
      confirmed: "مؤكد",
      completed: "مكتمل",
      cancelled: "ملغي",
    };
    return (
      <span
        className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles[status] || styles.pending}`}
      >
        {labels[status] || status}
      </span>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="bg-royal-red-dark flex min-h-screen items-center justify-center px-6">
        <div className="gold-border-glow w-full max-w-md rounded-2xl border border-[var(--gold)]/20 bg-[var(--royal-red-light)]/40 p-8">
          <div className="mb-8 text-center">
            <h1 className="animate-shimmer mb-2 text-3xl font-bold">
              لوحة التحكم
            </h1>
            <p
              className="font-thuluth text-sm font-bold text-[var(--gold)]/50"
              suppressHydrationWarning
            >
              {
                "\u0639\u064E\u0627\u0644\u064E\u0645\u064F \u0627\u0644\u0652\u0628\u064E\u0643\u0652\u0644\u064E\u0627\u0648\u064E\u0629 - الإدارة"
              }
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--gold)]">
                اسم المستخدم
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-[var(--gold)]/20 bg-[var(--royal-red-dark)]/60 px-4 py-3 text-[var(--cream)] placeholder:text-[var(--gold)]/30 focus:border-[var(--gold)]/50 focus:outline-none"
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--gold)]">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[var(--gold)]/20 bg-[var(--royal-red-dark)]/60 px-4 py-3 text-[var(--cream)] placeholder:text-[var(--gold)]/30 focus:border-[var(--gold)]/50 focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-xl bg-[var(--gold)] py-4 text-lg font-bold text-[var(--royal-red-dark)] transition-all hover:bg-[var(--gold-light)] disabled:opacity-50"
            >
              {loginLoading ? "جاري الدخول..." : "تسجيل الدخول"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-royal-red-dark min-h-screen" ref={printRef}>
      {/* Dashboard Header */}
      <header className="border-b border-[var(--gold)]/15 bg-[var(--royal-red-dark)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="animate-shimmer text-xl font-bold">لوحة التحكم</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-[var(--gold)]/20 px-4 py-2 text-sm text-[var(--gold)]/70 transition-colors hover:border-red-400/40 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            خروج
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Tabs */}
        <div className="mb-8 flex gap-3">
          {[
            { id: "stats" as const, label: "الإحصائيات", icon: BarChart3 },
            { id: "orders" as const, label: "الطلبات", icon: ShoppingBag },
            {
              id: "reservations" as const,
              label: "الحجوزات",
              icon: CalendarDays,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-[var(--gold)] text-[var(--royal-red-dark)]"
                  : "border border-[var(--gold)]/20 text-[var(--gold)]/70 hover:border-[var(--gold)]/40"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--gold)] border-t-transparent" />
          </div>
        )}

        {!loading && activeTab === "stats" && stats && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={DollarSign}
              label="مبيعات اليوم"
              value={`${stats.todaySales.toFixed(2)} د.ل`}
            />
            <StatCard
              icon={TrendingUp}
              label="مبيعات الشهر"
              value={`${stats.monthlySales.toFixed(2)} د.ل`}
            />
            <StatCard
              icon={Package}
              label="إجمالي الطلبات"
              value={stats.totalOrders.toString()}
            />
            <StatCard
              icon={Clock}
              label="طلبات معلقة"
              value={stats.pendingOrders.toString()}
            />
          </div>
        )}

        {!loading && activeTab === "orders" && (
          <div className="flex flex-col gap-4">
            {orders.length === 0 ? (
              <EmptyState label="لا توجد طلبات بعد" />
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="gold-border-glow rounded-2xl border border-[var(--gold)]/15 bg-[var(--royal-red-light)]/30 p-6"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-[var(--cream)]">
                          طلب #{order.id}
                        </h3>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="mt-1 text-xs text-[var(--gold)]/40">
                        {new Date(order.created_at).toLocaleString("ar-LY")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => printInvoice(order)}
                        className="flex items-center gap-1 rounded-lg border border-[var(--gold)]/20 px-3 py-2 text-xs text-[var(--gold)]/70 transition-colors hover:border-[var(--gold)]/40 hover:text-[var(--gold)]"
                      >
                        <Printer className="h-3 w-3" />
                        طباعة
                      </button>
                    </div>
                  </div>

                  <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
                    <div className="text-[var(--gold)]/60">
                      <span className="text-[var(--gold)]/40">العميل: </span>
                      {order.customer_name}
                    </div>
                    <div className="text-[var(--gold)]/60">
                      <span className="text-[var(--gold)]/40">الهاتف: </span>
                      <span dir="ltr">{order.phone}</span>
                    </div>
                    <div className="text-[var(--gold)]/60">
                      <span className="text-[var(--gold)]/40">المدينة: </span>
                      {order.city}
                    </div>
                    <div className="text-[var(--gold)]/60">
                      <span className="text-[var(--gold)]/40">العنوان: </span>
                      {order.address}
                    </div>
                    <div className="text-[var(--gold)]/60">
                      <span className="text-[var(--gold)]/40">الدفع: </span>
                      {order.payment_method === "card"
                        ? "بطاقة بنكية"
                        : order.payment_method === "cash"
                          ? "الدفع عند الاستلام"
                          : "تحويل LYPAY"}
                    </div>
                    <div className="text-[var(--gold)]/60">
                      <span className="text-[var(--gold)]/40">التوصيل: </span>
                      {Number(order.delivery_fee).toFixed(2)} د.ل
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mb-4 rounded-xl border border-[var(--gold)]/10 bg-[var(--royal-red-dark)]/40 p-4">
                    <h4 className="mb-3 text-sm font-semibold text-[var(--gold)]">
                      المنتجات
                    </h4>
                    {order.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between border-b border-[var(--gold)]/5 py-2 last:border-0"
                      >
                        <div>
                          <span className="text-sm text-[var(--cream)]">
                            {item.product_name}
                          </span>
                          {item.selected_options &&
                            Array.isArray(item.selected_options) &&
                            item.selected_options.length > 0 && (
                              <div className="mt-1 text-xs text-[var(--gold)]/50">
                                {item.selected_options.map(
                                  (opt: any, idx: number) => (
                                    <span key={idx} className="ml-1">
                                      {opt.name} (+{opt.price} د.ل)
                                      {idx < item.selected_options.length - 1
                                        ? " + "
                                        : ""}
                                    </span>
                                  ),
                                )}
                              </div>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[var(--gold)]/60">
                          <span>x{item.quantity}</span>
                          <span>
                            {(Number(item.unit_price) * item.quantity).toFixed(
                              2,
                            )}{" "}
                            د.ل
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-lg font-bold text-[var(--gold)]">
                      الإجمالي: {Number(order.total_amount).toFixed(2)} د.ل
                    </span>
                    <div className="flex gap-2">
                      {order.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              updateOrderStatus(order.id, "confirmed")
                            }
                            className="flex items-center gap-1 rounded-lg bg-green-500/20 px-3 py-2 text-xs text-green-400 transition-colors hover:bg-green-500/30"
                          >
                            <CheckCircle className="h-3 w-3" />
                            تأكيد
                          </button>
                          <button
                            onClick={() =>
                              updateOrderStatus(order.id, "cancelled")
                            }
                            className="flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/30"
                          >
                            <XCircle className="h-3 w-3" />
                            إلغاء
                          </button>
                        </>
                      )}
                      {order.status === "confirmed" && (
                        <button
                          onClick={() =>
                            updateOrderStatus(order.id, "completed")
                          }
                          className="flex items-center gap-1 rounded-lg bg-blue-500/20 px-3 py-2 text-xs text-blue-400 transition-colors hover:bg-blue-500/30"
                        >
                          <CheckCircle className="h-3 w-3" />
                          اكتمال
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && activeTab === "reservations" && (
          <div className="flex flex-col gap-4">
            {reservations.length === 0 ? (
              <EmptyState label="لا توجد حجوزات بعد" />
            ) : (
              reservations.map((res) => (
                <div
                  key={res.id}
                  className="gold-border-glow rounded-2xl border border-[var(--gold)]/15 bg-[var(--royal-red-light)]/30 p-6"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-[var(--cream)]">
                          {res.full_name}
                        </h3>
                        {getStatusBadge(res.status)}
                      </div>
                      <p className="mt-1 text-xs text-[var(--gold)]/40">
                        {new Date(res.created_at).toLocaleString("ar-LY")}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
                    <div className="text-[var(--gold)]/60">
                      <span className="text-[var(--gold)]/40">الهاتف: </span>
                      <span dir="ltr">{res.phone}</span>
                    </div>
                    <div className="text-[var(--gold)]/60">
                      <span className="text-[var(--gold)]/40">التاريخ: </span>
                      {res.reservation_date}
                    </div>
                    <div className="text-[var(--gold)]/60">
                      <span className="text-[var(--gold)]/40">الوقت: </span>
                      {res.reservation_time}
                    </div>
                    <div className="text-[var(--gold)]/60">
                      <span className="text-[var(--gold)]/40">
                        عدد الأشخاص:{" "}
                      </span>
                      {res.guests}
                    </div>
                    {res.notes && (
                      <div className="text-[var(--gold)]/60 sm:col-span-2">
                        <span className="text-[var(--gold)]/40">ملاحظات: </span>
                        {res.notes}
                      </div>
                    )}
                  </div>

                  {res.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          updateReservationStatus(res.id, "confirmed")
                        }
                        className="flex items-center gap-1 rounded-lg bg-green-500/20 px-3 py-2 text-xs text-green-400 transition-colors hover:bg-green-500/30"
                      >
                        <CheckCircle className="h-3 w-3" />
                        تأكيد
                      </button>
                      <button
                        onClick={() =>
                          updateReservationStatus(res.id, "cancelled")
                        }
                        className="flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/30"
                      >
                        <XCircle className="h-3 w-3" />
                        إلغاء
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="gold-border-glow rounded-2xl border border-[var(--gold)]/15 bg-[var(--royal-red-light)]/30 p-6">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--gold)]/10">
        <Icon className="h-6 w-6 text-[var(--gold)]" />
      </div>
      <p className="text-sm text-[var(--gold)]/50">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[var(--cream)]">{value}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--gold)]/10 bg-[var(--royal-red-light)]/20 py-20 text-center">
      <Package className="mb-4 h-16 w-16 text-[var(--gold)]/20" />
      <p className="text-lg text-[var(--gold)]/40">{label}</p>
    </div>
  );
}
