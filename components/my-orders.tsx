"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Truck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: number;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  total_amount: number;
  status: string;
  created_at: string;
  cancel_deadline: string;
  seconds_remaining: number;
  items: OrderItem[];
}

interface MyOrdersProps {
  phone: string;
  onClose: () => void;
}

export default function MyOrders({ phone, onClose }: MyOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [timers, setTimers] = useState<Record<number, number>>({});

  // دالة مساعدة لتحويل القيم إلى أرقام
  const toNumber = (value: any): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseFloat(value) || 0;
    return 0;
  };

  const fetchOrders = async () => {
    try {
      // للمستخدمين المسجلين، phone قد يكون موجوداً لكننا لا نعتمد عليه فقط
      // الـ API سيتعامل مع user_id تلقائياً
      const url = phone
        ? `/api/orders?phone=${encodeURIComponent(phone)}`
        : "/api/orders";
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("البيانات:", data);

      // تحويل البيانات إلى الشكل المطلوب
      const formattedOrders = data.map((order: any) => ({
        ...order,
        total_amount: toNumber(order.total_amount),
        seconds_remaining: toNumber(order.seconds_remaining),
        items: (order.items || []).map((item: any) => ({
          ...item,
          unit_price: toNumber(item.unit_price),
        })),
      }));

      setOrders(formattedOrders);

      // تحديث المؤقتات
      const initialTimers: Record<number, number> = {};
      formattedOrders.forEach((order: Order) => {
        if (order.status === "pending" && order.seconds_remaining > 0) {
          initialTimers[order.id] = order.seconds_remaining;
        }
      });
      setTimers(initialTimers);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("حدث خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (phone) {
      fetchOrders();
    }
  }, [phone]);

  // تحديث المؤقتات كل ثانية
  useEffect(() => {
    if (Object.keys(timers).length === 0) return;

    const interval = setInterval(() => {
      setTimers((prev) => {
        const newTimers = { ...prev };
        let hasChanges = false;

        Object.keys(newTimers).forEach((key) => {
          const id = Number(key);
          if (newTimers[id] > 0) {
            newTimers[id] -= 1;
            hasChanges = true;
          } else {
            delete newTimers[id];
            hasChanges = true;
          }
        });

        return hasChanges ? newTimers : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timers]);

  const handleCancel = async (orderId: number) => {
    setCancellingId(orderId);
    try {
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }), // 👈 أزلنا phone من هنا
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("تم إلغاء الطلب بنجاح");
        // تحديث قائمة الطلبات
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: "cancelled" } : order,
          ),
        );
        // إزالة المؤقت
        setTimers((prev) => {
          const newTimers = { ...prev };
          delete newTimers[orderId];
          return newTimers;
        });
      } else {
        toast.error(data.error || "حدث خطأ في إلغاء الطلب");
      }
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error("حدث خطأ في الاتصال");
    } finally {
      setCancellingId(null);
    }
  };
  // تنسيق الوقت (دقائق:ثواني) - بدون أجزاء الثانية
  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(Math.max(0, seconds)); // نأخذ الجزء الصحيح فقط
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ar-LY", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // حالة الطلب
  const getStatusBadge = (status: string, secondsRemaining?: number) => {
    switch (status) {
      case "pending":
        return secondsRemaining && secondsRemaining > 0 ? (
          <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400">
            <Clock className="h-3 w-3" />
            {formatTime(secondsRemaining)}
          </span>
        ) : (
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400">
            قيد الانتظار
          </span>
        );
      case "confirmed":
        return (
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
            <CheckCircle className="mr-1 inline h-3 w-3" />
            تم التأكيد
          </span>
        );
      case "preparing":
        return (
          <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-400">
            <Package className="mr-1 inline h-3 w-3" />
            قيد التحضير
          </span>
        );
      case "delivered":
        return (
          <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300">
            <Truck className="mr-1 inline h-3 w-3" />
            تم التوصيل
          </span>
        );
      case "cancelled":
        return (
          <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400">
            <XCircle className="mr-1 inline h-3 w-3" />
            ملغي
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="absolute top-0 right-0 bottom-0 w-full max-w-2xl overflow-y-auto border-r border-[var(--gold)]/20 bg-[var(--royal-red-dark)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--gold)]/15 bg-[var(--royal-red-dark)]/95 p-6 backdrop-blur-sm">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--cream)]">
            <Package className="h-5 w-5 text-[var(--gold)]" />
            طلباتي
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[var(--gold)]/60 transition-colors hover:bg-[var(--gold)]/10 hover:text-[var(--gold)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--gold)] border-t-transparent" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="mb-4 h-16 w-16 text-[var(--gold)]/20" />
              <p className="text-lg text-[var(--gold)]/40">
                لا توجد طلبات سابقة
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-[var(--gold)]/20 bg-[var(--royal-red-light)]/30 p-5 transition-all hover:border-[var(--gold)]/40"
                >
                  {/* رأس الطلب */}
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-sm text-[var(--gold)]/60">
                        طلب رقم
                      </span>
                      <h3 className="text-lg font-bold text-[var(--cream)]">
                        #{order.id.toString().slice(-4).padStart(4, "0")}
                      </h3>
                    </div>
                    {getStatusBadge(order.status, timers[order.id])}
                  </div>

                  {/* تفاصيل الطلب */}
                  <div className="mb-4 space-y-2 text-sm">
                    <p className="text-[var(--gold)]/60">
                      <span className="font-semibold text-[var(--gold)]">
                        التاريخ:
                      </span>{" "}
                      {formatDate(order.created_at)}
                    </p>
                    <p className="text-[var(--gold)]/60">
                      <span className="font-semibold text-[var(--gold)]">
                        العنوان:
                      </span>{" "}
                      {order.address} - {order.city}
                    </p>
                  </div>

                  {/* المنتجات */}
                  <div className="mb-4 rounded-lg bg-[var(--royal-red-dark)]/50 p-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between py-2 text-sm"
                      >
                        <span className="text-[var(--cream)]">
                          {item.product_name} × {item.quantity}
                        </span>
                        <span className="font-bold text-[var(--gold)]">
                          {(item.quantity * item.unit_price).toFixed(2)} د.ل
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* الإجمالي */}
                  <div className="flex items-center justify-between border-t border-[var(--gold)]/15 pt-3">
                    <span className="font-bold text-[var(--gold)]">
                      الإجمالي
                    </span>
                    <span className="text-xl font-bold text-[var(--cream)]">
                      {order.total_amount.toFixed(2)} د.ل
                    </span>
                  </div>

                  {/* زر الإلغاء - يظهر فقط إذا كان pending والوقت لم ينته */}
                  {order.status === "pending" && timers[order.id] > 0 && (
                    <button
                      onClick={() => handleCancel(order.id)}
                      disabled={cancellingId === order.id}
                      className="mt-4 w-full rounded-lg bg-red-500/15 py-3 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/25 disabled:opacity-50"
                    >
                      {cancellingId === order.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                          جاري الإلغاء...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <XCircle className="h-4 w-4" />
                          إلغاء الطلب (متبقي {formatTime(timers[order.id])})
                        </span>
                      )}
                    </button>
                  )}

                  {/* رسالة انتهاء الوقت */}
                  {order.status === "pending" && !timers[order.id] && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-400">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>انتهت المهلة المسموحة للإلغاء</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
