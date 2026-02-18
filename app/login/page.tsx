"use client"

import React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LogIn, Loader2, ArrowRight } from "lucide-react"
import PhoneInput from "@/components/phone-input"

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [localNumber, setLocalNumber] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; password?: string }>({})
  const [countryDial, setCountryDial] = useState("")

  function validate(): boolean {
    const errors: typeof fieldErrors = {}
    if (!localNumber.trim()) {
      errors.phone = "رقم الهاتف مطلوب"
    } else if (localNumber.trim().length < 7 || localNumber.trim().length > 12) {
      errors.phone = "رقم هاتف غير صالح"
    }
    if (!password) {
      errors.password = "كلمة المرور مطلوبة"
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!validate()) return
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "حدث خطأ")
        return
      }
      router.push("/")
    } catch {
      setError("حدث خطأ في الاتصال")
    } finally {
      setLoading(false)
    }
  }

  const inputBase =
    "w-full rounded-xl border px-4 py-3 text-sm transition-all duration-300 placeholder:opacity-40 focus:outline-none"

  function inputStyle(hasError: boolean) {
    return {
      background: "hsl(350 76% 10% / 0.6)",
      borderColor: hasError ? "hsl(0 70% 50% / 0.6)" : "hsl(43 65% 52% / 0.2)",
      color: "var(--cream)",
    }
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "hsl(43 65% 52% / 0.5)"
    e.currentTarget.style.boxShadow = "0 0 12px hsl(43 65% 52% / 0.15)"
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.boxShadow = "none"
  }

  return (
    <div className="bg-royal-red-dark relative flex min-h-screen items-center justify-center px-4">
      {/* Background decoration */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, hsl(43 65% 52% / 0.04) 0%, transparent 50%), radial-gradient(circle at 70% 80%, hsl(350 76% 30% / 0.15) 0%, transparent 50%)",
        }}
      />

      <div className="glass-card relative z-10 w-full max-w-md rounded-2xl p-8">
        {/* Back button */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-100"
          style={{ color: "var(--gold)", opacity: 0.6 }}
        >
          <ArrowRight className="h-3.5 w-3.5" />
          العودة للرئيسية
        </Link>

        {/* Header */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="brand-title-sm mb-2 inline-block text-3xl"
            suppressHydrationWarning
          >
            {"\u0639\u064E\u0627\u0644\u064E\u0645\u064F \u0627\u0644\u0652\u0628\u064E\u0643\u0652\u0644\u064E\u0627\u0648\u064E\u0629"}
          </Link>
          <h1 className="text-xl font-semibold" style={{ color: "var(--gold-light)" }}>
            تسجيل الدخول
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--gold)" }}>
            أدخل بياناتك للمتابعة
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="mb-5 rounded-xl border px-4 py-3 text-center text-sm font-medium"
            style={{
              borderColor: "hsl(0 60% 40%)",
              background: "hsl(0 60% 20% / 0.3)",
              color: "hsl(0 80% 70%)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--gold)" }}>
              رقم الهاتف
            </label>
            <PhoneInput
              value={localNumber}
              onChange={(fullPhone, _dial, local) => {
                setPhone(fullPhone)
                setLocalNumber(local)
                if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: undefined }))
              }}
              defaultCountry="LY"
              error={!!fieldErrors.phone}
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-xs" style={{ color: "hsl(0 80% 65%)" }}>{fieldErrors.phone}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium" style={{ color: "var(--gold)" }}>
              كلمة المرور
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }))
                }}
                placeholder="******"
                required
                dir="ltr"
                className={`${inputBase} pe-12`}
                style={inputStyle(!!fieldErrors.password)}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 left-3 -translate-y-1/2 p-1 opacity-50 transition-opacity hover:opacity-100"
                style={{ color: "var(--gold)" }}
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs" style={{ color: "hsl(0 80% 65%)" }}>{fieldErrors.password}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-shimmer mt-2 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, hsl(43 60% 45%), hsl(43 70% 55%), hsl(43 60% 48%))",
              color: "hsl(350 76% 8%)",
              boxShadow: "0 4px 20px hsl(43 65% 52% / 0.3)",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري الدخول...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                تسجيل الدخول
              </>
            )}
          </button>
        </form>

        {/* Signup link */}
        <p className="mt-6 text-center text-sm" style={{ color: "var(--gold)" }}>
          {"ليس لديك حساب؟ "}
          <Link
            href="/signup"
            className="font-semibold underline underline-offset-4 transition-colors duration-200 hover:text-cream"
            style={{ color: "var(--gold-light)" }}
          >
            إنشاء حساب
          </Link>
        </p>
      </div>
    </div>
  )
}
