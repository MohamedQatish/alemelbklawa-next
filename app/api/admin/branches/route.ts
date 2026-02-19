import { validateAdminSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

export async function GET() {
  await ensureTables()
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  try {
    const branches = await sql`SELECT * FROM branches ORDER BY sort_order, created_at ASC`
    return NextResponse.json(branches)
  } catch (error) {
    console.error("Admin branches error:", error)
    return NextResponse.json({ error: "خطأ في تحميل الفروع" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  try {
    const body = await request.json()
    const { name, address, phone, secondary_phone, city, google_maps_url, latitude, longitude, working_hours, image_url } = body

    if (!name || !city) {
      return NextResponse.json({ error: "اسم الفرع والمدينة مطلوبة" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO branches (name, address, phone, secondary_phone, city, google_maps_url, latitude, longitude, working_hours, image_url)
      VALUES (
        ${name.trim()},
        ${address?.trim() || null},
        ${phone?.trim() || null},
        ${secondary_phone?.trim() || null},
        ${city.trim()},
        ${google_maps_url?.trim() || null},
        ${latitude ? Number(latitude) : null},
        ${longitude ? Number(longitude) : null},
        ${working_hours?.trim() || null},
        ${image_url || null}
      )
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Create branch error:", error)
    return NextResponse.json({ error: "خطأ في إضافة الفرع" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  try {
    const body = await request.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: "معرف الفرع مطلوب" }, { status: 400 })

    const existing = await sql`SELECT * FROM branches WHERE id = ${id}`
    if (existing.length === 0) return NextResponse.json({ error: "الفرع غير موجود" }, { status: 404 })
    const b = existing[0]

    const result = await sql`
      UPDATE branches SET
        name = ${("name" in body) ? (body.name?.trim() || b.name) : b.name},
        address = ${("address" in body) ? (body.address?.trim() || null) : b.address},
        phone = ${("phone" in body) ? (body.phone?.trim() || null) : b.phone},
        secondary_phone = ${("secondary_phone" in body) ? (body.secondary_phone?.trim() || null) : b.secondary_phone},
        city = ${("city" in body) ? (body.city?.trim() || b.city) : b.city},
        google_maps_url = ${("google_maps_url" in body) ? (body.google_maps_url?.trim() || null) : b.google_maps_url},
        latitude = ${("latitude" in body) ? (body.latitude ? Number(body.latitude) : null) : b.latitude},
        longitude = ${("longitude" in body) ? (body.longitude ? Number(body.longitude) : null) : b.longitude},
        working_hours = ${("working_hours" in body) ? (body.working_hours?.trim() || null) : b.working_hours},
        image_url = ${("image_url" in body) ? (body.image_url || null) : b.image_url},
        is_active = ${("is_active" in body) ? body.is_active : b.is_active},
        sort_order = ${("sort_order" in body) ? body.sort_order : b.sort_order},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Update branch error:", error)
    return NextResponse.json({ error: "خطأ في تحديث الفرع" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: "معرف الفرع مطلوب" }, { status: 400 })

    const result = await sql`DELETE FROM branches WHERE id = ${id} RETURNING id`
    if (result.length === 0) return NextResponse.json({ error: "الفرع غير موجود" }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete branch error:", error)
    return NextResponse.json({ error: "خطأ في حذف الفرع" }, { status: 500 })
  }
}
