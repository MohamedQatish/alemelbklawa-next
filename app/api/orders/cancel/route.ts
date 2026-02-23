import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "رقم الطلب مطلوب" },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    // ✅ إزالة التعليقات من SQL
    const [order] = await sql`
      SELECT 
        id, 
        status, 
        user_id,
        cancel_deadline,
        created_at
      FROM orders 
      WHERE id = ${orderId}
    `;

    if (!order) {
      return NextResponse.json(
        { error: "الطلب غير موجود" },
        { status: 404 }
      );
    }

    if (order.user_id !== currentUser.id) {
      return NextResponse.json(
        { error: "غير مصرح لك بإلغاء هذا الطلب" },
        { status: 403 }
      );
    }

    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: "لا يمكن إلغاء الطلب بعد تأكيده" },
        { status: 400 }
      );
    }

    const now = new Date();
    const deadline = new Date(order.cancel_deadline);
    
    if (now > deadline) {
      return NextResponse.json(
        { error: "انتهت المهلة المسموحة للإلغاء (10 دقائق)" },
        { status: 400 }
      );
    }

    await sql`
      UPDATE orders 
      SET 
        status = 'cancelled',
        notes = CONCAT(
          COALESCE(notes, ''), 
          '\n[تم الإلغاء بواسطة العميل في ', NOW(), ']'
        )
      WHERE id = ${orderId}
    `;

    return NextResponse.json({
      success: true,
      message: "تم إلغاء الطلب بنجاح"
    });

  } catch (error: any) {
    console.error("Order cancellation error:", error);
    return NextResponse.json(
      { error: error?.message || "حدث خطأ في إلغاء الطلب" },
      { status: 500 }
    );
  }
}

// للتحقق من إمكانية إلغاء الطلب (GET)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "رقم الطلب مطلوب" },
        { status: 400 }
      );
    }

    const [order] = await sql`
      SELECT 
        id,
        status,
        cancel_deadline,
        EXTRACT(EPOCH FROM (cancel_deadline - NOW())) as seconds_remaining
      FROM orders 
      WHERE id = ${orderId} AND user_id = ${currentUser.id}
    `;

    if (!order) {
      return NextResponse.json({ canCancel: false });
    }

    const canCancel = 
      order.status === 'pending' && 
      order.seconds_remaining > 0;

    return NextResponse.json({
      canCancel,
      status: order.status,
      secondsRemaining: Math.max(0, Math.floor(order.seconds_remaining || 0))
    });

  } catch (error: any) {
    console.error("Cancel check error:", error);
    return NextResponse.json(
      { error: "خطأ في التحقق من الطلب" },
      { status: 500 }
    );
  }
}