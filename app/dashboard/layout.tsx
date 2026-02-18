import React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "لوحة التحكم | عالم البكلاوة",
  description: "لوحة تحكم الإدارة",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
