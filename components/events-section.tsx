"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Check,
  ShoppingCart,
  Loader2,
  Plus,
  Minus,
  X,
  Calendar,
  Gift,
  Star,
  Heart,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Package,
} from "lucide-react";
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

interface SelectedItem {
  item: DBEvent;
  quantity: number;
  selectedOptions: any[];
  finalPrice: number;
}

// أيقونات افتراضية جميلة للمناسبات
const categoryIcons: Record<string, { icon: string; bg: string }> = {
  أعراس: { icon: "💍", bg: "from-pink-500/20 to-rose-500/20" },
  تخرج: { icon: "🎓", bg: "from-blue-500/20 to-indigo-500/20" },
  ميلاد: { icon: "🎂", bg: "from-yellow-500/20 to-amber-500/20" },
  خطوبة: { icon: "💑", bg: "from-purple-500/20 to-pink-500/20" },
  اجتماعات: { icon: "🤝", bg: "from-gray-500/20 to-slate-500/20" },
  default: { icon: "🎉", bg: "from-[var(--gold)]/20 to-[var(--gold)]/5" },
};

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
      icon:
        dbEvents.find((ev) => ev.category === catName && ev.icon)?.icon || null,
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
  const [eventCategories, setEventCategories] = useState<EventCategory[]>(
    makeFallbackCategories,
  );
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // حالة الباقة - اختيار واحد من كل تصنيف
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItem | null>>({});

  // Modal State
  const [modalEvent, setModalEvent] = useState<DBEvent | null>(null);
  const [modalCategoryId, setModalCategoryId] = useState<string>("");
  const [selections, setSelections] = useState<Record<number, number[]>>({});
  const [quantity, setQuantity] = useState(1);

  // Price cache
  const [priceCache, setPriceCache] = useState<
    Record<string, { price: number; options: any[] }>
  >({});

  // حساب التقدم
  const selectedCount = Object.keys(selectedItems).length;
  const totalCategories = eventCategories.length;
  const isComplete = selectedCount === totalCategories && totalCategories > 0;
  const progressPercentage = totalCategories > 0 ? (selectedCount / totalCategories) * 100 : 0;

  // المجموعات المتبقية
  const remainingCategories = eventCategories.filter(cat => !selectedItems[cat.id]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data: DBEvent[] = await res.json();
        const processedData = data.map((event) => ({
          ...event,
          id: Number(event.id),
        }));
        if (processedData.length > 0) {
          setEventCategories(makeDBCategories(processedData));
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

    let totalPrice = Number(modalEvent.price);
    const selectedOptionsList: any[] = [];

    Object.entries(selections).forEach(([groupId, optionIds]) => {
      const group = modalEvent.option_groups?.find(
        (g) => g.id === Number(groupId),
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

  const handleEventSelection = async (
    event: DBEvent | null,
    categoryId: string,
  ) => {
    if (!event) return;

    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (data.user) {
        setModalEvent(event);
        setModalCategoryId(categoryId);
      } else {
        const eventToSave = {
          id: event.id,
          name: event.name,
          price: event.price,
          category: event.category,
          description: event.description,
          image_url: event.image_url,
          categoryId: categoryId,
        };
        localStorage.setItem("pendingEvent", JSON.stringify(eventToSave));
        localStorage.setItem("pendingAction", "add-event");
        window.location.href = `/signup?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      toast.error("حدث خطأ. الرجاء المحاولة مرة أخرى");
    }
  };

  const confirmSelection = () => {
    if (!modalEvent || !modalCategoryId) return;

    // بناء الخيارات يدوياً من selections
    const selectedOptionsForStorage: any[] = [];
    let calculatedPrice = Number(modalEvent.price);

    // التحقق من المجموعات الإجبارية وجمع الخيارات المحددة
    if (modalEvent.option_groups && modalEvent.option_groups.length > 0) {
      for (const group of modalEvent.option_groups) {
        const selectedIds = selections[group.id] || [];

        // التحقق من المجموعات الإجبارية
        if (group.isRequired && selectedIds.length === 0) {
          toast.error(`الرجاء اختيار ${group.name}`);
          return;
        }

        // جمع الخيارات المحددة
        for (const optId of selectedIds) {
          const option = group.options.find((o) => o.id === optId);
          if (option) {
            selectedOptionsForStorage.push({
              id: option.id,
              name: option.name,
              price: option.price,
              optionId: option.id,
            });
            calculatedPrice += Number(option.price);
          }
        }
      }
    }

    // حفظ في selectedItems
    setSelectedItems((prev) => ({
      ...prev,
      [modalCategoryId]: {
        item: modalEvent,
        quantity: quantity,
        selectedOptions: selectedOptionsForStorage,
        finalPrice: calculatedPrice,
      },
    }));

    toast.success(`تم اختيار ${modalEvent.name} للباقة`);
    setModalEvent(null);
  };

  const removeSelection = (categoryId: string) => {
    setSelectedItems((prev) => {
      const newSelected = { ...prev };
      delete newSelected[categoryId];
      return newSelected;
    });
    toast.success("تم إزالة العنصر من الباقة");
  };

  const addPackageToCart = () => {
    // التحقق من اكتمال الباقة
    if (!isComplete) {
      toast.error(`الرجاء اختيار عنصر من الأقسام المتبقية: ${remainingCategories.map(c => c.title).join('، ')}`);
      return;
    }

    let totalPrice = 0;

    for (const [catId, data] of Object.entries(selectedItems)) {
      if (data) {
        const category = eventCategories.find((c) => c.id === catId);
        if (category) {
          // تحويل الخيارات مع التأكد من وجود optionId
          const optionsForCart = data.selectedOptions.map((opt: any) => ({
            id: opt.id,
            name: opt.name,
            price: opt.price,
            optionId: opt.optionId || opt.id,
          }));

          for (let i = 0; i < data.quantity; i++) {
            addToCart({
              productId: Number(data.item.id),
              name: data.item.name,
              basePrice: Number(data.item.price),
              finalPrice: Number(data.finalPrice),
              category: "مناسبات",
              selectedOptions: optionsForCart,
            });
          }
          totalPrice += Number(data.finalPrice) * data.quantity;
        }
      }
    }

    toast.success(`تمت إضافة باقة المناسبات إلى السلة (إجمالي ${totalPrice.toFixed(2)} د.ل)`);
    setSelectedItems({});
  };

  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return "/placeholder.svg";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/")) return url;
    return `/${url}`;
  };

  const getCategoryIcon = (catTitle: string, customIcon?: string | null) => {
    if (customIcon) return customIcon;
    for (const [key, value] of Object.entries(categoryIcons)) {
      if (catTitle.includes(key)) {
        return value.icon;
      }
    }
    return categoryIcons.default.icon;
  };

  const getCategoryBg = (catTitle: string) => {
    for (const [key, value] of Object.entries(categoryIcons)) {
      if (catTitle.includes(key)) {
        return value.bg;
      }
    }
    return categoryIcons.default.bg;
  };

  return (
    <section
      ref={sectionRef}
      id="events"
      className="bg-gradient-to-b from-[var(--royal-red-dark)] to-[#2a0a0f] relative overflow-hidden py-16 md:py-24"
    >
      {/* عناصر زخرفية في الخلفية */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-[var(--gold)] blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-[var(--gold)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* العنوان مع مؤشر التقدم */}
        <div
          className="text-center mb-8 md:mb-12 transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
          }}
        >
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <div className="w-12 h-0.5 bg-gradient-to-l from-[var(--gold)] to-transparent" />
            <Calendar className="h-6 w-6 text-[var(--gold)]" />
            <div className="w-12 h-0.5 bg-gradient-to-r from-[var(--gold)] to-transparent" />
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--gold)] mb-4">
            باقة المناسبات
          </h2>
          <p className="text-base md:text-lg text-[var(--gold)]/60 max-w-2xl mx-auto">
            اختر عنصراً واحداً من كل قسم لتكوين باقة المناسبات المثالية
          </p>
          
          {/* شريط التقدم */}
          {totalCategories > 0 && (
            <div className="max-w-md mx-auto mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-[var(--gold)]/60">تقدم الباقة</span>
                <span className="text-sm font-bold text-[var(--gold)]">
                  {selectedCount} / {totalCategories}
                </span>
              </div>
              <div className="h-2 bg-[var(--gold)]/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* حالة التحميل */}
        {loadingEvents ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-[var(--gold)]/20 border-t-[var(--gold)] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Gift className="h-6 w-6 text-[var(--gold)]/50" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* شبكة التصنيفات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {eventCategories.map((cat, catIdx) => {
                const catBg = getCategoryBg(cat.title);
                const catIcon = getCategoryIcon(cat.title, cat.icon);
                const isSelected = !!selectedItems[cat.id];
                const selectedItem = selectedItems[cat.id];

                return (
                  <div
                    key={cat.id}
                    className={`group relative rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${
                      isSelected ? 'ring-2 ring-[var(--gold)] shadow-xl' : ''
                    }`}
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateY(0)" : "translateY(20px)",
                      transition: `opacity 0.5s ease ${catIdx * 0.1}s, transform 0.5s ease ${catIdx * 0.1}s`,
                    }}
                  >
                    {/* خلفية متدرجة */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${catBg} opacity-50`} />

                    {/* حدود متوهجة */}
                    <div className="absolute inset-0 border border-[var(--gold)]/20 group-hover:border-[var(--gold)]/40 rounded-2xl transition-colors duration-300" />

                    {/* المحتوى */}
                    <div className="relative bg-[var(--royal-red-light)]/40 backdrop-blur-sm p-6 md:p-8">
                      {/* رأس التصنيف */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-[var(--gold)]/20 rounded-xl blur-md group-hover:blur-lg transition-all" />
                            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--gold)]/20 to-[var(--gold)]/5 border border-[var(--gold)]/30 flex items-center justify-center text-2xl">
                              {catIcon}
                            </div>
                          </div>
                          <h3 className="text-lg md:text-xl font-bold text-[var(--cream)] group-hover:text-[var(--gold)] transition-colors">
                            {cat.title}
                          </h3>
                        </div>

                        {/* حالة الاختيار */}
                        {isSelected && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-5 w-5 text-[var(--gold)]" />
                          </div>
                        )}
                      </div>

                      {/* العنصر المختار (إذا وجد) */}
                      {isSelected && selectedItem && (
                        <div className="mb-4 p-3 bg-[var(--gold)]/10 rounded-xl border border-[var(--gold)]/30">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-[var(--gold)]">{selectedItem.item.name}</h4>
                            <button
                              onClick={() => removeSelection(cat.id)}
                              className="p-1 hover:bg-red-500/20 rounded-full transition-colors"
                            >
                              <X className="h-4 w-4 text-red-400" />
                            </button>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[var(--gold)]/60">الكمية:</span>
                            <span className="text-[var(--cream)]">{selectedItem.quantity}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-[var(--gold)]/60">السعر:</span>
                            <span className="text-[var(--gold)] font-bold">{selectedItem.finalPrice} د.ل</span>
                          </div>
                        </div>
                      )}

                      {/* شبكة المنتجات - تظهر فقط إذا لم يتم الاختيار */}
                      {!isSelected && (
                        <div className="grid grid-cols-2 gap-3">
                          {cat.items.slice(0, 4).map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleEventSelection(item.fullEvent || null, cat.id)}
                              className="group/item relative rounded-lg overflow-hidden transition-all duration-300 hover:scale-105"
                            >
                              <div className="aspect-square">
                                {item.image_url ? (
                                  <img
                                    src={getImageUrl(item.image_url)}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-[var(--royal-red-light)] to-[var(--royal-red-dark)] flex items-center justify-center">
                                    <Gift className="h-6 w-6 text-[var(--gold)]/30" />
                                  </div>
                                )}
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-[var(--royal-red-dark)] via-transparent to-transparent" />
                              <div className="absolute bottom-0 left-0 right-0 p-2">
                                <p className="text-xs font-bold text-[var(--cream)] truncate">
                                  {item.name}
                                </p>
                                <p className="text-[10px] text-[var(--gold)]">
                                  {item.price} د.ل
                                </p>
                              </div>
                            </button>
                          ))}
                          
                          {/* زر عرض المزيد إذا كان هناك أكثر من 4 عناصر */}
                          {cat.items.length > 4 && (
                            <button
                              onClick={() => handleEventSelection(cat.items[0].fullEvent || null, cat.id)}
                              className="col-span-2 mt-2 py-2 text-xs bg-[var(--gold)]/10 rounded-lg border border-[var(--gold)]/30 text-[var(--gold)] hover:bg-[var(--gold)]/20 transition-colors"
                            >
                              + {cat.items.length - 4} عناصر أخرى
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* شريط الباقة - يظهر عند اختيار عنصر واحد على الأقل */}
            {selectedCount > 0 && (
              <div className="sticky bottom-6 mt-12 z-20 animate-slide-up">
                <div className="relative max-w-4xl mx-auto">
                  {/* تأثير التوهج */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-[var(--gold)]/30 via-[var(--gold)]/20 to-transparent rounded-3xl blur-2xl" />

                  {/* المحتوى */}
                  <div className="relative bg-gradient-to-br from-[var(--royal-red-dark)] to-[#1a0a0f] backdrop-blur-xl border-2 border-[var(--gold)]/30 rounded-2xl p-6 shadow-2xl">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {/* أيقونة السلة مع عداد */}
                        <div className="relative">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--gold)]/20 to-[var(--gold)]/5 border-2 border-[var(--gold)]/30 flex items-center justify-center">
                            <Package className="h-7 w-7 text-[var(--gold)]" />
                          </div>
                          <div className="absolute -top-2 -right-2 min-w-[24px] h-6 px-1.5 rounded-full bg-[var(--gold)] border-2 border-[var(--royal-red-dark)] flex items-center justify-center">
                            <span className="text-xs font-bold text-[var(--royal-red-dark)]">
                              {selectedCount}
                            </span>
                          </div>
                        </div>

                        {/* معلومات الباقة */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-[var(--gold)]/60">باقة المناسبات</span>
                            <div className="w-1 h-1 rounded-full bg-[var(--gold)]/40" />
                            <span className="text-xs text-[var(--gold)]/40">
                              {isComplete ? 'اكتملت الباقة' : `متبقي ${remainingCategories.length} أقسام`}
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-[var(--gold)]">
                            {Object.values(selectedItems).reduce((sum, data) => 
                              sum + (data ? data.finalPrice * data.quantity : 0), 0
                            ).toFixed(2)}{" "}
                            <span className="text-sm text-[var(--gold)]/60">د.ل</span>
                          </div>
                        </div>
                      </div>

                      {/* زر الإضافة */}
                      <button
                        onClick={addPackageToCart}
                        disabled={!isComplete}
                        className={`group/btn relative overflow-hidden px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl w-full sm:w-auto ${
                          isComplete
                            ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-[var(--royal-red-dark)] hover:scale-105 shadow-[var(--gold)]/30'
                            : 'bg-gray-600/50 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {isComplete ? (
                            <>
                              <ShoppingCart className="h-5 w-5 transition-transform group-hover/btn:rotate-12" />
                              أضف الباقة إلى السلة
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-5 w-5" />
                              أكمل اختيار الأقسام
                            </>
                          )}
                        </span>
                      </button>
                    </div>

                    {/* رسالة الأقسام المتبقية */}
                    {!isComplete && remainingCategories.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[var(--gold)]/20">
                        <p className="text-sm text-[var(--gold)]/60 flex items-center gap-2">
                          <ArrowLeft className="h-4 w-4" />
                          الأقسام المتبقية: {remainingCategories.map(c => c.title).join(' • ')}
                        </p>
                      </div>
                    )}
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
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--gold)]/30 bg-gradient-to-b from-[var(--royal-red-dark)] to-[#1a0a0f] shadow-2xl animate-in zoom-in-95 duration-300"
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
              <div className="relative h-56 w-full overflow-hidden">
                <img
                  src={getImageUrl(modalEvent.image_url)}
                  alt={modalEvent.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--royal-red-dark)] via-[var(--royal-red-dark)]/50 to-transparent" />
                <div className="absolute bottom-4 right-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[var(--gold)] blur-md opacity-50" />
                    <span className="relative bg-[var(--gold)] text-[var(--royal-red-dark)] px-4 py-2 rounded-xl font-bold text-lg">
                      {Number(modalEvent.price).toFixed(2)} د.ل
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-[var(--cream)] mb-2">
                  {modalEvent.name}
                </h3>
                {modalEvent.description && (
                  <p className="text-sm text-[var(--gold)]/60 leading-relaxed">
                    {modalEvent.description}
                  </p>
                )}
              </div>

              {/* Option Groups */}
              {modalEvent.option_groups && modalEvent.option_groups.length > 0 ? (
                <div className="mb-6 space-y-6">
                  {modalEvent.option_groups.map((group) => (
                    <div key={group.id} className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="text-sm font-bold text-[var(--gold)]">
                          {group.name}
                        </h4>
                        {group.isRequired && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                            مطلوب
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {group.options.map((opt) => {
                          const isSelected = selections[group.id]?.includes(opt.id) || false;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => toggleOption(group.id, opt.id)}
                              className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all duration-200 ${
                                isSelected
                                  ? "border-[var(--gold)] bg-[var(--gold)]/10"
                                  : "border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                                    isSelected
                                      ? "border-[var(--gold)] bg-[var(--gold)]"
                                      : "border-white/20 bg-transparent"
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3 text-[var(--royal-red-dark)]" />}
                                </div>
                                <span className={`text-sm font-medium ${isSelected ? "text-[var(--gold)]" : "text-[var(--cream)]"}`}>
                                  {opt.name}
                                </span>
                              </div>
                              {opt.price > 0 && (
                                <span className="text-sm font-bold text-green-400">
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
                <div className="mb-6 text-center py-8 bg-white/5 rounded-xl">
                  <p className="text-sm text-[var(--gold)]/40">
                    لا توجد خيارات إضافية لهذه المناسبة
                  </p>
                </div>
              )}

              {/* Quantity selector */}
              <div className="mb-6 bg-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--gold)]">الكمية</span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-xl bg-[var(--gold)]/10 hover:bg-[var(--gold)]/20 border border-[var(--gold)]/20 flex items-center justify-center text-[var(--gold)] transition-all"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-xl font-bold text-[var(--gold)] min-w-[40px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                      className="w-10 h-10 rounded-xl bg-[var(--gold)]/10 hover:bg-[var(--gold)]/20 border border-[var(--gold)]/20 flex items-center justify-center text-[var(--gold)] transition-all"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Total Price */}
              <div className="mb-6 bg-gradient-to-br from-[var(--gold)]/10 to-transparent rounded-xl p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--gold)]/60">سعر القطعة:</span>
                    <span className="font-bold text-[var(--gold)]">
                      {(calculatedResult?.price || modalEvent.price).toFixed(2)} د.ل
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[var(--gold)]/20">
                    <span className="text-base font-bold text-[var(--gold)]">الإجمالي:</span>
                    <span className="text-2xl font-bold text-[var(--gold)]">
                      {((calculatedResult?.price || modalEvent.price) * quantity).toFixed(2)} د.ل
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirm button */}
              <button
                onClick={confirmSelection}
                className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-[var(--royal-red-dark)] hover:scale-[1.02] transition-all duration-300 shadow-xl shadow-[var(--gold)]/30 flex items-center justify-center gap-2"
              >
                <Check className="h-5 w-5" />
                <span>تأكيد الاختيار ({quantity} قطعة)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}