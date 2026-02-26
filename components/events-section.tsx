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

/* Unified category shape used in render */
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
  // استخراج التصنيفات الفريدة من قاعدة البيانات
  const catOrder: string[] = [];
  for (const ev of dbEvents) {
    if (!catOrder.includes(ev.category)) catOrder.push(ev.category);
  }

  return catOrder
    .map((catName) => {
      const firstEvent = dbEvents.find((ev) => ev.category === catName);
      return {
        id: `cat-${catName}`, // استخدام اسم التصنيف كـ id
        title: catName, // اسم التصنيف مباشرة من قاعدة البيانات
        icon:
          dbEvents.find((ev) => ev.category === catName && ev.icon)?.icon ||
          null,
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
      };
    })
    .filter((c) => c.items.length > 0);
}

function EventCategoryIcon({ icon }: { icon?: string | null }) {
  if (icon) {
    return <span className="text-4xl">{icon}</span>;
  }

  // أيقونة افتراضية للمناسبات
  return <span className="text-4xl">🎉</span>;
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

  /* Fetch events from the database API */
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
      className="bg-royal-red-dark relative overflow-hidden py-24"
    >
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-l from-transparent via-[var(--gold)]/40 to-transparent" />

      {/* Subtle ambient glow */}
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

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Title */}
        <div
          className="mb-16 text-center transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
          }}
        >
          <h2 className="animate-shimmer mb-4 text-4xl font-bold md:text-5xl">
            المناسبات
          </h2>
          <p className="text-gold/50 mx-auto max-w-lg text-lg">
            اختر من كل قسم عنصر واحد لباقة المناسبات
          </p>
          <div className="mx-auto mt-5 h-1 w-24 rounded-full bg-[var(--gold)]/50" />
        </div>

        {/* Loading State */}
        {loadingEvents ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--gold)]/40" />
          </div>
        ) : (
          <>
            {/* Category Cards Grid */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {eventCategories.map((cat, catIdx) => (
                <div
                  key={cat.id}
                  className="group rounded-2xl border border-[var(--gold)]/15 bg-[var(--royal-red-light)]/50 p-7 backdrop-blur-sm transition-all duration-500 hover:border-[var(--gold)]/30 hover:shadow-[0_0_25px_hsl(43_65%_52%/0.08)]"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(28px)",
                    transitionDelay: `${catIdx * 150 + 200}ms`,
                  }}
                >
                  {/* Category Icon + Title */}
                  <div className="mb-6 flex flex-col items-center gap-3 text-center">
                    <div className="menu-icon-3d">
                      <div className="menu-icon-3d-inner">
                        <EventCategoryIcon icon={cat.icon} />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-[var(--cream)] transition-colors duration-300 group-hover:text-[var(--gold)]">
                      {cat.title}
                    </h3>
                    <div className="mx-auto h-px w-16 bg-gradient-to-l from-transparent via-[var(--gold)]/30 to-transparent transition-all duration-400 group-hover:w-24 group-hover:via-[var(--gold)]/50" />
                  </div>

                  {/* Items */}
                  <div className="flex flex-col gap-3">
                    {cat.items.map((item) => {
                      const isSelected = selections[cat.id] === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => selectItem(cat.id, item.id)}
                          className={`flex items-center justify-between rounded-xl px-5 py-4 transition-all duration-300 ${
                            isSelected
                              ? "border-2 border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)] shadow-[0_0_15px_hsl(43_65%_52%/0.1)]"
                              : "border border-[var(--gold)]/12 text-[var(--gold)]/60 hover:border-[var(--gold)]/35 hover:bg-[var(--gold)]/5 hover:text-[var(--gold)]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                isSelected
                                  ? "border-[var(--gold)] bg-[var(--gold)] shadow-[0_0_8px_hsl(43_65%_52%/0.3)]"
                                  : "border-[var(--gold)]/25"
                              }`}
                            >
                              {isSelected && (
                                <Check className="h-4 w-4 text-[var(--royal-red-dark)]" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-right">
                              {item.icon && (
                                <span className="text-lg">{item.icon}</span>
                              )}
                              {item.image_url && (
                                <img
                                  src={
                                    item.image_url.startsWith("http")
                                      ? item.image_url
                                      : `/${item.image_url}`
                                  }
                                  alt={item.name}
                                  className="h-8 w-8 rounded-md object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "/placeholder.svg";
                                  }}
                                />
                              )}
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </div>
                          <span className="text-sm font-bold">
                            {item.price} د.ل
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-14 text-center">
              <button
                onClick={addPackageToCart}
                className="btn-shimmer inline-flex items-center gap-3 rounded-full border-2 border-[var(--gold)] px-10 py-4 text-lg font-bold transition-all duration-300 hover:scale-105"
                style={{
                  background:
                    selectedCount > 0
                      ? "linear-gradient(135deg, hsl(43 65% 48%), hsl(43 70% 58%))"
                      : "hsl(43 65% 52% / 0.08)",
                  color:
                    selectedCount > 0 ? "hsl(350 76% 10%)" : "hsl(43 65% 52%)",
                  boxShadow:
                    selectedCount > 0
                      ? "0 0 25px hsl(43 65% 52% / 0.3), 0 4px 15px hsl(0 0% 0% / 0.2)"
                      : "none",
                }}
              >
                <ShoppingCart className="h-5 w-5" />
                أضف الباقة إلى السلة
                {selectedCount > 0 && (
                  <span className="mr-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--royal-red-dark)] text-xs font-bold text-[var(--gold)]">
                    {selectedCount}
                  </span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
