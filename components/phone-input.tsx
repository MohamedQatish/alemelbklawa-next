"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Search } from "lucide-react"

// Country data: code, dial code, flag emoji, Arabic name
const COUNTRIES = [
  { code: "LY", dial: "+218", flag: "\u{1F1F1}\u{1F1FE}", name: "ليبيا", placeholder: "9XXXXXXXX" },
  { code: "EG", dial: "+20", flag: "\u{1F1EA}\u{1F1EC}", name: "مصر", placeholder: "1XXXXXXXXX" },
  { code: "TN", dial: "+216", flag: "\u{1F1F9}\u{1F1F3}", name: "تونس", placeholder: "XXXXXXXX" },
  { code: "DZ", dial: "+213", flag: "\u{1F1E9}\u{1F1FF}", name: "الجزائر", placeholder: "XXXXXXXXX" },
  { code: "MA", dial: "+212", flag: "\u{1F1F2}\u{1F1E6}", name: "المغرب", placeholder: "XXXXXXXXX" },
  { code: "SA", dial: "+966", flag: "\u{1F1F8}\u{1F1E6}", name: "السعودية", placeholder: "5XXXXXXXX" },
  { code: "AE", dial: "+971", flag: "\u{1F1E6}\u{1F1EA}", name: "الإمارات", placeholder: "5XXXXXXXX" },
  { code: "IQ", dial: "+964", flag: "\u{1F1EE}\u{1F1F6}", name: "العراق", placeholder: "7XXXXXXXXX" },
  { code: "JO", dial: "+962", flag: "\u{1F1EF}\u{1F1F4}", name: "الأردن", placeholder: "7XXXXXXXX" },
  { code: "SY", dial: "+963", flag: "\u{1F1F8}\u{1F1FE}", name: "سوريا", placeholder: "9XXXXXXXX" },
  { code: "SD", dial: "+249", flag: "\u{1F1F8}\u{1F1E9}", name: "السودان", placeholder: "9XXXXXXXX" },
  { code: "TR", dial: "+90", flag: "\u{1F1F9}\u{1F1F7}", name: "تركيا", placeholder: "5XXXXXXXXX" },
  { code: "US", dial: "+1", flag: "\u{1F1FA}\u{1F1F8}", name: "أمريكا", placeholder: "XXXXXXXXXX" },
  { code: "GB", dial: "+44", flag: "\u{1F1EC}\u{1F1E7}", name: "بريطانيا", placeholder: "7XXXXXXXXX" },
  { code: "DE", dial: "+49", flag: "\u{1F1E9}\u{1F1EA}", name: "ألمانيا", placeholder: "1XXXXXXXXXX" },
  { code: "FR", dial: "+33", flag: "\u{1F1EB}\u{1F1F7}", name: "فرنسا", placeholder: "6XXXXXXXX" },
  { code: "IT", dial: "+39", flag: "\u{1F1EE}\u{1F1F9}", name: "إيطاليا", placeholder: "3XXXXXXXXX" },
]

interface PhoneInputProps {
  value: string
  onChange: (fullPhone: string, countryDial: string, localNumber: string) => void
  defaultCountry?: string
  className?: string
  error?: boolean
}

export default function PhoneInput({
  value,
  onChange,
  defaultCountry = "LY",
  className = "",
  error = false,
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState(
    () => COUNTRIES.find((c) => c.code === defaultCountry) || COUNTRIES[0],
  )
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [localNumber, setLocalNumber] = useState(value)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Focus search when dropdown opens
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus()
    }
  }, [open])

  const filtered = search.trim()
    ? COUNTRIES.filter(
        (c) =>
          c.name.includes(search) ||
          c.dial.includes(search) ||
          c.code.toLowerCase().includes(search.toLowerCase()),
      )
    : COUNTRIES

  function handleLocalChange(val: string) {
    // Only allow digits
    const digits = val.replace(/\D/g, "")
    setLocalNumber(digits)
    onChange(`${selectedCountry.dial}${digits}`, selectedCountry.dial, digits)
  }

  function handleCountrySelect(country: (typeof COUNTRIES)[0]) {
    setSelectedCountry(country)
    setOpen(false)
    setSearch("")
    onChange(`${country.dial}${localNumber}`, country.dial, localNumber)
  }

  const borderColor = error ? "hsl(0 70% 50%)" : "hsl(43 65% 52% / 0.15)"
  const borderHover = error ? "hsl(0 70% 50%)" : "hsl(43 65% 52% / 0.3)"

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className="flex items-stretch overflow-hidden rounded-xl border transition-all duration-300 focus-within:shadow-[0_0_15px_hsl(43_65%_52%/0.1)]"
        style={{
          borderColor,
          background: "hsl(350 76% 10% / 0.5)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = borderHover)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = borderColor)}
      >
        {/* Country Selector Button */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 border-l px-3 py-3 transition-colors hover:bg-[hsl(43_65%_52%/0.05)]"
          style={{ borderColor: "hsl(43 65% 52% / 0.1)" }}
          aria-label="اختيار الدولة"
        >
          <span className="text-lg leading-none">{selectedCountry.flag}</span>
          <span
            className="font-mono text-xs font-medium"
            style={{ color: "var(--gold)" }}
            dir="ltr"
          >
            {selectedCountry.dial}
          </span>
          <ChevronDown
            className="h-3 w-3 transition-transform duration-200"
            style={{
              color: "var(--gold)",
              opacity: 0.6,
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>

        {/* Phone Number Input */}
        <input
          type="tel"
          inputMode="numeric"
          value={localNumber}
          onChange={(e) => handleLocalChange(e.target.value)}
          placeholder={selectedCountry.placeholder}
          className="flex-1 bg-transparent px-3 py-3 font-mono text-sm outline-none placeholder:opacity-30"
          style={{ color: "var(--cream)" }}
          dir="ltr"
          autoComplete="tel-national"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full right-0 left-0 z-50 mt-1.5 max-h-64 overflow-hidden rounded-xl border shadow-2xl"
          style={{
            borderColor: "hsl(43 65% 52% / 0.15)",
            background: "hsl(350 76% 10%)",
            boxShadow: "0 20px 50px hsl(0 0% 0% / 0.5), 0 0 20px hsl(43 65% 52% / 0.05)",
          }}
        >
          {/* Search */}
          <div className="border-b p-2" style={{ borderColor: "hsl(43 65% 52% / 0.1)" }}>
            <div
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
              style={{ background: "hsl(350 76% 14% / 0.5)" }}
            >
              <Search className="h-3.5 w-3.5" style={{ color: "var(--gold)", opacity: 0.5 }} />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن الدولة..."
                className="flex-1 bg-transparent text-xs outline-none placeholder:opacity-30"
                style={{ color: "var(--cream)" }}
              />
            </div>
          </div>

          {/* Country List */}
          <div className="max-h-52 overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-center text-xs" style={{ color: "var(--gold)", opacity: 0.5 }}>
                لا توجد نتائج
              </div>
            ) : (
              filtered.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-right transition-colors hover:bg-[hsl(43_65%_52%/0.08)]"
                  style={{
                    background:
                      country.code === selectedCountry.code
                        ? "hsl(43 65% 52% / 0.1)"
                        : "transparent",
                  }}
                >
                  <span className="text-base leading-none">{country.flag}</span>
                  <span className="flex-1 text-xs font-medium" style={{ color: "var(--cream)" }}>
                    {country.name}
                  </span>
                  <span
                    className="font-mono text-xs"
                    style={{ color: "var(--gold)", opacity: 0.7 }}
                    dir="ltr"
                  >
                    {country.dial}
                  </span>
                  {country.code === selectedCountry.code && (
                    <div
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "var(--gold)" }}
                    />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export { COUNTRIES }
