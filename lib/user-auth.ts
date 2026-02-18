import { sql } from "./neon"
import { cookies } from "next/headers"

function toHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  )
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256,
  )
  return toHex(salt) + ":" + toHex(new Uint8Array(hash))
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(":")
  if (!saltHex || !hashHex) return false

  const salt = fromHex(saltHex)
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  )
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256,
  )
  return toHex(new Uint8Array(hash)) === hashHex
}

export async function createUserSession(userId: number): Promise<string> {
  const token = crypto.randomUUID() + "-" + crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await sql`
    INSERT INTO user_sessions (user_id, session_token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
  `

  return token
}

export async function getCurrentUser(): Promise<{
  id: number
  name: string
  phone: string
  email: string | null
  city: string | null
} | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("user_session")?.value

    if (!sessionToken) return null

    const result = await sql`
      SELECT u.id, u.name, u.phone, u.email, u.city
      FROM users u
      JOIN user_sessions s ON s.user_id = u.id
      WHERE s.session_token = ${sessionToken}
      AND s.expires_at > NOW()
    `

    if (result.length === 0) return null
    return result[0] as { id: number; name: string; phone: string; email: string | null; city: string | null }
  } catch {
    return null
  }
}

export async function destroyUserSession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("user_session")?.value
  if (sessionToken) {
    await sql`DELETE FROM user_sessions WHERE session_token = ${sessionToken}`
  }
}
