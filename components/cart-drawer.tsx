"use client"

import React from "react"
import { useSyncExternalStore, useState, useEffect, useCallback } from "react"
import { X, Plus, Minus, Trash2, ShoppingCart } from "lucide-react"
import {
  getCart,
  subscribeToCart,
  updateQuantity,
  removeFromCart,
  getCartTotal,
  getCartCount,
  clearCart,
  getServerCart,
  getServerTotal,
  getServerCount,
} from "@/lib/cart"
import { toast } from "sonner"

interface DeliveryCityOption { name: string; price: number }

// نوع جديد لعنصر السلة (مطابق لـ CartItem في cart.ts)
interface CartItemDisplay {
  productId: number
  name: string
  basePrice: number
  finalPrice: number
  quantity: number
  category: string
  selectedOptions: {
    id: number
    name: string
    price: number
  }[]
  notes?: string
}

export default function CartDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const items = useSyncExternalStore(subscribeToCart, getCart, getServerCart) as CartItemDisplay[]
  const total = useSyncExternalStore(subscribeToCart, getCartTotal, getServerTotal)
  const count = useSyncExternalStore(subscribeToCart, getCartCount, getServerCount)

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [cities, setCities] = useState<DeliveryCityOption[]>([])
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    secondaryPhone: "",
    city: "",
    paymentMethod: "",
    notes: "",
    confirmed: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)

  const fetchCities = useCallback(async () => {
    try {
      const res = await fetch("/api/delivery-cities")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setCities(data.map((c: { city: string; price: number }) => ({
            name: c.city,
            price: Number(c.price),
          })))
        }
      }
    } catch { /* keep static fallback */ }
  }, [])

  useEffect(() => { fetchCities() }, [fetchCities])

  const selectedCity = cities.find((c) => c.name === form.city)
  const deliveryFee = selectedCity?.price || 0
  const grandTotal = total + deliveryFee

  // دالة مساعدة لعرض الخيارات المختارة كنص
  const formatSelectedOptions = (selectedOptions: CartItemDisplay['selectedOptions']) => {
    return selectedOptions.map(opt => opt.name).join(' + ')
  }

  async function handleSubmitOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!form.paymentMethod) {
      toast.error("يرجى اختيار طريقة الدفع")
      return
    }
    if (!form.confirmed) {
      toast.error("يرجى تأكيد الطلب")
      return
    }
    if (count === 0) {
      toast.error("السلة فارغة")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name,
          phone: form.phone,
          secondaryPhone: form.secondaryPhone,
          address: form.address,
          city: form.city,
          deliveryFee,
          totalAmount: grandTotal,
          paymentMethod: form.paymentMethod,
          notes: form.notes,
          items: items.map((item) => ({
            productId: item.productId,
            productName: item.name,
            category: item.category,
            quantity: item.quantity,
            unitPrice: item.finalPrice, // نرسل السعر النهائي
            basePrice: item.basePrice, // سعر الأساسي (للحفظ)
          selectedOptions: item.selectedOptions.map(opt => ({ optionId: opt.id })),
            notes: item.notes || "",
          })),
        }),
      })

      if (res.ok) {
        setOrderSuccess(true)
        clearCart()
      } else {
        toast.error("حدث خطأ أثناء إرسال الطلب")
      }
    } catch {
      toast.error("حدث خطأ في الاتصال")
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="absolute top-0 right-0 bottom-0 w-full max-w-md overflow-y-auto border-r border-[var(--gold)]/20 bg-[var(--royal-red-dark)]">
        <div className="flex items-center justify-between border-b border-[var(--gold)]/15 p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--cream)]">
            <ShoppingCart className="h-5 w-5 text-[var(--gold)]" />
            سلة التسوق ({count})
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[var(--gold)]/60 transition-colors hover:bg-[var(--gold)]/10 hover:text-[var(--gold)]"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {orderSuccess ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--gold)]/10">
              <svg className="h-10 w-10 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mb-3 text-2xl font-bold text-[var(--cream)]">شكراً لاختيارك إيانا</h3>
            <p className="mb-8 text-[var(--gold)]/60">تم استلام طلبك بنجاح وسيتم التواصل معك قريباً</p>
            <button
              onClick={() => {
                setOrderSuccess(false)
                setCheckoutOpen(false)
                onClose()
              }}
              className="rounded-full bg-[var(--gold)] px-8 py-3 font-bold text-[var(--royal-red-dark)] transition-all hover:bg-[var(--gold-light)]"
            >
              العودة للرئيسية
            </button>
          </div>
        ) : checkoutOpen ? (
          <form onSubmit={handleSubmitOrder} className="p-6">
            <button
              type="button"
              onClick={() => setCheckoutOpen(false)}
              className="mb-6 text-sm text-[var(--gold)]/60 transition-colors hover:text-[var(--gold)]"
            >
              &larr; العودة للسلة
            </button>

            <div className="flex flex-col gap-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--gold)]">الاسم الكامل *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-[var(--gold)]/20 bg-[var(--royal-red-light)]/60 px-4 py-3 text-[var(--cream)] placeholder:text-[var(--gold)]/30 focus:border-[var(--gold)]/50 focus:outline-none"
                  placeholder="أدخل اسمك الكامل"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--gold)]">العنوان *</label>
                <input
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-xl border border-[var(--gold)]/20 bg-[var(--royal-red-light)]/60 px-4 py-3 text-[var(--cream)] placeholder:text-[var(--gold)]/30 focus:border-[var(--gold)]/50 focus:outline-none"
                  placeholder="أدخل عنوانك بالتفصيل"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--gold)]">رقم الهاتف الرئيسي *</label>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-xl border border-[var(--gold)]/20 bg-[var(--royal-red-light)]/60 px-4 py-3 text-[var(--cream)] placeholder:text-[var(--gold)]/30 focus:border-[var(--gold)]/50 focus:outline-none"
                  placeholder="09XXXXXXXX"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--gold)]">رقم هاتف ثانوي</label>
                <input
                  value={form.secondaryPhone}
                  onChange={(e) => setForm({ ...form, secondaryPhone: e.target.value })}
                  className="w-full rounded-xl border border-[var(--gold)]/20 bg-[var(--royal-red-light)]/60 px-4 py-3 text-[var(--cream)] placeholder:text-[var(--gold)]/30 focus:border-[var(--gold)]/50 focus:outline-none"
                  placeholder="اختياري"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--gold)]">المدينة *</label>
                <select
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full rounded-xl border border-[var(--gold)]/20 bg-[var(--royal-red-light)]/60 px-4 py-3 text-[var(--cream)] focus:border-[var(--gold)]/50 focus:outline-none"
                >
                  <option value="" className="bg-[var(--royal-red-dark)] text-[var(--gold)]">اختر المدينة</option>
                  {cities.map((city) => (
                    <option key={city.name} value={city.name} className="bg-[var(--royal-red-dark)] text-[var(--gold)]">
                      {city.name} - رسوم التوصيل: {city.price} د.ل
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method Selection */}
              <div className="rounded-xl border-2 border-[var(--gold)]/25 bg-[var(--royal-red-light)]/30 p-4">
                <label className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--gold)]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                  طريقة الدفع *
                </label>
                <div className="flex flex-col gap-2.5">
                  {/* Bank Card */}
                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3.5 transition-all duration-200 ${form.paymentMethod === "card" ? "border-[var(--gold)] bg-[var(--gold)]/15 shadow-[0_0_12px_rgba(197,165,90,0.15)]" : "border-[var(--gold)]/15 hover:border-[var(--gold)]/30 hover:bg-[var(--gold)]/5"}`}>
                    <input type="radio" name="payment" value="card" checked={form.paymentMethod === "card"} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="sr-only" />
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${form.paymentMethod === "card" ? "border-[var(--gold)] bg-[var(--gold)]" : "border-[var(--gold)]/30"}`}>
                      {form.paymentMethod === "card" && <div className="h-2 w-2 rounded-full bg-[var(--royal-red-dark)]" />}
                    </div>
                    <div className="flex flex-1 items-center gap-3">
                      <svg className="h-6 w-6 text-[var(--gold)]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                      <div>
                        <span className="block text-sm font-semibold text-[var(--cream)]">بطاقة بنكية</span>
                        <span className="block text-xs text-[var(--gold)]/50">{'Visa / Mastercard'}</span>
                      </div>
                    </div>
                  </label>

                  {/* LYPAY */}
                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3.5 transition-all duration-200 ${form.paymentMethod === "lypay" ? "border-[var(--gold)] bg-[var(--gold)]/15 shadow-[0_0_12px_rgba(197,165,90,0.15)]" : "border-[var(--gold)]/15 hover:border-[var(--gold)]/30 hover:bg-[var(--gold)]/5"}`}>
                    <input type="radio" name="payment" value="lypay" checked={form.paymentMethod === "lypay"} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="sr-only" />
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${form.paymentMethod === "lypay" ? "border-[var(--gold)] bg-[var(--gold)]" : "border-[var(--gold)]/30"}`}>
                      {form.paymentMethod === "lypay" && <div className="h-2 w-2 rounded-full bg-[var(--royal-red-dark)]" />}
                    </div>
                    <div className="flex flex-1 items-center gap-3">
                      <svg className="h-6 w-6 text-[var(--gold)]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
                      <div>
                        <span className="block text-sm font-semibold text-[var(--cream)]">تحويل LYPAY</span>
                        <span className="block text-xs text-[var(--gold)]/50">{'IBAN / تحويل إلكتروني'}</span>
                      </div>
                    </div>
                  </label>

                  {/* Cash on Delivery */}
                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3.5 transition-all duration-200 ${form.paymentMethod === "cash" ? "border-[var(--gold)] bg-[var(--gold)]/15 shadow-[0_0_12px_rgba(197,165,90,0.15)]" : "border-[var(--gold)]/15 hover:border-[var(--gold)]/30 hover:bg-[var(--gold)]/5"}`}>
                    <input type="radio" name="payment" value="cash" checked={form.paymentMethod === "cash"} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="sr-only" />
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${form.paymentMethod === "cash" ? "border-[var(--gold)] bg-[var(--gold)]" : "border-[var(--gold)]/30"}`}>
                      {form.paymentMethod === "cash" && <div className="h-2 w-2 rounded-full bg-[var(--royal-red-dark)]" />}
                    </div>
                    <div className="flex flex-1 items-center gap-3">
                      <svg className="h-6 w-6 text-[var(--gold)]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
                      <div>
                        <span className="block text-sm font-semibold text-[var(--cream)]">الدفع عند الاستلام</span>
                        <span className="block text-xs text-[var(--gold)]/50">نقداً عند التوصيل</span>
                      </div>
                    </div>
                  </label>
                </div>
                {!form.paymentMethod && (
                  <p className="mt-2 text-xs text-red-400/70">يرجى اختيار طريقة الدفع لإتمام الطلب</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--gold)]">ملاحظات</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-xl border border-[var(--gold)]/20 bg-[var(--royal-red-light)]/60 px-4 py-3 text-[var(--cream)] placeholder:text-[var(--gold)]/30 focus:border-[var(--gold)]/50 focus:outline-none"
                  rows={3}
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>

              {/* Order Summary */}
              <div className="rounded-xl border border-[var(--gold)]/20 bg-[var(--royal-red-light)]/40 p-4">
                <div className="flex justify-between text-sm text-[var(--gold)]/70">
                  <span>المنتجات</span>
                  <span>{total.toFixed(2)} د.ل</span>
                </div>
                <div className="my-2 flex justify-between text-sm text-[var(--gold)]/70">
                  <span>رسوم التوصيل</span>
                  <span>{deliveryFee.toFixed(2)} د.ل</span>
                </div>
                <div className="border-t border-[var(--gold)]/15 pt-2">
                  <div className="flex justify-between text-lg font-bold text-[var(--gold)]">
                    <span>الإجمالي</span>
                    <span>{grandTotal.toFixed(2)} د.ل</span>
                  </div>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.confirmed}
                  onChange={(e) => setForm({ ...form, confirmed: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-[var(--gold)]"
                />
                <span className="text-sm text-[var(--gold)]/70">أؤكد أن جميع البيانات صحيحة وأوافق على إتمام الطلب</span>
              </label>

              <button
                type="submit"
                disabled={submitting || !form.confirmed || !form.paymentMethod}
                className="w-full rounded-xl bg-[var(--gold)] py-4 text-lg font-bold text-[var(--royal-red-dark)] transition-all duration-300 hover:bg-[var(--gold-light)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "جاري إرسال الطلب..." : !form.paymentMethod ? "اختر طريقة الدفع أولاً" : "تأكيد الطلب"}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <ShoppingCart className="mb-4 h-16 w-16 text-[var(--gold)]/20" />
                <p className="text-lg text-[var(--gold)]/40">السلة فارغة</p>
              </div>
            ) : (
              <>
                <div className="flex-1 divide-y divide-[var(--gold)]/10">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${JSON.stringify(item.selectedOptions)}`}
                      className="flex items-center gap-4 p-4 transition-colors hover:bg-[var(--royal-red-light)]/30"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-[var(--cream)]">{item.name}</h4>
                        {item.selectedOptions.length > 0 && (
                          <p className="mt-1 text-xs text-[var(--gold)]/50">
                            {formatSelectedOptions(item.selectedOptions)}
                          </p>
                        )}
                        <p className="mt-1 text-sm font-bold text-[var(--gold)]">
                          {(item.finalPrice * item.quantity).toFixed(2)} د.ل
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.selectedOptions, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--gold)]/20 text-[var(--gold)] transition-colors hover:bg-[var(--gold)]/10"
                          aria-label="تقليل الكمية"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-[24px] text-center text-sm font-bold text-[var(--cream)]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.selectedOptions, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--gold)]/20 text-[var(--gold)] transition-colors hover:bg-[var(--gold)]/10"
                          aria-label="زيادة الكمية"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId, item.selectedOptions)}
                        className="p-2 text-red-400/60 transition-colors hover:text-red-400"
                        aria-label="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[var(--gold)]/15 p-6">
                  <div className="mb-4 flex justify-between text-lg font-bold">
                    <span className="text-[var(--gold)]">الإجمالي</span>
                    <span className="text-[var(--cream)]">{total.toFixed(2)} د.ل</span>
                  </div>
                  <button
                    onClick={() => setCheckoutOpen(true)}
                    className="w-full rounded-xl bg-[var(--gold)] py-4 text-lg font-bold text-[var(--royal-red-dark)] transition-all duration-300 hover:bg-[var(--gold-light)]"
                  >
                    إتمام الطلب
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}