"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Plus, Search, Edit3, Trash2, Save, X, Shield, ShieldCheck, ShieldAlert,
  Eye, UserPlus, Loader2, Lock, User, CheckSquare, Square, Power,
} from "lucide-react"

const T = {
  bg: "var(--admin-bg)", surface: "var(--admin-surface)", surfaceHover: "var(--admin-surface-hover)",
  surfaceDeep: "var(--admin-surface-deep)", border: "var(--admin-border)", borderHover: "var(--admin-border-hover)",
  accent: "var(--admin-accent)", accentLight: "var(--admin-accent-light)", accentMuted: "var(--admin-accent-muted)",
  glow: "var(--admin-glow)", text: "var(--admin-text)", textMuted: "var(--admin-text-muted)", textDim: "var(--admin-text-dim)",
}

interface AdminUser {
  id: number; username: string; display_name: string | null; role: string
  permissions: string[]; is_active: boolean; last_login: string | null; created_at: string
}

interface UserForm {
  username: string; password: string; display_name: string; role: string; permissions: string[]
}

const ROLES = [
  { id: "super_admin", label: "مدير عام", icon: ShieldAlert },
  { id: "admin", label: "مدير", icon: ShieldCheck },
  { id: "editor", label: "محرر", icon: Shield },
  { id: "viewer", label: "مشاهد", icon: Eye },
]

const ALL_PERMISSIONS = [
  { id: "view_dashboard", label: "عرض لوحة التحكم" },
  { id: "manage_products", label: "إدارة المنتجات" },
  { id: "manage_events", label: "إدارة المناسبات" },
  { id: "manage_gallery", label: "إدارة المعرض" },
  { id: "manage_branches", label: "إدارة الفروع" },
  { id: "manage_orders", label: "إدارة الطلبات" },
  { id: "manage_users", label: "إدارة المستخدمين" },
  { id: "edit_content", label: "تعديل المحتوى" },
  { id: "full_access", label: "صلاحيات كاملة" },
]

const emptyForm: UserForm = { username: "", password: "", display_name: "", role: "editor", permissions: ["view_dashboard"] }

const inputStyle: React.CSSProperties = {
  background: T.surfaceDeep, border: `1px solid ${T.border}`, color: T.text, borderRadius: "0.75rem", padding: "0.625rem 0.875rem", width: "100%", fontSize: "0.875rem", outline: "none",
}

export default function UsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<UserForm>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: number; role: string } | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users")
      if (res.ok) setUsers(await res.json())
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/session")
      if (res.ok) {
        const data = await res.json()
        setCurrentUser({ id: data.user.id, role: data.user.role })
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchUsers(); fetchSession() }, [fetchUsers, fetchSession])

  const filtered = users.filter((u) =>
    u.username.includes(search) || (u.display_name || "").includes(search) || u.role.includes(search)
  )

  function startEdit(user: AdminUser) {
    setEditingId(user.id); setShowAdd(false)
    setForm({ username: user.username, password: "", display_name: user.display_name || "", role: user.role, permissions: user.permissions || [] })
  }

  function cancelEdit() { setEditingId(null); setShowAdd(false); setForm(emptyForm) }

  function togglePermission(permId: string) {
    setForm((f) => {
      const has = f.permissions.includes(permId)
      if (permId === "full_access") return { ...f, permissions: has ? f.permissions.filter((p) => p !== permId) : [...ALL_PERMISSIONS.map((p) => p.id)] }
      const next = has ? f.permissions.filter((p) => p !== permId) : [...f.permissions, permId]
      return { ...f, permissions: next }
    })
  }

  async function handleSave() {
    if (!form.username.trim()) return
    if (!editingId && !form.password) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        username: form.username, display_name: form.display_name, role: form.role, permissions: form.permissions,
      }
      if (editingId) payload.id = editingId
      if (form.password) payload.password = form.password

      const res = await fetch("/api/admin/users", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) { await fetchUsers(); cancelEdit() }
      else { const data = await res.json(); alert(data.error || "خطأ") }
    } catch { alert("خطأ في الاتصال") }
    finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (res.ok) { await fetchUsers(); setDeleteConfirm(null) }
      else { const d = await res.json(); alert(d.error) }
    } catch { alert("خطأ") }
  }

  async function toggleActive(user: AdminUser) {
    await fetch("/api/admin/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, is_active: !user.is_active }),
    })
    fetchUsers()
  }

  const roleIcon = (role: string) => {
    const R = ROLES.find((r) => r.id === role)
    return R ? <R.icon className="h-4 w-4" /> : <Shield className="h-4 w-4" />
  }

  const roleLabel = (role: string) => ROLES.find((r) => r.id === role)?.label || role

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" style={{ color: T.accent }} /></div>

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: T.text }}>إدارة المستخدمين</h2>
          <p className="text-sm" style={{ color: T.textDim }}>{users.length} مستخدم</p>
        </div>
        <button onClick={() => { setShowAdd(true); setEditingId(null); setForm(emptyForm) }}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all hover:scale-[1.02]"
          style={{ background: T.accent, color: T.bg }}>
          <UserPlus className="h-4 w-4" /> إضافة مستخدم
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" style={{ color: T.textDim }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..."
          className="w-full rounded-xl border py-2.5 pr-10 pl-4 text-sm outline-none"
          style={{ borderColor: T.border, background: T.surface, color: T.text }} />
      </div>

      {/* Add/Edit Form */}
      {(showAdd || editingId) && (
        <div className="rounded-xl border p-5" style={{ borderColor: T.borderHover, background: T.surfaceHover }}>
          <h3 className="mb-4 text-base font-bold" style={{ color: T.accent }}>
            {editingId ? "تعديل المستخدم" : "إضافة مستخدم جديد"}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: T.textMuted }}>اسم المستخدم *</label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" style={{ color: T.textDim }} />
                <input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  style={{ ...inputStyle, paddingRight: "2.5rem" }} placeholder="username" dir="ltr" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: T.textMuted }}>
                {editingId ? "كلمة المرور الجديدة (اتركها فارغة للإبقاء)" : "كلمة المرور *"}
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" style={{ color: T.textDim }} />
                <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  style={{ ...inputStyle, paddingRight: "2.5rem" }} placeholder="******" dir="ltr" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: T.textMuted }}>الاسم الظاهر</label>
              <input value={form.display_name} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                style={inputStyle} placeholder="الاسم الكامل" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: T.textMuted }}>الدور</label>
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                style={{ ...inputStyle, appearance: "none" as const }}>
                {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
          </div>

          {/* Permissions Grid */}
          <div className="mt-4">
            <label className="mb-2 block text-xs font-semibold" style={{ color: T.textMuted }}>الصلاحيات</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ALL_PERMISSIONS.map((perm) => {
                const checked = form.permissions.includes(perm.id)
                return (
                  <button key={perm.id} onClick={() => togglePermission(perm.id)}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all"
                    style={{
                      borderColor: checked ? T.accent : T.border,
                      background: checked ? `color-mix(in srgb, ${T.accent} 15%, transparent)` : "transparent",
                      color: checked ? T.accent : T.textDim,
                    }}>
                    {checked ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                    {perm.label}
                  </button>
                )
              })}
            </div>
          </div>

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

      {/* Users List */}
      <div className="flex flex-col gap-3">
        {filtered.map((user) => (
          <div key={user.id} className="group flex items-center gap-4 rounded-xl border p-4 transition-all"
            style={{ borderColor: T.border, background: T.surface, opacity: user.is_active ? 1 : 0.55 }}>
            {/* Avatar */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{ background: `color-mix(in srgb, ${T.accent} 20%, transparent)`, color: T.accent }}>
              {roleIcon(user.role)}
            </div>
            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold" style={{ color: T.text }}>{user.display_name || user.username}</span>
                <span className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: `color-mix(in srgb, ${T.accent} 15%, transparent)`, color: T.accent }}>
                  {roleLabel(user.role)}
                </span>
                {!user.is_active && <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-[10px] text-red-400">معطل</span>}
              </div>
              <p className="text-xs" style={{ color: T.textDim }} dir="ltr">@{user.username}</p>
              {user.last_login && (
                <p className="mt-0.5 text-[10px]" style={{ color: T.textDim }}>
                  آخر دخول: {new Date(user.last_login).toLocaleDateString("ar-LY")}
                </p>
              )}
            </div>
            {/* Permissions tags */}
            <div className="hidden flex-wrap gap-1 lg:flex">
              {(user.permissions || []).slice(0, 3).map((p) => (
                <span key={p} className="rounded-md px-1.5 py-0.5 text-[10px]" style={{ background: T.surfaceDeep, color: T.textDim }}>
                  {ALL_PERMISSIONS.find((ap) => ap.id === p)?.label || p}
                </span>
              ))}
              {(user.permissions || []).length > 3 && (
                <span className="text-[10px]" style={{ color: T.textDim }}>+{user.permissions.length - 3}</span>
              )}
            </div>
            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1.5">
              {currentUser && currentUser.id !== user.id && (
                <button onClick={() => toggleActive(user)} title={user.is_active ? "تعطيل" : "تفعيل"}
                  className="rounded-lg p-2 transition-colors hover:bg-white/5">
                  <Power className="h-4 w-4" style={{ color: user.is_active ? "#22c55e" : T.textDim }} />
                </button>
              )}
              <button onClick={() => startEdit(user)} className="rounded-lg p-2 transition-colors hover:bg-white/5">
                <Edit3 className="h-4 w-4" style={{ color: T.accentLight }} />
              </button>
              {currentUser && currentUser.id !== user.id && (
                deleteConfirm === user.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => handleDelete(user.id)} className="rounded-lg bg-red-500/20 px-2 py-1 text-xs text-red-400">حذف</button>
                    <button onClick={() => setDeleteConfirm(null)} className="rounded-lg px-2 py-1 text-xs" style={{ color: T.textDim }}>إلغاء</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(user.id)} className="rounded-lg p-2 transition-colors hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4 text-red-400/60" />
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="py-12 text-center text-sm" style={{ color: T.textDim }}>لا يوجد مستخدمين</div>
      )}
    </div>
  )
}
