import { validateAdminSession } from "@/lib/auth"
import { sql } from "@/lib/neon"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

export async function GET() {
  await ensureTables()
  const isAdmin = await validateAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const events = await sql`
      SELECT * FROM events ORDER BY category, sort_order, created_at DESC
    `
    return NextResponse.json(events)
  } catch (error) {
    console.error("Admin events error:", error)
    return NextResponse.json({ error: "خطأ في تحميل المناسبات" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, description, price, category, image_url, is_available, is_featured, sort_order } = body

    if (!name || !price || !category) {
      return NextResponse.json({ error: "الاسم والسعر والتصنيف مطلوبة" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO events (name, description, price, category, image_url, is_available, is_featured, sort_order)
      VALUES (
        ${name.trim()},
        ${description?.trim() || null},
        ${Number(price)},
        ${category.trim()},
        ${image_url || null},
        ${is_available !== false},
        ${is_featured === true},
        ${sort_order || 0}
      )
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Create event error:", error)
    return NextResponse.json({ error: "خطأ في إضافة المناسبة" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "معرف المناسبة مطلوب" }, { status: 400 })
    }

    const existing = await sql`SELECT * FROM events WHERE id = ${id}`
    if (existing.length === 0) {
      return NextResponse.json({ error: "المناسبة غير موجودة" }, { status: 404 })
    }
    const e = existing[0]

    const newName = ("name" in body) ? (body.name?.trim() || e.name) : e.name
    const newDesc = ("description" in body) ? (body.description?.trim() || null) : e.description
    const newPrice = ("price" in body && body.price != null) ? Number(body.price) : e.price
    const newCat = ("category" in body) ? (body.category?.trim() || e.category) : e.category
    const newImg = ("image_url" in body) ? (body.image_url || null) : e.image_url
    const newAvail = ("is_available" in body) ? body.is_available : e.is_available
    const newFeat = ("is_featured" in body) ? body.is_featured : e.is_featured
    const newSort = ("sort_order" in body) ? body.sort_order : e.sort_order

    const result = await sql`
      UPDATE events SET
        name = ${newName},
        description = ${newDesc},
        price = ${newPrice},
        category = ${newCat},
        image_url = ${newImg},
        is_available = ${newAvail},
        is_featured = ${newFeat},
        sort_order = ${newSort},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "المناسبة غير موجودة" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Update event error:", error)
    return NextResponse.json({ error: "خطأ في تحديث المناسبة" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "معرف المناسبة مطلوب" }, { status: 400 })
    }

    const result = await sql`DELETE FROM events WHERE id = ${id} RETURNING id`

    if (result.length === 0) {
      return NextResponse.json({ error: "المناسبة غير موجودة" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete event error:", error)
    return NextResponse.json({ error: "خطأ في حذف المناسبة" }, { status: 500 })
  }
}
