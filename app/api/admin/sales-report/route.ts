import { validateAdminSession } from "@/lib/auth"
import { sql } from "@/lib/neon"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

export async function GET(request: Request) {
  await ensureTables()
  const valid = await validateAdminSession()
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const period = searchParams.get("period") || "daily"

  try {
    let summary, breakdown, topProducts, paymentBreakdown

    if (period === "daily") {
      summary = await sql`
        SELECT
          COUNT(CASE WHEN status != 'cancelled' THEN 1 END) as total_orders,
          COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount END), 0) as total_revenue,
          COALESCE(AVG(CASE WHEN status != 'cancelled' THEN total_amount END), 0) as avg_order,
          COUNT(CASE WHEN status = 'completed' OR status = 'delivered' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders
        FROM orders WHERE created_at::date = CURRENT_DATE
      `
      breakdown = await sql`
        SELECT TO_CHAR(created_at, 'HH24:MI') as time_label, COUNT(*) as order_count,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM orders WHERE created_at::date = CURRENT_DATE AND status != 'cancelled'
        GROUP BY TO_CHAR(created_at, 'HH24:MI') ORDER BY TO_CHAR(created_at, 'HH24:MI')
      `
      topProducts = await sql`
        SELECT oi.product_name, SUM(oi.quantity) as total_qty,
          SUM(oi.quantity * oi.unit_price) as total_revenue
        FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE o.created_at::date = CURRENT_DATE AND o.status != 'cancelled'
        GROUP BY oi.product_name ORDER BY total_qty DESC LIMIT 10
      `
      paymentBreakdown = await sql`
        SELECT order_type as payment_method, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
        FROM orders WHERE created_at::date = CURRENT_DATE AND status != 'cancelled'
        GROUP BY order_type
      `
    } else if (period === "monthly") {
      summary = await sql`
        SELECT
          COUNT(CASE WHEN status != 'cancelled' THEN 1 END) as total_orders,
          COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount END), 0) as total_revenue,
          COALESCE(AVG(CASE WHEN status != 'cancelled' THEN total_amount END), 0) as avg_order,
          COUNT(CASE WHEN status = 'completed' OR status = 'delivered' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders
        FROM orders WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
      `
      breakdown = await sql`
        SELECT TO_CHAR(created_at::date, 'YYYY-MM-DD') as time_label, COUNT(*) as order_count,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM orders WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) AND status != 'cancelled'
        GROUP BY created_at::date ORDER BY created_at::date
      `
      topProducts = await sql`
        SELECT oi.product_name, SUM(oi.quantity) as total_qty,
          SUM(oi.quantity * oi.unit_price) as total_revenue
        FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', CURRENT_DATE) AND o.status != 'cancelled'
        GROUP BY oi.product_name ORDER BY total_qty DESC LIMIT 10
      `
      paymentBreakdown = await sql`
        SELECT order_type as payment_method, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
        FROM orders WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) AND status != 'cancelled'
        GROUP BY order_type
      `
    } else {
      summary = await sql`
        SELECT
          COUNT(CASE WHEN status != 'cancelled' THEN 1 END) as total_orders,
          COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount END), 0) as total_revenue,
          COALESCE(AVG(CASE WHEN status != 'cancelled' THEN total_amount END), 0) as avg_order,
          COUNT(CASE WHEN status = 'completed' OR status = 'delivered' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders
        FROM orders WHERE DATE_TRUNC('year', created_at) = DATE_TRUNC('year', CURRENT_DATE)
      `
      breakdown = await sql`
        SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as time_label, COUNT(*) as order_count,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM orders WHERE DATE_TRUNC('year', created_at) = DATE_TRUNC('year', CURRENT_DATE) AND status != 'cancelled'
        GROUP BY DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at)
      `
      topProducts = await sql`
        SELECT oi.product_name, SUM(oi.quantity) as total_qty,
          SUM(oi.quantity * oi.unit_price) as total_revenue
        FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE DATE_TRUNC('year', o.created_at) = DATE_TRUNC('year', CURRENT_DATE) AND o.status != 'cancelled'
        GROUP BY oi.product_name ORDER BY total_qty DESC LIMIT 10
      `
      paymentBreakdown = await sql`
        SELECT order_type as payment_method, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
        FROM orders WHERE DATE_TRUNC('year', created_at) = DATE_TRUNC('year', CURRENT_DATE) AND status != 'cancelled'
        GROUP BY order_type
      `
    }

    return NextResponse.json({
      period,
      summary: summary[0] || {},
      breakdown: breakdown || [],
      topProducts: topProducts || [],
      paymentBreakdown: paymentBreakdown || [],
    })
  } catch (error) {
    console.error("Sales report error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
