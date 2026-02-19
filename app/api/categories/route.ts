import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

export const dynamic = "force-dynamic"

/** Public endpoint: returns all product categories */
export async function GET() {
  try {
    await ensureTables()
    const rows = await sql`SELECT id, name, label_ar, icon, sort_order FROM product_categories ORDER BY sort_order, id`
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Categories fetch error:", error)
    return NextResponse.json([], { status: 200 })
  }
}
