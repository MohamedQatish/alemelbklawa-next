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
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Package,
} from "lucide-react";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";
import Image from "next/image";

// ===== مكون محسّن للصور =====
const OptimizedImage = ({ 
  src, 
  alt, 
  priority = false,
  className = "",
  aspectRatio = "aspect-square"
}: { 
  src: string; 
  alt: string; 
  priority?: boolean;
  className?: string;
  aspectRatio?: string;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const optimizedSrc = useMemo(() => {
    if (!src) return "/placeholder.svg";
    if (src.startsWith("http")) return src;
    if (src.startsWith("/")) return src;
    return `/${src}`;
  }, [src]);

  if (error) {
    return (
      <div className={`${aspectRatio} w-full bg-gradient-to-br from-[var(--royal-red-light)] to-[var(--royal-red-dark)] flex items-center justify-center ${className}`}>
        <Gift className="h-8 w-8 text-[var(--gold)]/30" />
      </div>
    );
  }

  return (
    <div className={`relative ${aspectRatio} w-full overflow-hidden bg-[var(--royal-red-light)]/20 ${className}`}>
      <Image
        src={optimizedSrc}
        alt={alt}
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        quality={85}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setIsLoading(false)}
        onError={() => setError(true)}
        className={`
          object-cover transition-all duration-500
          ${isLoading ? 'scale-110 blur-xl' : 'scale-100 blur-0'}
        `}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--royal-red-light)]/30">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]/50" />
        </div>
      )}
    </div>
  );
};

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

// أيقونات افتراضية للمناسبات (مبسطة)
const categoryIcons: Record<string, { icon: string; bg: string }> = {
  أعراس: { icon: "💍", bg: "from-pink-500/20 to-rose-500/20" },
  تخرج: { icon: "🎓", bg: "from-blue-500/20 to-indigo-500/20" },
  ميلاد: { icon: "🎂", bg: "from-yellow-500/20 to-amber-500/20" },
  خطوبة: { icon: "💑", bg: "from-purple-500/20 to-pink-500/20" },
  اجتماعات: { icon: "🤝", bg: "from-gray-500/20 to-slate-500/20" },
  default: { icon: "🎉", bg: "from-[var(--gold)]/20 to-[var(--gold)]/5" },
};

function makeDBCategories(dbEvents: DBEvent[]): EventCategory[] {
  const catOrder = [...new Set(dbEvents.map(ev => ev.category))];
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
  const [eventCategories, setEventCategories] = useState<EventCategory[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItem | null>>({});
  const [modalEvent, setModalEvent] = useState<DBEvent | null>(null);
  const [modalCategoryId, setModalCategoryId] = useState<string>("");
  const [selections, setSelections] = useState<Record<number, number[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [priceCache, setPriceCache] = useState<Record<string, { price: number; options: any[] }>>({});

  // حسابات سريعة
  const selectedCount = Object.keys(selectedItems).length;
  const totalCategories = eventCategories.length;
  const isComplete = selectedCount === totalCategories && totalCategories > 0;
  const progressPercentage = totalCategories > 0 ? (selectedCount / totalCategories) * 100 : 0;
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
      // silent fail
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

    const allSelections: Record<number, number[]>[] = [{}];
    event.option_groups.forEach((group) => {
      group.options.forEach((opt) => {
        allSelections.push({ [group.id]: [opt.id] });
      });
    });

    const newCache = { ...priceCache };

    for (const selection of allSelections) {
      const key = JSON.stringify(selection);
      if (newCache[key]) continue;

      const selectedOptionIds = Object.entries(selection).flatMap(
        ([gId, optIds]) => optIds.map((oid) => ({ optionId: oid }))
      );

      if (selectedOptionIds.length === 0) {
        newCache[key] = { price: Number(event.price), options: [] };
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
          newCache[key] = { price: Number(data.finalPrice), options: data.selectedOptions };
        }
      } catch {
        // تجاهل الأخطاء
      }
    }

    setPriceCache(newCache);
  };

  const calculatedResult = useMemo(() => {
    if (!modalEvent) return null;

    const key = JSON.stringify(selections);
    if (priceCache[key]) return priceCache[key];

    let total = Number(modalEvent.price);
    const options: any[] = [];

    Object.entries(selections).forEach(([gId, optIds]) => {
      const group = modalEvent.option_groups?.find((g) => g.id === Number(gId));
      if (group) {
        optIds.forEach((oid) => {
          const opt = group.options.find((o) => o.id === oid);
          if (opt) {
            total += Number(opt.price);
            options.push({ id: opt.id, name: opt.name, price: opt.price });
          }
        });
      }
    });

    return { price: total, options };
  }, [modalEvent, selections, priceCache]);

  const toggleOption = useCallback((groupId: number, optionId: number) => {
    setSelections((prev) => {
      const group = modalEvent?.option_groups?.find((g) => g.id === groupId);
      if (!group) return prev;

      const current = prev[groupId] || [];

      if (group.selectionType === "single") {
        return current[0] === optionId ? prev : { ...prev, [groupId]: [optionId] };
      } else {
        if (current.includes(optionId)) {
          return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
        } else {
          if (group.maxSelect && current.length >= group.maxSelect) {
            toast.error(`يمكنك اختيار ${group.maxSelect} خيارات كحد أقصى`);
            return prev;
          }
          return { ...prev, [groupId]: [...current, optionId] };
        }
      }
    });
  }, [modalEvent]);

  const handleEventSelection = async (event: DBEvent | null, categoryId: string) => {
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
    } catch {
      toast.error("حدث خطأ. الرجاء المحاولة مرة أخرى");
    }
  };

  const confirmSelection = () => {
    if (!modalEvent || !modalCategoryId) return;

    const selectedOptionsForStorage: any[] = [];
    let calculatedPrice = Number(modalEvent.price);

    if (modalEvent.option_groups?.length) {
      for (const group of modalEvent.option_groups) {
        const selectedIds = selections[group.id] || [];

        if (group.isRequired && selectedIds.length === 0) {
          toast.error(`الرجاء اختيار ${group.name}`);
          return;
        }

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
    if (!isComplete) {
      toast.error(`الرجاء اختيار عنصر من الأقسام المتبقية: ${remainingCategories.map(c => c.title).join('، ')}`);
      return;
    }

    const packageId = `package-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const packageItems: any[] = [];
    let totalPackagePrice = 0;

    for (const [catId, data] of Object.entries(selectedItems)) {
      if (data) {
        packageItems.push({
          productId: Number(data.item.id),
          name: data.item.name,
          basePrice: Number(data.item.price),
          finalPrice: Number(data.finalPrice),
          category: "مناسبات",
          selectedOptions: data.selectedOptions.map((opt: any) => ({
            id: opt.id,
            name: opt.name,
            price: opt.price,
          })),
          quantity: data.quantity,
        });
        totalPackagePrice += Number(data.finalPrice) * data.quantity;
      }
    }

    addToCart({
      productId: -1,
      name: "باقة المناسبات",
      basePrice: totalPackagePrice,
      finalPrice: totalPackagePrice,
      category: "package",
      selectedOptions: [],
      notes: JSON.stringify({ packageId, items: packageItems })
    });

    toast.success(`تمت إضافة الباقة إلى السلة (إجمالي ${totalPackagePrice.toFixed(2)} د.ل)`);
    setSelectedItems({});
  };

  const getCategoryIcon = (catTitle: string, customIcon?: string | null) => {
    if (customIcon) return customIcon;
    return categoryIcons[catTitle]?.icon || categoryIcons.default.icon;
  };

  const getCategoryBg = (catTitle: string) => {
    return categoryIcons[catTitle]?.bg || categoryIcons.default.bg;
  };

  return (
    <section
      ref={sectionRef}
      id="events"
      className="bg-gradient-to-b from-[var(--royal-red-dark)] to-[#2a0a0f] relative overflow-hidden py-16 md:py-24"
    >
      {/* خلفية ثابتة */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-[var(--gold)] blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-[var(--gold)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* العنوان */}
        <div
          className="text-center mb-8 md:mb-12 transition-opacity duration-700"
          style={{ opacity: visible ? 1 : 0 }}
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
            اختر عنصراً واحداً من كل قسم لتكوين الباقة المثالية
          </p>
          
          {/* شريط التقدم */}
          {totalCategories > 0 && (
            <div className="max-w-md mx-auto mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-[var(--gold)]/60">تقدم الباقة</span>
                <span className="text-sm font-bold text-[var(--gold)]">
                  {selectedCount}/{totalCategories}
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
                    className={`group relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                      isSelected ? 'ring-2 ring-[var(--gold)]' : ''
                    }`}
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateY(0)" : "translateY(20px)",
                      transition: `opacity 0.5s ease ${catIdx * 0.1}s, transform 0.5s ease ${catIdx * 0.1}s`,
                    }}
                  >
                    {/* خلفية متدرجة */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${catBg} opacity-50`} />

                    {/* المحتوى */}
                    <div className="relative bg-[var(--royal-red-light)]/40 backdrop-blur-sm p-6 md:p-8">
                      {/* رأس التصنيف */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-[var(--gold)]/20 rounded-xl blur-md" />
                            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--gold)]/20 to-[var(--gold)]/5 border border-[var(--gold)]/30 flex items-center justify-center text-2xl">
                              {catIcon}
                            </div>
                          </div>
                          <h3 className="text-lg md:text-xl font-bold text-[var(--cream)]">
                            {cat.title}
                          </h3>
                        </div>

                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-[var(--gold)]" />
                        )}
                      </div>

                      {/* العنصر المختار */}
                      {isSelected && selectedItem && (
                        <div className="mb-4 p-3 bg-[var(--gold)]/10 rounded-xl border border-[var(--gold)]/30">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-[var(--gold)]">{selectedItem.item.name}</h4>
                            <button
                              onClick={() => removeSelection(cat.id)}
                              className="p-1 hover:bg-red-500/20 rounded-full"
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

                      {/* شبكة المنتجات */}
                      {!isSelected && (
                        <div className="grid grid-cols-2 gap-3">
                          {cat.items.slice(0, 4).map((item, idx) => (
                            <button
                              key={item.id}
                              onClick={() => handleEventSelection(item.fullEvent || null, cat.id)}
                              className="group/item relative rounded-lg overflow-hidden"
                            >
                              {item.image_url ? (
                                <OptimizedImage
                                  src={item.image_url}
                                  alt={item.name}
                                  priority={catIdx < 2 && idx < 2} // أول صورتين فقط أولوية
                                  aspectRatio="aspect-square"
                                />
                              ) : (
                                <div className="aspect-square bg-gradient-to-br from-[var(--royal-red-light)] to-[var(--royal-red-dark)] flex items-center justify-center">
                                  <Gift className="h-6 w-6 text-[var(--gold)]/30" />
                                </div>
                              )}
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
                          
                          {cat.items.length > 4 && (
                            <button
                              onClick={() => handleEventSelection(cat.items[0].fullEvent || null, cat.id)}
                              className="col-span-2 mt-2 py-2 text-xs bg-[var(--gold)]/10 rounded-lg border border-[var(--gold)]/30 text-[var(--gold)] hover:bg-[var(--gold)]/20"
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

            {/* شريط الباقة */}
            {selectedCount > 0 && (
              <div className="sticky bottom-6 mt-12 z-20">
                <div className="relative max-w-4xl mx-auto">
                  <div className="absolute -inset-2 bg-gradient-to-r from-[var(--gold)]/30 via-[var(--gold)]/20 to-transparent rounded-3xl blur-2xl" />
                  <div className="relative bg-gradient-to-br from-[var(--royal-red-dark)] to-[#1a0a0f] backdrop-blur-xl border-2 border-[var(--gold)]/30 rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--gold)]/20 to-[var(--gold)]/5 border-2 border-[var(--gold)]/30 flex items-center justify-center">
                            <Package className="h-7 w-7 text-[var(--gold)]" />
                          </div>
                          <div className="absolute -top-2 -right-2 min-w-[24px] h-6 px-1.5 rounded-full bg-[var(--gold)] border-2 border-[var(--royal-red-dark)]">
                            <span className="text-xs font-bold text-[var(--royal-red-dark)]">
                              {selectedCount}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-[var(--gold)]/60">باقة المناسبات</span>
                            <span className="text-xs text-[var(--gold)]/40">
                              {isComplete ? 'اكتملت' : `متبقي ${remainingCategories.length}`}
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-[var(--gold)]">
                            {Object.values(selectedItems).reduce((sum, data) => 
                              sum + (data ? data.finalPrice * data.quantity : 0), 0
                            ).toFixed(2)} د.ل
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={addPackageToCart}
                        disabled={!isComplete}
                        className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 w-full sm:w-auto ${
                          isComplete
                            ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-[var(--royal-red-dark)] hover:scale-105'
                            : 'bg-gray-600/50 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        <span className="flex items-center justify-center gap-2">
                          {isComplete ? (
                            <>
                              <ShoppingCart className="h-5 w-5" />
                              أضف الباقة
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-5 w-5" />
                              أكمل الاختيار
                            </>
                          )}
                        </span>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setModalEvent(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--gold)]/30 bg-gradient-to-b from-[var(--royal-red-dark)] to-[#1a0a0f]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalEvent(null)}
              className="absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--royal-red-light)] text-[var(--gold)]/70 hover:text-[var(--gold)]"
            >
              <X className="h-4 w-4" />
            </button>

            {modalEvent.image_url && (
              <div className="relative h-56 w-full overflow-hidden">
                <OptimizedImage
                  src={modalEvent.image_url}
                  alt={modalEvent.name}
                  priority={true}
                  aspectRatio="aspect-video"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--royal-red-dark)] via-[var(--royal-red-dark)]/50 to-transparent" />
                <div className="absolute bottom-4 right-4">
                  <span className="bg-[var(--gold)] text-[var(--royal-red-dark)] px-4 py-2 rounded-xl font-bold text-lg">
                    {Number(modalEvent.price).toFixed(2)} د.ل
                  </span>
                </div>
              </div>
            )}

            <div className="p-6">
              <h3 className="text-2xl font-bold text-[var(--cream)] mb-2">{modalEvent.name}</h3>
              {modalEvent.description && (
                <p className="text-sm text-[var(--gold)]/60 mb-6">{modalEvent.description}</p>
              )}

              {/* Option Groups */}
              {modalEvent.option_groups?.map((group) => (
                <div key={group.id} className="mb-6 bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-bold text-[var(--gold)]">{group.name}</h4>
                    {group.isRequired && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">مطلوب</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {group.options.map((opt) => {
                      const isSelected = selections[group.id]?.includes(opt.id) || false;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => toggleOption(group.id, opt.id)}
                          className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all ${
                            isSelected
                              ? "border-[var(--gold)] bg-[var(--gold)]/10"
                              : "border-white/10 bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                              isSelected ? "border-[var(--gold)] bg-[var(--gold)]" : "border-white/20"
                            }`}>
                              {isSelected && <Check className="h-3 w-3 text-[var(--royal-red-dark)]" />}
                            </div>
                            <span className={`text-sm font-medium ${isSelected ? "text-[var(--gold)]" : "text-[var(--cream)]"}`}>
                              {opt.name}
                            </span>
                          </div>
                          {opt.price > 0 && (
                            <span className="text-sm font-bold text-green-400">+{opt.price} د.ل</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Quantity selector */}
              <div className="mb-6 bg-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--gold)]">الكمية</span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center text-[var(--gold)]"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-xl font-bold text-[var(--gold)] min-w-[40px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(q => Math.min(10, q + 1))}
                      className="w-10 h-10 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center text-[var(--gold)]"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Total Price */}
              <div className="mb-6 bg-gradient-to-br from-[var(--gold)]/10 to-transparent rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-[var(--gold)]">الإجمالي:</span>
                  <span className="text-2xl font-bold text-[var(--gold)]">
                    {((calculatedResult?.price || modalEvent.price) * quantity).toFixed(2)} د.ل
                  </span>
                </div>
              </div>

              {/* Confirm button */}
              <button
                onClick={confirmSelection}
                className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-[var(--royal-red-dark)]"
              >
                <span className="flex items-center justify-center gap-2">
                  <Check className="h-5 w-5" />
                  تأكيد الاختيار ({quantity})
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}