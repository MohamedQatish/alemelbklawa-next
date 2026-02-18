"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  Plus, Search, Edit3, Trash2, Save, X, Upload, ImageIcon,
  CalendarDays, Eye, EyeOff, Star, Loader2, ChevronDown,
} from "lucide-react"

/* ===== Theme (mirrors admin dashboard) ===== */
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
}

interface EventItem {
  id: number
  name: string
  description: string | null
  price: number
  category: string
  image_url: string | null
  is_available: boolean
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface EventForm {
  name: string
  description: string
  price: string
  category: string
  image_url: string
  is_available: boolean
  is_featured: boolean
  sort_order: string
}

const CATEGORIES = [
  { id: "حلويات المناسبات", label: "حلويات المناسبات" },
  { id: "حلويات شرقية للمناسبات", label: "حلويات شرقية" },
  { id: "عصائر المناسبات", label: "عصائر المناسبات" },
]

const emptyForm: EventForm = {
  name: "", description: "", price: "", category: CATEGORIES[0].id,
  image_url: "", is_available: true, is_featured: false, sort_order: "0",
}

export default function EventsManager() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQ, setSearchQ] = useState("")
  const [filterCat, setFilterCat] = useState("all")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<EventForm>(emptyForm)
  const [uploading, setUploading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [customCatMode, setCustomCatMode] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  /* Derive all categories from DB + predefined */
  const allCategories = (() => {
    const predefined = CATEGORIES.map((c) => c.id)
    const fromDB = events.map((e) => e.category).filter((c) => !predefined.includes(c))
    const unique = [...new Set(fromDB)]
    return [...CATEGORIES, ...unique.map((c) => ({ id: c, label: c }))]
  })()

  /* Fetch events */
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/events")
      if (res.ok) setEvents(await res.json())
    } catch { /* empty */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  /* Save (create or update) */
  async function handleSave() {
    if (!form.name.trim() || !form.price || !form.category.trim()) return
    setSaving(true)
    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category.trim(),
        image_url: form.image_url.trim(),
        is_available: form.is_available,
        is_featured: form.is_featured,
        sort_order: Number(form.sort_order) || 0,
      }
      const res = await fetch("/api/admin/events", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        await fetchEvents()
        setEditingId(null)
        setShowAdd(false)
        setForm(emptyForm)
        setCustomCatMode(false)
      }
    } catch { /* empty */ } finally { setSaving(false) }
  }

  /* Delete */
  async function handleDelete(id: number) {
    try {
      const res = await fetch("/api/admin/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        await fetchEvents()
        setDeleteConfirm(null)
      }
    } catch { /* empty */ }
  }

  /* Toggle availability */
  async function toggleAvail(ev: EventItem) {
    await fetch("/api/admin/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ev.id, is_available: !ev.is_available }),
    })
    await fetchEvents()
  }

  /* Image upload */
  async function handleImageUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      if (res.ok) {
        const data = await res.json()
        setForm((f) => ({ ...f, image_url: data.url }))
      }
    } catch { /* empty */ } finally { setUploading(false) }
  }

  function startEdit(ev: EventItem) {
    setEditingId(ev.id)
    setShowAdd(true)
    setCustomCatMode(false)
    setForm({
      name: ev.name,
      description: ev.description || "",
      price: String(ev.price),
      category: ev.category,
      image_url: ev.image_url || "",
      is_available: ev.is_available,
      is_featured: ev.is_featured,
      sort_order: String(ev.sort_order),
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setShowAdd(false)
    setForm(emptyForm)
    setCustomCatMode(false)
  }

  /* Filtering */
  const filtered = events.filter((ev) => {
    const q = searchQ.toLowerCase()
    const matchSearch = !q || ev.name.toLowerCase().includes(q) || (ev.description || "").toLowerCase().includes(q)
    const matchCat = filterCat === "all" || ev.category === filterCat
    return matchSearch && matchCat
  })

  const grouped = allCategories.map((cat) => ({
    ...cat,
    events: filtered.filter((ev) => ev.category === cat.id),
  })).filter((g) => g.events.length > 0)

  /* Shared styles */
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: "10px",
    border: `1px solid ${T.border}`, background: T.surfaceDeep,
    color: T.text, fontSize: "14px", outline: "none",
    transition: "border-color 0.2s",
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: T.accent }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: T.text }}>
            <CalendarDays className="ml-2 inline h-5 w-5" style={{ color: T.accent }} />
            ادارة المناسبات
          </h2>
          <p className="mt-1 text-sm" style={{ color: T.textDim }}>{events.length} مناسبة</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditingId(null); setForm(emptyForm); setCustomCatMode(false) }}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02]"
          style={{ background: T.accent, color: T.bg }}
        >
          <Plus className="h-4 w-4" /> اضافة مناسبة
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAdd && (
        <div className="animate-slide-up-fade rounded-2xl border p-6" style={{ background: T.surface, borderColor: T.border }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold" style={{ color: T.text }}>
              {editingId ? "تعديل المناسبة" : "اضافة مناسبة جديدة"}
            </h3>
            <button onClick={cancelEdit}><X className="h-5 w-5" style={{ color: T.textDim }} /></button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold" style={{ color: T.textMuted }}>الاسم *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="اسم المناسبة..." style={inputStyle} />
            </div>

            {/* Price */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold" style={{ color: T.textMuted }}>السعر (د.ل) *</label>
              <input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/[^0-9.]/g, "") }))} placeholder="0.00" style={inputStyle} dir="ltr" />
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold" style={{ color: T.textMuted }}>التصنيف *</label>
              {customCatMode ? (
                <div className="flex gap-2">
                  <input
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    placeholder="اسم التصنيف الجديد..."
                    style={inputStyle}
                    autoFocus
                  />
                  <button onClick={() => setCustomCatMode(false)} className="shrink-0 rounded-lg border px-3 text-xs" style={{ borderColor: T.border, color: T.textDim }}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} style={{ ...inputStyle, appearance: "none", paddingLeft: "32px" }}>
                      {allCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: T.textDim }} />
                  </div>
                  <button
                    onClick={() => { setCustomCatMode(true); setForm((f) => ({ ...f, category: "" })) }}
                    className="shrink-0 rounded-lg border px-3 text-xs transition-colors hover:bg-amber-500/10"
                    style={{ borderColor: T.border, color: T.accent }}
                    title="تصنيف جديد"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Sort Order */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold" style={{ color: T.textMuted }}>ترتيب العرض</label>
              <input value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value.replace(/[^0-9]/g, "") }))} placeholder="0" style={inputStyle} dir="ltr" />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold" style={{ color: T.textMuted }}>الوصف</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="وصف المناسبة..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            {/* Image */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold" style={{ color: T.textMuted }}>صورة المناسبة</label>
              <div className="flex gap-3">
                <input value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="رابط الصورة أو ارفع صورة..." style={{ ...inputStyle, flex: 1 }} dir="ltr" />
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]) }} />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors"
                  style={{ borderColor: T.border, color: T.accent }}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  رفع
                </button>
              </div>
              {form.image_url && (
                <div className="mt-3 flex items-center gap-3">
                  <img src={form.image_url || "/placeholder.svg"} alt="preview" className="h-20 w-20 rounded-lg border object-cover" style={{ borderColor: T.border }} crossOrigin="anonymous" />
                  <button onClick={() => setForm((f) => ({ ...f, image_url: "" }))} className="text-xs" style={{ color: T.textDim }}>
                    <X className="mr-1 inline h-3 w-3" />ازالة
                  </button>
                </div>
              )}
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-4 sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: T.textMuted }}>
                <input type="checkbox" checked={form.is_available} onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))} className="accent-amber-500" />
                متاح
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: T.textMuted }}>
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} className="accent-amber-500" />
                مميز
              </label>
            </div>
          </div>

          {/* Save / Cancel */}
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={cancelEdit} className="rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors" style={{ borderColor: T.border, color: T.textMuted }}>الغاء</button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.price || !form.category.trim()}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] disabled:opacity-50"
              style={{ background: T.accent, color: T.bg }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingId ? "حفظ التعديلات" : "اضافة"}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1" style={{ minWidth: 200 }}>
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: T.textDim }} />
          <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="بحث في المناسبات..." className="w-full rounded-xl border py-2.5 pr-10 pl-4 text-sm outline-none" style={{ background: T.surfaceDeep, borderColor: T.border, color: T.text }} />
        </div>
        <div className="relative">
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded-xl border py-2.5 pr-4 pl-8 text-sm outline-none" style={{ background: T.surfaceDeep, borderColor: T.border, color: T.text, appearance: "none" }}>
            <option value="all">كل التصنيفات</option>
            {allCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: T.textDim }} />
        </div>
      </div>

      {/* Events List */}
      {grouped.length === 0 ? (
        <div className="py-16 text-center">
          <CalendarDays className="mx-auto mb-3 h-10 w-10" style={{ color: T.textDim }} />
          <p className="text-sm" style={{ color: T.textDim }}>لا توجد مناسبات</p>
        </div>
      ) : (
        grouped.map((group) => (
          <div key={group.id}>
            <h3 className="mb-3 text-sm font-bold" style={{ color: T.accentLight }}>{group.label} ({group.events.length})</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.events.map((ev) => (
                <div
                  key={ev.id}
                  className="group relative overflow-hidden rounded-xl border transition-all duration-200 hover:border-amber-500/30"
                  style={{ background: T.surface, borderColor: T.border, opacity: ev.is_available ? 1 : 0.55 }}
                >
                  {/* Image */}
                  {ev.image_url ? (
                    <div className="relative h-36 w-full overflow-hidden">
                      <img src={ev.image_url || "/placeholder.svg"} alt={ev.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" crossOrigin="anonymous" />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }} />
                      {ev.is_featured && (
                        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: T.accent, color: T.bg }}>
                          <Star className="h-2.5 w-2.5" /> مميز
                        </span>
                      )}
                      {!ev.is_available && (
                        <span className="absolute left-2 top-2 rounded-full bg-red-500/80 px-2 py-0.5 text-[10px] font-bold text-white">غير متاح</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-24 items-center justify-center" style={{ background: T.surfaceDeep }}>
                      <ImageIcon className="h-8 w-8" style={{ color: T.textDim }} />
                      {ev.is_featured && (
                        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: T.accent, color: T.bg }}>
                          <Star className="h-2.5 w-2.5" /> مميز
                        </span>
                      )}
                    </div>
                  )}

                  {/* Info */}
                  <div className="p-4">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold leading-tight" style={{ color: T.text }}>{ev.name}</h4>
                      <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: `${T.accent}20`, color: T.accent }}>{ev.price} د.ل</span>
                    </div>
                    {ev.description && (
                      <p className="mb-3 line-clamp-2 text-xs" style={{ color: T.textDim }}>{ev.description}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 border-t pt-3" style={{ borderColor: T.border }}>
                      <button onClick={() => startEdit(ev)} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-amber-500/10" style={{ color: T.accent }}>
                        <Edit3 className="h-3 w-3" /> تعديل
                      </button>
                      <button onClick={() => toggleAvail(ev)} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-amber-500/10" style={{ color: T.textMuted }}>
                        {ev.is_available ? <><EyeOff className="h-3 w-3" /> اخفاء</> : <><Eye className="h-3 w-3" /> اظهار</>}
                      </button>
                      {deleteConfirm === ev.id ? (
                        <div className="mr-auto flex items-center gap-1">
                          <button onClick={() => handleDelete(ev.id)} className="rounded-lg bg-red-500/20 px-2.5 py-1.5 text-[11px] font-bold text-red-400 transition-colors hover:bg-red-500/30">تأكيد</button>
                          <button onClick={() => setDeleteConfirm(null)} className="rounded-lg px-2 py-1.5 text-[11px]" style={{ color: T.textDim }}>الغاء</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(ev.id)} className="mr-auto flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-red-400/70 transition-colors hover:bg-red-500/10 hover:text-red-400">
                          <Trash2 className="h-3 w-3" /> حذف
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
