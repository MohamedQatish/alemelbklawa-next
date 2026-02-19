import { validateAdminSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

export async function GET() {
  await ensureTables()
  if (!(await validateAdminSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const rows = await sql`SELECT * FROM product_categories ORDER BY sort_order, id`
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  await ensureTables()
  if (!(await validateAdminSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { name, label_ar, icon, sort_order } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 })
    // Get next sort_order if not provided
    let order = sort_order
    if (order === undefined || order === null) {
      const maxRow = await sql`SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM product_categories`
      order = maxRow[0].next_order
    }
    const rows = await sql`
      INSERT INTO product_categories (name, label_ar, icon, sort_order)
      VALUES (${name.trim()}, ${label_ar?.trim() || name.trim()}, ${icon || null}, ${order})
      RETURNING *
    `
    return NextResponse.json(rows[0], { status: 201 })
  } catch (e) {
    console.error("Create category error:", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  await ensureTables()
  if (!(await validateAdminSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { id, name, label_ar, icon, sort_order } = await req.json()
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    // Get old name before update so we can sync products.category text
    const oldRows = await sql`SELECT name FROM product_categories WHERE id = ${id}`
    const oldName = oldRows[0]?.name

    const rows = await sql`
      UPDATE product_categories SET
        name = COALESCE(${name || null}, name),
        label_ar = COALESCE(${label_ar || null}, label_ar),
        icon = COALESCE(${icon || null}, icon),
        sort_order = COALESCE(${sort_order ?? null}, sort_order)
      WHERE id = ${id} RETURNING *
    `
    // If name changed, also update products.category and events.category text fields to keep sync
    if (name && oldName && name.trim() !== oldName) {
      await sql`UPDATE products SET category = ${name.trim()} WHERE category_id = ${id}`
      await sql`UPDATE events SET category = ${name.trim()} WHERE category = ${oldName}`
    }

    return NextResponse.json(rows[0])
  } catch (e) {
    console.error("Update category error:", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  await ensureTables()
  if (!(await validateAdminSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { id } = await req.json()
    // Get category name before deleting for events cleanup
    const catRow = await sql`SELECT name FROM product_categories WHERE id = ${id}`
    const catName = catRow[0]?.name
    // Unlink products from this category (set both category_id and category text to null)
    await sql`UPDATE products SET category_id = NULL, category = NULL WHERE category_id = ${id}`
    // Remove events tied to this category name
    if (catName) {
      await sql`DELETE FROM events WHERE category = ${catName}`
    }
    await sql`DELETE FROM product_categories WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Delete category error:", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
