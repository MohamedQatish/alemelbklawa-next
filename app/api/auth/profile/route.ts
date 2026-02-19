import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { ensureTables } from "@/lib/ensure-tables"

async function getSessionUser() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("user_session")?.value
  if (!sessionToken) return null

  const result = await sql`
    SELECT u.id, u.name, u.phone, u.email, u.address, u.city, u.created_at
    FROM users u
    JOIN user_sessions s ON s.user_id = u.id
    WHERE s.session_token = ${sessionToken}
    AND s.expires_at > NOW()
  `
  if (result.length === 0) return null
  return result[0]
}

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    // Get user's order history
    const orders = await sql`
      SELECT o.id, o.total_amount, o.status, o.created_at, o.city
      FROM orders o
      WHERE o.phone = ${user.phone}
      ORDER BY o.created_at DESC
      LIMIT 20
    `

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        address: user.address,
        city: user.city,
        created_at: user.created_at,
      },
      orders,
    })
  } catch (error) {
    console.error("Profile error:", error)
    return NextResponse.json({ error: "خطأ" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, address, city } = body

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "الاسم مطلوب (حرفين على الأقل)" }, { status: 400 })
    }

    await sql`
      UPDATE users
      SET name = ${name.trim()},
          email = ${email?.trim() || null},
          address = ${address?.trim() || null},
          city = ${city?.trim() || null},
          updated_at = NOW()
      WHERE id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "خطأ في تحديث الملف الشخصي" }, { status: 500 })
  }
}
