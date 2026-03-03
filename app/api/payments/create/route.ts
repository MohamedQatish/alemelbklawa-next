import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createPayment } from "@/lib/payment";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    // جلب بيانات الطلب
    const [order] = await sql`
      SELECT * FROM orders WHERE id = ${orderId}
    `;

    if (!order) {
      return NextResponse.json(
        { error: "الطلب غير موجود" },
        { status: 404 }
      );
    }

    // إنشاء سجل دفع جديد
    const [payment] = await sql`
      INSERT INTO payments (
        order_id, 
        amount, 
        currency, 
        payment_method,
        status
      ) VALUES (
        ${order.id},
        ${order.total_amount},
        'د.ل',
        ${order.payment_method},
        'pending'
      )
      RETURNING *
    `;

    // إنشاء الدفع عبر البوابة
    const paymentResult = await createPayment({
      orderId: order.id,
      amount: order.total_amount,
      currency: 'د.ل',
      customerName: order.customer_name,
      customerPhone: order.phone,
      description: `طلب #${order.id}`,
    });

    if (paymentResult.success && paymentResult.transactionId) {
      await sql`
        UPDATE payments 
        SET 
          transaction_id = ${paymentResult.transactionId},
          gateway_response = ${paymentResult.gatewayResponse || null},
          payment_url = ${paymentResult.paymentUrl || null},
          updated_at = NOW()
        WHERE id = ${payment.id}
      `;
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      paymentUrl: paymentResult.paymentUrl,
    });

  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { error: "فشل إنشاء الدفع" },
      { status: 500 }
    );
  }
}