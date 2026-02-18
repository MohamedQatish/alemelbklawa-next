import { validateAdminSession } from "@/lib/auth"
import { sql } from "@/lib/neon"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

export async function GET(request: Request) {
  await ensureTables()
  const isAdmin = await validateAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const filterDay = searchParams.get("day")
    const filterMonth = searchParams.get("month")
    const filterYear = searchParams.get("year")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const completedStatuses = ["confirmed", "preparing", "delivered"]
    const hasFilter = !!(filterDay || filterMonth || filterYear || (startDate && endDate))

    // ===== Build date filter conditions =====
    // When filter is active, ALL metrics reflect the filtered period
    // When no filter, use normal real-time logic

    let filteredSales = 0
    let filteredLabel = ""
    let filteredOrders = 0
    let filteredCancelled = 0
    let filteredPending = 0

    if (startDate && endDate) {
      // Custom date range
      const salesRes = await sql`
        SELECT COALESCE(SUM(total_amount), 0) as total FROM orders
        WHERE created_at >= ${startDate}::date AND created_at < (${endDate}::date + interval '1 day')
        AND status = ANY(${completedStatuses})
      `
      const ordersRes = await sql`
        SELECT COUNT(*) as count FROM orders
        WHERE created_at >= ${startDate}::date AND created_at < (${endDate}::date + interval '1 day')
        AND status = ANY(${completedStatuses})
      `
      const cancelledRes = await sql`
        SELECT COUNT(*) as count FROM orders
        WHERE created_at >= ${startDate}::date AND created_at < (${endDate}::date + interval '1 day')
        AND status = 'cancelled'
      `
      const pendingRes = await sql`
        SELECT COUNT(*) as count FROM orders
        WHERE created_at >= ${startDate}::date AND created_at < (${endDate}::date + interval '1 day')
        AND status = 'pending'
      `
      filteredSales = Number(salesRes[0].total)
      filteredOrders = Number(ordersRes[0].count)
      filteredCancelled = Number(cancelledRes[0].count)
      filteredPending = Number(pendingRes[0].count)
      filteredLabel = `من ${startDate} إلى ${endDate}`
    } else if (filterDay && filterMonth && filterYear) {
      const dateStr = `${filterYear}-${filterMonth.padStart(2, "0")}-${filterDay.padStart(2, "0")}`
      const salesRes = await sql`
        SELECT COALESCE(SUM(total_amount), 0) as total FROM orders
        WHERE DATE(created_at) = ${dateStr}::date AND status = ANY(${completedStatuses})
      `
      const ordersRes = await sql`
        SELECT COUNT(*) as count FROM orders
        WHERE DATE(created_at) = ${dateStr}::date AND status = ANY(${completedStatuses})
      `
      const cancelledRes = await sql`
        SELECT COUNT(*) as count FROM orders
        WHERE DATE(created_at) = ${dateStr}::date AND status = 'cancelled'
      `
      const pendingRes = await sql`
        SELECT COUNT(*) as count FROM orders
        WHERE DATE(created_at) = ${dateStr}::date AND status = 'pending'
      `
      filteredSales = Number(salesRes[0].total)
      filteredOrders = Number(ordersRes[0].count)
      filteredCancelled = Number(cancelledRes[0].count)
      filteredPending = Number(pendingRes[0].count)
      filteredLabel = `مبيعات يوم ${dateStr}`
    } else if (filterMonth && filterYear) {
      const salesRes = await sql`
        SELECT COALESCE(SUM(total_amount), 0) as total FROM orders
        WHERE EXTRACT(MONTH FROM created_at) = ${Number(filterMonth)}
        AND EXTRACT(YEAR FROM created_at) = ${Number(filterYear)}
        AND status = ANY(${completedStatuses})
      `
      const ordersRes = await sql`
        SELECT COUNT(*) as count FROM orders
        WHERE EXTRACT(MONTH FROM created_at) = ${Number(filterMonth)}
        AND EXTRACT(YEAR FROM created_at) = ${Number(filterYear)}
        AND status = ANY(${completedStatuses})
      `
      const cancelledRes = await sql`
        SELECT COUNT(*) as count FROM orders
        WHERE EXTRACT(MONTH FROM created_at) = ${Number(filterMonth)}
        AND EXTRACT(YEAR FROM created_at) = ${Number(filterYear)}
        AND status = 'cancelled'
      `
      const pendingRes = await sql`
        SELECT COUNT(*) as count FROM orders
        WHERE EXTRACT(MONTH FROM created_at) = ${Number(filterMonth)}
        AND EXTRACT(YEAR FROM created_at) = ${Number(filterYear)}
        AND status = 'pending'
      `
      filteredSales = Number(salesRes[0].total)
      filteredOrders = Number(ordersRes[0].count)
      filteredCancelled = Number(cancelledRes[0].count)
      filteredPending = Number(pendingRes[0].count)
      filteredLabel = `مبيعات شهر ${filterMonth}/${filterYear}`
    } else if (filterYear) {
      const salesRes = await sql`
        SELECT COALESCE(SUM(total_amount), 0) as total FROM orders
        WHERE EXTRACT(YEAR FROM created_at) = ${Number(filterYear)}
        AND status = ANY(${completedStatuses})
      `
      const ordersRes = await sql`
        SELECT COUNT(*) as count FROM orders
        WHERE EXTRACT(YEAR FROM created_at) = ${Number(filterYear)}
        AND status = ANY(${completedStatuses})
      `
      const cancelledRes = await sql`
        SELECT COUNT(*) as count FROM orders
        WHERE EXTRACT(YEAR FROM created_at) = ${Number(filterYear)}
        AND status = 'cancelled'
      `
      const pendingRes = await sql`
        SELECT COUNT(*) as count FROM orders
        WHERE EXTRACT(YEAR FROM created_at) = ${Number(filterYear)}
        AND status = 'pending'
      `
      filteredSales = Number(salesRes[0].total)
      filteredOrders = Number(ordersRes[0].count)
      filteredCancelled = Number(cancelledRes[0].count)
      filteredPending = Number(pendingRes[0].count)
      filteredLabel = `مبيعات سنة ${filterYear}`
    }

    // ===== Hourly breakdown (only when a specific day is selected) =====
    let hourlySales: { hour: number; total: number; count: number }[] = []
    if (filterDay && filterMonth && filterYear) {
      const dateStr = `${filterYear}-${filterMonth.padStart(2, "0")}-${filterDay.padStart(2, "0")}`
      const hourlyRes = await sql`
        SELECT EXTRACT(HOUR FROM created_at)::int as hour,
               COALESCE(SUM(total_amount), 0) as total,
               COUNT(*) as count
        FROM orders
        WHERE DATE(created_at) = ${dateStr}::date
          AND status = ANY(${completedStatuses})
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
      `
      hourlySales = hourlyRes.map((r: Record<string, unknown>) => ({
        hour: Number(r.hour),
        total: Number(r.total),
        count: Number(r.count),
      }))
    }

    // ===== Default (unfiltered) Statistics =====
    const todaySales = await sql`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM orders WHERE DATE(created_at) = CURRENT_DATE AND status = ANY(${completedStatuses})
    `
    const monthlySales = await sql`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM orders WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) AND status = ANY(${completedStatuses})
    `
    const totalOrders = await sql`
      SELECT COUNT(*) as count FROM orders WHERE status = ANY(${completedStatuses})
    `
    const pendingOrders = await sql`
      SELECT COUNT(*) as count FROM orders WHERE status = 'pending'
    `
    const cancelledOrders = await sql`
      SELECT COUNT(*) as count FROM orders WHERE status = 'cancelled'
    `
    const totalCustomers = await sql`
      SELECT COUNT(*) as count FROM users WHERE password_hash IS NOT NULL
    `

    // ===== Store Statistics =====
    const totalRevenue = await sql`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = ANY(${completedStatuses})
    `
    const avgOrder = await sql`
      SELECT COALESCE(AVG(total_amount), 0) as avg FROM orders WHERE status = ANY(${completedStatuses})
    `
    const totalDeliveryFees = await sql`
      SELECT COALESCE(SUM(delivery_fee), 0) as total FROM orders WHERE status = ANY(${completedStatuses})
    `
    const topCity = await sql`
      SELECT city, COUNT(*) as count FROM orders WHERE status = ANY(${completedStatuses})
      GROUP BY city ORDER BY count DESC LIMIT 1
    `
    const topProduct = await sql`
      SELECT oi.product_name, SUM(oi.quantity) as total_qty
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status = ANY(${completedStatuses})
      GROUP BY oi.product_name ORDER BY total_qty DESC LIMIT 1
    `

    return NextResponse.json({
      // Real-time (unfiltered) stats
      todaySales: Number(todaySales[0].total),
      monthlySales: Number(monthlySales[0].total),
      totalOrders: Number(totalOrders[0].count),
      pendingOrders: Number(pendingOrders[0].count),
      cancelledOrders: Number(cancelledOrders[0].count),
      totalCustomers: Number(totalCustomers[0].count),
      // Filtered data
      hasFilter,
      filteredSales,
      filteredOrders,
      filteredCancelled,
      filteredPending,
      filteredLabel,
      hourlySales,
      // Store Stats
      storeStats: {
        totalRevenue: Number(totalRevenue[0].total),
        avgOrderValue: Number(avgOrder[0].avg),
        totalDeliveryFees: Number(totalDeliveryFees[0].total),
        topCity: topCity.length > 0 ? { name: topCity[0].city, count: Number(topCity[0].count) } : null,
        topProduct: topProduct.length > 0 ? { name: topProduct[0].product_name, qty: Number(topProduct[0].total_qty) } : null,
      },
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ error: "خطأ في جلب الإحصائيات" }, { status: 500 })
  }
}
