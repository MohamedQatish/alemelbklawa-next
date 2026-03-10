import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { calculateProductPrice } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/user-auth";

interface OrderItem {
  productId: number;
  product_name?: string;
  category?: string;
  quantity: number;
  price?: number;
  basePrice?: number; 
  selectedOptions?: Array<{ optionId: number; name?: string; price?: number }>;
  notes?: string;
}

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
    
    // جلب المستخدم بالتوازي مع التحقق
    const currentUserPromise = getCurrentUser();

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

    // التحقق من البيانات الأساسية
    if (!customerName || !phone || !address || !city || !paymentMethod || !items?.length) {
      return NextResponse.json(
        { error: "بيانات الطلب غير مكتملة" },
        { status: 400 }
      );
    }

    // التحقق من صحة البيانات
    if (
      customerName.length > 100 ||
      address.length > 250 ||
      phone.length > 20 ||
      (secondaryPhone && secondaryPhone.length > 20)
    ) {
      return NextResponse.json(
        { error: "بعض الحقول تتجاوز الحد الأقصى للطول المسموح به" },
        { status: 400 }
      );
    }

    const nameRegex = /^[a-zA-Z\u0621-\u064A\s]+$/;
    if (!nameRegex.test(customerName.trim())) {
      return NextResponse.json(
        { error: "اسم المستلم يجب أن يحتوي على حروف فقط" },
        { status: 400 }
      );
    }

    const addressRegex = /^[a-zA-Z\u0621-\u064A0-9\s\.,\-_/\\]+$/;
    if (!addressRegex.test(address.trim())) {
      return NextResponse.json(
        { error: "العنوان يحتوي على رموز غير مسموحة" },
        { status: 400 }
      );
    }

    // انتظار المستخدم بعد التحقق
    const currentUser = await currentUserPromise;

    // حساب الأسعار بالتوازي
    const pricingPromises = items.map(async (item: OrderItem) => {
      const selectedOptions = item.selectedOptions || [];

      // معالجة الباقات
      if (item.category === 'package') {
        let packageTotal = 0;
        try {
          if (item.notes) {
            const packageData = JSON.parse(item.notes);
            packageTotal = packageData.items?.reduce((sum: number, pkgItem: any) => 
              sum + (pkgItem.finalPrice * pkgItem.quantity), 0) || item.price || 0;
          }
        } catch {
          // تجاهل أخطاء التحليل
        }

        return {
          pricing: {
            productName: item.product_name || "باقة المناسبات",
            finalPrice: item.price || packageTotal || 0,
            basePrice: item.basePrice || 0,
            selectedOptions: []
          },
          item
        };
      }

      // للمنتجات والمناسبات العادية
      const sourceType = item.category === "مناسبات" ? 'event' : 'product';
      const pricing = await calculateProductPrice(
        item.productId,
        selectedOptions,
        sourceType
      );
      
      return { pricing, item };
    });

    // انتظار كل الحسابات مرة واحدة
    const pricingResults = await Promise.all(pricingPromises);

    // تجميع النتائج
    let totalAmount = 0;
    const orderItemsData: PreparedOrderItem[] = [];

    for (const { pricing, item } of pricingResults) {
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

    // ✅ الحل النهائي: استخدام sql مباشرة في المعاملة
    const result = await sql.begin(async () => {
      // إنشاء الطلب
      const [order] = await sql`
        INSERT INTO orders (
          customer_name, phone, secondary_phone, address, city,
          delivery_fee, total_amount, payment_method, notes,
          status, created_at, cancel_deadline, user_id
        ) VALUES (
          ${customerName}, ${phone}, ${secondaryPhone || null}, ${address}, ${city},
          ${deliveryFee}, ${totalAmount}, ${paymentMethod}, ${notes || null},
          'pending', NOW(), NOW() + INTERVAL '10 minutes', ${currentUser?.id || null}
        )
        RETURNING id
      `;

      // إدخال جميع عناصر الطلب
      for (const itemData of orderItemsData) {
        await sql`
          INSERT INTO order_items (
            order_id, product_name, category, quantity, unit_price,
            selected_options, product_price_snapshot, final_price_snapshot, notes
          ) VALUES (
            ${order.id}, ${itemData.product_name}, ${itemData.category},
            ${itemData.quantity}, ${itemData.unit_price}, ${itemData.selected_options}::jsonb,
            ${itemData.product_price_snapshot}, ${itemData.final_price_snapshot}, ${itemData.notes}
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
    // رسالة خطأ عامة للإنتاج
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء الطلب" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    // استعلام محسن
    let query = sql`
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
    `;

    if (phone && currentUser) {
      const localPhone = phone.replace('+218', '');
      query = sql`
        ${query}
        WHERE o.user_id = ${currentUser.id}
          AND (o.phone = ${phone} 
            OR o.phone = ${localPhone}
            OR o.secondary_phone = ${phone}
            OR o.secondary_phone = ${localPhone})
      `;
    } else {
      query = sql`
        ${query}
        WHERE o.user_id = ${currentUser.id}
      `;
    }

    query = sql`
      ${query}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 50
    `;

    const orders = await query;
    return NextResponse.json(orders);

  } catch {
    return NextResponse.json(
      { error: "خطأ في جلب الطلبات" },
      { status: 500 }
    );
  }
}