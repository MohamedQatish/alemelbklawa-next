// app/api/payments/callback/route.ts (لبوابة الدفع)
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
   
    const { transactionId, status } = body;

    const [payment] = await sql`
      SELECT * FROM payments WHERE transaction_id = ${transactionId}
    `;

    if (payment) {
      const newStatus = status === 'paid' ? 'paid' : 'failed';
      
      await sql.begin(async () => {
        await sql`
          UPDATE payments 
          SET 
            status = ${newStatus},
            gateway_response = ${body},
            updated_at = NOW()
          WHERE id = ${payment.id}
        `;

        if (newStatus === 'paid') {
          await sql`
            UPDATE orders 
            SET status = 'confirmed' 
            WHERE id = ${payment.order_id}
          `;
        }
      });
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Payment callback error:", error);
    return NextResponse.json(
      { error: "خطأ في معالجة callback" },
      { status: 500 }
    );
  }
}