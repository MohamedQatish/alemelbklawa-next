import { sql } from "@/lib/neon"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

export async function GET() {
  try {
    await ensureTables()
    const settings = await sql`SELECT setting_key, setting_value, setting_type, setting_group FROM site_settings ORDER BY sort_order`
    const images = await sql`SELECT image_key, image_url, alt_text, sort_order FROM site_images WHERE is_active = true ORDER BY sort_order`

    const settingsMap: Record<string, string> = {}
    for (const s of settings) {
      settingsMap[s.setting_key] = s.setting_value
    }

    return NextResponse.json({ settings: settingsMap, images })
  } catch (error) {
    console.error("Settings fetch error:", error)
    return NextResponse.json({ error: "خطأ في تحميل الإعدادات" }, { status: 500 })
  }
}
