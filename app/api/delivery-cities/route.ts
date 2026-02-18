import { sql } from "@/lib/neon"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await ensureTables()
    const rows = await sql`SELECT id, city_name as city, city_name as name, price FROM delivery_pricing WHERE is_active = true ORDER BY sort_order ASC, city_name ASC`
    return NextResponse.json(rows)
  } catch (e) {
    console.error("Delivery cities error:", e)
    return NextResponse.json([], { status: 200 })
  }
}
