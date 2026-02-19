import { validateAdminSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

export async function GET() {
  await ensureTables()
  const ok = await validateAdminSession()
  if (!ok) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  try {
    const rows = await sql`SELECT id, city_name, city_name as city, price, is_active, sort_order FROM delivery_pricing ORDER BY sort_order ASC, city_name ASC`
    return NextResponse.json(rows)
  } catch (e) { console.error(e); return NextResponse.json([], { status: 200 }) }
}

export async function POST(req: Request) {
  const ok = await validateAdminSession()
  if (!ok) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  try {
    const { city, price } = await req.json()
    if (!city?.trim()) return NextResponse.json({ error: "اسم المدينة مطلوب" }, { status: 400 })
    const exists = await sql`SELECT id FROM delivery_pricing WHERE city_name = ${city.trim()}`
    if (exists.length > 0) return NextResponse.json({ error: "المدينة موجودة بالفعل" }, { status: 409 })
    const rows = await sql`INSERT INTO delivery_pricing (city_name, price) VALUES (${city.trim()}, ${Number(price) || 0}) RETURNING *`
    return NextResponse.json(rows[0])
  } catch (e) { console.error(e); return NextResponse.json({ error: "خطأ" }, { status: 500 }) }
}

export async function PATCH(req: Request) {
  const ok = await validateAdminSession()
  if (!ok) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  try {
    const { id, city, price } = await req.json()
    if (!id) return NextResponse.json({ error: "المعرف مطلوب" }, { status: 400 })
    const rows = await sql`
      UPDATE delivery_pricing SET city_name = ${city?.trim()}, price = ${Number(price) || 0} WHERE id = ${id} RETURNING *
    `
    return NextResponse.json(rows[0])
  } catch (e) { console.error(e); return NextResponse.json({ error: "خطأ" }, { status: 500 }) }
}

export async function DELETE(req: Request) {
  const ok = await validateAdminSession()
  if (!ok) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  try {
    const { id } = await req.json()
    await sql`DELETE FROM delivery_pricing WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (e) { console.error(e); return NextResponse.json({ error: "خطأ" }, { status: 500 }) }
}
