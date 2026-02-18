import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { hashPassword, createUserSession } from "@/lib/user-auth"
import { ensureTables } from "@/lib/ensure-tables"

export async function POST(request: Request) {
  try {
    await ensureTables()
    const body = await request.json()
    const { name, phone, password, location } = body

    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: "الاسم ورقم الهاتف وكلمة المرور مطلوبة" },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 },
      )
    }

    // Check if user exists
    const existing = await sql`SELECT id FROM users WHERE phone = ${phone}`
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "رقم الهاتف مسجل مسبقا" },
        { status: 409 },
      )
    }

    const passwordHash = await hashPassword(password)

    const result = await sql`
      INSERT INTO users (name, phone, password_hash, city)
      VALUES (${name}, ${phone}, ${passwordHash}, ${location?.trim() || null})
      RETURNING id, name, phone
    `

    const user = result[0]
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
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "حدث خطأ أثناء التسجيل" },
      { status: 500 },
    )
  }
}
