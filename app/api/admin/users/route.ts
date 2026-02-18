import { validateAdminSession, getSessionUser, hashPassword } from "@/lib/auth"
import { sql } from "@/lib/neon"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

/** Convert JS array to PostgreSQL TEXT[] literal: {a,b,c} */
function toPgArray(arr: string[]): string {
  return `{${arr.join(",")}}`
}

async function requireManageUsers() {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return { error: "غير مصرح", status: 401 }
  const user = await getSessionUser()
  if (!user) return { error: "غير مصرح", status: 401 }
  if (user.role !== "super_admin" && !user.permissions.includes("full_access") && !user.permissions.includes("manage_users")) {
    return { error: "ليس لديك صلاحية إدارة المستخدمين", status: 403 }
  }
  return { user }
}

export async function GET() {
  const check = await requireManageUsers()
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status })

  try {
    const users = await sql`
      SELECT id, username, display_name, role, permissions, is_active, last_login, created_at
      FROM admin_users ORDER BY created_at ASC
    `
    return NextResponse.json(users)
  } catch (error) {
    console.error("Admin users error:", error)
    return NextResponse.json({ error: "خطأ في تحميل المستخدمين" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const check = await requireManageUsers()
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status })

  try {
    const body = await request.json()
    const { username, password, display_name, role, permissions } = body

    if (!username || !password) {
      return NextResponse.json({ error: "اسم المستخدم وكلمة المرور مطلوبة" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 })
    }

    // Check uniqueness
    const existing = await sql`SELECT id FROM admin_users WHERE username = ${username.trim().toLowerCase()}`
    if (existing.length > 0) {
      return NextResponse.json({ error: "اسم المستخدم موجود بالفعل" }, { status: 409 })
    }

    // Only super_admin can create super_admin users
    if (role === "super_admin" && check.user.role !== "super_admin") {
      return NextResponse.json({ error: "لا يمكنك إنشاء مدير عام" }, { status: 403 })
    }

    const passwordHash = await hashPassword(password)
    const result = await sql`
      INSERT INTO admin_users (username, password_hash, display_name, role, permissions)
      VALUES (
        ${username.trim().toLowerCase()},
        ${passwordHash},
        ${display_name?.trim() || null},
        ${role || "editor"},
        ${toPgArray(permissions || ["view_dashboard"])}
      )
      RETURNING id, username, display_name, role, permissions, is_active, created_at
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "خطأ في إضافة المستخدم" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const check = await requireManageUsers()
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status })

  try {
    const body = await request.json()
    const { id } = body

    if (!id) return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 })

    const existing = await sql`SELECT * FROM admin_users WHERE id = ${id}`
    if (existing.length === 0) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 })

    const u = existing[0]

    // Prevent non-super_admin from editing super_admin
    if (u.role === "super_admin" && check.user.role !== "super_admin") {
      return NextResponse.json({ error: "لا يمكنك تعديل المدير العام" }, { status: 403 })
    }

    const newDisplayName = ("display_name" in body) ? (body.display_name?.trim() || null) : u.display_name
    const newRole = ("role" in body) ? body.role : u.role
    const newPerms = ("permissions" in body) ? toPgArray(body.permissions) : toPgArray(Array.isArray(u.permissions) ? u.permissions : [])
    const newActive = ("is_active" in body) ? body.is_active : u.is_active

    // If password is being changed
    let newHash = u.password_hash
    if (body.password && body.password.length >= 6) {
      newHash = await hashPassword(body.password)
    }

    // If username is being changed, check uniqueness
    let newUsername = u.username
    if ("username" in body && body.username && body.username.trim().toLowerCase() !== u.username) {
      const dup = await sql`SELECT id FROM admin_users WHERE username = ${body.username.trim().toLowerCase()} AND id != ${id}`
      if (dup.length > 0) return NextResponse.json({ error: "اسم المستخدم موجود بالفعل" }, { status: 409 })
      newUsername = body.username.trim().toLowerCase()
    }

    const result = await sql`
      UPDATE admin_users SET
        username = ${newUsername},
        password_hash = ${newHash},
        display_name = ${newDisplayName},
        role = ${newRole},
        permissions = ${newPerms},
        is_active = ${newActive}
      WHERE id = ${id}
      RETURNING id, username, display_name, role, permissions, is_active, last_login, created_at
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "خطأ في تحديث المستخدم" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const check = await requireManageUsers()
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status })

  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 })

    // Prevent deleting yourself
    if (id === check.user.id) {
      return NextResponse.json({ error: "لا يمكنك حذف حسابك" }, { status: 400 })
    }

    const existing = await sql`SELECT role FROM admin_users WHERE id = ${id}`
    if (existing.length === 0) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 })

    // Prevent non-super_admin from deleting super_admin
    if (existing[0].role === "super_admin" && check.user.role !== "super_admin") {
      return NextResponse.json({ error: "لا يمكنك حذف المدير العام" }, { status: 403 })
    }

    await sql`DELETE FROM admin_sessions WHERE admin_user_id = ${id}`
    await sql`DELETE FROM admin_users WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "خطأ في حذف المستخدم" }, { status: 500 })
  }
}
