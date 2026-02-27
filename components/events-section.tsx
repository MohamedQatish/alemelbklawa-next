"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Check, ShoppingCart, Loader2, Plus, Minus, X } from "lucide-react";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";

interface Option {
  id: number;
  name: string;
  price: number;
  replaceBasePrice: boolean;
  sortOrder: number;
}

interface OptionGroup {
  id: number;
  name: string;
  isRequired: boolean;
  selectionType: "single" | "multiple";
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  options: Option[];
}

interface DBEvent {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_featured: boolean;
  icon: string | null;
  option_groups?: OptionGroup[];
}

interface EventCategory {
  id: string;
  title: string;
  icon?: string | null;
  items: {
    id: string;
    name: string;
    price: number;
    description?: string;
    image_url?: string;
    is_featured?: boolean;
    icon?: string | null;
    fullEvent?: DBEvent;
  }[];
}

function makeFallbackCategories(): EventCategory[] {
  return [];
}

function makeDBCategories(dbEvents: DBEvent[]): EventCategory[] {
  const catOrder: string[] = [];
  for (const ev of dbEvents) {
    if (!catOrder.includes(ev.category)) catOrder.push(ev.category);
  }

  return catOrder
    .map((catName) => ({
      id: `cat-${catName}`,
      title: catName,
      icon: dbEvents.find((ev) => ev.category === catName && ev.icon)?.icon || null,
      items: dbEvents
        .filter((ev) => ev.category === catName)
        .map((ev) => ({
          id: String(ev.id),
          name: ev.name,
          price: ev.price,
          description: ev.description || undefined,
          image_url: ev.image_url || undefined,
          is_featured: ev.is_featured,
          icon: ev.icon || null,
          fullEvent: ev,
        })),
    }))
    .filter((c) => c.items.length > 0);
}

export default function EventsSection() {
  const [eventCategories, setEventCategories] = useState<EventCategory[]>(makeFallbackCategories);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // حالة الباقة - اختيار واحد من كل تصنيف
  const [selectedItems, setSelectedItems] = useState<Record<string, {
    item: any;
    quantity: number;
    selectedOptions: any[];
    finalPrice: number;
  } | null>>({});

  // Modal State
  const [modalEvent, setModalEvent] = useState<DBEvent | null>(null);
  const [modalCategoryId, setModalCategoryId] = useState<string>("");
  const [selections, setSelections] = useState<Record<number, number[]>>({});
  const [quantity, setQuantity] = useState(1);
  
  // Price cache
  const [priceCache, setPriceCache] = useState<Record<string, { price: number; options: any[] }>>({});

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data: DBEvent[] = await res.json();
        if (data.length > 0) {
          setEventCategories(makeDBCategories(data));
        }
      }
    } catch {
      /* silently fall back to static data */
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Reset modal selections when event changes
  useEffect(() => {
    if (modalEvent) {
      const initial: Record<number, number[]> = {};
      modalEvent.option_groups?.forEach((group) => {
        if (group.isRequired && group.options.length > 0) {
          initial[group.id] = [group.options[0].id];
        } else {
          initial[group.id] = [];
        }
      });
      setSelections(initial);
      setQuantity(1);
      
      // Preload prices
      preloadAllPrices(modalEvent);
    }
  }, [modalEvent]);

  const preloadAllPrices = async (event: DBEvent) => {
    if (!event.option_groups?.length) return;

    const allPossibleSelections: Record<number, number[]>[] = [];
    allPossibleSelections.push({});

    event.option_groups.forEach((group) => {
      group.options.forEach((opt) => {
        const selection: Record<number, number[]> = {};
        selection[group.id] = [opt.id];
        allPossibleSelections.push(selection);
      });
    });

    const newCache = { ...priceCache };

    for (const selection of allPossibleSelections) {
      const selectionsKey = JSON.stringify(selection);
      if (newCache[selectionsKey]) continue;

      const selectedOptionIds: { optionId: number }[] = [];
      Object.entries(selection).forEach(([groupId, optionIds]) => {
        optionIds.forEach((oid) => selectedOptionIds.push({ optionId: oid }));
      });

      if (selectedOptionIds.length === 0) {
        newCache[selectionsKey] = {
          price: Number(event.price),
          options: [],
        };
        continue;
      }

      try {
        const res = await fetch("/api/cart/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: event.id,
            selectedOptions: selectedOptionIds,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          newCache[selectionsKey] = {
            price: Number(data.finalPrice),
            options: data.selectedOptions,
          };
        }
      } catch (error) {
        console.error("Failed to preload price:", error);
      }
    }

    setPriceCache(newCache);
  };

  const getCachedPrice = useCallback(() => {
    if (!modalEvent) return null;

    const selectionsKey = JSON.stringify(selections);
    const cached = priceCache[selectionsKey];

    if (cached) {
      return cached;
    }

    // Fallback calculation
    let totalPrice = Number(modalEvent.price);
    const selectedOptionsList: any[] = [];

    Object.entries(selections).forEach(([groupId, optionIds]) => {
      const group = modalEvent.option_groups?.find(
        (g) => g.id === Number(groupId)
      );
      if (group) {
        optionIds.forEach((oid) => {
          const option = group.options.find((opt) => opt.id === oid);
          if (option) {
            totalPrice += Number(option.price);
            selectedOptionsList.push({
              id: option.id,
              name: option.name,
              price: option.price,
            });
          }
        });
      }
    });

    return {
      price: totalPrice,
      options: selectedOptionsList,
    };
  }, [modalEvent, selections, priceCache]);

  const calculatedResult = useMemo(() => {
    return getCachedPrice();
  }, [getCachedPrice]);

  const toggleOption = (groupId: number, optionId: number) => {
    setSelections((prev) => {
      const group = modalEvent?.option_groups?.find((g) => g.id === groupId);
      if (!group) return prev;

      const current = prev[groupId] || [];

      if (group.selectionType === "single") {
        if (current.length === 1 && current[0] === optionId) {
          return prev;
        }
        return { ...prev, [groupId]: [optionId] };
      } else {
        if (current.includes(optionId)) {
          return {
            ...prev,
            [groupId]: current.filter((id) => id !== optionId),
          };
        } else {
          if (group.maxSelect && current.length >= group.maxSelect) {
            toast.error(`يمكنك اختيار ${group.maxSelect} خيارات كحد أقصى`);
            return prev;
          }
          return { ...prev, [groupId]: [...current, optionId] };
        }
      }
    });
  };

  const confirmSelection = () => {
    if (!modalEvent || !modalCategoryId || !calculatedResult) return;

    // Check required groups
    for (const group of modalEvent.option_groups || []) {
      if (
        group.isRequired &&
        (!selections[group.id] || selections[group.id].length === 0)
      ) {
        toast.error(`الرجاء اختيار ${group.name}`);
        return;
      }
    }

    // Save to selected items
    setSelectedItems(prev => ({
      ...prev,
      [modalCategoryId]: {
        item: modalEvent,
        quantity: quantity,
        selectedOptions: calculatedResult.options,
        finalPrice: calculatedResult.price,
      }
    }));

    toast.success(`تم اختيار ${modalEvent.name} للباقة`);
    setModalEvent(null);
  };

  const removeSelection = (categoryId: string) => {
    setSelectedItems(prev => {
      const newSelected = { ...prev };
      delete newSelected[categoryId];
      return newSelected;
    });
  };

  const addPackageToCart = () => {
    let added = 0;
    let totalPrice = 0;

    for (const [catId, data] of Object.entries(selectedItems)) {
      if (data) {
        const category = eventCategories.find(c => c.id === catId);
        if (category) {
          for (let i = 0; i < data.quantity; i++) {
            addToCart({
              productId: data.item.id,
              name: data.item.name,
              basePrice: data.item.price,
              finalPrice: data.finalPrice,
              category: "مناسبات",
              selectedOptions: data.selectedOptions,
            });
          }
          added++;
          totalPrice += data.finalPrice * data.quantity;
        }
      }
    }

    if (added > 0) {
      toast.success(`تمت إضافة ${added} عناصر إلى السلة (إجمالي ${totalPrice.toFixed(2)} د.ل)`);
      setSelectedItems({});
    } else {
      toast.error("يرجى اختيار عنصر واحد على الأقل");
    }
  };

  const selectedCount = Object.keys(selectedItems).length;
  const totalPrice = Object.values(selectedItems).reduce((sum, data) => {
    return sum + (data ? data.finalPrice * data.quantity : 0);
  }, 0);

  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return "/placeholder.svg";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/")) return url;
    return `/${url}`;
  };

  return (
    <section
      ref={sectionRef}
      id="events"
      className="bg-royal-red-dark relative overflow-hidden py-16 md:py-24"
    >
      {/* الخلفية */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-l from-transparent via-[var(--gold)]/40 to-transparent" />
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          width: "800px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, hsl(43 65% 52% / 0.03) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* العنوان */}
        <div
          className="text-center mb-10 md:mb-16 transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
          }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-[var(--gold)] mb-2">
            المناسبات
          </h2>
          <p className="text-sm md:text-lg text-[var(--gold)]/60 max-w-lg mx-auto">
            اختر من كل قسم عنصراً واحداً لتكوين الباقة
          </p>
          <div className="mx-auto mt-3 w-16 md:w-24 h-1 rounded-full bg-[var(--gold)]/50" />
        </div>

        {/* حالة التحميل */}
        {loadingEvents ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--gold)]/40" />
          </div>
        ) : (
          <>
            {/* شبكة التصنيفات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {eventCategories.map((cat, catIdx) => (
                <div
                  key={cat.id}
                  className="group rounded-xl md:rounded-2xl border border-[var(--gold)]/15 bg-[var(--royal-red-light)]/50 p-4 md:p-5 backdrop-blur-sm transition-all duration-500 hover:border-[var(--gold)]/30"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(20px)",
                    transition: `opacity 0.5s ease ${catIdx * 0.1}s, transform 0.5s ease ${catIdx * 0.1}s`,
                  }}
                >
                  {/* رأس التصنيف مع حالة الاختيار */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[var(--gold)]/10 flex items-center justify-center">
                        <span className="text-xl md:text-2xl">{cat.icon || "🎉"}</span>
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-[var(--cream)] group-hover:text-[var(--gold)] transition-colors">
                        {cat.title}
                      </h3>
                    </div>
                    {selectedItems[cat.id] && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs bg-[var(--gold)] text-[var(--royal-red-dark)] px-2 py-1 rounded-full">
                          ✓ تم
                        </span>
                        <button
                          onClick={() => removeSelection(cat.id)}
                          className="p-1 hover:bg-red-500/20 rounded-full transition-colors"
                        >
                          <X className="h-3 w-3 text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* شبكة المنتجات */}
                  <div className="grid grid-cols-2 gap-2">
                    {cat.items.map((item) => {
                      const isSelected = selectedItems[cat.id]?.item.id === item.fullEvent?.id;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setModalEvent(item.fullEvent || null);
                            setModalCategoryId(cat.id);
                          }}
                          disabled={isSelected}
                          className={`group/item relative rounded-lg overflow-hidden transition-all duration-200 ${
                            isSelected
                              ? "ring-2 ring-[var(--gold)] opacity-60 cursor-not-allowed"
                              : "hover:ring-1 hover:ring-[var(--gold)]/30"
                          }`}
                        >
                          {/* الصورة */}
                          <div className="aspect-square bg-[var(--royal-red-dark)]">
                            {item.image_url ? (
                              <img
                                src={getImageUrl(item.image_url)}
                                alt={item.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-110"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-2xl opacity-30">🎂</span>
                              </div>
                            )}

                            {/* شارة مميز */}
                            {item.is_featured && (
                              <span className="absolute top-0.5 right-0.5 bg-[var(--gold)] text-[6px] md:text-[8px] font-bold px-1 py-0.5 rounded-full text-[var(--royal-red-dark)]">
                                مميز
                              </span>
                            )}

                            {/* علامة الاختيار */}
                            {isSelected && (
                              <div className="absolute inset-0 bg-[var(--gold)]/20 flex items-center justify-center">
                                <Check className="h-6 w-6 text-[var(--gold)]" />
                              </div>
                            )}
                          </div>

                          {/* معلومات المنتج */}
                          <div className="p-1.5 bg-gradient-to-t from-[var(--royal-red-dark)] to-transparent">
                            <h4 className="text-[10px] md:text-xs font-medium text-[var(--cream)] line-clamp-1">
                              {item.name}
                            </h4>
                            <span className="text-[9px] md:text-[11px] font-bold text-[var(--gold)]">
                              {item.price} د.ل
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* شريط الباقة */}
            {selectedCount > 0 && (
              <div className="sticky bottom-4 mt-8 md:relative md:bottom-auto md:mt-12 z-10">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[var(--gold)]/20 via-[var(--gold)]/10 to-transparent rounded-2xl blur-xl opacity-70" />

                  <div className="relative bg-gradient-to-br from-[var(--royal-red-dark)] to-[var(--royal-red-light)] backdrop-blur-md border-2 border-[var(--gold)]/30 rounded-2xl p-4 md:p-5 shadow-2xl">
                    {/* شريط التقدم */}
                    <div className="absolute -top-1 left-4 right-4 h-1 bg-[var(--gold)]/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] rounded-full transition-all duration-500"
                        style={{
                          width: `${(selectedCount / eventCategories.length) * 100}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[var(--gold)]/20 to-[var(--gold)]/5 border border-[var(--gold)]/30 flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-[var(--gold)]" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--gold)] border-2 border-[var(--royal-red-dark)] flex items-center justify-center">
                            <span className="text-[10px] font-bold text-[var(--royal-red-dark)]">
                              {selectedCount}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-xs text-[var(--gold)]/60">باقة المناسبات</span>
                          <span className="text-sm font-bold text-[var(--gold)]">
                            {totalPrice.toFixed(2)} د.ل
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={addPackageToCart}
                        className="px-5 md:px-6 py-2.5 md:py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-[var(--royal-red-dark)] hover:scale-105 transition-all duration-300 shadow-lg shadow-[var(--gold)]/30"
                      >
                        <ShoppingCart className="inline ml-2 h-4 w-4" />
                        أضف الباقة
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal - نافذة اختيار الخيارات */}
      {modalEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setModalEvent(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--gold)]/30 bg-[var(--royal-red-dark)] shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setModalEvent(null)}
              className="absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--royal-red-light)] text-[var(--gold)]/70 transition-all hover:text-[var(--gold)] hover:scale-110"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Product image */}
            {modalEvent.image_url && (
              <div className="relative h-48 w-full overflow-hidden rounded-t-3xl">
                <img
                  src={getImageUrl(modalEvent.image_url)}
                  alt={modalEvent.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--royal-red-dark)] via-transparent to-transparent" />
              </div>
            )}

            <div className="p-6">
              {/* Product info */}
              <div className="mb-4 flex items-start justify-between">
                <h3 className="text-xl font-bold text-[var(--cream)]">
                  {modalEvent.name}
                </h3>
                <span className="text-[var(--gold)] font-bold">
                  {Number(modalEvent.price).toFixed(2)} د.ل
                </span>
              </div>

              {modalEvent.description && (
                <p className="mb-5 text-sm text-[var(--gold)]/60">
                  {modalEvent.description}
                </p>
              )}

              {/* Option Groups */}
              {modalEvent.option_groups && modalEvent.option_groups.length > 0 ? (
                <div className="mb-6 flex flex-col gap-5">
                  {modalEvent.option_groups.map((group) => (
                    <div key={group.id}>
                      <h4 className="mb-2.5 text-sm font-semibold text-[var(--gold)]">
                        {group.name}
                        {group.isRequired && <span className="mr-1 text-red-400">*</span>}
                      </h4>
                      <div className="flex flex-col gap-2">
                        {group.options.map((opt) => {
                          const isSelected = selections[group.id]?.includes(opt.id) || false;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => toggleOption(group.id, opt.id)}
                              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-right transition-all duration-200 ${
                                isSelected
                                  ? "border-[var(--gold)] bg-[var(--gold)]/15"
                                  : "border-white/10 bg-white/5 hover:bg-white/10"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                                    isSelected
                                      ? "border-[var(--gold)] bg-[var(--gold)]"
                                      : "border-white/20 bg-transparent"
                                  }`}
                                >
                                  {isSelected && (
                                    <Check className="h-3 w-3 text-[var(--royal-red-dark)]" />
                                  )}
                                </div>
                                <span className={`text-sm font-medium ${isSelected ? "text-[var(--gold)]" : "text-[var(--cream)]"}`}>
                                  {opt.name}
                                </span>
                              </div>
                              {opt.price > 0 && (
                                <span className="text-xs font-semibold text-green-400">
                                  +{opt.price} د.ل
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mb-6 text-center text-sm text-[var(--gold)]/40">
                  لا توجد خيارات إضافية
                </p>
              )}

              {/* Quantity selector */}
              <div className="mb-4 flex items-center justify-between p-3 rounded-xl bg-white/5">
                <span className="text-sm text-[var(--gold)]/70">الكمية</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(q => Math.min(10, q + 1))}
                    className="w-8 h-8 rounded-full bg-[var(--gold)]/20 flex items-center justify-center text-[var(--gold)] hover:bg-[var(--gold)]/30"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <span className="text-lg font-bold text-[var(--gold)] min-w-[24px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-full bg-[var(--gold)]/20 flex items-center justify-center text-[var(--gold)] hover:bg-[var(--gold)]/30"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                </div>
              </div>

             {/* Total Price */}
<div className="mb-4 space-y-2">
  <div className="flex justify-between items-center">
    <span className="text-sm text-[var(--gold)]/70">سعر القطعة الواحدة:</span>
    <span className="text-base font-bold text-[var(--gold)]">
      {(calculatedResult?.price || modalEvent.price).toFixed(2)} د.ل
    </span>
  </div>
  
  <div className="flex justify-between items-center pt-2 border-t border-[var(--gold)]/20">
    <span className="text-base font-bold text-[var(--gold)]">الإجمالي للكمية:</span>
    <span className="text-xl font-bold text-[var(--gold)]" style={{ color: 'var(--gold)' }}>
      {((calculatedResult?.price || modalEvent.price) * quantity).toFixed(2)} د.ل
    </span>
  </div>
  
  {/* تفاصيل الحساب */}
  <div className="text-xs text-[var(--gold)]/40 text-left">
    {quantity} × {(calculatedResult?.price || modalEvent.price).toFixed(2)} د.ل
  </div>
</div>
              <button
                onClick={confirmSelection}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)] py-3.5 text-sm font-bold text-[var(--royal-red-dark)] transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                <Check className="h-4 w-4" />
                <span>تأكيد الاختيار ({quantity} قطعة)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}