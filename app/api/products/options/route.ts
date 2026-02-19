import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

export const dynamic = "force-dynamic"

/** GET product options for a given product_id  */
export async function GET(req: Request) {
  await ensureTables()
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get("product_id")
  if (!productId) return NextResponse.json([])

  try {
    const groups = await sql`
      SELECT g.id, g.name, g.label_ar
      FROM product_option_groups g
      JOIN product_option_assignments a ON a.option_group_id = g.id
      WHERE a.product_id = ${productId}
      ORDER BY g.id
    `
    if (groups.length === 0) return NextResponse.json([])

    const groupIds = groups.map((g: Record<string, unknown>) => g.id)
    const options = await sql`
      SELECT * FROM product_options WHERE group_id = ANY(${groupIds}) ORDER BY sort_order, id
    `

    const result = groups.map((g: Record<string, unknown>) => ({
      ...g,
      options: options.filter((o: Record<string, unknown>) => o.group_id === g.id),
    }))
    return NextResponse.json(result)
  } catch (e) {
    console.error("Product options error:", e)
    return NextResponse.json([], { status: 200 })
  }
}
