"use client"

import { useEffect, useRef } from "react"

/**
 * Global ambient floating particles rendered on a fixed canvas.
 * Uses only GPU-composited properties (transform, opacity) for 60 fps.
 */
export default function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let w = (canvas.width = window.innerWidth)
    let h = (canvas.height = window.innerHeight)

    // Soft gold orbs drifting slowly
    const orbs = Array.from({ length: 18 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2.5 + 0.8,
      dx: (Math.random() - 0.5) * 0.15,
      dy: (Math.random() - 0.5) * 0.15 - 0.05,
      alpha: Math.random() * 0.35 + 0.1,
      pulse: Math.random() * Math.PI * 2,
    }))

    let raf: number
    function draw() {
      if (!ctx) return
      ctx.clearRect(0, 0, w, h)
      for (const o of orbs) {
        o.pulse += 0.008
        const a = o.alpha + Math.sin(o.pulse) * 0.08
        ctx.beginPath()
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(212,175,55,${Math.max(0, a)})`
        ctx.fill()

        o.x += o.dx
        o.y += o.dy
        if (o.x < -10) o.x = w + 10
        if (o.x > w + 10) o.x = -10
        if (o.y < -10) o.y = h + 10
        if (o.y > h + 10) o.y = -10
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    const onResize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    window.addEventListener("resize", onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  )
}
