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
        EXTRACT(EPOCH FROM (o.cancel_deadline - NOW())) as seconds_remaining,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_name', oi.product_name,
              'category', oi.category,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'selected_options', (oi.selected_options::jsonb)::jsonb,  
              'product_price_snapshot', oi.product_price_snapshot,
              'final_price_snapshot', oi.final_price_snapshot,
              'notes', oi.notes
            ) ORDER BY oi.id
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;

    // ✅ معالجة الباقات: استخراج بيانات الباقة من notes
    const processedOrders = orders.map((order: any) => {
      const processedItems = order.items.map((item: any) => {
        // إذا كان العنصر من نوع package ونسبة package
        if (item.category === 'package' && item.notes) {
          try {
            const packageData = JSON.parse(item.notes);
            return {
              ...item,
              is_package: true,
              package_items: packageData.items || [],
              package_total: packageData.totalPrice || item.unit_price,
              package_quantity: item.quantity
            };
          } catch (e) {
            console.error("Failed to parse package data:", e);
          }
        }
        return item;
      });
      
      return {
        ...order,
        items: processedItems
      };
    });

    return NextResponse.json(processedOrders);
  } catch (error) {
    console.error("Admin orders error:", error)
    return NextResponse.json({ error: "خطأ في جلب الطلبات" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const { orderId, status } = await request.json()
    
    if (!orderId || !status) {
      return NextResponse.json({ error: "بيانات غير كاملة" }, { status: 400 })
    }

    await sql`
      UPDATE orders 
      SET status = ${status} 
      WHERE id = ${orderId}
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update order error:", error)
    return NextResponse.json({ error: "خطأ في تحديث الطلب" }, { status: 500 })
  }
}