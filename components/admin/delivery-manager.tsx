"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Loader2, MapPin, DollarSign, Save, X } from "lucide-react"
import { toast } from "sonner"

interface DeliveryCity {
  id: number
  city: string
  price: number
}

const emptyForm = { city: "", price: "" }

export default function DeliveryManager() {
  const [cities, setCities] = useState<DeliveryCity[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchCities = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/delivery")
      if (res.ok) setCities(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCities() }, [fetchCities])

  function startAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setShowAdd(true)
  }

  function startEdit(c: DeliveryCity) {
    setShowAdd(false)
    setEditingId(c.id)
    setForm({ city: c.city, price: String(c.price) })
  }

  function cancel() {
    setShowAdd(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSave() {
    const city = (form.city || "").trim()
    const price = Number(form.price)
    if (!city) { toast.error("اسم المدينة مطلوب"); return }
    if (isNaN(price) || price < 0) { toast.error("السعر غير صالح"); return }

    setSaving(true)
    try {
      if (editingId) {
        const res = await fetch("/api/admin/delivery", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, city, price }),
        })
        if (!res.ok) throw new Error()
        toast.success("تم تحديث المدينة")
      } else {
        const res = await fetch("/api/admin/delivery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ city, price }),
        })
        if (!res.ok) throw new Error()
        toast.success("تمت إضافة المدينة")
      }
      cancel()
      fetchCities()
    } catch { toast.error("حدث خطأ") }
    finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm("هل أنت متأكد من حذف هذه المدينة؟")) return
    try {
      const res = await fetch("/api/admin/delivery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      toast.success("تم حذف المدينة")
      fetchCities()
    } catch { toast.error("حدث خطأ") }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--gold)]" />
    </div>
  )

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--gold)]">إعدادات التوصيل</h2>
          <p className="mt-1 text-sm text-[var(--gold)]/50">{cities.length} مدينة</p>
        </div>
        <button onClick={startAdd} className="flex items-center gap-2 rounded-xl bg-[var(--gold)] px-4 py-2.5 text-sm font-bold text-[var(--royal-red-dark)] transition-all hover:bg-[var(--gold-light)]">
          <Plus className="h-4 w-4" />
          إضافة مدينة
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="rounded-2xl border border-[var(--gold)]/20 bg-[var(--royal-red-light)]/30 p-5">
          <h3 className="mb-4 text-sm font-bold text-[var(--gold)]">إضافة مدينة جديدة</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-[var(--gold)]/60">اسم المدينة *</label>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="مثال: طرابلس" className="w-full rounded-xl border border-[var(--gold)]/20 bg-[var(--royal-red-dark)]/50 px-4 py-2.5 text-sm text-[var(--cream)] outline-none focus:border-[var(--gold)]/50 placeholder:text-[var(--gold)]/25" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-[var(--gold)]/60">سعر التوصيل (د.ل) *</label>
              <input type="number" min="0" step="0.5" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="10" className="w-full rounded-xl border border-[var(--gold)]/20 bg-[var(--royal-red-dark)]/50 px-4 py-2.5 text-sm text-[var(--cream)] outline-none focus:border-[var(--gold)]/50 placeholder:text-[var(--gold)]/25" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-2 text-sm font-bold text-[var(--royal-red-dark)] transition-all hover:bg-[var(--gold-light)] disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ
            </button>
            <button onClick={cancel} className="flex items-center gap-2 rounded-xl border border-[var(--gold)]/20 bg-transparent px-5 py-2 text-sm text-[var(--gold)] transition-all hover:bg-[var(--gold)]/10">
              <X className="h-4 w-4" />
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Cities Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--gold)]/15">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--gold)]/15 bg-[var(--royal-red-light)]/40">
              <th className="px-5 py-3 text-right text-xs font-semibold text-[var(--gold)]/70">المدينة</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-[var(--gold)]/70">سعر التوصيل</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--gold)]/70">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {cities.map(c => (
              <tr key={c.id} className="border-b border-[var(--gold)]/8 transition-colors hover:bg-[var(--gold)]/5">
                {editingId === c.id ? (
                  <>
                    <td className="px-5 py-3">
                      <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full rounded-lg border border-[var(--gold)]/20 bg-[var(--royal-red-dark)]/50 px-3 py-1.5 text-sm text-[var(--cream)] outline-none focus:border-[var(--gold)]/50" />
                    </td>
                    <td className="px-5 py-3">
                      <input type="number" min="0" step="0.5" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-28 rounded-lg border border-[var(--gold)]/20 bg-[var(--royal-red-dark)]/50 px-3 py-1.5 text-sm text-[var(--cream)] outline-none focus:border-[var(--gold)]/50" />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-[var(--gold)] px-3 py-1.5 text-xs font-bold text-[var(--royal-red-dark)] hover:bg-[var(--gold-light)] disabled:opacity-50">
                          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "حفظ"}
                        </button>
                        <button onClick={cancel} className="rounded-lg border border-[var(--gold)]/20 bg-transparent px-3 py-1.5 text-xs text-[var(--gold)] hover:bg-[var(--gold)]/10">إلغاء</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[var(--gold)]/40" />
                        <span className="text-sm font-medium text-[var(--cream)]">{c.city}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-[var(--gold)]/40" />
                        <span className="text-sm font-semibold text-[var(--gold)]">{c.price} د.ل</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(c)} className="rounded-lg p-1.5 text-[var(--gold)]/50 transition-colors hover:bg-[var(--gold)]/10 hover:text-[var(--gold)]">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="rounded-lg p-1.5 text-red-400/50 transition-colors hover:bg-red-400/10 hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {cities.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-12 text-center text-sm text-[var(--gold)]/40">لا توجد مدن مضافة</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
