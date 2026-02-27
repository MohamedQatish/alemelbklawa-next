import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

// Cache للإعدادات العامة
let publicSettingsCache: Record<string, string> | null = null
let cacheTime: number | null = null
const CACHE_DURATION = 60 * 1000 // دقيقة واحدة

export async function GET() {
  try {
    await ensureTables()
    
    // التحقق من صحة Cache
    const now = Date.now()
    if (publicSettingsCache && cacheTime && (now - cacheTime) < CACHE_DURATION) {
      return NextResponse.json(publicSettingsCache)
    }
    
    // جلب الإعدادات
    const settings = await sql`
      SELECT setting_key, setting_value 
      FROM site_settings 
      WHERE setting_value IS NOT NULL AND setting_value != ''
    `
    
    // تحويلها إلى كائن
    const settingsMap: Record<string, string> = {}
    for (const s of settings) {
      settingsMap[s.setting_key] = s.setting_value
    }
    
    // تحديث Cache
    publicSettingsCache = settingsMap
    cacheTime = now
    
    return NextResponse.json(settingsMap)
  } catch (error) {
    console.error("Public settings error:", error)
    return NextResponse.json({ 
      site_name: "عالم البقلاوة",
      currency: "د.ل",
      language: "ar"
    }, { status: 200 }) // إرجاع قيم افتراضية عند الخطأ
  }
}