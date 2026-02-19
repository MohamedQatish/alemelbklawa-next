import { validateAdminSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

/** GET all option groups with their options (using new tables) */
export async function GET(request: Request) {
  await ensureTables()
  if (!(await validateAdminSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  // الحصول على product_id من Query String إذا وجد
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('product_id')
  
  // جلب المجموعات من الجدول الجديد - مع فلترة حسب product_id إذا وجد
  let groupsQuery
  if (productId) {
    groupsQuery = await sql`
      SELECT * FROM product_option_groups_v2 
      WHERE product_id = ${Number(productId)}
      ORDER BY sort_order, id
    ` as any[]
  } else {
    groupsQuery = await sql`
      SELECT * FROM product_option_groups_v2 
      ORDER BY sort_order, id
    ` as any[]
  }
  
  // جلب الخيارات من الجدول الجديد
  const options = await sql`
    SELECT * FROM product_options_v2 ORDER BY sort_order, id
  ` as any[]

  const result = groupsQuery.map((g) => ({
    ...g,
    options: options.filter((o) => o.group_id === g.id),
  }))
  return NextResponse.json(result)
}

/** POST create a new option group */
export async function POST(req: Request) {
  if (!(await validateAdminSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { 
      name, 
      is_required = false, 
      selection_type = "single", 
      min_select = 1, 
      max_select = 1, 
      sort_order = 0 
    } = await req.json()
    
    if (!name?.trim()) 
      return NextResponse.json({ error: "Name required" }, { status: 400 })
    
    // التحقق من صحة القيم
    if (!["single", "multiple"].includes(selection_type)) {
      return NextResponse.json({ error: "Invalid selection type" }, { status: 400 })
    }
    if (min_select < 0 || max_select < min_select) {
      return NextResponse.json({ error: "Invalid min/max select" }, { status: 400 })
    }

    const rows = await sql`
      INSERT INTO product_option_groups_v2 (
        product_id, name, is_required, selection_type, min_select, max_select, sort_order
      ) VALUES (
        NULL, ${name.trim()}, ${is_required}, ${selection_type}, ${min_select}, ${max_select}, ${sort_order}
      )
      RETURNING *
    ` as any[]
    
    return NextResponse.json({ ...rows[0], options: [] }, { status: 201 })
  } catch (e) {
    console.error("Create option group error:", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

/** PATCH update group or manage options */
export async function PATCH(req: Request) {
  if (!(await validateAdminSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const body = await req.json()

    // Update group properties
    if (body.action === "update_group") {
      const { 
        id, name, is_required, selection_type, min_select, max_select, sort_order 
      } = body
      await sql`
        UPDATE product_option_groups_v2 SET
          name = COALESCE(${name || null}, name),
          is_required = COALESCE(${is_required ?? null}, is_required),
          selection_type = COALESCE(${selection_type || null}, selection_type),
          min_select = COALESCE(${min_select ?? null}, min_select),
          max_select = COALESCE(${max_select ?? null}, max_select),
          sort_order = COALESCE(${sort_order ?? null}, sort_order)
        WHERE id = ${id}
      `
      return NextResponse.json({ ok: true })
    }

    // Add option to a group
    if (body.action === "add_option") {
      const { 
        group_id, name, price = 0, replace_base_price = false, sort_order = 0 
      } = body
      if (!name?.trim()) 
        return NextResponse.json({ error: "Name required" }, { status: 400 })
      
      const rows = await sql`
        INSERT INTO product_options_v2 (
          group_id, name, price, replace_base_price, sort_order, is_active
        ) VALUES (
          ${group_id}, ${name.trim()}, ${Number(price)}, ${replace_base_price}, ${sort_order}, true
        )
        RETURNING *
      ` as any[]
      return NextResponse.json(rows[0], { status: 201 })
    }

    // Update an existing option
    if (body.action === "update_option") {
      const { id, name, price, replace_base_price, sort_order } = body
      await sql`
        UPDATE product_options_v2 SET
          name = COALESCE(${name || null}, name),
          price = COALESCE(${price !== undefined ? Number(price) : null}, price),
          replace_base_price = COALESCE(${replace_base_price ?? null}, replace_base_price),
          sort_order = COALESCE(${sort_order ?? null}, sort_order)
        WHERE id = ${id}
      `
      return NextResponse.json({ ok: true })
    }

    // Delete an option
    if (body.action === "delete_option") {
      await sql`DELETE FROM product_options_v2 WHERE id = ${body.id}`
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (e) {
    console.error("Option groups patch error:", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

/** DELETE an entire option group */
export async function DELETE(req: Request) {
  if (!(await validateAdminSession()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { id } = await req.json()
    // الحذف المتتالي (CASCADE) يجب أن يكون معرفاً في قاعدة البيانات، لكن للاحتياط نحذف يدوياً
    await sql`DELETE FROM product_options_v2 WHERE group_id = ${id}`
    await sql`DELETE FROM product_option_groups_v2 WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Delete option group error:", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}