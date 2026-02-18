"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { MapPin, Phone, Clock, Navigation, Loader2 } from "lucide-react"

interface DBBranch {
  id: number; name: string; address: string | null; phone: string | null; secondary_phone: string | null
  city: string; google_maps_url: string | null; latitude: number | null; longitude: number | null
  working_hours: string | null; image_url: string | null
}

interface BranchDisplay {
  id: string; name: string; address: string; phone: string; hours: string
  lat: number; lng: number; google_maps_url?: string
}

/* ===== Custom 3D Map Marker SVG ===== */
function MapMarker3D() {
  return (
    <svg
      width="44"
      height="58"
      viewBox="0 0 44 58"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: "drop-shadow(0 6px 10px hsl(0 0% 0% / 0.4)) drop-shadow(0 0 16px hsl(43 65% 52% / 0.25))",
        transition: "filter 0.3s ease",
      }}
    >
      <defs>
        {/* Pin body gradient — deep red to dark red */}
        <linearGradient id="pin-body" x1="6" y1="4" x2="38" y2="44">
          <stop offset="0%" stopColor="#9B2335" />
          <stop offset="40%" stopColor="#7B1E2F" />
          <stop offset="100%" stopColor="#5A0F1F" />
        </linearGradient>
        {/* Gold ring gradient */}
        <linearGradient id="pin-ring" x1="10" y1="10" x2="34" y2="30">
          <stop offset="0%" stopColor="#E0C97B" />
          <stop offset="50%" stopColor="#C5A55A" />
          <stop offset="100%" stopColor="#A8873A" />
        </linearGradient>
        {/* Inner glow */}
        <radialGradient id="pin-glow" cx="50%" cy="35%" r="30%">
          <stop offset="0%" stopColor="#FFF8E7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FFF8E7" stopOpacity="0" />
        </radialGradient>
        {/* Highlight reflection */}
        <linearGradient id="pin-hi" x1="14" y1="6" x2="22" y2="20">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Pin shape — teardrop */}
      <path
        d="M22 2C12 2 4 10 4 20C4 32 22 54 22 54C22 54 40 32 40 20C40 10 32 2 22 2Z"
        fill="url(#pin-body)"
        stroke="url(#pin-ring)"
        strokeWidth="2"
      />

      {/* Inner gold ring */}
      <circle cx="22" cy="20" r="10" fill="none" stroke="url(#pin-ring)" strokeWidth="2.5" />

      {/* Inner gold dot */}
      <circle cx="22" cy="20" r="5" fill="url(#pin-ring)" />

      {/* Center glow */}
      <circle cx="22" cy="18" r="8" fill="url(#pin-glow)" />

      {/* Specular highlight */}
      <ellipse cx="17" cy="12" rx="6" ry="5" fill="url(#pin-hi)" />
    </svg>
  )
}

export default function BranchesSection() {
  const [visible, setVisible] = useState(false)
  const [branches, setBranches] = useState<BranchDisplay[]>([])
  const [loadingBranches, setLoadingBranches] = useState(true)
  const sectionRef = useRef<HTMLElement>(null)

  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch("/api/branches")
      if (res.ok) {
        const data: DBBranch[] = await res.json()
        if (data.length > 0) {
          setBranches(data.map((b) => ({
            id: String(b.id),
            name: b.name,
            address: b.address || "",
            phone: b.phone || "",
            hours: b.working_hours || "",
            lat: b.latitude || 0,
            lng: b.longitude || 0,
            google_maps_url: b.google_maps_url || undefined,
          })))
        }
      }
    } catch { /* fall back to static */ }
    finally { setLoadingBranches(false) }
  }, [])

  useEffect(() => { fetchBranches() }, [fetchBranches])

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
      { threshold: 0.08 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} id="branches" className="bg-royal-red-dark relative py-20">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-l from-transparent via-[var(--gold)]/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-6">
        {/* Title */}
        <div
          className="mb-16 text-center transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)" }}
        >
          <h2 className="animate-shimmer mb-4 text-4xl font-bold md:text-5xl">فروعنا</h2>
          <div className="mx-auto h-1 w-24 rounded-full bg-[var(--gold)]/50" />
          <p className="mx-auto mt-4 max-w-md text-sm text-[var(--gold)]/50 leading-relaxed">
            زورونا في أحد فروعنا الثلاثة في طرابلس
          </p>
        </div>

        {/* Branch Cards Grid */}
        <div className={`grid gap-8 ${branches.length === 1 ? "max-w-lg mx-auto" : branches.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          {branches.map((branch, idx) => (
            <div
              key={branch.id}
              className="gold-border-glow group overflow-hidden rounded-2xl border border-[var(--gold)]/15 bg-[var(--royal-red-light)]/40 transition-all duration-500 hover:border-[var(--gold)]/40"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(30px)",
                transitionDelay: `${idx * 180 + 250}ms`,
              }}
            >
              {/* 3D Map Container */}
              <div className="map-3d-wrap relative h-56 w-full">
                <div className="map-3d relative h-full w-full">
                  <iframe
                    src={`https://maps.google.com/maps?q=${branch.lat},${branch.lng}&z=15&output=embed`}
                    className="h-full w-full border-0"
                    loading="lazy"
                    title={`خريطة ${branch.name}`}
                    allowFullScreen
                  />

                  {/* Gradient overlay at bottom */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--royal-red-dark)] via-transparent to-transparent opacity-60" />
                </div>

                {/* 3D Custom Marker */}
                <div
                  className="map-marker-3d"
                  style={{ animationDelay: `${idx * 200 + 600}ms` }}
                >
                  <MapMarker3D />
                  {/* Pulse ring */}
                  <div className="marker-pulse-ring" />
                  {/* Ground shadow */}
                  <div className="marker-ground-shadow" />
                </div>
              </div>

              {/* Branch Info */}
              <div className="p-6">
                <h3 className="mb-4 text-xl font-bold text-[var(--cream)] transition-colors duration-300 group-hover:text-[var(--gold)]">
                  {branch.name}
                </h3>

                <div className="mb-3 flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)] transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-sm leading-relaxed text-[var(--gold)]/70">{branch.address}</span>
                </div>

                <div className="mb-3 flex items-center gap-3">
                  <Clock className="h-4 w-4 shrink-0 text-[var(--gold)] transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-sm text-[var(--gold)]/70">{branch.hours}</span>
                </div>

                <div className="mb-6 flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-[var(--gold)] transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-sm text-[var(--gold)]/70" dir="ltr">{branch.phone}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <a
                    href={`tel:${branch.phone}`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/10 py-3 text-sm font-semibold text-[var(--gold)] transition-all duration-300 hover:bg-[var(--gold)] hover:text-[var(--royal-red-dark)]"
                  >
                    <Phone className="h-4 w-4" />
                    اتصل بنا
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-[var(--gold)]/20 bg-[var(--gold)]/5 px-4 py-3 text-sm font-semibold text-[var(--gold)]/70 transition-all duration-300 hover:border-[var(--gold)]/40 hover:bg-[var(--gold)]/10 hover:text-[var(--gold)]"
                    title="الاتجاهات"
                  >
                    <Navigation className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
