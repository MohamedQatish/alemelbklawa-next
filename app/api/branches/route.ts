import { sql } from "@/lib/neon"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await ensureTables()
    const rows = await sql`
      SELECT id, name, address, phone, secondary_phone, city,
             google_maps_url, latitude, longitude, working_hours, image_url
      FROM branches
      WHERE is_active = true
      ORDER BY sort_order ASC, created_at ASC
    `
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Branches error:", error)
    return NextResponse.json([], { status: 200 })
  }
}
