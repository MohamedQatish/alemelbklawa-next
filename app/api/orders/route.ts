import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { calculateProductPrice } from "@/lib/pricing"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      customerName,
      phone,
      secondaryPhone,
      address,
      city,
      deliveryFee = 0,
      paymentMethod,
      notes,
      items, 
    } = body


    if (!customerName || !phone || !address || !city || !paymentMethod || !items?.length) {
      return NextResponse.json(
        { error: "بيانات الطلب غير مكتملة" },
        { status: 400 }
      )
    }

    // حساب السعر النهائي لكل عنصر باستخدام calculateProductPrice
    let totalAmount = 0
    const orderItemsData = []

    for (const item of items) {
      // تأكد من أن selectedOptions موجودة، وإلا اجعلها مصفوفة فارغة
      const selectedOptions = item.selectedOptions || []

      // احسب السعر من الخلفية (مهم جداً للأمان)
      const pricing = await calculateProductPrice(
        item.productId,
        selectedOptions // يجب أن يكون formato: [{ optionId: number }]
      )

      const itemTotal = pricing.finalPrice * item.quantity
      totalAmount += itemTotal

      // تجهيز البيانات لحفظها في order_items
      orderItemsData.push({
        product_name: pricing.productName,
        category: item.category || "",
        quantity: item.quantity,
        unit_price: pricing.finalPrice, // السعر النهائي للوحدة
        selected_options: JSON.stringify(pricing.selectedOptions), // snapshot كـ JSON
        product_price_snapshot: pricing.basePrice,
        final_price_snapshot: pricing.finalPrice,
        notes: item.notes || null,
      })
    }

    // إضافة رسوم التوصيل
    totalAmount += deliveryFee

    // بدء transaction
    await sql`BEGIN`

    try {
      // 1. إنشاء الطلب في جدول orders
      const [order] = await sql`
        INSERT INTO orders (
          customer_name,
          phone,
          secondary_phone,
          address,
          city,
          delivery_fee,
          total_amount,
          payment_method,
          notes,
          status,
          created_at
        ) VALUES (
          ${customerName},
          ${phone},
          ${secondaryPhone || null},
          ${address},
          ${city},
          ${deliveryFee},
          ${totalAmount},
          ${paymentMethod},
          ${notes || null},
          'pending',
          NOW()
        )
        RETURNING id
      ` as { id: number }[]

      // 2. إضافة عناصر الطلب إلى order_items
      for (const itemData of orderItemsData) {
        await sql`
          INSERT INTO order_items (
            order_id,
            product_name,
            category,
            quantity,
            unit_price,
            selected_options,
            product_price_snapshot,
            final_price_snapshot,
            notes
          ) VALUES (
            ${order.id},
            ${itemData.product_name},
            ${itemData.category},
            ${itemData.quantity},
            ${itemData.unit_price},
            ${itemData.selected_options}::jsonb,
            ${itemData.product_price_snapshot},
            ${itemData.final_price_snapshot},
            ${itemData.notes}
          )
        `
      }

      await sql`COMMIT`

      return NextResponse.json({
        success: true,
        orderId: order.id,
        totalAmount,
      })
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error: any) {
    console.error("Order creation error:", error)
    return NextResponse.json(
      { error: error.message || "حدث خطأ في إنشاء الطلب" },
      { status: 500 }
    )
  }
}

// يمكنك الاحتفاظ بـ GET إذا كنت تريد جلب الطلبات (اختياري)
export async function GET() {
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
            'selected_options', oi.selected_options,
            'product_price_snapshot', oi.product_price_snapshot,
            'final_price_snapshot', oi.final_price_snapshot,
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
    console.error("Orders fetch error:", error)
    return NextResponse.json(
      { error: "خطأ في جلب الطلبات" },
      { status: 500 }
    )
  }
}