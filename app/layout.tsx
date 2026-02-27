import type { Metadata, Viewport } from "next"
import { Amiri, Cairo, Aref_Ruqaa } from "next/font/google"
import { Toaster } from "sonner"
import { cookies } from "next/headers"

import "./globals.css"

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
})

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-cairo",
})

const arefRuqaa = Aref_Ruqaa({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-ruqaa",
})

// دالة لجلب الإعدادات في السيرفر
async function getSettings() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/settings`, {
      next: { revalidate: 60 } // إعادة التحقق كل 60 ثانية
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (error) {
    console.error("Failed to fetch settings:", error)
  }
  
  // القيم الافتراضية
  return {
    site_name: "عالم البقلاوة",
    site_description: "أجود أنواع الحلويات الليبية والشرقية",
    currency: "د.ل",
    language: "ar",
    primary_color: "#7B1E2F",
    secondary_color: "#C5A55A",
    background_color: "#1a0b0e",
    font_family: "Cairo",
    favicon_url: null,
    orders_enabled: "true",
    delivery_enabled: "true"
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  
  return {
    title: settings.site_name,
    description: settings.site_description,
    icons: settings.favicon_url ? {
      icon: settings.favicon_url,
    } : undefined,
  }
}

export const viewport: Viewport = {
  themeColor: "#2D0610",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await getSettings()
  
  // تحديد الخط بناءً على الإعدادات
  const fontClass = 
    settings.font_family === 'Amiri' ? amiri.variable :
    settings.font_family === 'Aref Ruqaa' ? arefRuqaa.variable :
    cairo.variable // افتراضي Cairo

  return (
    <html 
      lang={settings.language || "ar"} 
      dir="rtl" 
      className={fontClass}
      suppressHydrationWarning
      style={{
        backgroundColor: settings.background_color,
      }}
    >
      <body className="font-sans antialiased" style={{
        backgroundColor: settings.background_color,
      }}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "hsl(350 76% 14%)",
              color: "hsl(43 65% 52%)",
              border: "1px solid hsl(350 40% 22%)",
            },
          }}
        />
      </body>
    </html>
  )
}