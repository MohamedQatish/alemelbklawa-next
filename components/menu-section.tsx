"use client";

import React from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Plus, Loader2, X, Check } from "lucide-react";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";
import Image from "next/image";

// ================== Types ==================
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

interface DBProduct {
  id: number;
  name: string;
  description: string | null;
  base_price: number;
  category: string;
  image_url: string | null;
  is_featured: boolean;
  option_groups: OptionGroup[];
}
interface DBCategory {
  id: number;
  name: string;
  label_ar: string;
  icon: string | null;
  sort_order: number;
}

interface MenuCategory {
  id: string;
  label: string;
  icon: string | null;
  items: {
    id: string;
    name: string;
    price: number;
    category: string;
    description?: string;
    image_url?: string;
    is_featured: boolean;
  }[];
}

/* Fallback icon key mapping for known categories */
const ICON_KEY_MAP: Record<string, string> = {
  عصائر: "juices",
  "عصائر طبيعية": "juices",
  "حلويات ليبية": "libyan",
  "حلويات شرقية": "oriental",
  كيك: "cakes",
  "تورتة مخصصة": "torta",
};

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

  // تحسين عنوان URL للصورة
  const optimizedSrc = useMemo(() => {
    if (!src) return "/placeholder.svg";
    if (src.startsWith("http")) return src;
    if (src.startsWith("/")) return src;
    return `/${src}`;
  }, [src]);

  return (
    <div className={`relative ${aspectRatio} w-full overflow-hidden bg-[var(--royal-red-light)]/20 ${className}`}>
      {!error ? (
        <>
          <Image
            src={optimizedSrc}
            alt={alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--royal-red-light)]/80">
          <span className="text-4xl opacity-30">🍽️</span>
        </div>
      )}
    </div>
  );
};

/* ============================================================
   3D SVG Icons (مختصرة للسرعة)
   ============================================================ */
const JuiceIcon = ({ size = 48 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <defs>
      <linearGradient id="j1" x1="20" y1="18" x2="44" y2="58">
        <stop stopColor="#E0C97B"/><stop offset=".5" stopColor="#C5A55A"/><stop offset="1" stopColor="#9A7B3A"/>
      </linearGradient>
      <linearGradient id="j2" x1="24" y1="30" x2="40" y2="54">
        <stop stopColor="#FF6B6B"/><stop offset="1" stopColor="#D44040"/>
      </linearGradient>
    </defs>
    <path d="M22 18L20 54c0 2.2 1.8 4 4 4h16c2.2 0 4-1.8 4-4l-2-36H22z" fill="url(#j1)"/>
    <path d="M23 30l-2 24c0 1.7 1.3 3 3 3h16c1.7 0 3-1.3 3-3l-2-24H23z" fill="url(#j2)" opacity=".85"/>
  </svg>
);

const LibyanSweetsIcon = ({ size = 48 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <ellipse cx="32" cy="52" rx="26" ry="6" fill="#E0C97B"/>
    <path d="M16 38l8-10 8 10-8 6-8-6z" fill="#D4956A"/>
    <path d="M28 36l8-10 8 10-8 6-8-6z" fill="#D4956A"/>
    <path d="M20 42l8-8 8 8-8 6-8-6z" fill="#B8763E"/>
    <circle cx="24" cy="33" r="1.2" fill="#7BA05B"/>
    <circle cx="34" cy="31" r="1" fill="#7BA05B"/>
  </svg>
);

const OrientalSweetsIcon = ({ size = 48 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <ellipse cx="32" cy="50" rx="27" ry="7" fill="#E0C97B"/>
    <ellipse cx="32" cy="36" rx="18" ry="10" fill="#E8A040"/>
    <circle cx="28" cy="33" r="1.5" fill="#7BA05B"/>
    <circle cx="32" cy="31" r="1.3" fill="#8CB06B"/>
  </svg>
);

const CakeIcon = ({ size = 48 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect x="10" y="40" width="44" height="16" rx="4" fill="#D4956A"/>
    <rect x="12" y="36" width="40" height="5" rx="2.5" fill="#FFF8E0"/>
    <rect x="14" y="22" width="36" height="15" rx="4" fill="#E8A860"/>
    <circle cx="32" cy="16" r="4" fill="#D44040"/>
  </svg>
);

const TorteIcon = ({ size = 48 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect x="8" y="38" width="48" height="16" rx="4" fill="#6B3A2A"/>
    <rect x="10" y="36" width="44" height="3" rx="1.5" fill="#FFF8E0"/>
    <rect x="12" y="24" width="40" height="13" rx="4" fill="#5A3020"/>
  </svg>
);

const categoryIcons: Record<string, React.ReactNode> = {
  juices: <JuiceIcon />,
  libyan: <LibyanSweetsIcon />,
  oriental: <OrientalSweetsIcon />,
  cakes: <CakeIcon />,
  torta: <TorteIcon />,
};

export default function MenuSection() {
  // ===== حالات سريعة جداً =====
  const [activeCategory, setActiveCategory] = useState("");
  const [visible, setVisible] = useState(false);
  const [dbProducts, setDbProducts] = useState<DBProduct[] | null>(null);
  const [dbCategories, setDbCategories] = useState<DBCategory[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // ===== تحميل المستخدم مرة واحدة فقط =====
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});

    // أنيميشن خفيف وسريع
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      @keyframes softPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
      .animate-icon-pulse { animation: softPulse 2.5s ease-in-out infinite; }
      .icon-hover-effect { transition: all 0.3s ease; }
      .icon-hover-effect:hover { transform: scale(1.2) rotate(5deg); filter: drop-shadow(0 0 15px #d4af37); }
      .scrollbar-hide::-webkit-scrollbar { display: none; }
      .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // ===== جلب البيانات مع التخزين المؤقت =====
  const fetchData = useCallback(async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/products"),
      ]);

      if (catRes.ok) {
        const cats: DBCategory[] = await catRes.json();
        setDbCategories(cats);
        if (cats.length > 0 && !activeCategory) {
          setActiveCategory(ICON_KEY_MAP[cats[0].name] || cats[0].name);
        }
      }

      if (prodRes.ok) {
        const data = await prodRes.json();
        const productsWithNumericPrice = data.map((p: any) => ({
          ...p,
          base_price: Number(p.base_price) || 0,
        }));
        setDbProducts(productsWithNumericPrice);
      }
    } catch {
      // silent fail
    } finally {
      setLoadingProducts(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ===== كشف الرؤية =====
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
      { threshold: 0.08 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ===== بناء الفئات =====
  const categories: MenuCategory[] = useMemo(() => {
    if (!dbProducts) return [];

    if (dbCategories.length > 0) {
      return dbCategories
        .map((cat) => ({
          id: ICON_KEY_MAP[cat.name] || cat.name,
          label: cat.label_ar || cat.name,
          icon: cat.icon,
          items: dbProducts
            .filter((p) => p.category === cat.name)
            .map((p) => ({
              id: String(p.id),
              name: p.name,
              price: p.base_price,
              category: cat.label_ar || cat.name,
              description: p.description || undefined,
              image_url: p.image_url || undefined,
              is_featured: p.is_featured,
            })),
        }))
        .filter((c) => c.items.length > 0);
    }

    const catNames = [...new Set(dbProducts.map((p) => p.category))];
    return catNames
      .map((catName) => ({
        id: ICON_KEY_MAP[catName] || catName,
        label: catName,
        icon: null,
        items: dbProducts
          .filter((p) => p.category === catName)
          .map((p) => ({
            id: String(p.id),
            name: p.name,
            price: p.base_price,
            category: catName,
            description: p.description || undefined,
            image_url: p.image_url || undefined,
            is_featured: p.is_featured,
          })),
      }))
      .filter((c) => c.items.length > 0);
  }, [dbProducts, dbCategories]);

  const currentCategory = categories.find((c) => c.id === activeCategory);

  // ===== ULTRA-FAST Product Modal =====
  const [selectedProduct, setSelectedProduct] = useState<DBProduct | null>(null);
  const [selections, setSelections] = useState<Record<number, number[]>>({});
  const [priceCache, setPriceCache] = useState<Record<string, { price: number; options: any[] }>>({});

  useEffect(() => {
    if (!selectedProduct) return;

    const initial: Record<number, number[]> = {};
    selectedProduct.option_groups.forEach((group) => {
      if (group.isRequired && group.options.length > 0) {
        initial[group.id] = [group.options[0].id];
      } else {
        initial[group.id] = [];
      }
    });
    setSelections(initial);

    const preloadPrices = async () => {
      const allSelections: Record<number, number[]>[] = [{}];

      selectedProduct.option_groups.forEach((group) => {
        group.options.forEach((opt) => {
          const sel: Record<number, number[]> = {};
          sel[group.id] = [opt.id];
          allSelections.push(sel);
        });
      });

      const newCache = { ...priceCache };

      for (const selection of allSelections) {
        const key = JSON.stringify(selection);
        if (newCache[key]) continue;

        const selectedOptionIds = Object.entries(selection).flatMap(
          ([gId, optIds]) => optIds.map((oid) => ({ optionId: oid })),
        );

        if (selectedOptionIds.length === 0) {
          newCache[key] = {
            price: Number(selectedProduct.base_price),
            options: [],
          };
          continue;
        }

        try {
          const res = await fetch("/api/cart/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: selectedProduct.id,
              selectedOptions: selectedOptionIds,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            newCache[key] = {
              price: Number(data.finalPrice),
              options: data.selectedOptions,
            };
          }
        } catch {
          // تجاهل الأخطاء
        }
      }

      setPriceCache(newCache);
    };

    preloadPrices();
  }, [selectedProduct]);

  const calculatedResult = useMemo(() => {
    if (!selectedProduct) return null;

    const key = JSON.stringify(selections);
    if (priceCache[key]) return priceCache[key];

    let total = Number(selectedProduct.base_price);
    const options: any[] = [];

    Object.entries(selections).forEach(([gId, optIds]) => {
      const group = selectedProduct.option_groups.find(
        (g) => g.id === Number(gId),
      );
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
  }, [selectedProduct, selections, priceCache]);

  const toggleOption = useCallback(
    (groupId: number, optionId: number) => {
      setSelections((prev) => {
        const group = selectedProduct?.option_groups.find(
          (g) => g.id === groupId,
        );
        if (!group) return prev;

        const current = prev[groupId] || [];

        if (group.selectionType === "single") {
          return current[0] === optionId
            ? prev
            : { ...prev, [groupId]: [optionId] };
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
    },
    [selectedProduct],
  );

  const confirmAddToCart = useCallback(() => {
    if (!selectedProduct || !calculatedResult) return;

    for (const group of selectedProduct.option_groups) {
      if (
        group.isRequired &&
        (!selections[group.id] || selections[group.id].length === 0)
      ) {
        toast.error(`الرجاء اختيار ${group.name}`);
        return;
      }
    }

    addToCart({
      productId: selectedProduct.id,
      name: selectedProduct.name,
      basePrice: selectedProduct.base_price,
      finalPrice: calculatedResult.price,
      category: selectedProduct.category,
      selectedOptions: calculatedResult.options,
    });

    toast.success(`تمت إضافة ${selectedProduct.name} إلى السلة`);
    setSelectedProduct(null);
  }, [selectedProduct, calculatedResult, selections]);

  const handleProductClick = useCallback(
    (item: any) => {
      if (currentUser) {
        const fullProduct = dbProducts?.find((p) => p.id === Number(item.id));
        if (fullProduct) {
          setSelectedProduct(fullProduct);
        } else {
          toast.error("لم يتم العثور على المنتج");
        }
      } else {
        const productToSave = {
          id: item.id,
          name: item.name,
          price: item.price,
          category: item.category,
          description: item.description,
          image_url: item.image_url,
        };
        localStorage.setItem("pendingProduct", JSON.stringify(productToSave));
        localStorage.setItem("pendingAction", "add-to-cart");
        window.location.href = `/signup?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    },
    [currentUser, dbProducts],
  );

  return (
    <section
      ref={sectionRef}
      id="menu"
      className="bg-royal-red-dark relative py-20 overflow-hidden"
    >
      {/* خلفية ثابتة خفيفة */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[var(--gold)] rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[var(--gold)] rounded-full filter blur-3xl"></div>
      </div>

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        {/* العنوان */}
        <div
          className="mb-16 text-center transition-opacity duration-500"
          style={{ opacity: visible ? 1 : 0 }}
        >
          <h2 className="mb-4 text-4xl font-bold md:text-5xl text-[var(--gold)]">
            القائمة
          </h2>
          <div className="mx-auto h-1 w-24 rounded-full bg-[var(--gold)]/50" />
        </div>

        {/* أقسام الفئات */}
        <div
          className="mb-8 sm:mb-14 flex gap-3 overflow-x-auto overflow-y-hidden px-2 sm:flex-wrap sm:justify-center scrollbar-hide"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 0.5s" }}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 group flex flex-col items-center gap-2 rounded-2xl px-4 py-3 transition-all duration-200 sm:px-5 sm:py-4 ${
                  isActive
                    ? "border-2 border-[var(--gold)]/60 bg-[var(--gold)]/15"
                    : "border border-[var(--gold)]/20 bg-[var(--royal-red-light)]/40 hover:border-[var(--gold)]/40"
                }`}
                style={{ minWidth: "90px" }}
              >
                <div className="menu-icon-3d">
                  <div
                    className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl transition-all duration-200 ${
                      isActive ? "icon-active" : ""
                    }`}
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg, hsl(43 65% 52% / 0.25), hsl(43 65% 52% / 0.12))"
                        : "linear-gradient(135deg, hsl(350 60% 18% / 0.7), hsl(350 76% 14% / 0.5))",
                    }}
                  >
                    {cat.icon ? (
                      <span
                        className={`text-2xl sm:text-3xl icon-hover-effect ${isActive ? "animate-icon-pulse" : ""}`}
                      >
                        {cat.icon}
                      </span>
                    ) : (
                      <div
                        className={`icon-hover-effect scale-90 sm:scale-100 ${isActive ? "animate-icon-pulse" : ""}`}
                      >
                        {categoryIcons[cat.id]}
                      </div>
                    )}
                  </div>
                </div>

                <span
                  className={`text-xs sm:text-sm font-semibold ${isActive ? "text-[var(--gold)]" : "text-[var(--gold)]/60"}`}
                >
                  {cat.label}
                </span>

                <div
                  className="h-1 rounded-full transition-all duration-200"
                  style={{
                    width: isActive ? "24px" : "0px",
                    background: isActive ? "var(--gold)" : "transparent",
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* منتجات - مع صور محسّنة */}
        {loadingProducts ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--gold)]/50" />
          </div>
        ) : (
          <>
            {/* موبايل - شبكة بعمودين */}
            <div className="grid grid-cols-2 gap-3 sm:hidden">
              {currentCategory?.items.map((item, index) => (
                <div
                  key={item.id}
                  className="group/product rounded-xl border border-[var(--gold)]/20 bg-[var(--royal-red-light)]/60 backdrop-blur-sm overflow-hidden"
                >
                  {item.image_url ? (
                    <>
                      <OptimizedImage
                        src={item.image_url}
                        alt={item.name}
                        priority={index < 2} // أول صورتين فقط أولوية عالية
                        aspectRatio="aspect-square"
                      />
                      {item.is_featured && (
                        <div className="absolute top-1 right-1 z-10 bg-[var(--gold)] text-[var(--royal-red-dark)] text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                          مميز
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="aspect-square w-full bg-[var(--royal-red-light)]/80 flex items-center justify-center">
                      <span className="text-3xl opacity-30">🍽️</span>
                    </div>
                  )}

                  <div className="p-1.5">
                    <h3 className="font-bold text-[var(--cream)] text-xs leading-tight line-clamp-2 mb-0.5 min-h-[28px]">
                      {item.name}
                    </h3>

                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[var(--gold)] font-bold text-xs">
                        {Number(item.price).toFixed(2)}{" "}
                        <span className="text-[10px] text-[var(--gold)]/70">
                          د.ل
                        </span>
                      </span>
                    </div>

                    <button
                      onClick={() => handleProductClick(item)}
                      className="w-full rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/10 py-1 text-[10px] font-semibold text-[var(--gold)] transition-colors duration-150 hover:bg-[var(--gold)] hover:text-[var(--royal-red-dark)] flex items-center justify-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      أضف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ديسكتوب - شبكة كاملة */}
            <div className="hidden sm:grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {currentCategory?.items.map((item, index) => (
                <div
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-[var(--gold)]/20 bg-[var(--royal-red-light)]/60 backdrop-blur-sm transition-all duration-200 hover:border-[var(--gold)]/50"
                >
                  {item.image_url ? (
                    <div className="relative h-44 w-full overflow-hidden">
                      <OptimizedImage
                        src={item.image_url}
                        alt={item.name}
                        priority={index < 3} // أول 3 صور أولوية عالية
                        aspectRatio="aspect-video"
                      />
                      {item.is_featured && (
                        <div className="absolute top-2 right-2 z-10 bg-[var(--gold)] text-[var(--royal-red-dark)] text-xs font-bold px-2 py-1 rounded-full">
                          مميز
                        </div>
                      )}
                    </div>
                  ) : null}
                  
                  <div className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <h3 className="text-lg font-bold text-[var(--cream)]">
                        {item.name}
                      </h3>
                      <span className="text-[var(--gold)] font-bold">
                        {Number(item.price).toFixed(2)} د.ل
                      </span>
                    </div>

                    {item.description && (
                      <p className="mb-4 text-sm text-[var(--gold)]/60">
                        {item.description}
                      </p>
                    )}

                    <button
                      onClick={() => handleProductClick(item)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/10 py-3 text-sm font-semibold text-[var(--gold)] transition-colors duration-150 hover:bg-[var(--gold)] hover:text-[var(--royal-red-dark)]"
                    >
                      <Plus className="h-4 w-4" />
                      أضف إلى السلة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* مودال المنتج */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--gold)]/30 bg-[var(--royal-red-dark)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--royal-red-light)] text-[var(--gold)]/70 transition-colors hover:text-[var(--gold)]"
            >
              <X className="h-4 w-4" />
            </button>

            {selectedProduct.image_url && (
              <div className="relative h-48 w-full overflow-hidden rounded-t-3xl">
                <OptimizedImage
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  priority={true}
                  aspectRatio="aspect-video"
                />
              </div>
            )}

            <div className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <h3 className="text-xl font-bold text-[var(--cream)]">
                  {selectedProduct.name}
                </h3>
                <span className="text-[var(--gold)] font-bold">
                  {Number(selectedProduct.base_price).toFixed(2)} د.ل
                </span>
              </div>

              {selectedProduct.description && (
                <p className="mb-5 text-sm text-[var(--gold)]/60">
                  {selectedProduct.description}
                </p>
              )}

              {selectedProduct.option_groups.length > 0 ? (
                <div className="mb-6 flex flex-col gap-5">
                  {selectedProduct.option_groups.map((group) => (
                    <div key={group.id}>
                      <h4 className="mb-2.5 text-sm font-semibold text-[var(--gold)]">
                        {group.name}
                        {group.isRequired && (
                          <span className="mr-1 text-red-400">*</span>
                        )}
                      </h4>
                      <div className="flex flex-col gap-2">
                        {group.options.map((opt) => {
                          const isSelected =
                            selections[group.id]?.includes(opt.id) || false;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => toggleOption(group.id, opt.id)}
                              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-right transition-colors duration-150 ${
                                isSelected
                                  ? "border-[var(--gold)] bg-[var(--gold)]/15"
                                  : "border-white/10 bg-white/5 hover:bg-white/10"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                                    isSelected
                                      ? "border-[var(--gold)] bg-[var(--gold)]"
                                      : "border-white/20 bg-transparent"
                                  }`}
                                >
                                  {isSelected && (
                                    <Check className="h-3 w-3 text-[var(--royal-red-dark)]" />
                                  )}
                                </div>
                                <span
                                  className={`text-sm font-medium ${isSelected ? "text-[var(--gold)]" : "text-[var(--cream)]"}`}
                                >
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

              <div className="mb-4 flex justify-between items-center">
                <span className="text-sm text-[var(--gold)]/70">
                  السعر النهائي:
                </span>
                <span className="text-xl font-bold text-[var(--gold)]">
                  {calculatedResult?.price.toFixed(2) ||
                    Number(selectedProduct.base_price).toFixed(2)}{" "}
                  د.ل
                </span>
              </div>

              <button
                onClick={confirmAddToCart}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)] py-3.5 text-sm font-bold text-[var(--royal-red-dark)] transition-colors duration-150 hover:bg-[var(--gold)]/90"
              >
                <Plus className="h-4 w-4" />
                <span>أضف إلى السلة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}