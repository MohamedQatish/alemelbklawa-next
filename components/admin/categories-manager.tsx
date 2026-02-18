"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Plus, Edit3, Trash2, Save, X, Loader2, FolderOpen, GripVertical, Package } from "lucide-react"

const T = {
  bg: "var(--admin-bg)", surface: "var(--admin-surface)", surfaceHover: "var(--admin-surface-hover)",
  surfaceDeep: "var(--admin-surface-deep)", border: "var(--admin-border)", borderHover: "var(--admin-border-hover)",
  accent: "var(--admin-accent)", accentLight: "var(--admin-accent-light)", accentMuted: "var(--admin-accent-muted)",
  glow: "var(--admin-glow)", text: "var(--admin-text)", textMuted: "var(--admin-text-muted)", textDim: "var(--admin-text-dim)",
}

interface Category { id: number; name: string; label_ar: string; icon: string | null; sort_order: number }
interface ProductCount { category_id: number; count: number }

const emptyForm = { name: "", label_ar: "", icon: "", sort_order: 0 }

export default function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [productCounts, setProductCounts] = useState<Map<number, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories")
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch { /* */ }
    finally { setLoading(false) }
  }, [])

  const fetchProductCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/products")
      if (res.ok) {
        const products = await res.json()
        const counts = new Map<number, number>()
        for (const p of products) {
          if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) || 0) + 1)
        }
        setProductCounts(counts)
      }
    } catch { /* */ }
  }, [])

  useEffect(() => { fetchCategories(); fetchProductCounts() }, [fetchCategories, fetchProductCounts])

  function showMessage(msg: string, isError = false) {
    if (isError) { setError(msg); setSuccess(""); setTimeout(() => setError(""), 4000) }
    else { setSuccess(msg); setError(""); setTimeout(() => setSuccess(""), 4000) }
  }

  function startAdd() {
    setEditingId(null)
    const nextOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) + 1 : 1
    setForm({ ...emptyForm, sort_order: nextOrder })
    setShowAdd(true)
  }
  function startEdit(c: Category) {
    setShowAdd(false); setEditingId(c.id)
    setForm({ name: c.name || "", label_ar: c.label_ar || c.name || "", icon: c.icon || "", sort_order: c.sort_order || 0 })
  }
  function cancel() { setShowAdd(false); setEditingId(null); setForm(emptyForm) }

  async function handleSave() {
    if (!form.name.trim()) { showMessage("يرجى ادخال اسم القسم", true); return }
    setSaving(true)
    try {
      const method = editingId ? "PATCH" : "POST"
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        name: form.name.trim(),
        label_ar: form.label_ar.trim() || form.name.trim(),
        icon: form.icon.trim() || null,
        sort_order: form.sort_order,
      }
      const res = await fetch("/api/admin/categories", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      })
      if (res.ok) {
        showMessage(editingId ? "تم تحديث القسم بنجاح" : "تم إضافة القسم بنجاح")
        cancel(); fetchCategories(); fetchProductCounts()
      } else {
        const data = await res.json().catch(() => ({}))
        showMessage(data.error || "حدث خطأ", true)
      }
    } catch { showMessage("خطأ في الاتصال", true) }
    finally { setSaving(false) }
  }

  async function handleDelete(cat: Category) {
    const count = productCounts.get(cat.id) || 0
    const msg = count > 0
      ? `سيتم حذف القسم "${cat.name}" وفصل ${count} منتج عنه. هل أنت متأكد؟`
      : `هل أنت متأكد من حذف القسم "${cat.name}"؟`
    if (!confirm(msg)) return
    try {
      const res = await fetch("/api/admin/categories", {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: cat.id }),
      })
      if (res.ok) {
        showMessage("تم حذف القسم بنجاح")
        fetchCategories(); fetchProductCounts()
      } else { showMessage("فشل في حذف القسم", true) }
    } catch { showMessage("خطأ في الاتصال", true) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: T.accent }} />
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Status messages */}
      {error && (
        <div className="animate-slide-up-fade rounded-xl border px-4 py-3 text-sm font-medium"
          style={{ background: "hsl(0 60% 50% / 0.1)", borderColor: "hsl(0 60% 50% / 0.3)", color: "hsl(0 70% 65%)" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="animate-slide-up-fade rounded-xl border px-4 py-3 text-sm font-medium"
          style={{ background: "hsl(140 60% 40% / 0.1)", borderColor: "hsl(140 60% 40% / 0.3)", color: "hsl(140 70% 60%)" }}>
          {success}
        </div>
      )}

      {/* Header */}
      <div className="admin-panel animate-slide-up-fade">
        <div className="relative z-10 flex items-center justify-between p-5">
          <div>
            <h2 className="text-lg font-bold" style={{ color: T.accentLight }}>
              <FolderOpen className="ml-2 inline h-5 w-5" />ادارة الاقسام
            </h2>
            <p className="mt-1 text-xs" style={{ color: T.textDim }}>{categories.length} قسم مسجل</p>
          </div>
          <button onClick={startAdd} className="admin-btn-glow flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
            style={{ background: T.accent, color: "#fff" }}>
            <Plus className="h-4 w-4" /> إضافة قسم
          </button>
        </div>
      </div>

      {/* Add / Edit form */}
      {(showAdd || editingId !== null) && (
        <div className="admin-panel animate-slide-up-fade">
          <div className="relative z-10 space-y-4 p-5">
            <h3 className="text-sm font-bold" style={{ color: T.accentLight }}>
              {editingId ? "تعديل القسم" : "إضافة قسم جديد"}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs" style={{ color: T.textMuted }}>اسم القسم</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: T.border, background: T.surfaceDeep, color: T.text }}
                  placeholder="مثال: حلويات شرقية" dir="rtl" />
              </div>
              <div>
                <label className="mb-1 block text-xs" style={{ color: T.textMuted }}>الاسم المعروض (اختياري)</label>
                <input value={form.label_ar} onChange={e => setForm({ ...form, label_ar: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: T.border, background: T.surfaceDeep, color: T.text }}
                  placeholder="يستخدم اسم القسم إذا تُرك فارغاً" dir="rtl" />
              </div>
              <div>
                <label className="mb-1 block text-xs" style={{ color: T.textMuted }}>أيقونة (اختياري)</label>
                <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: T.border, background: T.surfaceDeep, color: T.text }}
                  placeholder="star, cake, cup-soda ..." dir="ltr" />
              </div>
              <div>
                <label className="mb-1 block text-xs" style={{ color: T.textMuted }}>ترتيب العرض</label>
                <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: T.border, background: T.surfaceDeep, color: T.text }} min={0} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="admin-btn-glow flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
                style={{ background: T.accent, color: "#fff", opacity: saving ? 0.7 : 1 }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingId ? "تحديث" : "حفظ"}
              </button>
              <button onClick={cancel} className="admin-btn-glow flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all"
                style={{ borderColor: T.border, color: T.textMuted }}>
                <X className="h-4 w-4" /> إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories list */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <FolderOpen className="mb-3 h-12 w-12" style={{ color: T.textDim }} />
          <p style={{ color: T.textMuted }}>لا توجد أقسام بعد</p>
          <p className="mt-1 text-xs" style={{ color: T.textDim }}>أضف قسم جديد لبدء تنظيم منتجاتك</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, i) => {
            const count = productCounts.get(cat.id) || 0
            return (
              <div key={cat.id} className="admin-card animate-card-enter p-5"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}>
                <div className="relative z-10">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: "hsl(200 80% 55% / 0.1)" }}>
                        {cat.icon ? (
                          <span className="text-lg">{cat.icon}</span>
                        ) : (
                          <FolderOpen className="h-5 w-5" style={{ color: T.accent }} />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold" style={{ color: T.text }}>{cat.name}</h3>
                        {cat.label_ar && cat.label_ar !== cat.name && (
                          <p className="text-[11px]" style={{ color: T.textDim }}>{cat.label_ar}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-md px-2 py-0.5 text-[10px]" style={{ background: "hsl(200 80% 55% / 0.1)", color: T.accentMuted }}>
                        <GripVertical className="ml-1 inline h-3 w-3" /> ترتيب: {cat.sort_order}
                      </span>
                      <span className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px]"
                        style={{ background: count > 0 ? "hsl(140 60% 40% / 0.1)" : "hsl(0 0% 50% / 0.1)", color: count > 0 ? "hsl(140 70% 60%)" : T.textDim }}>
                        <Package className="h-3 w-3" /> {count} منتج
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(cat)} className="admin-btn-glow flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs transition-all"
                      style={{ border: `1px solid ${T.border}`, color: T.accentLight }}>
                      <Edit3 className="h-3 w-3" /> تعديل
                    </button>
                    <button onClick={() => handleDelete(cat)} className="admin-btn-glow flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs transition-all"
                      style={{ border: "1px solid hsl(0 60% 50% / 0.3)", color: "hsl(0 60% 60%)" }}>
                      <Trash2 className="h-3 w-3" /> حذف
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
