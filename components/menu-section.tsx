"use client";

import React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Loader2, X, Check } from "lucide-react";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";

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

/* ============================================================
   3D SVG Icons — one per menu category
   Each uses gold gradients with highlights for a 3D metallic look
   ============================================================ */

function JuiceIcon({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="juice-body" x1="20" y1="18" x2="44" y2="58">
          <stop offset="0%" stopColor="#E0C97B" />
          <stop offset="50%" stopColor="#C5A55A" />
          <stop offset="100%" stopColor="#9A7B3A" />
        </linearGradient>
        <linearGradient id="juice-liquid" x1="24" y1="30" x2="40" y2="54">
          <stop offset="0%" stopColor="#FF6B6B" />
          <stop offset="100%" stopColor="#D44040" />
        </linearGradient>
        <linearGradient id="juice-highlight" x1="24" y1="18" x2="26" y2="50">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Glass body */}
      <path
        d="M22 18 L20 54 C20 56.2 21.8 58 24 58 L40 58 C42.2 58 44 56.2 44 54 L42 18 Z"
        fill="url(#juice-body)"
      />
      {/* Liquid inside */}
      <path
        d="M23 30 L21 54 C21 55.7 22.3 57 24 57 L40 57 C41.7 57 43 55.7 43 54 L41 30 Z"
        fill="url(#juice-liquid)"
        opacity="0.85"
      />
      {/* Glass highlight */}
      <path d="M24 19 L23 52 L26 52 L27 19 Z" fill="url(#juice-highlight)" />
      {/* Rim */}
      <ellipse
        cx="32"
        cy="18"
        rx="11"
        ry="3"
        fill="#E8D5A0"
        stroke="#C5A55A"
        strokeWidth="1"
      />
      {/* Straw */}
      <rect
        x="34"
        y="6"
        width="3"
        height="32"
        rx="1.5"
        fill="#C5A55A"
        transform="rotate(8 35 22)"
      />
      {/* Straw bend */}
      <path
        d="M37 8 L40 4"
        stroke="#C5A55A"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Ice cubes */}
      <rect
        x="26"
        y="34"
        width="6"
        height="5"
        rx="1"
        fill="white"
        opacity="0.3"
      />
      <rect
        x="33"
        y="38"
        width="5"
        height="4"
        rx="1"
        fill="white"
        opacity="0.25"
      />
    </svg>
  );
}

function LibyanSweetsIcon({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="lb-tray" x1="8" y1="44" x2="56" y2="58">
          <stop offset="0%" stopColor="#E0C97B" />
          <stop offset="50%" stopColor="#C5A55A" />
          <stop offset="100%" stopColor="#9A7B3A" />
        </linearGradient>
        <linearGradient id="lb-pastry" x1="16" y1="20" x2="48" y2="44">
          <stop offset="0%" stopColor="#D4956A" />
          <stop offset="50%" stopColor="#B8763E" />
          <stop offset="100%" stopColor="#8E5A2A" />
        </linearGradient>
        <linearGradient id="lb-honey" x1="20" y1="24" x2="44" y2="40">
          <stop offset="0%" stopColor="#FFDB70" />
          <stop offset="100%" stopColor="#C5A55A" />
        </linearGradient>
      </defs>
      {/* Ornate tray */}
      <ellipse cx="32" cy="52" rx="26" ry="6" fill="url(#lb-tray)" />
      <ellipse cx="32" cy="52" rx="22" ry="4" fill="#D4B96E" opacity="0.3" />
      {/* Baklava diamond pieces */}
      <path d="M16 38 L24 28 L32 38 L24 44 Z" fill="url(#lb-pastry)" />
      <path d="M28 36 L36 26 L44 36 L36 42 Z" fill="url(#lb-pastry)" />
      <path
        d="M20 42 L28 34 L36 42 L28 48 Z"
        fill="url(#lb-pastry)"
        opacity="0.9"
      />
      {/* Honey drizzle */}
      <path
        d="M22 32 Q24 30 26 32 Q28 34 30 32 Q32 30 34 32 Q36 34 38 32"
        stroke="url(#lb-honey)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.8"
      />
      <path
        d="M24 38 Q26 36 28 38 Q30 40 32 38 Q34 36 36 38"
        stroke="url(#lb-honey)"
        strokeWidth="1.2"
        fill="none"
        opacity="0.6"
      />
      {/* Pistachio sprinkles */}
      <circle cx="24" cy="33" r="1.2" fill="#7BA05B" />
      <circle cx="34" cy="31" r="1" fill="#7BA05B" />
      <circle cx="30" cy="39" r="1.1" fill="#7BA05B" />
      <circle cx="38" cy="35" r="0.9" fill="#8CB06B" />
      {/* Highlight */}
      <path d="M18 36 L22 30 L24 32 L20 38 Z" fill="white" opacity="0.15" />
    </svg>
  );
}

function OrientalSweetsIcon({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="os-plate" x1="6" y1="38" x2="58" y2="56">
          <stop offset="0%" stopColor="#E0C97B" />
          <stop offset="50%" stopColor="#C5A55A" />
          <stop offset="100%" stopColor="#9A7B3A" />
        </linearGradient>
        <linearGradient id="os-kunafa" x1="14" y1="22" x2="50" y2="42">
          <stop offset="0%" stopColor="#E8A040" />
          <stop offset="50%" stopColor="#D48A28" />
          <stop offset="100%" stopColor="#B06E18" />
        </linearGradient>
        <radialGradient id="os-cheese" cx="50%" cy="60%" r="40%">
          <stop offset="0%" stopColor="#FFF8E0" />
          <stop offset="100%" stopColor="#E8D5A0" />
        </radialGradient>
      </defs>
      {/* Plate */}
      <ellipse cx="32" cy="50" rx="27" ry="7" fill="url(#os-plate)" />
      <ellipse cx="32" cy="50" rx="23" ry="5" fill="#D4B96E" opacity="0.25" />
      {/* Round kunafa base */}
      <ellipse cx="32" cy="36" rx="18" ry="10" fill="url(#os-kunafa)" />
      {/* Shredded texture lines */}
      <path
        d="M16 34 Q20 30 24 34 Q28 38 32 34 Q36 30 40 34 Q44 38 48 34"
        stroke="#C57818"
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M18 38 Q22 34 26 38 Q30 42 34 38 Q38 34 42 38 Q46 42 48 38"
        stroke="#C57818"
        strokeWidth="0.7"
        fill="none"
        opacity="0.4"
      />
      {/* Cheese filling visible at slice */}
      <path
        d="M44 34 L50 38 L48 42 L42 38 Z"
        fill="url(#os-cheese)"
        opacity="0.8"
      />
      {/* Syrup drizzle */}
      <path
        d="M20 32 Q24 28 28 32 Q32 36 36 32 Q40 28 44 32"
        stroke="#FFDB70"
        strokeWidth="1.5"
        fill="none"
        opacity="0.7"
      />
      {/* Pistachio topping */}
      <circle cx="28" cy="33" r="1.5" fill="#7BA05B" />
      <circle cx="32" cy="31" r="1.3" fill="#8CB06B" />
      <circle cx="36" cy="33" r="1.4" fill="#7BA05B" />
      <circle cx="30" cy="36" r="1.1" fill="#6B904B" />
      <circle cx="34" cy="35" r="1.2" fill="#8CB06B" />
      {/* Top highlight */}
      <ellipse cx="28" cy="32" rx="6" ry="3" fill="white" opacity="0.1" />
    </svg>
  );
}

function CakeIcon({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ck-base" x1="10" y1="36" x2="54" y2="56">
          <stop offset="0%" stopColor="#D4956A" />
          <stop offset="50%" stopColor="#C07840" />
          <stop offset="100%" stopColor="#8E5A2A" />
        </linearGradient>
        <linearGradient id="ck-top" x1="14" y1="22" x2="50" y2="38">
          <stop offset="0%" stopColor="#E8A860" />
          <stop offset="50%" stopColor="#D49040" />
          <stop offset="100%" stopColor="#B07028" />
        </linearGradient>
        <linearGradient id="ck-cream" x1="12" y1="34" x2="52" y2="38">
          <stop offset="0%" stopColor="#FFF8E0" />
          <stop offset="50%" stopColor="#F0E0C0" />
          <stop offset="100%" stopColor="#E8D5A0" />
        </linearGradient>
        <linearGradient id="ck-icing" x1="14" y1="22" x2="50" y2="26">
          <stop offset="0%" stopColor="#E0C97B" />
          <stop offset="50%" stopColor="#C5A55A" />
          <stop offset="100%" stopColor="#A8883A" />
        </linearGradient>
      </defs>
      {/* Bottom tier */}
      <rect x="10" y="40" width="44" height="16" rx="4" fill="url(#ck-base)" />
      {/* Cream layer */}
      <rect
        x="12"
        y="36"
        width="40"
        height="5"
        rx="2.5"
        fill="url(#ck-cream)"
      />
      {/* Top tier */}
      <rect x="14" y="22" width="36" height="15" rx="4" fill="url(#ck-top)" />
      {/* Icing drip */}
      <path
        d="M14 24 Q14 22 16 22 L48 22 Q50 22 50 24 L50 26 Q46 30 42 26 Q38 22 34 26 Q30 30 26 26 Q22 22 18 26 L14 26 Z"
        fill="url(#ck-icing)"
      />
      {/* Cherry on top */}
      <circle cx="32" cy="16" r="4" fill="#D44040" />
      <circle cx="30" cy="14" r="1.2" fill="white" opacity="0.4" />
      {/* Stem */}
      <path
        d="M32 12 Q34 8 37 7"
        stroke="#5A8A3A"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Side highlights */}
      <rect
        x="14"
        y="24"
        width="3"
        height="11"
        rx="1.5"
        fill="white"
        opacity="0.12"
      />
      <rect
        x="12"
        y="42"
        width="3"
        height="12"
        rx="1.5"
        fill="white"
        opacity="0.1"
      />
    </svg>
  );
}

function TorteIcon({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="tr-base" x1="8" y1="32" x2="56" y2="56">
          <stop offset="0%" stopColor="#6B3A2A" />
          <stop offset="50%" stopColor="#4A2518" />
          <stop offset="100%" stopColor="#3A1A10" />
        </linearGradient>
        <linearGradient id="tr-choco" x1="10" y1="26" x2="54" y2="32">
          <stop offset="0%" stopColor="#5A3020" />
          <stop offset="50%" stopColor="#3E1E10" />
          <stop offset="100%" stopColor="#2E1408" />
        </linearGradient>
        <linearGradient id="tr-glaze" x1="12" y1="24" x2="52" y2="28">
          <stop offset="0%" stopColor="#E0C97B" />
          <stop offset="50%" stopColor="#C5A55A" />
          <stop offset="100%" stopColor="#A8883A" />
        </linearGradient>
        <linearGradient id="tr-cream-fill" x1="10" y1="38" x2="54" y2="42">
          <stop offset="0%" stopColor="#FFF8E0" />
          <stop offset="100%" stopColor="#E8D5A0" />
        </linearGradient>
      </defs>
      {/* Base plate */}
      <ellipse cx="32" cy="54" rx="26" ry="5" fill="#C5A55A" opacity="0.3" />
      {/* Bottom tier */}
      <rect x="8" y="38" width="48" height="16" rx="4" fill="url(#tr-base)" />
      {/* Cream line */}
      <rect
        x="10"
        y="36"
        width="44"
        height="3"
        rx="1.5"
        fill="url(#tr-cream-fill)"
      />
      {/* Top tier */}
      <rect x="12" y="24" width="40" height="13" rx="4" fill="url(#tr-choco)" />
      {/* Gold glaze drip */}
      <path
        d="M12 26 Q12 24 14 24 L50 24 Q52 24 52 26 L52 28 Q48 33 44 28 Q40 23 36 28 Q32 33 28 28 Q24 23 20 28 L12 28 Z"
        fill="url(#tr-glaze)"
      />
      {/* Chocolate shavings on top */}
      <rect
        x="20"
        y="20"
        width="8"
        height="2"
        rx="1"
        fill="#3E1E10"
        transform="rotate(-15 24 21)"
      />
      <rect
        x="30"
        y="19"
        width="7"
        height="2"
        rx="1"
        fill="#4A2518"
        transform="rotate(10 34 20)"
      />
      <rect
        x="38"
        y="21"
        width="6"
        height="1.5"
        rx="0.75"
        fill="#3E1E10"
        transform="rotate(-8 41 22)"
      />
      {/* Gold decorative swirl */}
      <path
        d="M28 16 Q30 12 32 14 Q34 16 36 12 Q38 8 40 12"
        stroke="#C5A55A"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Side highlight */}
      <rect
        x="14"
        y="26"
        width="2.5"
        height="9"
        rx="1.25"
        fill="white"
        opacity="0.1"
      />
      <rect
        x="10"
        y="40"
        width="3"
        height="12"
        rx="1.5"
        fill="white"
        opacity="0.08"
      />
    </svg>
  );
}

/* Map category ID → icon component */
const categoryIcons: Record<string, React.ReactNode> = {
  juices: <JuiceIcon />,
  libyan: <LibyanSweetsIcon />,
  oriental: <OrientalSweetsIcon />,
  cakes: <CakeIcon />,
  torta: <TorteIcon />,
};

export default function MenuSection() {
  const [activeCategory, setActiveCategory] = useState("");
  const [visible, setVisible] = useState(false);
  const [dbProducts, setDbProducts] = useState<DBProduct[] | null>(null);
  const [dbCategories, setDbCategories] = useState<DBCategory[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);

  // إضافة الأنيميشن مع إخفاء شريط التمرير
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      @keyframes softPulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.08); opacity: 0.9; }
      }
      
      @keyframes gentleBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      
      @keyframes slowSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes goldGlow {
        0%, 100% { filter: drop-shadow(0 0 3px rgba(212, 175, 55, 0.4)); }
        50% { filter: drop-shadow(0 0 12px rgba(212, 175, 55, 0.8)); }
      }
      
      @keyframes wiggle {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(8deg); }
        75% { transform: rotate(-8deg); }
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
      }
      
      @keyframes shimmer {
        0% { filter: brightness(1); }
        50% { filter: brightness(1.3); }
        100% { filter: brightness(1); }
      }
      
      @keyframes heartbeat {
        0%, 100% { transform: scale(1); }
        25% { transform: scale(1.1); }
        50% { transform: scale(0.95); }
        75% { transform: scale(1.05); }
      }
      
      .animate-icon-pulse { animation: softPulse 2.5s ease-in-out infinite; }
      .animate-icon-bounce { animation: gentleBounce 2s ease infinite; }
      .animate-icon-spin { animation: slowSpin 8s linear infinite; }
      .animate-icon-glow { animation: goldGlow 2.5s ease-in-out infinite; }
      .animate-icon-wiggle { animation: wiggle 1.5s ease-in-out infinite; }
      .animate-icon-float { animation: float 3s ease-in-out infinite; }
      .animate-icon-shimmer { animation: shimmer 2s ease-in-out infinite; }
      .animate-icon-heartbeat { animation: heartbeat 2s ease-in-out infinite; }
      
      .icon-hover-effect {
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .icon-hover-effect:hover {
        transform: scale(1.2) rotate(5deg);
        filter: drop-shadow(0 0 15px rgba(212, 175, 55, 0.9));
      }
      
      .icon-container {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }
      
      .icon-active {
        filter: drop-shadow(0 0 15px rgba(212, 175, 55, 0.8));
      }

      /* إخفاء شريط التمرير مع بقاء وظيفة التمرير */
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  /* Fetch categories and products from database */
  const fetchData = useCallback(async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/products"),
      ]);
      if (catRes.ok) {
        const cats: DBCategory[] = await catRes.json();
        setDbCategories(cats);
        // Set first category as active if none set
        if (cats.length > 0) {
          setActiveCategory(
            (prev) => prev || ICON_KEY_MAP[cats[0].name] || cats[0].name,
          );
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
      /* fall back to static data */
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  /* Build categories dynamically from DB categories + products */
  const categories: MenuCategory[] = (() => {
    if (!dbProducts) return [];

    // If we have DB categories, use those as the source of truth
    if (dbCategories.length > 0) {
      return dbCategories
        .map((cat) => {
          const iconKey = ICON_KEY_MAP[cat.name] || cat.name;
          return {
            id: iconKey,
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
          };
        })
        .filter((c) => c.items.length > 0);
    }

    // Fallback: build categories from product data
    const catNames = [...new Set(dbProducts.map((p) => p.category))];
    return catNames
      .map((catName) => {
        const iconKey = ICON_KEY_MAP[catName] || catName;
        return {
          id: iconKey,
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
        };
      })
      .filter((c) => c.items.length > 0);
  })();

  const currentCategory = categories.find((c) => c.id === activeCategory);

  // ===== NEW: Product Modal State =====
  const [selectedProduct, setSelectedProduct] = useState<DBProduct | null>(
    null,
  );
  // selections: key = groupId, value = array of selected optionIds
  const [selections, setSelections] = useState<Record<number, number[]>>({});
  const [calculating, setCalculating] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [calculatedOptions, setCalculatedOptions] = useState<any[]>([]);

  // Reset selections when product changes
  useEffect(() => {
    if (selectedProduct) {
      // Initialize selections: for required single groups, auto-select first option
      const initial: Record<number, number[]> = {};
      selectedProduct.option_groups.forEach((group) => {
        if (group.isRequired && group.options.length > 0) {
          initial[group.id] = [group.options[0].id];
        } else {
          initial[group.id] = [];
        }
      });
      setSelections(initial);
      setCalculatedPrice(null);
      setCalculatedOptions([]);
    }
  }, [selectedProduct]);

  // Call calculate API whenever selections change
  useEffect(() => {
    if (!selectedProduct) return;

    // Build array of selected optionIds from all groups
    const selectedOptionIds: { optionId: number }[] = [];
    Object.entries(selections).forEach(([groupId, optionIds]) => {
      optionIds.forEach((oid) => selectedOptionIds.push({ optionId: oid }));
    });

    // If no options selected, don't calculate (show base price)
    if (selectedOptionIds.length === 0) {
      setCalculatedPrice(Number(selectedProduct.base_price));
      setCalculatedOptions([]);
      return;
    }

    const calculate = async () => {
      setCalculating(true);
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
          setCalculatedPrice(Number(data.finalPrice));
          setCalculatedOptions(data.selectedOptions);
        } else {
          const error = await res.json();
          toast.error(error.error || "خطأ في حساب السعر");
        }
      } catch {
        toast.error("فشل الاتصال بالخادم");
      } finally {
        setCalculating(false);
      }
    };

    calculate();
  }, [selectedProduct, selections]);

  // Handle option toggle for single/multiple groups
  const toggleOption = (groupId: number, optionId: number) => {
    setSelections((prev) => {
      const group = selectedProduct?.option_groups.find(
        (g) => g.id === groupId,
      );
      if (!group) return prev;

      const current = prev[groupId] || [];

      if (group.selectionType === "single") {
        // Single: replace selection
        return { ...prev, [groupId]: [optionId] };
      } else {
        // Multiple: toggle
        if (current.includes(optionId)) {
          return {
            ...prev,
            [groupId]: current.filter((id) => id !== optionId),
          };
        } else {
          // Check maxSelect
          if (group.maxSelect && current.length >= group.maxSelect) {
            toast.error(`يمكنك اختيار ${group.maxSelect} خيارات كحد أقصى`);
            return prev;
          }
          return { ...prev, [groupId]: [...current, optionId] };
        }
      }
    });
  };

  // Confirm add to cart
  const confirmAddToCart = () => {
    if (!selectedProduct || calculatedPrice === null) return;

    // التحقق من اكتمال المجموعات الإجبارية
    for (const group of selectedProduct.option_groups) {
      if (
        group.isRequired &&
        (!selections[group.id] || selections[group.id].length === 0)
      ) {
        toast.error(`الرجاء اختيار ${group.name}`);
        return;
      }
    }

    // تجهيز selectedOptions للعرض في السلة
    const selectedOptionsForCart = calculatedOptions.map((opt) => ({
      id: opt.id,
      name: opt.name,
      price: opt.price,
    }));

    addToCart({
      productId: selectedProduct.id,
      name: selectedProduct.name,
      basePrice: selectedProduct.base_price,
      finalPrice: calculatedPrice,
      category: selectedProduct.category,
      selectedOptions: selectedOptionsForCart,
    });

    toast.success(`تمت إضافة ${selectedProduct.name} إلى السلة`);
    setSelectedProduct(null);
  };

  const getIconAnimation = (catId: string, isActive: boolean) => {
    if (isActive) return "animate-icon-pulse";
    return "";
  };

  return (
    <section
      ref={sectionRef}
      id="menu"
      className="bg-royal-red-dark relative py-20 overflow-hidden"
    >
      {/* خلفية متحركة خفيفة */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[var(--gold)] rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[var(--gold)] rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        {/* Section Title */}
        <div
          className="mb-16 text-center transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
          }}
        >
          <h2 className="animate-shimmer mb-4 text-4xl font-bold md:text-5xl text-[var(--gold)]">
            القائمة
          </h2>
          <div className="mx-auto h-1 w-24 rounded-full bg-[var(--gold)]/50" />
        </div>

        {/* Category Tabs - نسختك الجديدة مع التمرير الأفقي للموبايل فقط */}
        <div
className="mb-8 sm:mb-14 flex gap-3 overflow-x-auto overflow-y-hidden px-2 sm:flex-wrap sm:justify-center scrollbar-hide"          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s",
          }}
        >
          {categories.map((cat, index) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 group flex flex-col items-center gap-2 rounded-2xl px-4 py-3 transition-all duration-300 sm:px-5 sm:py-4 ${
                  isActive
                    ? "border-2 border-[var(--gold)]/60 bg-[var(--gold)]/15 shadow-lg scale-105"
                    : "border border-[var(--gold)]/20 bg-[var(--royal-red-light)]/40 hover:border-[var(--gold)]/40 hover:bg-[var(--gold)]/8 hover:scale-102"
                }`}
                style={{ minWidth: "90px" }}
              >
                {/* 3D Icon Container - مع تصغير للموبايل */}
                <div className="menu-icon-3d">
                  <div
                    className={`menu-icon-3d-inner flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl transition-all duration-500 icon-container ${
                      isActive ? "icon-active" : ""
                    }`}
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg, hsl(43 65% 52% / 0.25), hsl(43 65% 52% / 0.12))"
                        : "linear-gradient(135deg, hsl(350 60% 18% / 0.7), hsl(350 76% 14% / 0.5))",
                      boxShadow: isActive
                        ? "0 8px 25px hsl(43 65% 52% / 0.25), inset 0 2px 5px hsl(43 65% 52% / 0.2)"
                        : "0 4px 12px hsl(0 0% 0% / 0.3), inset 0 1px 2px hsl(0 0% 100% / 0.1)",
                    }}
                  >
                    {cat.icon ? (
                      <span
                        className={`text-2xl sm:text-3xl icon-hover-effect ${getIconAnimation(cat.id, isActive)}`}
                        style={{
                          display: "inline-block",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform =
                            "scale(1.2) rotate(5deg)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform =
                            "scale(1) rotate(0deg)";
                        }}
                      >
                        {cat.icon}
                      </span>
                    ) : (
                      <div
                        className={`icon-hover-effect scale-90 sm:scale-100 ${getIconAnimation(cat.id, isActive)}`}
                      >
                        {categoryIcons[cat.id]}
                      </div>
                    )}
                  </div>
                </div>

                {/* Label - مع تصغير للموبايل */}
                <span
                  className={`text-xs sm:text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? "text-[var(--gold)] scale-105"
                      : "text-[var(--gold)]/60 group-hover:text-[var(--gold)]/80"
                  }`}
                >
                  {cat.label}
                </span>

                {/* Active indicator dot */}
                <div
                  className="h-1 rounded-full transition-all duration-400"
                  style={{
                    width: isActive ? "24px" : "0px",
                    background: isActive ? "var(--gold)" : "transparent",
                    opacity: isActive ? 1 : 0,
                    boxShadow: isActive ? "0 0 10px var(--gold)" : "none",
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        {loadingProducts ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--gold)]/50" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {currentCategory?.items.map((item, index) => {
              const imgUrl =
                "image_url" in item
                  ? (item as { image_url?: string }).image_url
                  : undefined;
              return (
                <div
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-[var(--gold)]/20 bg-[var(--royal-red-light)]/60 backdrop-blur-sm transition-all duration-500 hover:border-[var(--gold)]/50 hover:shadow-2xl hover:shadow-[var(--gold)]/20 hover:-translate-y-1"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(20px)",
                    transition: `opacity 0.5s ease ${index * 0.04 + 0.3}s, transform 0.5s ease ${index * 0.04 + 0.3}s, box-shadow 0.3s ease, border-color 0.3s ease`,
                  }}
                >
                  {/* Product Image */}
                  {imgUrl && (
                    <div className="relative h-44 w-full overflow-hidden">
                      <img
                        src={imgUrl}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        crossOrigin="anonymous"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--royal-red-dark)] via-transparent to-transparent" />

                      {/* Badge للمنتجات المميزة */}
                      {item.is_featured && (
                        <div className="absolute top-2 right-2 bg-[var(--gold)] text-[var(--royal-red-dark)] text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                          مميز
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <h3 className="text-lg font-bold text-[var(--cream)] group-hover:text-[var(--gold)] transition-colors">
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

                    {/* Add to Cart */}
                    <button
                      onClick={() => {
                        const fullProduct = dbProducts?.find(
                          (p) => p.id === Number(item.id),
                        );
                        if (fullProduct) {
                          setSelectedProduct(fullProduct);
                        } else {
                          toast.error("لم يتم العثور على المنتج");
                        }
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/10 py-3 text-sm font-semibold text-[var(--gold)] transition-all duration-300 hover:bg-[var(--gold)] hover:text-[var(--royal-red-dark)] hover:scale-105 active:scale-95"
                    >
                      <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                      أضف إلى السلة
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Options Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--gold)]/30 bg-[var(--royal-red-dark)] shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--royal-red-light)] text-[var(--gold)]/70 transition-all hover:text-[var(--gold)] hover:scale-110"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Product image */}
            {selectedProduct.image_url && (
              <div className="relative h-48 w-full overflow-hidden rounded-t-3xl">
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--royal-red-dark)] via-transparent to-transparent" />
              </div>
            )}

            <div className="p-6">
              {/* Product info */}
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

              {/* Option Groups */}
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
                              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-right transition-all duration-200 ${
                                isSelected
                                  ? "border-[var(--gold)] bg-[var(--gold)]/15 scale-102"
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
                                <span
                                  className={`text-sm font-medium ${
                                    isSelected
                                      ? "text-[var(--gold)]"
                                      : "text-[var(--cream)]"
                                  }`}
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

              {/* Total Price & Add to Cart */}
              <div className="mb-4 flex justify-between items-center">
                <span className="text-sm text-[var(--gold)]/70">
                  السعر النهائي:
                </span>
                {calculating ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--gold)]/50" />
                ) : (
                  <span className="text-xl font-bold text-[var(--gold)] animate-pulse">
                    {calculatedPrice !== null
                      ? calculatedPrice.toFixed(2)
                      : Number(selectedProduct.base_price).toFixed(2)}{" "}
                    د.ل
                  </span>
                )}
              </div>

              <button
                onClick={confirmAddToCart}
                disabled={calculating}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)] py-3.5 text-sm font-bold text-[var(--royal-red-dark)] transition-all duration-300 hover:shadow-xl hover:shadow-[var(--gold)]/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                <span>أضف إلى السلة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
