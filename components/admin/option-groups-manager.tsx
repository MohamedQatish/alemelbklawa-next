"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Loader2,
  Settings2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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

interface Option {
  id: number;
  group_id: number;
  name: string;
  price: number;
  replace_base_price: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface OptionGroup {
  id: number;
  product_id: number | null;
  name: string;
  is_required: boolean;
  selection_type: "single" | "multiple";
  min_select: number;
  max_select: number;
  sort_order: number;
  created_at: string;
  options: Option[];
}

export default function OptionGroupsManager() {
  const [groups, setGroups] = useState<OptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);

  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [addingOptionFor, setAddingOptionFor] = useState<number | null>(null);
  const [editingOption, setEditingOption] = useState<number | null>(null);
  const [groupForm, setGroupForm] = useState({
    name: "",
    is_required: false,
    selection_type: "single" as "single" | "multiple",
    min_select: 1,
    max_select: 1,
    sort_order: 0,
  });

  const [optForm, setOptForm] = useState({
    name: "",
    price: 0,
    replace_base_price: false,
    sort_order: 0,
  });

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/option-groups");
      if (res.ok) setGroups(await res.json());
    } catch {
      /* */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  function cancelGroup() {
    setShowAddGroup(false);
    setEditingGroupId(null);
    setGroupForm({
      name: "",
      is_required: false,
      selection_type: "single",
      min_select: 1,
      max_select: 1,
      sort_order: 0,
    });
  }

  function cancelOpt() {
    setAddingOptionFor(null);
    setEditingOption(null);
    setOptForm({
      name: "",
      price: 0,
      replace_base_price: false,
      sort_order: 0,
    });
  }

  async function saveGroup() {
    if (!groupForm.name.trim()) return;
    setSaving(true);
    try {
      if (editingGroupId) {
        await fetch("/api/admin/option-groups", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_group",
            id: editingGroupId,
            ...groupForm,
          }),
        });
      } else {
        await fetch("/api/admin/option-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(groupForm),
        });
      }
      cancelGroup();
      fetchGroups();
    } catch {
      /* */
    } finally {
      setSaving(false);
    }
  }

  async function deleteGroup(id: number) {
    if (!confirm("هل أنت متأكد من حذف هذه المجموعة وجميع خياراتها؟")) return;
    await fetch("/api/admin/option-groups", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchGroups();
  }

  async function saveOption(groupId: number) {
    if (!optForm.name.trim()) return;
    setSaving(true);
    try {
      if (editingOption) {
        await fetch("/api/admin/option-groups", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_option",
            id: editingOption,
            ...optForm,
          }),
        });
      } else {
        await fetch("/api/admin/option-groups", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add_option",
            group_id: groupId,
            ...optForm,
          }),
        });
      }
      cancelOpt();
      fetchGroups();
    } catch {
      /* */
    } finally {
      setSaving(false);
    }
  }

  async function deleteOption(id: number) {
    if (!confirm("حذف هذا الخيار؟")) return;
    await fetch("/api/admin/option-groups", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_option", id }),
    });
    fetchGroups();
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: T.accent }} />
      </div>
    );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="admin-panel animate-slide-up-fade">
        <div className="relative z-10 flex items-center justify-between p-5">
          <div>
            <h2 className="text-lg font-bold" style={{ color: T.accentLight }}>
              <Settings2 className="ml-2 inline h-5 w-5" />
              مجموعات الخيارات
            </h2>
            <p className="mt-1 text-xs" style={{ color: T.textDim }}>
              أنشئ مجموعات مثل "الوزن" أو "الحجم" وأضف خيارات بأسعار مختلفة
            </p>
          </div>
          <button
            onClick={() => {
              cancelOpt();
              setEditingGroupId(null);
              cancelGroup();
              setShowAddGroup(true);
            }}
            className="admin-btn-glow flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
            style={{ background: T.accent, color: "#fff" }}
          >
            <Plus className="h-4 w-4" /> مجموعة جديدة
          </button>
        </div>
      </div>

      {/* Add / Edit group form */}
      {(showAddGroup || editingGroupId !== null) && (
        <div className="admin-panel animate-slide-up-fade">
          <div className="relative z-10 space-y-4 p-5">
            <h3 className="text-sm font-bold" style={{ color: T.accentLight }}>
              {editingGroupId ? "تعديل المجموعة" : "إضافة مجموعة جديدة"}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs" style={{ color: T.textMuted }}>
                  الاسم (إنجليزي)
                </label>
                <input
                  value={groupForm.name}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, name: e.target.value })
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{
                    borderColor: T.border,
                    background: T.surfaceDeep,
                    color: T.text,
                  }}
                  placeholder="e.g. weight"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs" style={{ color: T.textMuted }}>
                  <input
                    type="checkbox"
                    checked={groupForm.is_required}
                    onChange={(e) =>
                      setGroupForm({ ...groupForm, is_required: e.target.checked })
                    }
                  />
                  إجباري
                </label>
                <select
                  value={groupForm.selection_type}
                  onChange={(e) =>
                    setGroupForm({
                      ...groupForm,
                      selection_type: e.target.value as "single" | "multiple",
                    })
                  }
                  className="rounded-lg border px-2 py-1 text-xs"
                  style={{ borderColor: T.border, background: T.surfaceDeep, color: T.text }}
                >
                  <option value="single">اختيار واحد</option>
                  <option value="multiple">اختيار متعدد</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs" style={{ color: T.textMuted }}>
                  الحد الأدنى للاختيار
                </label>
                <input
                  type="number"
                  value={groupForm.min_select}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, min_select: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{
                    borderColor: T.border,
                    background: T.surfaceDeep,
                    color: T.text,
                  }}
                  min="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs" style={{ color: T.textMuted }}>
                  الحد الأقصى للاختيار
                </label>
                <input
                  type="number"
                  value={groupForm.max_select}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, max_select: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{
                    borderColor: T.border,
                    background: T.surfaceDeep,
                    color: T.text,
                  }}
                  min="0"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-1">
              <div>
                <label className="mb-1 block text-xs" style={{ color: T.textMuted }}>
                  ترتيب العرض
                </label>
                <input
                  type="number"
                  value={groupForm.sort_order}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, sort_order: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{
                    borderColor: T.border,
                    background: T.surfaceDeep,
                    color: T.text,
                  }}
                  min="0"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveGroup}
                disabled={saving}
                className="admin-btn-glow flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
                style={{ background: T.accent, color: "#fff" }}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {editingGroupId ? "تحديث" : "حفظ"}
              </button>
              <button
                onClick={cancelGroup}
                className="admin-btn-glow flex items-center gap-2 rounded-lg border px-4 py-2 text-sm"
                style={{ borderColor: T.border, color: T.textMuted }}
              >
                <X className="h-4 w-4" /> إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Groups list */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Settings2 className="mb-3 h-12 w-12" style={{ color: T.textDim }} />
          <p style={{ color: T.textMuted }}>لا توجد مجموعات خيارات بعد</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group, gi) => (
            <div
              key={group.id}
              className="admin-panel animate-card-enter"
              style={{
                animationDelay: `${gi * 40}ms`,
                animationFillMode: "backwards",
              }}
            >
              <div className="relative z-10">
                {/* Group header */}
                <div className="flex items-center justify-between p-5">
                  <button
                    onClick={() =>
                      setExpandedGroup(
                        expandedGroup === group.id ? null : group.id,
                      )
                    }
                    className="flex flex-1 items-center gap-3 text-right"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: "hsl(200 80% 55% / 0.1)" }}
                    >
                      <Settings2
                        className="h-5 w-5"
                        style={{ color: T.accentLight }}
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold" style={{ color: T.text }}>
                        {group.name}
                      </h3>
                      <p className="text-xs" style={{ color: T.textDim }}>
                        {group.is_required ? "إجباري" : "اختياري"} -{" "}
                        {group.selection_type === "single" ? "اختيار واحد" : "اختيار متعدد"} -{" "}
                        {group.options.length} خيار
                      </p>
                    </div>
                    {expandedGroup === group.id ? (
                      <ChevronUp
                        className="mr-auto h-4 w-4"
                        style={{ color: T.textDim }}
                      />
                    ) : (
                      <ChevronDown
                        className="mr-auto h-4 w-4"
                        style={{ color: T.textDim }}
                      />
                    )}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        cancelOpt();
                        setShowAddGroup(false);
                        setEditingGroupId(group.id);
                        setGroupForm({
                          name: group.name,
                          is_required: group.is_required,
                          selection_type: group.selection_type,
                          min_select: group.min_select,
                          max_select: group.max_select,
                          sort_order: group.sort_order,
                        });
                      }}
                      className="admin-btn-glow rounded-lg p-2"
                      style={{ color: T.accentLight }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteGroup(group.id)}
                      className="admin-btn-glow rounded-lg p-2"
                      style={{ color: "hsl(0 60% 60%)" }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded: options list */}
                {expandedGroup === group.id && (
                  <div
                    className="border-t px-5 pb-5 pt-4"
                    style={{ borderColor: T.border }}
                  >
                    {/* Options table */}
                    {group.options.length > 0 && (
                      <div
                        className="mb-4 overflow-x-auto rounded-lg border"
                        style={{ borderColor: T.border }}
                      >
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{ background: T.surfaceDeep }}>
                              <th
                                className="px-4 py-2.5 text-right text-xs font-semibold"
                                style={{ color: T.accentLight }}
                              >
                                اسم الخيار
                              </th>
                              <th
                                className="px-4 py-2.5 text-right text-xs font-semibold"
                                style={{ color: T.accentLight }}
                              >
                                السعر
                              </th>
                              <th
                                className="px-4 py-2.5 text-right text-xs font-semibold"
                                style={{ color: T.accentLight }}
                              >
                                يستبدل السعر الأساسي
                              </th>
                              <th
                                className="px-4 py-2.5 text-right text-xs font-semibold"
                                style={{ color: T.accentLight }}
                              >
                                ترتيب
                              </th>
                              <th
                                className="px-4 py-2.5 text-right text-xs font-semibold"
                                style={{ color: T.accentLight }}
                              >
                                إجراءات
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.options.map((opt) => (
                              <tr
                                key={opt.id}
                                style={{
                                  borderBottom: `1px solid hsl(200 80% 55% / 0.05)`,
                                }}
                              >
                                <td className="px-4 py-2.5" style={{ color: T.text }}>
                                  {opt.name}
                                </td>
                                <td
                                  className="px-4 py-2.5 font-mono"
                                  style={{
                                    color: opt.price > 0 ? T.accentLight : T.textDim,
                                  }}
                                >
                                  {opt.price} د.ل
                                </td>
                                <td className="px-4 py-2.5" style={{ color: T.textMuted }}>
                                  {opt.replace_base_price ? "نعم" : "لا"}
                                </td>
                                <td className="px-4 py-2.5" style={{ color: T.textDim }}>
                                  {opt.sort_order}
                                </td>
                                <td className="flex gap-1 px-4 py-2.5">
                                  <button
                                    onClick={() => {
                                      setAddingOptionFor(null);
                                      setEditingOption(opt.id);
                                      setOptForm({
                                        name: opt.name,
                                        price: opt.price,
                                        replace_base_price: opt.replace_base_price,
                                        sort_order: opt.sort_order,
                                      });
                                    }}
                                    className="admin-btn-glow rounded p-1"
                                    style={{ color: T.accentLight }}
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteOption(opt.id)}
                                    className="admin-btn-glow rounded p-1"
                                    style={{ color: "hsl(0 60% 60%)" }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Add / Edit option form */}
                    {addingOptionFor === group.id ||
                    (editingOption &&
                      group.options.some((o) => o.id === editingOption)) ? (
                      <div
                        className="space-y-3 rounded-lg p-4"
                        style={{ background: T.surfaceDeep }}
                      >
                        <h4
                          className="text-xs font-bold"
                          style={{ color: T.accentLight }}
                        >
                          {editingOption ? "تعديل الخيار" : "إضافة خيار جديد"}
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <label
                              className="mb-1 block text-[10px]"
                              style={{ color: T.textDim }}
                            >
                              اسم الخيار
                            </label>
                            <input
                              value={optForm.name}
                              onChange={(e) =>
                                setOptForm({ ...optForm, name: e.target.value })
                              }
                              className="w-full rounded-lg border px-3 py-2 text-xs outline-none"
                              style={{
                                borderColor: T.border,
                                background: T.surface,
                                color: T.text,
                              }}
                              placeholder="نصف كيلو"
                            />
                          </div>
                          <div>
                            <label
                              className="mb-1 block text-[10px]"
                              style={{ color: T.textDim }}
                            >
                              السعر (د.ل)
                            </label>
                            <input
                              type="number"
                              value={optForm.price}
                              onChange={(e) =>
                                setOptForm({ ...optForm, price: Number(e.target.value) })
                              }
                              className="w-full rounded-lg border px-3 py-2 text-xs outline-none"
                              style={{
                                borderColor: T.border,
                                background: T.surface,
                                color: T.text,
                              }}
                              placeholder="0"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label
                              className="flex items-center gap-1 text-xs"
                              style={{ color: T.textDim }}
                            >
                              <input
                                type="checkbox"
                                checked={optForm.replace_base_price}
                                onChange={(e) =>
                                  setOptForm({
                                    ...optForm,
                                    replace_base_price: e.target.checked,
                                  })
                                }
                              />
                              يستبدل السعر الأساسي
                            </label>
                          </div>
                          <div>
                            <label
                              className="mb-1 block text-[10px]"
                              style={{ color: T.textDim }}
                            >
                              ترتيب
                            </label>
                            <input
                              type="number"
                              value={optForm.sort_order}
                              onChange={(e) =>
                                setOptForm({
                                  ...optForm,
                                  sort_order: Number(e.target.value),
                                })
                              }
                              className="w-full rounded-lg border px-3 py-2 text-xs outline-none"
                              style={{
                                borderColor: T.border,
                                background: T.surface,
                                color: T.text,
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveOption(group.id)}
                            disabled={saving}
                            className="admin-btn-glow flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium"
                            style={{ background: T.accent, color: "#fff" }}
                          >
                            {saving ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3" />
                            )}
                            {editingOption ? "تحديث" : "حفظ"}
                          </button>
                          <button
                            onClick={cancelOpt}
                            className="admin-btn-glow rounded-lg border px-3 py-1.5 text-xs"
                            style={{
                              borderColor: T.border,
                              color: T.textMuted,
                            }}
                          >
                            <X className="inline h-3 w-3" /> إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          cancelOpt();
                          setAddingOptionFor(group.id);
                          setOptForm({
                            name: "",
                            price: 0,
                            replace_base_price: false,
                            sort_order: 0,
                          });
                        }}
                        className="admin-btn-glow flex items-center gap-2 rounded-lg border px-4 py-2 text-xs transition-all"
                        style={{ borderColor: T.border, color: T.accentLight }}
                      >
                        <Plus className="h-3.5 w-3.5" /> إضافة خيار
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}