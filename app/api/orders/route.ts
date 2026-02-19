import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { calculateProductPrice } from "@/lib/pricing";

// تعريف نوع لعناصر الطلب
interface OrderItem {
  productId: number;
  product_name?: string;
  category?: string;
  quantity: number;
  price?: number;
  selectedOptions?: Array<{ optionId: number; name?: string; price?: number }>;
  notes?: string;
}

// تعريف نوع لبيانات العنصر المحضرة
interface PreparedOrderItem {
  product_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  selected_options: string;
  product_price_snapshot: number;
  final_price_snapshot: number;
  notes: string | null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

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
    } = body;

    if (!customerName || !phone || !address || !city || !paymentMethod || !items?.length) {
      return NextResponse.json(
        { error: "بيانات الطلب غير مكتملة" },
        { status: 400 }
      );
    }

    // حساب السعر النهائي لكل عنصر
    let totalAmount = 0;
    const orderItemsData: PreparedOrderItem[] = [];

    for (const item of items as OrderItem[]) {
      const selectedOptions = item.selectedOptions || [];
      const pricing = await calculateProductPrice(
        item.productId,
        selectedOptions
      );

      const itemTotal = pricing.finalPrice * item.quantity;
      totalAmount += itemTotal;

      orderItemsData.push({
        product_name: pricing.productName,
        category: item.category || "",
        quantity: item.quantity,
        unit_price: pricing.finalPrice,
        selected_options: JSON.stringify(pricing.selectedOptions),
        product_price_snapshot: pricing.basePrice,
        final_price_snapshot: pricing.finalPrice,
        notes: item.notes || null,
      });
    }

    totalAmount += deliveryFee;

    // استخدام sql.begin للمعاملة - بدون تمرير sql كمعامل
    const result = await sql.begin(async () => {
      // 1. إنشاء الطلب
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
      `;

      // 2. إضافة عناصر الطلب
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
        `;
      }

      return order;
    });

    return NextResponse.json({
      success: true,
      orderId: result.id,
      totalAmount,
    });

  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: error?.message || "حدث خطأ في إنشاء الطلب" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const orders = await sql`
      SELECT o.*, 
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
    
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      { error: "خطأ في جلب الطلبات" },
      { status: 500 }
    );
  }
}