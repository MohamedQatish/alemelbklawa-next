"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  Save,
  Loader2,
  CheckCircle,
} from "lucide-react"
import { toast } from "sonner"

interface UserProfile {
  id: number
  name: string
  phone: string
  email: string | null
  address: string | null
  location: string | null
  created_at: string
}

interface OrderHistory {
  id: number
  total_amount: number
  status: string
  created_at: string
  city: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [orders, setOrders] = useState<OrderHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [location, setLocation] = useState("")

  useEffect(() => {
    fetch("/api/auth/profile")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login")
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data) {
          setProfile(data.user)
          setOrders(data.orders || [])
          setName(data.user.name)
          setEmail(data.user.email || "")
          setAddress(data.user.address || "")
          setLocation(data.user.location || "")
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false))
  }, [router])

  async function handleSave() {
    if (!name.trim() || name.trim().length < 2) {
      toast.error("الاسم مطلوب (حرفين على الأقل)")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), address: address.trim(), location: location.trim() }),
      })
      if (res.ok) {
        toast.success("تم تحديث الملف الشخصي بنجاح")
        setProfile((p) => (p ? { ...p, name: name.trim(), email: email.trim() || null, address: address.trim() || null, location: location.trim() || null } : null))
        setEditMode(false)
      } else {
        const data = await res.json()
        toast.error(data.error || "حدث خطأ")
      }
    } catch {
      toast.error("حدث خطأ في الاتصال")
    } finally {
      setSaving(false)
    }
  }

  const statusLabels: Record<string, string> = {
    pending: "قيد الانتظار",
    confirmed: "مؤكد",
    preparing: "قيد التحضير",
    delivered: "تم التوصيل",
    cancelled: "ملغي",
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    confirmed: "bg-green-500/20 text-green-400",
    preparing: "bg-blue-500/20 text-blue-400",
    delivered: "bg-emerald-500/20 text-emerald-400",
    cancelled: "bg-red-500/20 text-red-400",
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-royal-red-dark">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[var(--gold)]/20 border-t-[var(--gold)]" />
          <p className="text-gold font-sans">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-royal-red-dark">
      {/* Top bar */}
      <header
        className="border-b"
        style={{
          background: "hsl(350 76% 12% / 0.8)",
          backdropFilter: "blur(12px)",
          borderColor: "hsl(43 65% 52% / 0.12)",
        }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <h1 className="font-serif text-xl font-bold text-gold sm:text-2xl">الملف الشخصي</h1>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gold transition-all hover:bg-[var(--gold)]/10"
          >
            العودة للرئيسية
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        {/* Profile Card */}
        <div
          className="mb-6 rounded-2xl border p-6"
          style={{
            background: "hsl(350 76% 14% / 0.5)",
            borderColor: "hsl(43 65% 52% / 0.12)",
          }}
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "hsl(43 65% 52% / 0.15)" }}
              >
                <User className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-cream">{profile.name}</h2>
                <p className="text-sm text-[var(--gold)]/50" dir="ltr">{profile.phone}</p>
              </div>
            </div>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="rounded-xl border px-4 py-2 text-sm font-medium text-gold transition-all hover:bg-[var(--gold)]/10"
                style={{ borderColor: "hsl(43 65% 52% / 0.3)" }}
              >
                تعديل
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditMode(false)
                    setName(profile.name)
                    setEmail(profile.email || "")
                    setAddress(profile.address || "")
                    setLocation(profile.location || "")
                  }}
                  className="rounded-xl border px-3 py-2 text-sm text-[var(--gold)]/50 transition-all hover:bg-[var(--gold)]/5"
                  style={{ borderColor: "hsl(43 65% 52% / 0.15)" }}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, hsl(43 60% 45%), hsl(43 70% 55%))",
                    color: "hsl(350 76% 8%)",
                  }}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Name */}
            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]/50" />
              <div className="flex-1">
                <p className="text-xs text-[var(--gold)]/40">الاسم الكامل</p>
                {editMode ? (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-cream outline-none focus:border-[var(--gold)]/50"
                    style={{ borderColor: "hsl(43 65% 52% / 0.2)" }}
                  />
                ) : (
                  <p className="mt-0.5 text-sm text-cream">{profile.name}</p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]/50" />
              <div>
                <p className="text-xs text-[var(--gold)]/40">رقم الهاتف</p>
                <p className="mt-0.5 text-sm text-cream" dir="ltr">{profile.phone}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]/50" />
              <div className="flex-1">
                <p className="text-xs text-[var(--gold)]/40">البريد الإلكتروني</p>
                {editMode ? (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    dir="ltr"
                    className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-cream outline-none focus:border-[var(--gold)]/50"
                    style={{ borderColor: "hsl(43 65% 52% / 0.2)" }}
                  />
                ) : (
                  <p className="mt-0.5 text-sm text-cream" dir="ltr">{profile.email || "غير محدد"}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]/50" />
              <div className="flex-1">
                <p className="text-xs text-[var(--gold)]/40">العنوان</p>
                {editMode ? (
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="عنوان التوصيل"
                    className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-cream outline-none focus:border-[var(--gold)]/50"
                    style={{ borderColor: "hsl(43 65% 52% / 0.2)" }}
                  />
                ) : (
                  <p className="mt-0.5 text-sm text-cream">{profile.address || "غير محدد"}</p>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]/50" />
              <div className="flex-1">
                <p className="text-xs text-[var(--gold)]/40">الموقع / المدينة</p>
                {editMode ? (
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="مثال: طرابلس، بنغازي..."
                    className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-cream outline-none focus:border-[var(--gold)]/50"
                    style={{ borderColor: "hsl(43 65% 52% / 0.2)" }}
                  />
                ) : (
                  <p className="mt-0.5 text-sm text-cream">{profile.location || "غير محدد"}</p>
                )}
              </div>
            </div>

            {/* Join date */}
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]/50" />
              <div>
                <p className="text-xs text-[var(--gold)]/40">تاريخ التسجيل</p>
                <p className="mt-0.5 text-sm text-cream">
                  {new Date(profile.created_at).toLocaleDateString("ar-LY", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div
          className="rounded-2xl border p-6"
          style={{
            background: "hsl(350 76% 14% / 0.5)",
            borderColor: "hsl(43 65% 52% / 0.12)",
          }}
        >
          <div className="mb-4 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-gold" />
            <h3 className="font-serif text-lg font-bold text-gold">سجل الطلبات</h3>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-[var(--gold)]/20" />
              <p className="text-sm text-[var(--gold)]/40">لا توجد طلبات سابقة</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                  style={{
                    background: "hsl(350 76% 10% / 0.5)",
                    borderColor: "hsl(43 65% 52% / 0.08)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-[var(--gold)]/40" />
                    <div>
                      <p className="text-sm font-semibold text-cream">{"طلب #"}{order.id}</p>
                      <p className="text-xs text-[var(--gold)]/40">
                        {new Date(order.created_at).toLocaleDateString("ar-LY")} - {order.city}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[order.status] || "bg-gray-500/20 text-gray-400"}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                    <span className="text-sm font-bold text-gold">
                      {Number(order.total_amount).toFixed(2)} د.ل
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
