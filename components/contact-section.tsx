"use client"

import React from "react"

import { useEffect, useRef, useCallback } from "react"
import { Phone, MessageCircle } from "lucide-react"
import { useSiteSettings } from "@/lib/use-site-settings"

/* ===== 3D Tilt Card Logic ===== */
function useTilt3D() {
  const ref = useRef<HTMLAnchorElement>(null)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateY = ((x - centerX) / centerX) * 8
    const rotateX = ((centerY - y) / centerY) * 6
    el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    el.style.setProperty("--glow-x", `${(x / rect.width) * 100}%`)
    el.style.setProperty("--glow-y", `${(y / rect.height) * 100}%`)
  }, [])

  const handleMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = "rotateX(0deg) rotateY(0deg)"
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener("mousemove", handleMouseMove)
    el.addEventListener("mouseleave", handleMouseLeave)
    return () => {
      el.removeEventListener("mousemove", handleMouseMove)
      el.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [handleMouseMove, handleMouseLeave])

  return ref
}

/* ===== Contact Card Component ===== */
function ContactCard3D({
  href,
  icon,
  title,
  subtitle,
  accentColor,
  delay,
}: {
  href: string
  icon: React.ReactNode
  title: string
  subtitle: string
  accentColor: string
  delay: number
}) {
  const tiltRef = useTilt3D()
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add("visible"), delay)
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div ref={cardRef} className="perspective-container stagger-enter">
      <a
        ref={tiltRef}
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        className="card-3d group relative block overflow-hidden rounded-2xl border border-[var(--gold)]/15 bg-[var(--royal-red-light)]/60 p-8 backdrop-blur-sm transition-all duration-400"
        style={{ transformStyle: "preserve-3d" } as React.CSSProperties}
      >
        {/* Glow layer that follows cursor */}
        <div className="card-3d-glow" />

        {/* Top gold accent line */}
        <div
          className="absolute top-0 right-0 left-0 h-[2px] opacity-0 transition-opacity duration-400 group-hover:opacity-100"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
        />

        {/* Icon */}
        <div className="card-3d-icon mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--gold)]/20 bg-[var(--gold)]/8 transition-all duration-400 group-hover:border-[var(--gold)]/40 group-hover:bg-[var(--gold)]/15 group-hover:shadow-[0_0_20px_hsl(43_65%_52%/0.15)]">
          {icon}
        </div>

        {/* Text content */}
        <div className="card-3d-inner">
          <h3 className="mb-2 text-xl font-bold text-[var(--cream)] transition-all duration-300 group-hover:text-[var(--gold)]">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-[var(--gold)]/50 transition-all duration-300 group-hover:text-[var(--gold)]/70">
            {subtitle}
          </p>
        </div>

        {/* Bottom arrow indicator */}
        <div className="mt-6 flex items-center gap-2 text-xs font-medium text-[var(--gold)]/40 transition-all duration-300 group-hover:text-[var(--gold)]/70">
          <span>افتح</span>
          <svg className="h-3.5 w-3.5 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>

        {/* Decorative corner accent */}
        <span className="absolute bottom-3 left-3 h-6 w-6 border-b border-l border-[var(--gold)]/15 rounded-bl-lg opacity-0 transition-opacity duration-400 group-hover:opacity-100" />
      </a>
    </div>
  )
}

/* ===== Main Section ===== */
const CURRENT_YEAR = "2026"

export default function ContactSection() {
  const { getSetting } = useSiteSettings()
  const titleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible")
          observer.unobserve(el)
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="contact" className="bg-royal-red-dark relative overflow-hidden py-24">
      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-l from-transparent via-[var(--gold)]/40 to-transparent" />

      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, hsl(43 65% 52% / 0.04) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Title */}
        <div ref={titleRef} className="stagger-enter mb-16 text-center">
          <h2 className="animate-shimmer mb-4 text-4xl font-bold md:text-5xl">تواصل معنا</h2>
          <p className="text-gold/50 mx-auto max-w-md text-lg">
            نسعد بتواصلكم معنا عبر أي من القنوات التالية
          </p>
          <div className="mx-auto mt-5 h-1 w-24 rounded-full bg-[var(--gold)]/50" />
        </div>

        {/* 3D Cards Grid */}
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
          {/* Facebook */}
          <ContactCard3D
            href={getSetting("facebook_url", "https://www.facebook.com/share/1DZGnJfuwq/")}
            icon={
              <svg className="h-8 w-8 text-[var(--gold)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            }
            title="فيسبوك"
            subtitle="تابعنا على صفحتنا الرسمية"
            accentColor="hsl(220 90% 55%)"
            delay={0}
          />

          {/* WhatsApp */}
          <ContactCard3D
            href={`https://wa.me/${getSetting("whatsapp_number", "218925006674").replace(/^0/, "218").replace(/\s/g, "")}`}
            icon={<MessageCircle className="h-8 w-8 text-[var(--gold)]" />}
            title="واتساب"
            subtitle={getSetting("whatsapp_number", "0925006674")}
            accentColor="hsl(142 70% 45%)"
            delay={150}
          />

          {/* Phone */}
          <ContactCard3D
            href={`tel:${getSetting("contact_phone", "0925006674")}`}
            icon={<Phone className="h-8 w-8 text-[var(--gold)]" />}
            title="اتصل بنا"
            subtitle={getSetting("contact_phone", "0925006674")}
            accentColor="hsl(43 65% 52%)"
            delay={300}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-24 border-t border-[var(--gold)]/10 pt-8 text-center">
        <p className="text-sm text-[var(--gold)]/40">
          {getSetting("footer_text", "جميع الحقوق محفوظة")} &copy; {CURRENT_YEAR}{" "}
          <span className="font-thuluth font-bold" suppressHydrationWarning>{"\u0639\u064E\u0627\u0644\u064E\u0645\u064F \u0627\u0644\u0652\u0628\u064E\u0643\u0652\u0644\u064E\u0627\u0648\u064E\u0629"}</span>
        </p>
      </div>
    </section>
  )
}
