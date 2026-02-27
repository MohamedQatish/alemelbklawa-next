"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, ShoppingCart, Loader2 } from "lucide-react";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";

interface DBEvent {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_featured: boolean;
  icon: string | null;
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
        })),
    }))
    .filter((c) => c.items.length > 0);
}

export default function EventsSection() {
  const [eventCategories, setEventCategories] = useState<EventCategory[]>(
    makeFallbackCategories,
  );
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selections, setSelections] = useState<Record<string, string | null>>(
    {},
  );
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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

  function selectItem(categoryId: string, itemId: string) {
    setSelections((prev) => ({
      ...prev,
      [categoryId]: prev[categoryId] === itemId ? null : itemId,
    }));
  }

  function addPackageToCart() {
    let added = 0;
    for (const cat of eventCategories) {
      const selectedId = selections[cat.id];
      if (selectedId) {
        const item = cat.items.find((i) => i.id === selectedId);
        if (item) {
          addToCart({
            productId: parseInt(item.id),
            name: item.name,
            basePrice: item.price,
            finalPrice: item.price,
            category: "مناسبات",
            selectedOptions: [],
          });
          added++;
        }
      }
    }
    if (added > 0) {
      toast.success(`تمت إضافة ${added} عناصر إلى السلة`);
      setSelections({});
    } else {
      toast.error("يرجى اختيار عنصر واحد على الأقل");
    }
  }

  const selectedCount = Object.values(selections).filter(Boolean).length;

  return (
    <section
      ref={sectionRef}
      id="events"
      className="bg-royal-red-dark relative overflow-hidden py-16 md:py-24"
    >
      {/* الخلفية كما هي - بدون تغيير */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-l from-transparent via-[var(--gold)]/40 to-transparent" />
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          width: "800px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, hsl(43 65% 52% / 0.03) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* العنوان - أصغر للموبايل */}
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
            اختر من كل قسم عنصر واحد لباقة المناسبات
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
            {/* شبكة التصنيفات - قياسات محسنة للموبايل */}
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
                  {/* رأس التصنيف - مبسط للموبايل */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[var(--gold)]/10 flex items-center justify-center">
                      <span className="text-xl md:text-2xl">
                        {cat.icon || "🎉"}
                      </span>
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-[var(--cream)] group-hover:text-[var(--gold)] transition-colors">
                      {cat.title}
                    </h3>
                  </div>

                  {/* شبكة المنتجات - 2 عمود للموبايل */}
                  <div className="grid grid-cols-2 gap-2">
                    {cat.items.map((item) => {
                      const isSelected = selections[cat.id] === item.id;
                      const imageUrl = item.image_url
                        ? item.image_url.startsWith("http")
                          ? item.image_url
                          : `/${item.image_url}`
                        : null;

                      return (
                        <button
                          key={item.id}
                          onClick={() => selectItem(cat.id, item.id)}
                          className={`group/item relative rounded-lg overflow-hidden transition-all duration-200 ${
                            isSelected
                              ? "ring-1 ring-[var(--gold)] ring-offset-1 ring-offset-[var(--royal-red-dark)]"
                              : "hover:ring-1 hover:ring-[var(--gold)]/30"
                          }`}
                        >
                          {/* الصورة - بحجم مناسب للموبايل */}
                          <div className="aspect-square bg-[var(--royal-red-dark)]">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-110"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "/placeholder.svg";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-2xl opacity-30">🎂</span>
                              </div>
                            )}

                            {/* شارة مميز - مصغرة */}
                            {item.is_featured && (
                              <span className="absolute top-0.5 right-0.5 bg-[var(--gold)] text-[6px] md:text-[8px] font-bold px-1 py-0.5 rounded-full text-[var(--royal-red-dark)]">
                                مميز
                              </span>
                            )}

                            {/* علامة الاختيار - تظهر عند التحديد */}
                            {isSelected && (
                              <div className="absolute inset-0 bg-[var(--gold)]/10 flex items-center justify-center">
                                <div className="w-5 h-5 rounded-full bg-[var(--gold)] flex items-center justify-center">
                                  <Check className="h-3 w-3 text-[var(--royal-red-dark)]" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* معلومات المنتج - مدمجة */}
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

            {/* شريط السلة المتطور - ثابت في الأسفل للموبايل */}
            <div className="sticky bottom-4 mt-8 md:relative md:bottom-auto md:mt-12 z-10">
              <div className="relative">
                {/* تأثير التوهج الخلفي */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--gold)]/20 via-[var(--gold)]/10 to-transparent rounded-2xl blur-xl opacity-70 group-hover:opacity-100 transition-opacity" />

                {/* المحتوى الرئيسي */}
                <div className="relative bg-gradient-to-br from-[var(--royal-red-dark)] to-[var(--royal-red-light)] backdrop-blur-md border-2 border-[var(--gold)]/30 rounded-2xl p-4 md:p-5 shadow-2xl shadow-black/50">
                  {/* شريط التقدم - يظهر عند اختيار عناصر */}
                  {selectedCount > 0 && (
                    <div className="absolute -top-1 left-4 right-4 h-1 bg-[var(--gold)]/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] rounded-full transition-all duration-500"
                        style={{
                          width: `${(selectedCount / eventCategories.length) * 100}%`,
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    {/* الجهة اليسرى - معلومات الباقة */}
                    <div className="flex items-center gap-3">
                      {/* أيقونة السلة مع العداد */}
                      <div className="relative">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[var(--gold)]/20 to-[var(--gold)]/5 border border-[var(--gold)]/30 flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-[var(--gold)]" />
                        </div>
                        {selectedCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--gold)] border-2 border-[var(--royal-red-dark)] flex items-center justify-center animate-pulse">
                            <span className="text-[10px] font-bold text-[var(--royal-red-dark)]">
                              {selectedCount}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* تفاصيل الباقة */}
                      <div className="flex flex-col">
                        <span className="text-xs text-[var(--gold)]/60">
                          باقة المناسبات
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg md:text-xl font-bold text-[var(--gold)]">
                            {selectedCount}
                          </span>
                          <span className="text-xs text-[var(--gold)]/40">
                            من {eventCategories.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* الجهة اليمنى - زر الشراء */}
                    <div className="flex items-center gap-2">
                      {/* السعر الإجمالي - يظهر عند الاختيار */}
                      {selectedCount > 0 && (
                        <div className="hidden sm:block text-left">
                          <span className="text-[10px] text-[var(--gold)]/40">
                            الإجمالي
                          </span>
                          <div className="text-sm font-bold text-[var(--gold)]">
                            {selectedCount * 50}{" "}
                            <span className="text-[10px]">د.ل</span>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={addPackageToCart}
                        disabled={selectedCount === 0}
                        className={`relative group/btn px-5 md:px-6 py-2.5 md:py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
                          selectedCount > 0
                            ? "bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-[var(--royal-red-dark)] hover:scale-105 active:scale-100 shadow-lg shadow-[var(--gold)]/30 hover:shadow-xl hover:shadow-[var(--gold)]/40"
                            : "bg-[var(--gold)]/5 text-[var(--gold)]/30 cursor-not-allowed border border-[var(--gold)]/10"
                        }`}
                      >
                        <ShoppingCart
                          className={`h-4 w-4 transition-transform duration-300 ${
                            selectedCount > 0
                              ? "group-hover/btn:scale-110 group-hover/btn:rotate-[-5deg]"
                              : ""
                          }`}
                        />
                        <span className="hidden xs:inline">
                          {selectedCount > 0 ? "أضف الباقة" : "اختر عناصر"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* رسالة تأكيد سريعة - تظهر عند اكتمال الباقة */}
                  {selectedCount === eventCategories.length &&
                    selectedCount > 0 && (
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="text-[10px] text-[var(--gold)]/60 bg-[var(--royal-red-dark)]/80 px-2 py-1 rounded-full border border-[var(--gold)]/20 animate-bounce">
                          ✨ اكتملت الباقة! اضفها الآن
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
