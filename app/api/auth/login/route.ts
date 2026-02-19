import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyPassword, createUserSession } from "@/lib/user-auth"
import { ensureTables } from "@/lib/ensure-tables"

export async function POST(request: Request) {
  try {
    await ensureTables()
    const body = await request.json()
    const { phone, password } = body

    if (!phone || !password) {
      return NextResponse.json(
        { error: "رقم الهاتف وكلمة المرور مطلوبة" },
        { status: 400 },
      )
    }

    const result = await sql`
      SELECT id, name, phone, password_hash
      FROM users WHERE phone = ${phone}
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "رقم الهاتف أو كلمة المرور غير صحيحة" },
        { status: 401 },
      )
    }

    const user = result[0]

    if (!user.password_hash) {
      return NextResponse.json(
        { error: "هذا الحساب لا يملك كلمة مرور. يرجى إنشاء حساب جديد" },
        { status: 401 },
      )
    }

    const isValid = await verifyPassword(password, user.password_hash as string)
    if (!isValid) {
      return NextResponse.json(
        { error: "رقم الهاتف أو كلمة المرور غير صحيحة" },
        { status: 401 },
      )
    }

    const sessionToken = await createUserSession(user.id as number)

    // Set cookie on the response object (correct way in Route Handlers)
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, phone: user.phone },
    })

    response.cookies.set("user_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل الدخول" },
      { status: 500 },
    )
  }
}
