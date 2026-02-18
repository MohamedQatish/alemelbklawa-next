"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Save,
  X,
  Upload,
  ImageIcon,
  Package,
  Eye,
  EyeOff,
  Star,
  Loader2,
  ChevronDown,
  GripVertical,
} from "lucide-react";

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
};

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
  category_id: number | null;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  category: string;
  category_id: number | null;
  image_url: string;
  is_available: boolean;
  is_featured: boolean;
  sort_order: string;
  option_group_ids: number[];
}

interface DBCategory {
  id: number;
  name: string;
  label_ar: string;
  icon: string | null;
  sort_order: number;
}
interface DBOptionGroup {
  id: number;
  name: string;
  label_ar?: string;
  is_required: boolean;
  selection_type: "single" | "multiple";
  min_select: number;
  max_select: number;
  sort_order: number;
  options: {
    id: number;
    name: string;
    price: number;
    replace_base_price: boolean;
    sort_order: number;
  }[];
}

const FALLBACK_CATS = [
  { id: "حلويات ليبية", label: "حلويات ليبية" },
  { id: "حلويات شرقية", label: "حلويات شرقية" },
  { id: "عصائر طبيعية", label: "عصائر طبيعية" },
];

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  category: FALLBACK_CATS[0].id,
  category_id: null,
  image_url: "",
  is_available: true,
  is_featured: false,
  sort_order: "0",
  option_group_ids: [],
};

export default function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [customCatMode, setCustomCatMode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dbCategories, setDbCategories] = useState<DBCategory[]>([]);
  const [optionGroups, setOptionGroups] = useState<DBOptionGroup[]>([]);

  /* Derive all unique categories from DB categories + existing products + fallback */
  const allCategories = (() => {
    // Start with DB categories - use name (not label_ar) as ID since products.category stores name
    const cats: { id: string; label: string; dbId?: number }[] =
      dbCategories.map((c) => ({
        id: c.name,
        label: c.label_ar || c.name,
        dbId: c.id,
      }));
    const knownIds = cats.map((c) => c.id);
    // Add fallback categories not already in DB
    for (const fc of FALLBACK_CATS) {
      if (!knownIds.includes(fc.id)) {
        cats.push(fc);
        knownIds.push(fc.id);
      }
    }
    // Add any product categories not yet known
    for (const p of products) {
      if (p.category && !knownIds.includes(p.category)) {
        cats.push({ id: p.category, label: p.category });
        knownIds.push(p.category);
      }
    }
    return cats;
  })();

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) setProducts(await res.json());
    } catch (e) {
      console.error("Fetch products error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMeta = useCallback(async () => {
    try {
      const [catRes, optRes] = await Promise.all([
        fetch("/api/admin/categories"),
        fetch("/api/admin/option-groups"),
      ]);
      if (catRes.ok) setDbCategories(await catRes.json());
      if (optRes.ok) setOptionGroups(await optRes.json());
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchMeta();
  }, [fetchProducts, fetchMeta]);

  /* === Image upload === */
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setForm((f) => ({ ...f, image_url: data.url }));
      } else {
        alert(data.error || "خطأ في رفع الصورة");
      }
    } catch {
      alert("خطأ في رفع الصورة");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  /* === Save (create or update) === */
  async function handleSave() {
    if (!form.name.trim() || !form.price || !form.category) {
      alert("الاسم والسعر والتصنيف مطلوبة");
      return;
    }
    setSaving(true);
    try {
      // Resolve category_id from selected category label
      const matchedCat = allCategories.find((c) => c.id === form.category);
      const catId =
        form.category_id ||
        (matchedCat && "dbId" in matchedCat
          ? (matchedCat as { dbId?: number }).dbId
          : null) ||
        null;

      const payload = {
        ...(editingId ? { id: editingId } : {}),
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        category_id: catId,
        image_url: form.image_url || null,
        is_available: form.is_available,
        is_featured: form.is_featured,
        sort_order: Number(form.sort_order) || 0,
        option_group_ids: form.option_group_ids,
      };
      const res = await fetch("/api/admin/products", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchProducts();
        setEditingId(null);
        setShowAdd(false);
        setForm(emptyForm);
        setCustomCatMode(false);
      } else {
        const data = await res.json();
        alert(data.error || "خطأ");
      }
    } catch {
      alert("خطأ في الحفظ");
    } finally {
      setSaving(false);
    }
  }

  /* === Delete === */
  async function handleDelete(id: number) {
    try {
      const product = products.find((p) => p.id === id);
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        if (product?.image_url) {
          fetch("/api/admin/upload", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: product.image_url }),
          }).catch(() => {});
        }
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setDeleteConfirm(null);
      }
    } catch {
      alert("خطأ في الحذف");
    }
  }

  /* === Toggle availability === */
  async function toggleAvailability(product: Product) {
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          is_available: !product.is_available,
        }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, is_available: !p.is_available } : p,
          ),
        );
      }
    } catch {
      alert("خطأ");
    }
  }

  /* === Edit setup === */
  /* === Edit setup === */
  async function startEdit(product: Product) {
    setEditingId(product.id);
    setShowAdd(true);

    // Fetch assigned option groups for this product using the new system
    let assignedGroupIds: number[] = [];
    try {
      // استخدام API الجديد مع product_id
      const res = await fetch(
        `/api/admin/option-groups?product_id=${product.id}`,
      );
      if (res.ok) {
        const groups = await res.json();
        assignedGroupIds = groups.map((g: any) => g.id);
        console.log("Fetched assigned groups:", assignedGroupIds); // للتصحيح
      } else {
        // Fallback to old API if needed
        console.warn("Failed to fetch from new API, trying old one");
        const oldRes = await fetch(
          `/api/products/options?product_id=${product.id}`,
        );
        if (oldRes.ok) {
          const groups = await oldRes.json();
          assignedGroupIds = groups.map((g: any) => g.id);
        }
      }
    } catch (error) {
      console.error("Error fetching assigned option groups:", error);
    }

    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      category: product.category,
      category_id: product.category_id || null,
      image_url: product.image_url || "",
      is_available: product.is_available,
      is_featured: product.is_featured,
      sort_order: String(product.sort_order),
      option_group_ids: assignedGroupIds,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setShowAdd(false);
    setForm(emptyForm);
    setCustomCatMode(false);
  }

  /* === Filtering === */
  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || p.name.toLowerCase().includes(q) || p.category.includes(q);
    const matchCat = catFilter === "all" || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const grouped = allCategories
    .map((cat) => ({
      ...cat,
      products: filtered.filter((p) => p.category === cat.id),
    }))
    .filter((g) => g.products.length > 0);

  const inputStyle: React.CSSProperties = {
    background: T.surfaceDeep,
    border: `1px solid ${T.border}`,
    color: T.text,
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    transition: "border-color 0.2s",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: T.accent }} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6" dir="rtl">
      {/* === Header bar === */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: T.accentLight }}>
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5" /> إدارة المنتجات
            </span>
          </h2>
          <p className="mt-1 text-sm" style={{ color: T.textDim }}>
            {products.length} منتج
          </p>
        </div>
        <button
          onClick={() => {
            setShowAdd(true);
            setEditingId(null);
            setForm(emptyForm);
          }}
          className="admin-btn-glow flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-105"
          style={{
            borderColor: T.accent,
            color: T.accentLight,
            background: `${T.accent}15`,
          }}
        >
          <Plus className="h-4 w-4" /> إضافة منتج جديد
        </button>
      </div>

      {/* === Add / Edit Form === */}
      {showAdd && (
        <div className="admin-panel animate-slide-up-fade mb-6 p-5">
          <h3
            className="mb-4 text-lg font-bold"
            style={{ color: T.accentLight }}
          >
            {editingId ? "تعديل المنتج" : "إضافة منتج جديد"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Name */}
            <div>
              <label
                className="mb-1.5 block text-xs font-semibold"
                style={{ color: T.textMuted }}
              >
                اسم المنتج *
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="اسم المنتج"
                style={inputStyle}
              />
            </div>
            {/* Price */}
            <div>
              <label
                className="mb-1.5 block text-xs font-semibold"
                style={{ color: T.textMuted }}
              >
                السعر (��.ل) *
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
                placeholder="0.00"
                style={inputStyle}
                dir="ltr"
              />
            </div>
            {/* Category */}
            <div>
              <label
                className="mb-1.5 block text-xs font-semibold"
                style={{ color: T.textMuted }}
              >
                التصنيف *
              </label>
              {customCatMode ? (
                <div className="flex gap-2">
                  <input
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                    placeholder="اسم التصنيف الجديد..."
                    style={inputStyle}
                    autoFocus
                  />
                  <button
                    onClick={() => setCustomCatMode(false)}
                    className="shrink-0 rounded-lg border px-3 text-xs"
                    style={{ borderColor: T.border, color: T.textDim }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, category: e.target.value }))
                      }
                      style={{
                        ...inputStyle,
                        appearance: "none",
                        paddingLeft: "32px",
                      }}
                    >
                      {allCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: T.textDim }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setCustomCatMode(true);
                      setForm((f) => ({ ...f, category: "" }));
                    }}
                    className="shrink-0 rounded-lg border px-3 text-xs transition-colors hover:bg-amber-500/10"
                    style={{ borderColor: T.border, color: T.accent }}
                    title="تصنيف جديد"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            {/* Description */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label
                className="mb-1.5 block text-xs font-semibold"
                style={{ color: T.textMuted }}
              >
                الوصف
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="وصف المنتج (اختياري)"
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
            {/* Image Upload */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label
                className="mb-1.5 block text-xs font-semibold"
                style={{ color: T.textMuted }}
              >
                صورة المنتج
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {form.image_url && (
                  <div
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border"
                    style={{ borderColor: T.border }}
                  >
                    <img
                      // نستخدم دالة للتأكد من أن الرابط يبدأ بـ / دائماً
                      src={
                        form.image_url.startsWith("http")
                          ? form.image_url
                          : form.image_url.startsWith("/")
                            ? form.image_url
                            : `/${form.image_url}`
                      }
                      alt="preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                    <button
                      onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all hover:scale-[1.02]"
                  style={{
                    borderColor: T.border,
                    color: T.textMuted,
                    background: T.surfaceDeep,
                  }}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? "جاري الرفع..." : "رفع صورة"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {/* Or paste URL */}
                <input
                  value={form.image_url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, image_url: e.target.value }))
                  }
                  placeholder="أو ألصق رابط الصورة..."
                  className="flex-1"
                  style={{ ...inputStyle, minWidth: "200px" }}
                  dir="ltr"
                />
              </div>
            </div>
            {/* Sort order */}
            <div>
              <label
                className="mb-1.5 block text-xs font-semibold"
                style={{ color: T.textMuted }}
              >
                ترتيب العرض
              </label>
              <input
                type="number"
                min="0"
                value={form.sort_order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sort_order: e.target.value }))
                }
                style={inputStyle}
                dir="ltr"
              />
            </div>
            {/* Toggles */}
            <div className="flex items-end gap-6 sm:col-span-1 lg:col-span-2">
              <label
                className="flex cursor-pointer items-center gap-2 text-sm"
                style={{ color: T.textMuted }}
              >
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_available: e.target.checked }))
                  }
                  className="accent-amber-500"
                />
                متوفر
              </label>
              <label
                className="flex cursor-pointer items-center gap-2 text-sm"
                style={{ color: T.textMuted }}
              >
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_featured: e.target.checked }))
                  }
                  className="accent-amber-500"
                />
                <Star className="h-3.5 w-3.5" /> مميز
              </label>
            </div>
          </div>

          {/* Option Groups Assignment */}
          {optionGroups.length > 0 && (
            <div className="mt-4">
              <label
                className="mb-2 block text-xs font-semibold"
                style={{ color: T.textMuted }}
              >
                مجموعات الخيارات (اختر المجموعات المرتبطة بهذا المنتج)
              </label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {optionGroups.map((group) => {
                  const checked = form.option_group_ids.includes(group.id);

                  // تحديد النوع والعرض بشكل جميل
                  const groupType = group.is_required ? "إجباري" : "اختياري";

                  const selectionType =
                    group.selection_type === "single"
                      ? "اختيار واحد"
                      : "اختيار متعدد";

                  const limits =
                    group.min_select > 1 || group.max_select < 99
                      ? ` (${group.min_select}-${group.max_select})`
                      : "";

                  return (
                    <label
                      key={group.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-200 ${
                        checked ? "ring-1" : ""
                      }`}
                      style={{
                        borderColor: checked ? T.accent : T.border,
                        background: checked ? `${T.accent}08` : T.surfaceDeep,
                        boxShadow: checked ? `0 0 0 1px ${T.accent}` : "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setForm((f) => ({
                            ...f,
                            option_group_ids: checked
                              ? f.option_group_ids.filter(
                                  (id) => id !== group.id,
                                )
                              : [...f.option_group_ids, group.id],
                          }));
                        }}
                        className="mt-1 h-4 w-4 shrink-0 accent-amber-500"
                      />

                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="font-semibold"
                            style={{ color: checked ? T.accentLight : T.text }}
                          >
                            {group.name}
                          </span>
                          <span className="text-xs" style={{ color: T.accent }}>
                            {group.options.length} خيار
                          </span>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                          {/* شارة نوع المجموعة */}
                          <span
                            className="rounded-full px-2 py-0.5"
                            style={{
                              background: group.is_required
                                ? "hsl(43 80% 52% / 0.15)"
                                : "hsl(200 80% 55% / 0.1)",
                              color: group.is_required
                                ? T.accentLight
                                : T.accentMuted,
                            }}
                          >
                            {groupType}
                          </span>

                          {/* شارة نوع الاختيار */}
                          <span
                            className="rounded-full px-2 py-0.5"
                            style={{
                              background: "hsl(0 0% 100% / 0.05)",
                              color: T.textMuted,
                            }}
                          >
                            {selectionType}
                            {limits}
                          </span>

                          {/* عرض أمثلة عن الخيارات (اختياري) */}
                          {group.options.length > 0 && (
                            <span
                              className="text-[10px]"
                              style={{ color: T.textDim }}
                            >
                              {group.options
                                .slice(0, 3)
                                .map((o) => o.name)
                                .join("، ")}
                              {group.options.length > 3 && "..."}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* تلميح للمساعدة */}
              <p className="mt-3 text-xs" style={{ color: T.textDim }}>
                <span
                  className="inline-block rounded-full px-2 py-0.5"
                  style={{ background: T.surfaceHover, color: T.accentMuted }}
                >
                  ℹ️
                </span>{" "}
                اختر مجموعة خيارات لتظهر مع هذا المنتج. يمكن تعديل الخيارات من
                صفحة "الخيارات".
              </p>
            </div>
          )}

          {/* Form actions */}
          <div className="mt-5 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="admin-btn-glow flex items-center gap-2 rounded-xl border px-6 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-105"
              style={{
                borderColor: "hsl(150 70% 45% / 0.4)",
                color: "hsl(150 70% 65%)",
                background: "hsl(150 70% 45% / 0.08)",
              }}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {editingId ? "تحديث المنتج" : "حفظ المنتج"}
            </button>
            <button
              onClick={cancelEdit}
              className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm transition-colors"
              style={{ borderColor: T.border, color: T.textDim }}
            >
              <X className="h-4 w-4" /> إلغاء
            </button>
          </div>
        </div>
      )}

      {/* === Search + Filter bar === */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: T.textDim }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو التصنيف..."
            className="w-full rounded-xl border py-2.5 pr-10 pl-4 text-sm outline-none transition-colors focus:border-amber-500/40"
            style={{
              background: T.surfaceDeep,
              borderColor: T.border,
              color: T.text,
            }}
          />
        </div>
        <div className="relative">
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="rounded-xl border py-2.5 pr-4 pl-9 text-sm outline-none transition-colors"
            style={{
              ...inputStyle,
              appearance: "none",
              width: "auto",
              minWidth: "160px",
            }}
          >
            <option value="all">كل التصنيفات</option>
            {allCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: T.textDim }}
          />
        </div>
      </div>

      {/* === Products List by Category === */}
      {grouped.length === 0 ? (
        <div className="admin-panel flex flex-col items-center justify-center py-16">
          <Package className="mb-3 h-12 w-12" style={{ color: T.textDim }} />
          <p className="text-lg font-semibold" style={{ color: T.textMuted }}>
            لا توجد منتجات
          </p>
          <p className="mt-1 text-sm" style={{ color: T.textDim }}>
            {search || catFilter !== "all"
              ? "جرب تغيير البحث أو الفلتر"
              : "أضف أول منتج من الزر أعلاه"}
          </p>
        </div>
      ) : (
        grouped.map((group) => (
          <div key={group.id} className="mb-6">
            <h3
              className="mb-3 flex items-center gap-2 text-sm font-bold"
              style={{ color: T.accentLight }}
            >
              <span
                className="h-1 w-1 rounded-full"
                style={{ background: T.accent }}
              />
              {group.label}
              <span
                className="text-xs font-normal"
                style={{ color: T.textDim }}
              >
                ({group.products.length})
              </span>
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.products.map((product) => (
                <div
                  key={product.id}
                  className="admin-panel group relative overflow-hidden transition-all duration-300 hover:scale-[1.01]"
                  style={{ opacity: product.is_available ? 1 : 0.55 }}
                >
                  {/* Image */}
                  {/* Image in Product Card */}
                  <div
                    className="relative h-40 w-full overflow-hidden rounded-t-xl"
                    style={{ background: T.surfaceDeep }}
                  >
                    {product.image_url ? (
                      <img
                        // التأكد من أن المسار يبدأ بـ / ليعمل من أي صفحة فرعية
                        src={
                          product.image_url.startsWith("/")
                            ? product.image_url
                            : `/${product.image_url}`
                        }
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/placeholder.svg";
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon
                          className="h-10 w-10"
                          style={{ color: T.textDim }}
                        />
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h4
                        className="text-sm font-bold leading-tight"
                        style={{ color: T.text }}
                      >
                        {product.name}
                      </h4>
                      <span
                        className="shrink-0 text-sm font-bold"
                        style={{ color: T.accent }}
                      >
                        {product.price} د.ل
                      </span>
                    </div>
                    {product.description && (
                      <p
                        className="mb-3 line-clamp-2 text-xs leading-relaxed"
                        style={{ color: T.textDim }}
                      >
                        {product.description}
                      </p>
                    )}

                    {/* Action buttons */}
                    <div
                      className="flex items-center gap-2 border-t pt-3"
                      style={{ borderColor: T.border }}
                    >
                      <button
                        onClick={() => startEdit(product)}
                        title="تعديل"
                        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all hover:scale-105"
                        style={{ borderColor: T.border, color: T.accentLight }}
                      >
                        <Edit3 className="h-3 w-3" /> تعديل
                      </button>
                      <button
                        onClick={() => toggleAvailability(product)}
                        title={product.is_available ? "إخفاء" : "إظهار"}
                        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all hover:scale-105"
                        style={{
                          borderColor: T.border,
                          color: product.is_available
                            ? T.textMuted
                            : "hsl(150 70% 60%)",
                        }}
                      >
                        {product.is_available ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                        {product.is_available ? "إخفاء" : "إظهار"}
                      </button>
                      {deleteConfirm === product.id ? (
                        <div className="flex items-center gap-1.5 mr-auto">
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-white transition-colors"
                            style={{ background: "hsl(0 70% 50%)" }}
                          >
                            تأكيد الحذف
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="rounded-lg px-2.5 py-1.5 text-xs"
                            style={{ color: T.textDim }}
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(product.id)}
                          title="حذف"
                          className="mr-auto flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs transition-all hover:scale-105 hover:bg-red-500/10"
                          style={{
                            borderColor: "hsl(0 70% 55% / 0.25)",
                            color: "hsl(0 70% 65%)",
                          }}
                        >
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
  );
}
