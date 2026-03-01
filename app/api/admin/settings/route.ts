import { validateAdminSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

export async function GET() {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const settings = await sql`SELECT * FROM site_settings ORDER BY sort_order`
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Admin settings error:", error)
    return NextResponse.json({ error: "خطأ في تحميل الإعدادات" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { settings } = body as { settings: Record<string, string> }

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 })
    }

    for (const [key, value] of Object.entries(settings)) {
      await sql`
        UPDATE site_settings
        SET setting_value = ${String(value)}, updated_at = NOW()
        WHERE setting_key = ${key}
      `
    }

    const updated = await sql`SELECT * FROM site_settings ORDER BY sort_order`
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update settings error:", error)
    return NextResponse.json({ error: "خطأ في تحديث الإعدادات" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { setting_key, setting_value, setting_type, setting_group, label, label_ar } = body

    if (!setting_key) {
      return NextResponse.json({ error: "مفتاح الإعداد مطلوب" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO site_settings (setting_key, setting_value, setting_type, setting_group, label, label_ar)
      VALUES (${setting_key}, ${setting_value || ''}, ${setting_type || 'text'}, ${setting_group || 'general'}, ${label || ''}, ${label_ar || ''})
      ON CONFLICT (setting_key) DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        updated_at = NOW()
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Create setting error:", error)
    return NextResponse.json({ error: "خطأ في إضافة الإعداد" }, { status: 500 })
  }
}
