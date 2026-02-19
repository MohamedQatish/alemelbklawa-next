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
    const orders = await sql`
      SELECT o.*, 
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_name', oi.product_name,
            'category', oi.category,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'selected_options', oi.selected_options,  -- <-- أضف هذا السطر
            'addons', oi.addons,
            'notes', oi.notes
          ) ORDER BY oi.id
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `
    return NextResponse.json(orders)
  } catch (error) {
    console.error("Admin orders error:", error)
    return NextResponse.json({ error: "خطأ" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const { orderId, status } = await request.json()
    await sql`UPDATE orders SET status = ${status} WHERE id = ${orderId}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update order error:", error)
    return NextResponse.json({ error: "خطأ" }, { status: 500 })
  }
}