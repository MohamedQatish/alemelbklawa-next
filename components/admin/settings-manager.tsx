"use client"

import { useState, useEffect, useCallback } from "react"
import { Save, Loader2, Globe, Phone, Image as ImageIcon, FileText, RefreshCw } from "lucide-react"

interface SiteSetting {
  id: number
  setting_key: string
  setting_value: string
  setting_type: string
  setting_group: string
  label: string
  label_ar: string
  sort_order: number
}

interface SiteImage {
  id: number
  image_key: string
  image_url: string
  alt_text: string
  sort_order: number
  is_active: boolean
}

const GROUP_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  general: { label: "عام", icon: <Globe className="h-4 w-4" /> },
  hero: { label: "الصفحة الرئيسية", icon: <FileText className="h-4 w-4" /> },
  contact: { label: "معلومات التواصل", icon: <Phone className="h-4 w-4" /> },
  social: { label: "وسائل التواصل", icon: <Globe className="h-4 w-4" /> },
  about: { label: "من نحن", icon: <FileText className="h-4 w-4" /> },
}

export default function SettingsManager() {
  const [settings, setSettings] = useState<SiteSetting[]>([])
  const [images, setImages] = useState<SiteImage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})
  const [activeGroup, setActiveGroup] = useState("general")
  const [saveSuccess, setSaveSuccess] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const [settingsRes, imagesRes] = await Promise.all([
        fetch("/api/admin/settings"),
        fetch("/api/admin/site-images"),
      ])
      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings(data)
        const vals: Record<string, string> = {}
        data.forEach((s: SiteSetting) => { vals[s.setting_key] = s.setting_value })
        setEditedValues(vals)
      }
      if (imagesRes.ok) {
        setImages(await imagesRes.json())
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: editedValues }),
      })
      if (res.ok) {
        const updated = await res.json()
        setSettings(updated)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err) {
      console.error("Failed to save:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpdate = async (id: number, image_url: string) => {
    try {
      const res = await fetch("/api/admin/site-images", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, image_url }),
      })
      if (res.ok) {
        setImages((prev) => prev.map((img) => (img.id === id ? { ...img, image_url } : img)))
      }
    } catch (err) {
      console.error("Failed to update image:", err)
    }
  }

  const groups = [...new Set(settings.map((s) => s.setting_group))]
  const groupedSettings = settings.filter((s) => s.setting_group === activeGroup)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--admin-accent)" }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--admin-text)" }}>
            اعدادات الموقع
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--admin-text-muted)" }}>
            تعديل محتوى الموقع والإعدادات العامة
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSettings}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)", color: "var(--admin-text-muted)" }}
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-all"
            style={{
              background: saveSuccess ? "hsl(142 70% 45%)" : "var(--admin-accent)",
              color: "var(--admin-bg)",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saveSuccess ? "تم الحفظ" : saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </div>

      {/* Group Tabs */}
      <div className="flex flex-wrap gap-2">
        {groups.map((group) => {
          const meta = GROUP_LABELS[group] || { label: group, icon: <Globe className="h-4 w-4" /> }
          return (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
              style={{
                background: activeGroup === group ? "var(--admin-accent)" : "var(--admin-surface)",
                color: activeGroup === group ? "var(--admin-bg)" : "var(--admin-text-muted)",
                border: `1px solid ${activeGroup === group ? "var(--admin-accent)" : "var(--admin-border)"}`,
              }}
            >
              {meta.icon}
              {meta.label}
            </button>
          )
        })}
        <button
          onClick={() => setActiveGroup("images")}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
          style={{
            background: activeGroup === "images" ? "var(--admin-accent)" : "var(--admin-surface)",
            color: activeGroup === "images" ? "var(--admin-bg)" : "var(--admin-text-muted)",
            border: `1px solid ${activeGroup === "images" ? "var(--admin-accent)" : "var(--admin-border)"}`,
          }}
        >
          <ImageIcon className="h-4 w-4" />
          صور الموقع
        </button>
      </div>

      {/* Settings Fields */}
      {activeGroup !== "images" ? (
        <div className="admin-panel flex flex-col gap-5 p-6">
          {groupedSettings.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "var(--admin-text-muted)" }}>
              لا توجد إعدادات في هذا القسم
            </p>
          ) : (
            groupedSettings.map((setting) => (
              <div key={setting.id} className="flex flex-col gap-2">
                <label className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
                  {setting.label_ar || setting.label || setting.setting_key}
                </label>
                {setting.setting_type === "textarea" ? (
                  <textarea
                    value={editedValues[setting.setting_key] ?? setting.setting_value}
                    onChange={(e) =>
                      setEditedValues((prev) => ({ ...prev, [setting.setting_key]: e.target.value }))
                    }
                    rows={4}
                    className="w-full rounded-lg px-4 py-3 text-sm transition-colors focus:outline-none"
                    style={{
                      background: "var(--admin-surface-deep)",
                      border: "1px solid var(--admin-border)",
                      color: "var(--admin-text)",
                    }}
                    dir="rtl"
                  />
                ) : (
                  <input
                    type="text"
                    value={editedValues[setting.setting_key] ?? setting.setting_value}
                    onChange={(e) =>
                      setEditedValues((prev) => ({ ...prev, [setting.setting_key]: e.target.value }))
                    }
                    className="w-full rounded-lg px-4 py-3 text-sm transition-colors focus:outline-none"
                    style={{
                      background: "var(--admin-surface-deep)",
                      border: "1px solid var(--admin-border)",
                      color: "var(--admin-text)",
                    }}
                    dir={setting.setting_key.includes("url") || setting.setting_key.includes("phone") || setting.setting_key.includes("email") ? "ltr" : "rtl"}
                  />
                )}
                <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                  {setting.setting_key}
                </span>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Images Tab */
        <div className="admin-panel flex flex-col gap-5 p-6">
          <h3 className="text-lg font-bold" style={{ color: "var(--admin-text)" }}>
            صور الموقع
          </h3>
          {images.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "var(--admin-text-muted)" }}>
              لا توجد صور مسجلة
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="flex flex-col gap-3 rounded-lg p-4"
                  style={{ background: "var(--admin-surface-deep)", border: "1px solid var(--admin-border)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
                      {img.alt_text || img.image_key}
                    </span>
                    <span className="rounded-md px-2 py-0.5 text-xs" style={{ background: "var(--admin-surface)", color: "var(--admin-text-muted)" }}>
                      {img.image_key}
                    </span>
                  </div>
                  {img.image_url && img.image_url !== "/placeholder.svg" && (
                    <div className="relative h-32 w-full overflow-hidden rounded-lg">
                      <img
                        src={img.image_url}
                        alt={img.alt_text}
                        className="h-full w-full object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                  )}
                  <input
                    type="text"
                    value={img.image_url}
                    onChange={(e) => {
                      setImages((prev) =>
                        prev.map((i) => (i.id === img.id ? { ...i, image_url: e.target.value } : i))
                      )
                    }}
                    onBlur={() => handleImageUpdate(img.id, img.image_url)}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{
                      background: "var(--admin-surface)",
                      border: "1px solid var(--admin-border)",
                      color: "var(--admin-text)",
                    }}
                    dir="ltr"
                    placeholder="رابط الصورة"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
