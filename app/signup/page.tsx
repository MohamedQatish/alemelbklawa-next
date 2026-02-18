"use client"

import React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, UserPlus, Loader2, ArrowRight, Check, X, MapPin } from "lucide-react"
import PhoneInput from "@/components/phone-input"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [localNumber, setLocalNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [location, setLocation] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [countryDial, setCountryDial] = useState("")

  // Password strength indicators
  const passChecks = {
    length: password.length >= 6,
    hasNumber: /[0-9]/.test(password),
    match: password.length > 0 && password === confirmPassword,
  }

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!name.trim()) errors.name = "الاسم مطلوب"
    if (!localNumber.trim()) {
      errors.phone = "رقم الهاتف مطلوب"
    } else if (localNumber.trim().length < 7 || localNumber.trim().length > 12) {
      errors.phone = "رقم هاتف غير صالح"
    }
    if (!password) {
      errors.password = "كلمة المرور مطلوبة"
    } else if (password.length < 6) {
      errors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = "كلمة المرور غير متطابقة"
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
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), password, location: location.trim() }),
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

  function clearFieldError(field: string) {
    if (fieldErrors[field]) setFieldErrors((p) => { const n = { ...p }; delete n[field]; return n })
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

  function PasswordCheck({ ok, label }: { ok: boolean; label: string }) {
    return (
      <div className="flex items-center gap-1.5 text-xs" style={{ color: ok ? "hsl(120 50% 55%)" : "hsl(43 30% 50%)" }}>
        {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-40" />}
        {label}
      </div>
    )
  }

  return (
    <div className="bg-royal-red-dark relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 70% 20%, hsl(43 65% 52% / 0.04) 0%, transparent 50%), radial-gradient(circle at 30% 80%, hsl(350 76% 30% / 0.15) 0%, transparent 50%)",
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
            إنشاء حساب جديد
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--gold)" }}>
            سجل الآن للاستمتاع بخدماتنا
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
          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium" style={{ color: "var(--gold)" }}>
              الاسم الكامل
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); clearFieldError("name") }}
              placeholder="أدخل اسمك"
              required
              className={inputBase}
              style={inputStyle(!!fieldErrors.name)}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs" style={{ color: "hsl(0 80% 65%)" }}>{fieldErrors.name}</p>
            )}
          </div>

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
                clearFieldError("phone")
              }}
              defaultCountry="LY"
              error={!!fieldErrors.phone}
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-xs" style={{ color: "hsl(0 80% 65%)" }}>{fieldErrors.phone}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="mb-1.5 block text-sm font-medium" style={{ color: "var(--gold)" }}>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                الموقع / المدينة
              </span>
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="مثال: طرابلس، بنغازي، مصراتة..."
              className={inputBase}
              style={inputStyle(false)}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            <p className="mt-1 text-xs" style={{ color: "var(--gold)", opacity: 0.4 }}>
              اختياري - يساعدنا في تقديم خدمة أفضل
            </p>
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
                onChange={(e) => { setPassword(e.target.value); clearFieldError("password") }}
                placeholder="6 أحرف على الأقل"
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
            {/* Password strength */}
            {password.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-3">
                <PasswordCheck ok={passChecks.length} label="6 أحرف+" />
                <PasswordCheck ok={passChecks.hasNumber} label="يحتوي رقم" />
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium" style={{ color: "var(--gold)" }}>
              تأكيد كلمة المرور
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError("confirmPassword") }}
              placeholder="أعد إدخال كلمة المرور"
              required
              dir="ltr"
              className={inputBase}
              style={inputStyle(!!fieldErrors.confirmPassword)}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-xs" style={{ color: "hsl(0 80% 65%)" }}>{fieldErrors.confirmPassword}</p>
            )}
            {confirmPassword.length > 0 && !fieldErrors.confirmPassword && (
              <div className="mt-1.5">
                <PasswordCheck ok={passChecks.match} label={passChecks.match ? "كلمة المرور متطابقة" : "كلمة المرور غير متطابقة"} />
              </div>
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
                جاري التسجيل...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                إنشاء حساب
              </>
            )}
          </button>
        </form>

        {/* Login link */}
        <p className="mt-6 text-center text-sm" style={{ color: "var(--gold)" }}>
          {"لديك حساب بالفعل؟ "}
          <Link
            href="/login"
            className="font-semibold underline underline-offset-4 transition-colors duration-200 hover:text-cream"
            style={{ color: "var(--gold-light)" }}
          >
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  )
}
