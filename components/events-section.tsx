"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Check, ShoppingCart, Loader2 } from "lucide-react"
import { addToCart } from "@/lib/cart"
import { toast } from "sonner"

interface DBEvent {
  id: number
  name: string
  description: string | null
  price: number
  category: string
  image_url: string | null
  is_featured: boolean
}

/* Map DB category names to icon keys and display titles */
const EVENT_CATEGORY_MAP: { dbName: string; iconKey: string; title: string }[] = [
  { dbName: "حلويات ليبية", iconKey: "desserts", title: "حلويات ليبية" },
  { dbName: "حلويات شرقية", iconKey: "oriental", title: "حلويات شرقية" },
  { dbName: "عصائر", iconKey: "juices", title: "عصائر" },
  { dbName: "عصائر طبيعية", iconKey: "juices", title: "عصائر طبيعية" },
]

/* Unified category shape used in render */
interface EventCategory {
  id: string
  title: string
  items: { id: string; name: string; price: number; description?: string; image_url?: string; is_featured?: boolean }[]
}

function makeFallbackCategories(): EventCategory[] {
  return []
}

function makeDBCategories(dbEvents: DBEvent[]): EventCategory[] {
  const knownMap = new Map(EVENT_CATEGORY_MAP.map((m) => [m.dbName, m]))
  const catOrder: string[] = []
  for (const ev of dbEvents) {
    if (!catOrder.includes(ev.category)) catOrder.push(ev.category)
  }
  return catOrder.map((catName) => {
    const known = knownMap.get(catName)
    return {
      id: known?.iconKey || catName,
      title: known?.title || catName,
      items: dbEvents
        .filter((ev) => ev.category === catName)
        .map((ev) => ({
          id: String(ev.id),
          name: ev.name,
          price: ev.price,
          description: ev.description || undefined,
          image_url: ev.image_url || undefined,
          is_featured: ev.is_featured,
        })),
    }
  }).filter((c) => c.items.length > 0)
}

function EventCategoryIcon({ categoryId }: { categoryId: string }) {
  const size = 56
  if (categoryId === "desserts") {
    return (
      <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="حلويات">
        <defs>
          <linearGradient id="ev-dessert-gold" x1="0" y1="0" x2="56" y2="56">
            <stop offset="0%" stopColor="#E0C97B" />
            <stop offset="50%" stopColor="#C5A55A" />
            <stop offset="100%" stopColor="#A8873A" />
          </linearGradient>
          <linearGradient id="ev-dessert-hi" x1="14" y1="8" x2="42" y2="8">
            <stop offset="0%" stopColor="#FFF8E7" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FFF8E7" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse cx="28" cy="42" rx="24" ry="6" fill="url(#ev-dessert-gold)" opacity="0.3" />
        <rect x="6" y="36" width="44" height="5" rx="2.5" fill="url(#ev-dessert-gold)" />
        <path d="M18 22 L28 12 L38 22 L28 32 Z" fill="url(#ev-dessert-gold)" stroke="#A8873A" strokeWidth="0.8" />
        <path d="M18 22 L28 12 L28 22 Z" fill="url(#ev-dessert-hi)" />
        <line x1="23" y1="17" x2="33" y2="27" stroke="#A8873A" strokeWidth="0.6" opacity="0.5" />
        <line x1="33" y1="17" x2="23" y2="27" stroke="#A8873A" strokeWidth="0.6" opacity="0.5" />
        <path d="M10 28 L16 22 L22 28 L16 34 Z" fill="url(#ev-dessert-gold)" opacity="0.7" stroke="#A8873A" strokeWidth="0.5" />
        <path d="M34 28 L40 22 L46 28 L40 34 Z" fill="url(#ev-dessert-gold)" opacity="0.7" stroke="#A8873A" strokeWidth="0.5" />
        <circle cx="28" cy="22" r="1.5" fill="#FFF8E7" opacity="0.5" />
        <circle cx="16" cy="28" r="1" fill="#FFF8E7" opacity="0.4" />
        <circle cx="40" cy="28" r="1" fill="#FFF8E7" opacity="0.4" />
      </svg>
    )
  }

  if (categoryId === "oriental") {
    return (
      <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="حلويات شرقية">
        <defs>
          <linearGradient id="ev-kunafa-gold" x1="0" y1="8" x2="56" y2="48">
            <stop offset="0%" stopColor="#E0C97B" />
            <stop offset="50%" stopColor="#D4A843" />
            <stop offset="100%" stopColor="#B88A2E" />
          </linearGradient>
          <radialGradient id="ev-kunafa-center" cx="50%" cy="40%" r="35%">
            <stop offset="0%" stopColor="#FFF8E7" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFF8E7" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ev-kunafa-cheese" x1="18" y1="26" x2="38" y2="26">
            <stop offset="0%" stopColor="#FFFDF0" />
            <stop offset="100%" stopColor="#F5E6C8" />
          </linearGradient>
        </defs>
        <ellipse cx="28" cy="46" rx="20" ry="4" fill="#A8873A" opacity="0.2" />
        <ellipse cx="28" cy="32" rx="22" ry="10" fill="url(#ev-kunafa-gold)" />
        <ellipse cx="28" cy="28" rx="20" ry="9" fill="#C5A55A" />
        {[...Array(8)].map((_, i) => (
          <line key={i} x1={12 + i * 4} y1={24} x2={14 + i * 4} y2={32} stroke="#B88A2E" strokeWidth="0.7" opacity="0.6" />
        ))}
        <path d="M12 30 Q28 36 44 30" stroke="url(#ev-kunafa-cheese)" strokeWidth="2.5" fill="none" opacity="0.7" />
        <ellipse cx="24" cy="24" rx="10" ry="4" fill="url(#ev-kunafa-center)" />
        <circle cx="22" cy="26" r="1.2" fill="#6B8E3A" opacity="0.8" />
        <circle cx="28" cy="24" r="1" fill="#6B8E3A" opacity="0.7" />
        <circle cx="34" cy="26" r="1.2" fill="#6B8E3A" opacity="0.8" />
        <circle cx="25" cy="29" r="0.8" fill="#6B8E3A" opacity="0.6" />
        <circle cx="31" cy="29" r="0.8" fill="#6B8E3A" opacity="0.6" />
      </svg>
    )
  }

  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="عصائر">
      <defs>
        <linearGradient id="ev-juice-glass" x1="18" y1="10" x2="38" y2="46">
          <stop offset="0%" stopColor="#FFF8E7" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FFF8E7" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="ev-juice-fill" x1="20" y1="20" x2="36" y2="42">
          <stop offset="0%" stopColor="#E8594B" />
          <stop offset="50%" stopColor="#D4423A" />
          <stop offset="100%" stopColor="#C53030" />
        </linearGradient>
        <linearGradient id="ev-juice-gold-rim" x1="16" y1="14" x2="40" y2="14">
          <stop offset="0%" stopColor="#C5A55A" />
          <stop offset="50%" stopColor="#E0C97B" />
          <stop offset="100%" stopColor="#C5A55A" />
        </linearGradient>
      </defs>
      <ellipse cx="28" cy="48" rx="14" ry="3" fill="#C5A55A" opacity="0.15" />
      <path d="M17 16 L20 44 Q28 47 36 44 L39 16 Z" fill="url(#ev-juice-glass)" stroke="#E0C97B" strokeWidth="0.6" opacity="0.7" />
      <path d="M18.5 22 L20.5 44 Q28 46.5 35.5 44 L37.5 22 Z" fill="url(#ev-juice-fill)" opacity="0.85" />
      <path d="M18.5 22 Q24 19 28 22 Q32 25 37.5 22" stroke="#E8594B" strokeWidth="0.8" fill="none" opacity="0.5" />
      <ellipse cx="28" cy="15.5" rx="11.5" ry="3" fill="none" stroke="url(#ev-juice-gold-rim)" strokeWidth="1.5" />
      <path d="M22 18 L23 40" stroke="#FFF8E7" strokeWidth="0.8" opacity="0.3" strokeLinecap="round" />
      <line x1="32" y1="6" x2="30" y2="36" stroke="#E0C97B" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="6" x2="36" y2="2" stroke="#E0C97B" strokeWidth="2" strokeLinecap="round" />
      <rect x="23" y="26" width="5" height="4" rx="1" fill="#FFF8E7" opacity="0.35" transform="rotate(-8 25.5 28)" />
      <rect x="30" y="30" width="4" height="3.5" rx="1" fill="#FFF8E7" opacity="0.25" transform="rotate(5 32 31.75)" />
      <circle cx="20" cy="13" r="4" fill="#E8594B" opacity="0.7" />
      <circle cx="20" cy="13" r="2.5" fill="#FF7B6B" opacity="0.5" />
    </svg>
  )
}

export default function EventsSection() {
  const [eventCategories, setEventCategories] = useState<EventCategory[]>(makeFallbackCategories)
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [selections, setSelections] = useState<Record<string, string | null>>({})
  const [visible, setVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  /* Fetch events from the database API */
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events")
      if (res.ok) {
        const data: DBEvent[] = await res.json()
        if (data.length > 0) {
          setEventCategories(makeDBCategories(data))
        }
      }
    } catch {
      /* silently fall back to static data */
    } finally {
      setLoadingEvents(false)
    }
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function selectItem(categoryId: string, itemId: string) {
    setSelections((prev) => ({
      ...prev,
      [categoryId]: prev[categoryId] === itemId ? null : itemId,
    }))
  }

  function addPackageToCart() {
    let added = 0
    for (const cat of eventCategories) {
      const selectedId = selections[cat.id]
      if (selectedId) {
        const item = cat.items.find((i) => i.id === selectedId)
        if (item) {
          addToCart({
            id: item.id,
            name: `${item.name} (باقة مناسبات)`,
            price: item.price,
            category: "مناسبات",
            addons: [],
          })
          added++
        }
      }
    }
    if (added > 0) {
      toast.success(`تمت إضافة ${added} عناصر إلى السلة`)
      setSelections({})
    } else {
      toast.error("يرجى اختيار عنصر واحد على الأقل")
    }
  }

  const selectedCount = Object.values(selections).filter(Boolean).length

  return (
    <section ref={sectionRef} id="events" className="bg-royal-red-dark relative overflow-hidden py-24">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-l from-transparent via-[var(--gold)]/40 to-transparent" />

      {/* Subtle ambient glow */}
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

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Title */}
        <div className="mb-16 text-center transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)" }}>
          <h2 className="animate-shimmer mb-4 text-4xl font-bold md:text-5xl">المناسبات</h2>
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
            {/* Category Cards Grid - responsive column count */}
            <div className={`grid gap-8 ${eventCategories.length <= 3 ? "md:grid-cols-3" : eventCategories.length === 4 ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2 lg:grid-cols-3"}`}>
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
                  {/* 3D Category Icon + Title */}
                  <div className="mb-6 flex flex-col items-center gap-3 text-center">
                    <div className="menu-icon-3d">
                      <div className="menu-icon-3d-inner">
                        <EventCategoryIcon categoryId={cat.id} />
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
                      const isSelected = selections[cat.id] === item.id
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
                              {item.image_url && (
                                <img src={item.image_url || "/placeholder.svg"} alt="" className="h-8 w-8 rounded-md object-cover" crossOrigin="anonymous" />
                              )}
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </div>
                          <span className="text-sm font-bold">{item.price} د.ل</span>
                        </button>
                      )
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
                  background: selectedCount > 0
                    ? "linear-gradient(135deg, hsl(43 65% 48%), hsl(43 70% 58%))"
                    : "hsl(43 65% 52% / 0.08)",
                  color: selectedCount > 0 ? "hsl(350 76% 10%)" : "hsl(43 65% 52%)",
                  boxShadow: selectedCount > 0
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
  )
}
