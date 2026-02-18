import { sql } from "@/lib/neon"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

export async function GET() {
  try {
    await ensureTables()
    const events = await sql`
      SELECT id, name, description, price, category, image_url, is_featured
      FROM events
      WHERE is_available = true
      ORDER BY category, sort_order, name
    `
    return NextResponse.json(events)
  } catch (error) {
    console.error("Public events error:", error)
    return NextResponse.json([], { status: 200 })
  }
}
