"use client"

/* force rebuild */
import { useState, useEffect, useCallback, useSyncExternalStore } from "react"
import { Menu, X, ShoppingCart, LogIn, UserPlus, User, LogOut, Loader2, Shield } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCartCount, getServerCount, subscribeToCart } from "@/lib/cart"

const navItems = [
  { id: "home", label: "الرئيسية" },
  { id: "menu", label: "القائمة" },
  { id: "events", label: "المناسبات" },
  { id: "branches", label: "الفروع" },
  { id: "contact", label: "تواصل معنا" },
]

interface UserData {
  id: number
  name: string
  phone: string
}

export default function Header({ onCartOpen }: { onCartOpen: () => void }) {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const cartCount = useSyncExternalStore(subscribeToCart, getCartCount, getServerCount)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Check auth status
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user)
      })
      .catch(() => {})
  }, [])

  // Close user dropdown on outside click
  useEffect(() => {
    if (!userMenuOpen) return
    const handler = () => setUserMenuOpen(false)
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [userMenuOpen])

  const handleLogout = useCallback(async () => {
    setLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      setUserMenuOpen(false)
      setMobileOpen(false)
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }, [router])

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
      setMobileOpen(false)
    }
  }

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b shadow-lg shadow-black/30"
          : ""
      }`}
      style={{
        background: scrolled
          ? "linear-gradient(135deg, hsl(350 76% 10% / 0.88), hsl(350 76% 14% / 0.82))"
          : "linear-gradient(180deg, hsl(350 76% 6% / 0.7) 0%, hsl(350 76% 6% / 0.3) 60%, transparent 100%)",
        backdropFilter: scrolled ? "blur(16px) saturate(1.3)" : "blur(6px)",
        WebkitBackdropFilter: scrolled ? "blur(16px) saturate(1.3)" : "blur(6px)",
        borderColor: scrolled ? "hsl(43 65% 52% / 0.1)" : "transparent",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        {/* Logo */}
        <button
          onClick={() => scrollTo("home")}
          className="brand-title-sm text-xl sm:text-2xl"
          suppressHydrationWarning
        >
          {"\u0639\u064E\u0627\u0644\u064E\u0645\u064F \u0627\u0644\u0652\u0628\u064E\u0643\u0652\u0644\u064E\u0627\u0648\u064E\u0629"}
        </button>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="text-gold-light relative text-sm font-medium transition-colors duration-300 after:absolute after:-bottom-1 after:right-0 after:h-0.5 after:w-0 after:bg-[var(--gold)] after:transition-all after:duration-300 hover:text-gold hover:after:w-full"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right side: Auth + Cart + Mobile toggle */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* ====== AUTH BUTTONS - DESKTOP ====== */}
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-300 hover:scale-[1.03]"
                  style={{
                    borderColor: "hsl(43 65% 52% / 0.4)",
                    color: "hsl(43 65% 52%)",
                    background: "hsl(350 76% 12% / 0.7)",
                    backdropFilter: "blur(8px)",
                    boxShadow: "0 2px 8px hsl(0 0% 0% / 0.2)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "hsl(43 65% 52% / 0.6)"
                    e.currentTarget.style.boxShadow =
                      "0 2px 16px hsl(43 65% 52% / 0.2)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "hsl(43 65% 52% / 0.4)"
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px hsl(0 0% 0% / 0.2)"
                  }}
                >
                  <User className="h-4 w-4" />
                  <span className="max-w-24 truncate">{user.name}</span>
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div
                    className="animate-fade-in absolute top-full left-0 mt-2 w-52 overflow-hidden rounded-xl border"
                    style={{
                      background: "hsl(350 76% 11% / 0.97)",
                      borderColor: "hsl(43 65% 52% / 0.15)",
                      backdropFilter: "blur(20px)",
                      boxShadow: "0 12px 40px hsl(0 0% 0% / 0.5)",
                    }}
                  >
                    <div
                      className="border-b px-4 py-3"
                      style={{ borderColor: "hsl(43 65% 52% / 0.1)" }}
                    >
                      <p className="truncate text-sm font-medium" style={{ color: "hsl(43 65% 52%)" }}>
                        {user.name}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: "hsl(43 50% 55%)" }} dir="ltr">
                        {user.phone}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm transition-colors duration-200 hover:bg-[hsl(43_65%_52%/0.08)]"
                      style={{ color: "hsl(43 65% 52%)" }}
                    >
                      <User className="h-4 w-4" />
                      الملف الشخصي
                    </Link>
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-2 border-t px-4 py-3 text-sm transition-colors duration-200 hover:bg-[hsl(0_50%_20%/0.3)] disabled:opacity-50"
                      style={{ color: "hsl(0 70% 65%)", borderColor: "hsl(43 65% 52% / 0.1)" }}
                    >
                      {loggingOut ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                      {loggingOut ? "جاري الخروج..." : "تسجيل الخروج"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* LOGIN BUTTON - outlined gold */}
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all duration-300 hover:scale-[1.04] active:scale-[0.97]"
                  style={{
                    borderColor: "hsl(43 65% 52% / 0.5)",
                    color: "hsl(43 65% 52%)",
                    background: "hsl(350 76% 10% / 0.6)",
                    backdropFilter: "blur(8px)",
                    textShadow: "0 0 8px hsl(43 65% 52% / 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "hsl(43 65% 52% / 0.8)"
                    e.currentTarget.style.background = "hsl(350 76% 14% / 0.7)"
                    e.currentTarget.style.boxShadow = "0 0 18px hsl(43 65% 52% / 0.2), 0 2px 8px hsl(0 0% 0% / 0.2)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "hsl(43 65% 52% / 0.5)"
                    e.currentTarget.style.background = "hsl(350 76% 10% / 0.6)"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  <LogIn className="h-4 w-4" />
                  دخول
                </Link>

                {/* SIGNUP BUTTON - solid gold gradient */}
                <Link
                  href="/signup"
                  className="btn-shimmer flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all duration-300 hover:scale-[1.04] active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(135deg, hsl(43 60% 45%), hsl(43 70% 55%), hsl(43 60% 48%))",
                    color: "hsl(350 76% 8%)",
                    boxShadow: "0 2px 14px hsl(43 65% 52% / 0.35), 0 1px 3px hsl(0 0% 0% / 0.2)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 24px hsl(43 65% 52% / 0.5), 0 2px 8px hsl(0 0% 0% / 0.3)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 2px 14px hsl(43 65% 52% / 0.35), 0 1px 3px hsl(0 0% 0% / 0.2)"
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                  حساب جديد
                </Link>
              </>
            )}
          </div>

          {/* Admin access button */}
          <Link
            href="/admin"
            className="hidden items-center gap-1 rounded-full border px-3 py-2 text-xs font-medium transition-all duration-300 hover:scale-[1.03] md:flex"
            style={{
              borderColor: "hsl(43 65% 52% / 0.2)",
              color: "hsl(43 50% 55%)",
              background: "hsl(350 76% 10% / 0.5)",
              backdropFilter: "blur(8px)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "hsl(43 65% 52% / 0.5)"
              e.currentTarget.style.color = "hsl(43 65% 52%)"
              e.currentTarget.style.boxShadow = "0 0 12px hsl(43 65% 52% / 0.15)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "hsl(43 65% 52% / 0.2)"
              e.currentTarget.style.color = "hsl(43 50% 55%)"
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            <Shield className="h-3.5 w-3.5" />
            الإدارة
          </Link>

          {/* Cart button */}
          <button
            onClick={onCartOpen}
            className="relative rounded-full p-2 transition-all duration-300 hover:scale-110"
            aria-label="سلة التسوق"
            style={{
              color: "hsl(43 65% 52%)",
              filter: "drop-shadow(0 0 4px hsl(43 65% 52% / 0.3))",
            }}
          >
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
            {cartCount > 0 && (
              <span
                className="absolute -top-0.5 -left-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                style={{
                  background: "linear-gradient(135deg, hsl(43 65% 48%), hsl(43 70% 58%))",
                  color: "hsl(350 76% 8%)",
                  boxShadow: "0 0 8px hsl(43 65% 52% / 0.5)",
                }}
              >
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-full p-2 transition-all duration-200 hover:scale-110 lg:hidden"
            aria-label="القائمة"
            style={{ color: "hsl(43 65% 52%)" }}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* ====== MOBILE NAV DROPDOWN ====== */}
      {mobileOpen && (
        <div
          className="animate-fade-in border-t lg:hidden"
          style={{
            background: "hsl(350 76% 9% / 0.97)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderColor: "hsl(43 65% 52% / 0.1)",
          }}
        >
          <nav className="flex flex-col items-center gap-4 py-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-lg font-medium transition-all duration-200 hover:scale-105"
                style={{ color: "hsl(43 65% 52%)" }}
              >
                {item.label}
              </button>
            ))}

            {/* Admin link - mobile */}
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:scale-105"
              style={{ color: "hsl(43 50% 55%)" }}
            >
              <Shield className="h-4 w-4" />
              لوحة الإدارة
            </Link>

            {/* ====== MOBILE AUTH BUTTONS ====== */}
            <div
              className="mt-2 flex w-full flex-col items-center gap-3 border-t px-6 pt-5"
              style={{ borderColor: "hsl(43 65% 52% / 0.1)" }}
            >
              {user ? (
                <>
                  <div className="flex items-center gap-2 text-sm" style={{ color: "hsl(43 70% 70%)" }}>
                    <User className="h-4 w-4" />
                    <span>{"مرحبا، "}{user.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    style={{
                      borderColor: "hsl(0 50% 40% / 0.5)",
                      color: "hsl(0 70% 65%)",
                      background: "hsl(0 50% 15% / 0.3)",
                    }}
                  >
                    {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                    {loggingOut ? "جاري الخروج..." : "تسجيل الخروج"}
                  </button>
                </>
              ) : (
                <>
                  {/* MOBILE LOGIN */}
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 py-3 text-base font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      borderColor: "hsl(43 65% 52% / 0.5)",
                      color: "hsl(43 65% 52%)",
                      background: "hsl(350 76% 12% / 0.6)",
                      textShadow: "0 0 8px hsl(43 65% 52% / 0.2)",
                    }}
                  >
                    <LogIn className="h-5 w-5" />
                    تسجيل الدخول
                  </Link>

                  {/* MOBILE SIGNUP */}
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="btn-shimmer flex w-full items-center justify-center gap-2 rounded-xl py-3 text-base font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, hsl(43 60% 45%), hsl(43 70% 55%), hsl(43 60% 48%))",
                      color: "hsl(350 76% 8%)",
                      boxShadow: "0 2px 16px hsl(43 65% 52% / 0.3)",
                    }}
                  >
                    <UserPlus className="h-5 w-5" />
                    إنشاء حساب جديد
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
