"use client"

import React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, User } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        router.push("/admin/dashboard")
      } else {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة")
      }
    } catch {
      setError("حدث خطأ في الاتصال")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--admin-bg)" }}>
      <div className="w-full max-w-md">
        <div className="mb-8 animate-fade-in text-center">
          <h1 className="brand-title-sm text-4xl" suppressHydrationWarning>{"\u0639\u064E\u0627\u0644\u064E\u0645\u064F \u0627\u0644\u0652\u0628\u064E\u0643\u0652\u0644\u064E\u0627\u0648\u064E\u0629"}</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--admin-text-muted)" }}>لوحة التحكم</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="admin-panel animate-card-enter relative p-8"
        >
          <div className="relative z-10">
            <h2 className="mb-6 text-center text-xl font-bold" style={{ color: "var(--admin-text)" }}>تسجيل الدخول</h2>

            {error && (
              <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-center text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--admin-accent-light)" }}>
                <User className="h-4 w-4" />
                اسم المستخدم
              </label>
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 transition-all duration-300 focus:outline-none"
                style={{
                  background: "var(--admin-surface-hover)",
                  borderColor: "var(--admin-border)",
                  color: "var(--admin-text)",
                }}
                placeholder="أدخل اسم المستخدم"
              />
            </div>

            <div className="mb-6">
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--admin-accent-light)" }}>
                <Lock className="h-4 w-4" />
                كلمة المرور
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 transition-all duration-300 focus:outline-none"
                style={{
                  background: "var(--admin-surface-hover)",
                  borderColor: "var(--admin-border)",
                  color: "var(--admin-text)",
                }}
                placeholder="أدخل كلمة المرور"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="admin-btn-glow w-full rounded-xl py-4 text-lg font-bold transition-all duration-300 disabled:opacity-50"
              style={{
                background: "var(--admin-accent)",
                color: "var(--admin-bg)",
              }}
            >
              {loading ? "جاري تسجيل الدخول..." : "دخول"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
