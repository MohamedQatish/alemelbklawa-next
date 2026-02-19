import { validateAdminSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

export async function GET() {
  await ensureTables()
  const isAdmin = await validateAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const images = await sql`SELECT * FROM site_images ORDER BY sort_order`
    return NextResponse.json(images)
  } catch (error) {
    console.error("Admin images error:", error)
    return NextResponse.json({ error: "خطأ في تحميل الصور" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { image_key, image_url, alt_text, sort_order } = body

    if (!image_key || !image_url) {
      return NextResponse.json({ error: "مفتاح الصورة والرابط مطلوبان" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO site_images (image_key, image_url, alt_text, sort_order)
      VALUES (${image_key}, ${image_url}, ${alt_text || ''}, ${sort_order || 0})
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Create image error:", error)
    return NextResponse.json({ error: "خطأ في إضافة الصورة" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, image_url, alt_text, is_active, sort_order } = body

    if (!id) {
      return NextResponse.json({ error: "معرف الصورة مطلوب" }, { status: 400 })
    }

    const existing = await sql`SELECT * FROM site_images WHERE id = ${id}`
    if (existing.length === 0) {
      return NextResponse.json({ error: "الصورة غير موجودة" }, { status: 404 })
    }

    const img = existing[0]
    const result = await sql`
      UPDATE site_images SET
        image_url = ${image_url ?? img.image_url},
        alt_text = ${alt_text ?? img.alt_text},
        is_active = ${is_active ?? img.is_active},
        sort_order = ${sort_order ?? img.sort_order},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Update image error:", error)
    return NextResponse.json({ error: "خطأ في تحديث الصورة" }, { status: 500 })
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
      return NextResponse.json({ error: "معرف الصورة مطلوب" }, { status: 400 })
    }

    const result = await sql`DELETE FROM site_images WHERE id = ${id} RETURNING id`
    if (result.length === 0) {
      return NextResponse.json({ error: "الصورة غير موجودة" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete image error:", error)
    return NextResponse.json({ error: "خطأ في حذف الصورة" }, { status: 500 })
  }
}
