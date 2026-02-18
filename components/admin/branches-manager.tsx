"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  Plus, Search, Edit3, Trash2, Save, X, Upload, ImageIcon,
  MapPin, Phone, Clock, Building2, Loader2, Eye, EyeOff, Globe,
} from "lucide-react"

const T = {
  bg: "var(--admin-bg)", surface: "var(--admin-surface)", surfaceHover: "var(--admin-surface-hover)",
  surfaceDeep: "var(--admin-surface-deep)", border: "var(--admin-border)", borderHover: "var(--admin-border-hover)",
  accent: "var(--admin-accent)", accentLight: "var(--admin-accent-light)", accentMuted: "var(--admin-accent-muted)",
  glow: "var(--admin-glow)", text: "var(--admin-text)", textMuted: "var(--admin-text-muted)", textDim: "var(--admin-text-dim)",
}

interface Branch {
  id: number; name: string; address: string | null; phone: string | null; secondary_phone: string | null
  city: string; google_maps_url: string | null; latitude: number | null; longitude: number | null
  working_hours: string | null; image_url: string | null; is_active: boolean; sort_order: number
}

interface BranchForm {
  name: string; address: string; phone: string; secondary_phone: string; city: string
  google_maps_url: string; latitude: string; longitude: string; working_hours: string; image_url: string
  is_active: boolean
}

const emptyForm: BranchForm = {
  name: "", address: "", phone: "", secondary_phone: "", city: "",
  google_maps_url: "", latitude: "", longitude: "", working_hours: "", image_url: "",
  is_active: true,
}

const inputStyle: React.CSSProperties = {
  background: T.surfaceDeep, border: `1px solid ${T.border}`, color: T.text, borderRadius: "0.75rem",
  padding: "0.625rem 0.875rem", width: "100%", fontSize: "0.875rem", outline: "none",
}

export default function BranchesManager() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<BranchForm>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/branches")
      if (res.ok) setBranches(await res.json())
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchBranches() }, [fetchBranches])

  function startEdit(branch: Branch) {
    setEditingId(branch.id); setShowAdd(false)
    setForm({
      ...emptyForm,
      name: branch.name || "", address: branch.address || "", phone: branch.phone || "",
      secondary_phone: branch.secondary_phone || "", city: branch.city || "",
      google_maps_url: branch.google_maps_url || "",
      latitude: branch.latitude?.toString() || "", longitude: branch.longitude?.toString() || "",
      working_hours: branch.working_hours || "", image_url: branch.image_url || "",
      is_active: branch.is_active ?? true,
    })
  }

  function cancelEdit() { setEditingId(null); setShowAdd(false); setForm(emptyForm) }

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const fd = new FormData(); fd.append("file", file)
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      if (res.ok) { const d = await res.json(); setForm((f) => ({ ...f, image_url: d.url })) }
    } catch { /* silent */ }
    finally { setUploading(false) }
  }

  async function handleSave() {
    const name = form.name || ""
    const city = form.city || ""
    if (!name.trim() || !city.trim()) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = { ...emptyForm, ...form }
      if (editingId) payload.id = editingId
      if (form.latitude) payload.latitude = Number(form.latitude)
      else delete payload.latitude
      if (form.longitude) payload.longitude = Number(form.longitude)
      else delete payload.longitude

      const res = await fetch("/api/admin/branches", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) { await fetchBranches(); cancelEdit() }
      else { const d = await res.json(); alert(d.error || "خطأ") }
    } catch { alert("خطأ في الاتصال") }
    finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch("/api/admin/branches", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (res.ok) { await fetchBranches(); setDeleteConfirm(null) }
    } catch { alert("خطأ") }
  }

  async function toggleActive(branch: Branch) {
    await fetch("/api/admin/branches", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: branch.id, is_active: !branch.is_active }),
    })
    fetchBranches()
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" style={{ color: T.accent }} /></div>

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: T.text }}>إدارة الفروع</h2>
          <p className="text-sm" style={{ color: T.textDim }}>{branches.length} فرع</p>
        </div>
        <button onClick={() => { setShowAdd(true); setEditingId(null); setForm(emptyForm) }}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all hover:scale-[1.02]"
          style={{ background: T.accent, color: T.bg }}>
          <Plus className="h-4 w-4" /> إضافة فرع
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAdd || editingId) && (
        <div className="rounded-xl border p-5" style={{ borderColor: T.borderHover, background: T.surfaceHover }}>
          <h3 className="mb-4 text-base font-bold" style={{ color: T.accent }}>
            {editingId ? "تعديل الفرع" : "إضافة فرع جديد"}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Name */}
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: T.textMuted }}>اسم الفرع *</label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" style={{ color: T.textDim }} />
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  style={{ ...inputStyle, paddingRight: "2.5rem" }} placeholder="فرع طرابلس" />
              </div>
            </div>
            {/* City */}
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: T.textMuted }}>المدينة *</label>
              <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                style={inputStyle} placeholder="طرابلس" />
            </div>
            {/* Address */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold" style={{ color: T.textMuted }}>العنوان</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" style={{ color: T.textDim }} />
                <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  style={{ ...inputStyle, paddingRight: "2.5rem" }} placeholder="العنوان الكامل" />
              </div>
            </div>
            {/* Phone */}
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: T.textMuted }}>رقم الهاتف</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" style={{ color: T.textDim }} />
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  style={{ ...inputStyle, paddingRight: "2.5rem" }} placeholder="091-XXXXXXX" dir="ltr" />
              </div>
            </div>
            {/* Secondary Phone */}
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: T.textMuted }}>هاتف ثانوي</label>
              <input value={form.secondary_phone} onChange={(e) => setForm((f) => ({ ...f, secondary_phone: e.target.value }))}
                style={inputStyle} placeholder="092-XXXXXXX" dir="ltr" />
            </div>
            {/* Working Hours */}
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: T.textMuted }}>ساعات العمل</label>
              <div className="relative">
                <Clock className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" style={{ color: T.textDim }} />
                <input value={form.working_hours} onChange={(e) => setForm((f) => ({ ...f, working_hours: e.target.value }))}
                  style={{ ...inputStyle, paddingRight: "2.5rem" }} placeholder="9:00 ص - 11:00 م" />
              </div>
            </div>
            {/* Google Maps URL */}
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: T.textMuted }}>رابط خرائط Google</label>
              <div className="relative">
                <Globe className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" style={{ color: T.textDim }} />
                <input value={form.google_maps_url} onChange={(e) => setForm((f) => ({ ...f, google_maps_url: e.target.value }))}
                  style={{ ...inputStyle, paddingRight: "2.5rem" }} placeholder="https://maps.google.com/..." dir="ltr" />
              </div>
            </div>
            {/* Latitude */}
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: T.textMuted }}>خط العرض (Latitude)</label>
              <input value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                style={inputStyle} placeholder="32.9022" dir="ltr" type="number" step="any" />
            </div>
            {/* Longitude */}
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: T.textMuted }}>خط الطول (Longitude)</label>
              <input value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                style={inputStyle} placeholder="13.1800" dir="ltr" type="number" step="any" />
            </div>
          </div>

          {/* Image Upload */}
          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold" style={{ color: T.textMuted }}>صورة الفرع</label>
            <div className="flex items-center gap-3">
              {form.image_url ? (
                <div className="relative h-20 w-20 overflow-hidden rounded-xl border" style={{ borderColor: T.border }}>
                  <img src={form.image_url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                    className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5">
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed transition-colors"
                  style={{ borderColor: T.border, color: T.textDim }}>
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]) }} />
              <div className="flex-1">
                <input value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  style={inputStyle} placeholder="أو أدخل رابط الصورة..." dir="ltr" />
              </div>
            </div>
          </div>

          {/* Map Preview */}
          {form.google_maps_url && (
            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold" style={{ color: T.textMuted }}>معاينة الخريطة</label>
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: T.border }}>
                <iframe
                  src={form.google_maps_url.includes("embed") ? form.google_maps_url : `https://www.google.com/maps?q=${form.latitude || ""},${form.longitude || ""}&output=embed`}
                  width="100%" height="200" style={{ border: 0 }} allowFullScreen loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade" title="map-preview" />
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all"
              style={{ background: T.accent, color: T.bg, opacity: saving ? 0.6 : 1 }}>
              <Save className="h-4 w-4" /> {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button onClick={cancelEdit} className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm"
              style={{ borderColor: T.border, color: T.textMuted }}>
              <X className="h-4 w-4" /> إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Branches List */}
      <div className="grid gap-4 md:grid-cols-2">
        {branches.map((branch) => (
          <div key={branch.id} className="overflow-hidden rounded-xl border transition-all"
            style={{ borderColor: T.border, background: T.surface, opacity: branch.is_active ? 1 : 0.55 }}>
            {/* Image header */}
            {branch.image_url && (
              <div className="relative h-36 w-full">
                <img src={branch.image_url || "/placeholder.svg"} alt={branch.name} className="h-full w-full object-cover" />
                {!branch.is_active && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="rounded-lg bg-red-500/80 px-3 py-1 text-xs font-bold text-white">معطل</span>
                  </div>
                )}
              </div>
            )}
            <div className="p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold" style={{ color: T.text }}>{branch.name}</h3>
                  <p className="text-xs" style={{ color: T.textDim }}>{branch.city}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => toggleActive(branch)} title={branch.is_active ? "إخفاء" : "إظهار"}
                    className="rounded-lg p-1.5 transition-colors hover:bg-white/5">
                    {branch.is_active ? <Eye className="h-4 w-4" style={{ color: "#22c55e" }} /> : <EyeOff className="h-4 w-4" style={{ color: T.textDim }} />}
                  </button>
                  <button onClick={() => startEdit(branch)} className="rounded-lg p-1.5 transition-colors hover:bg-white/5">
                    <Edit3 className="h-4 w-4" style={{ color: T.accentLight }} />
                  </button>
                  {deleteConfirm === branch.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(branch.id)} className="rounded-lg bg-red-500/20 px-2 py-1 text-xs text-red-400">حذف</button>
                      <button onClick={() => setDeleteConfirm(null)} className="rounded-lg px-2 py-1 text-xs" style={{ color: T.textDim }}>لا</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(branch.id)} className="rounded-lg p-1.5 transition-colors hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4 text-red-400/60" />
                    </button>
                  )}
                </div>
              </div>
              {branch.address && (
                <p className="mb-1 flex items-center gap-1.5 text-xs" style={{ color: T.textMuted }}>
                  <MapPin className="h-3 w-3 shrink-0" /> {branch.address}
                </p>
              )}
              {branch.phone && (
                <p className="mb-1 flex items-center gap-1.5 text-xs" style={{ color: T.textMuted }} dir="ltr">
                  <Phone className="h-3 w-3 shrink-0" /> {branch.phone}
                  {branch.secondary_phone && ` / ${branch.secondary_phone}`}
                </p>
              )}
              {branch.working_hours && (
                <p className="mb-1 flex items-center gap-1.5 text-xs" style={{ color: T.textMuted }}>
                  <Clock className="h-3 w-3 shrink-0" /> {branch.working_hours}
                </p>
              )}
              {branch.google_maps_url && (
                <a href={branch.google_maps_url} target="_blank" rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={{ background: `color-mix(in srgb, ${T.accent} 15%, transparent)`, color: T.accent }}>
                  <MapPin className="h-3 w-3" /> عرض على الخريطة
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {branches.length === 0 && !loading && (
        <div className="py-12 text-center text-sm" style={{ color: T.textDim }}>لا يوجد فروع</div>
      )}
    </div>
  )
}
