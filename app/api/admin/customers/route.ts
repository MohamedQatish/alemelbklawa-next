// app/api/admin/customers/route.ts
import { validateAdminSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

export async function GET() {
  await ensureTables()
  const isAdmin = await validateAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    // استخدام الأعمدة الموجودة فقط في جدول users
    const customers = await sql`
      SELECT
        id,
        name,
        phone,
        email,
        address,
        location as city,
        created_at
      FROM users
      WHERE password_hash IS NOT NULL  -- هذا يفصل العملاء عن المستخدمين الإداريين
      ORDER BY created_at DESC
    `
    
    return NextResponse.json(customers)
  } catch (error) {
    console.error("Admin customers error:", error)
    return NextResponse.json({ error: "خطأ في جلب العملاء" }, { status: 500 })
  }
}