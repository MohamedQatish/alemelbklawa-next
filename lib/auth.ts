import { cookies } from "next/headers"
import { sql } from "./neon"

/* ---------- Types ---------- */
export type AdminRole = "super_admin" | "admin" | "editor" | "viewer"

export type Permission =
  | "view_dashboard"
  | "manage_products"
  | "manage_events"
  | "manage_gallery"
  | "manage_branches"
  | "manage_orders"
  | "manage_users"
  | "edit_content"
  | "full_access"

export interface AdminUser {
  id: number
  username: string
  display_name: string | null
  role: AdminRole
  permissions: Permission[]
  is_active: boolean
}

/* All available permissions for reference */
export const ALL_PERMISSIONS: { id: Permission; label: string }[] = [
  { id: "view_dashboard", label: "عرض لوحة التحكم" },
  { id: "manage_products", label: "إدارة المنتجات" },
  { id: "manage_events", label: "إدارة المناسبات" },
  { id: "manage_gallery", label: "إدارة المعرض" },
  { id: "manage_branches", label: "إدارة الفروع" },
  { id: "manage_orders", label: "إدارة الطلبات" },
  { id: "manage_users", label: "إدارة المستخدمين" },
  { id: "edit_content", label: "تعديل المحتوى" },
  { id: "full_access", label: "صلاحيات كاملة" },
]

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "مدير عام",
  admin: "مدير",
  editor: "محرر",
  viewer: "مشاهد",
}

/* ---------- Password Hashing (SHA-256 via Web Crypto) ---------- */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "_kick_salt_2024")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password)
  return computed === hash
}

/* ---------- Session Management ---------- */
export async function createAdminSession(adminUserId?: number): Promise<string> {
  const token = crypto.randomUUID() + "-" + crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

  if (adminUserId) {
    await sql`
      INSERT INTO admin_sessions (session_token, expires_at, admin_user_id)
      VALUES (${token}, ${expiresAt.toISOString()}, ${adminUserId})
    `
    // Update last login
    await sql`UPDATE admin_users SET last_login = NOW() WHERE id = ${adminUserId}`
  } else {
    await sql`
      INSERT INTO admin_sessions (session_token, expires_at)
      VALUES (${token}, ${expiresAt.toISOString()})
    `
  }

  return token
}

export async function validateAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("admin_session")?.value
    if (!sessionToken) return false

    const result = await sql`
      SELECT id FROM admin_sessions
      WHERE session_token = ${sessionToken}
      AND expires_at > NOW()
    `
    return result.length > 0
  } catch {
    return false
  }
}

/** Get the full admin user attached to the current session */
export async function getSessionUser(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("admin_session")?.value
    if (!sessionToken) return null

    const result = await sql`
      SELECT u.id, u.username, u.display_name, u.role, u.permissions, u.is_active
      FROM admin_sessions s
      JOIN admin_users u ON u.id = s.admin_user_id
      WHERE s.session_token = ${sessionToken}
        AND s.expires_at > NOW()
        AND u.is_active = true
    `
    if (result.length === 0) return null

    const row = result[0]
    return {
      id: row.id,
      username: row.username,
      display_name: row.display_name,
      role: row.role as AdminRole,
      permissions: (row.permissions || []) as Permission[],
      is_active: row.is_active,
    }
  } catch {
    return null
  }
}

/** Check if the current session user has a specific permission */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const user = await getSessionUser()
  if (!user) return false
  if (user.role === "super_admin") return true
  if (user.permissions.includes("full_access")) return true
  return user.permissions.includes(permission)
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("admin_session")?.value

  if (sessionToken) {
    await sql`DELETE FROM admin_sessions WHERE session_token = ${sessionToken}`
  }
}
