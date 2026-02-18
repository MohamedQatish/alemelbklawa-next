import { createAdminSession, verifyPassword } from "@/lib/auth"
import { sql } from "@/lib/neon"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

export async function POST(request: Request) {
  try {
    await ensureTables()
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: "بيانات الدخول مطلوبة" }, { status: 400 })
    }

    // Look up user in database
    const users = await sql`
      SELECT id, username, password_hash, display_name, role, permissions, is_active
      FROM admin_users
      WHERE username = ${username.trim().toLowerCase()}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 })
    }

    const user = users[0]

    if (!user.is_active) {
      return NextResponse.json({ error: "هذا الحساب معطل" }, { status: 403 })
    }

    // Verify password
    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 })
    }

    // Create session linked to this user
    const token = await createAdminSession(user.id)

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        role: user.role,
        permissions: user.permissions || [],
      },
    })

    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json({ error: "خطأ في تسجيل الدخول" }, { status: 500 })
  }
}
