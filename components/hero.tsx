"use client"

/* force rebuild */
import { useEffect, useRef } from "react"
import { useSiteSettings } from "@/lib/use-site-settings"

export default function Hero() {
  const { getSetting, getImageUrl } = useSiteSettings()
  const particlesRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = particlesRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let w = (canvas.width = window.innerWidth)
    let h = (canvas.height = window.innerHeight)

    const particles: Array<{
      x: number
      y: number
      size: number
      speedY: number
      speedX: number
      opacity: number
      pulse: number
    }> = []

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2.5 + 0.5,
        speedY: -Math.random() * 0.4 - 0.08,
        speedX: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.5 + 0.15,
        pulse: Math.random() * Math.PI * 2,
      })
    }

    let animationId: number
    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        p.pulse += 0.015
        const dynamicOpacity = p.opacity + Math.sin(p.pulse) * 0.12
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(212,175,55,${Math.max(0.05, dynamicOpacity)})`
        ctx.fill()
        p.y += p.speedY
        p.x += p.speedX

        if (p.y < -10) {
          p.y = h + 10
          p.x = Math.random() * w
        }
      }
      animationId = requestAnimationFrame(animate)
    }
    animate()

    const handleResize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${getImageUrl("hero_bg", "/images/hero-bg.jpg")}')` }}
      />

      {/* Dark red overlay */}
      <div className="absolute inset-0 bg-[var(--royal-red-dark)]/80" />

      {/* Subtle radial vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, hsl(350 76% 6% / 0.6) 100%)",
        }}
      />

      {/* Gold Particles Canvas */}
      <canvas
        ref={particlesRef}
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      />

      {/* ===== Liquid Glass Card ===== */}
      <div className="glass-card relative z-10 mx-4 max-w-3xl rounded-3xl px-8 py-14 text-center md:px-16 md:py-20">
        {/* Decorative corner accents */}
        <span className="absolute top-4 right-4 h-8 w-8 border-t border-r border-[var(--gold)]/25 rounded-tr-xl" />
        <span className="absolute top-4 left-4 h-8 w-8 border-t border-l border-[var(--gold)]/25 rounded-tl-xl" />
        <span className="absolute bottom-4 right-4 h-8 w-8 border-b border-r border-[var(--gold)]/25 rounded-br-xl" />
        <span className="absolute bottom-4 left-4 h-8 w-8 border-b border-l border-[var(--gold)]/25 rounded-bl-xl" />

        {/* Main Title - Animated Gold + White Gradient */}
        <h1 className="brand-title mb-4 text-5xl leading-tight md:text-7xl lg:text-8xl" suppressHydrationWarning>
          {"\u0639\u064E\u0627\u0644\u064E\u0645\u064F \u0627\u0644\u0652\u0628\u064E\u0643\u0652\u0644\u064E\u0627\u0648\u064E\u0629"}
        </h1>

        {/* Subtitle */}
        <p
          className="mx-auto mb-10 max-w-xl text-lg leading-relaxed md:text-xl"
          style={{
            color: "hsl(43 60% 72%)",
            textShadow: "0 0 12px hsl(43 65% 52% / 0.2)",
          }}
        >
          {getSetting("hero_description", "حيث يلتقي التراث بالفخامة... أجود الحلويات الليبية والشرقية بأيدٍ ماهرة وخبرة عريقة تنقلك إلى عالمٍ من الأصالة والتميّز")}
        </p>

        {/* CTA Button - Solid Gold, Shimmer, Glow */}
        <button
          type="button"
          onClick={() =>
            document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })
          }
          className="btn-shimmer inline-block rounded-full px-12 py-4 text-lg font-bold transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
          style={{
            background:
              "linear-gradient(135deg, hsl(43 65% 48%), hsl(43 70% 58%))",
            color: "hsl(350 76% 8%)",
            boxShadow:
              "0 0 20px hsl(43 65% 52% / 0.35), 0 4px 15px hsl(0 0% 0% / 0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow =
              "0 0 35px hsl(43 65% 52% / 0.55), 0 6px 20px hsl(0 0% 0% / 0.35)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow =
              "0 0 20px hsl(43 65% 52% / 0.35), 0 4px 15px hsl(0 0% 0% / 0.3)"
          }}
        >
          استكشف القائمة
        </button>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-t from-[var(--royal-red-dark)] to-transparent" />
    </section>
  )
}
