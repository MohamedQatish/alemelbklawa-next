import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = parseInt(params.id);

    const [payment] = await sql`
      SELECT * FROM payments WHERE id = ${paymentId}
    `;

    if (!payment) {
      return NextResponse.json(
        { error: "الدفعة غير موجودة" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: payment.status === 'paid',
      status: payment.status,
      amount: payment.amount,
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "فشل التحقق من الدفع" },
      { status: 500 }
    );
  }
}