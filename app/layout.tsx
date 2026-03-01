import type { Metadata, Viewport } from "next"
import { Amiri, Cairo, Aref_Ruqaa } from "next/font/google"
import { Toaster } from "sonner"

import "./globals.css"

const _amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
})

const _cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-cairo",
})

const _arefRuqaa = Aref_Ruqaa({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-ruqaa",
})

export const metadata: Metadata = {
  title: "عالم البكلاوة | Baklava World",
  description:
    "عالم البكلاوة - أجود أنواع الحلويات الليبية والشرقية. تجربة فاخرة من التراث الأصيل.",
}

export const viewport: Viewport = {
  themeColor: "#2D0610",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // أضفنا suppressHydrationWarning هنا لحل مشكلة تضارب كلاسات الخطوط
    <html 
      lang="ar" 
      dir="rtl" 
      className={`${_amiri.variable} ${_cairo.variable} ${_arefRuqaa.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
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