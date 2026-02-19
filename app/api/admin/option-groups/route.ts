import { validateAdminSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

// تعريف الأنواع
interface OptionGroup {
  id: number;
  product_id: number | null;
  name: string;
  is_required: boolean;
  selection_type: 'single' | 'multiple';
  min_select: number;
  max_select: number;
  sort_order: number;
}

interface Option {
  id: number;
  group_id: number;
  name: string;
  price: number;
  replace_base_price: boolean;
  sort_order: number;
  is_active: boolean;
}

/** GET all option groups with their options (using new tables) */
export async function GET(request: Request) {
  try {
    await ensureTables()
    
    // التحقق من الجلسة
    const isValid = await validateAdminSession()
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // الحصول على product_id من Query String إذا وجد
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    
    // جلب المجموعات من الجدول الجديد - مع فلترة حسب product_id إذا وجد
    let groupsQuery
    if (productId) {
      groupsQuery = await sql<OptionGroup[]>`
        SELECT * FROM product_option_groups_v2 
        WHERE product_id = ${Number(productId)}
        ORDER BY sort_order, id
      `
    } else {
      groupsQuery = await sql<OptionGroup[]>`
        SELECT * FROM product_option_groups_v2 
        ORDER BY sort_order, id
      `
    }
    
    // جلب الخيارات من الجدول الجديد
    const options = await sql<Option[]>`
      SELECT * FROM product_options_v2 
      WHERE is_active = true 
      ORDER BY sort_order, id
    `

    const result = groupsQuery.map((g) => ({
      ...g,
      options: options.filter((o) => o.group_id === g.id),
    }))
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error("GET option groups error:", error)
    return NextResponse.json(
      { error: "حدث خطأ في جلب المجموعات" },
      { status: 500 }
    )
  }
}

/** POST create a new option group */
export async function POST(req: Request) {
  try {
    const isValid = await validateAdminSession()
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await req.json()
    const { 
      product_id,
      name, 
      is_required = false, 
      selection_type = "single", 
      min_select = 1, 
      max_select = 1, 
      sort_order = 0 
    } = body
    
    if (!name?.trim()) {
      return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 })
    }
    
    // التحقق من صحة القيم
    if (!["single", "multiple"].includes(selection_type)) {
      return NextResponse.json({ error: "نوع الاختيار غير صالح" }, { status: 400 })
    }
    if (min_select < 0 || max_select < min_select) {
      return NextResponse.json({ error: "قيم الاختيار غير صالحة" }, { status: 400 })
    }

    const rows = await sql<OptionGroup[]>`
      INSERT INTO product_option_groups_v2 (
        product_id, name, is_required, selection_type, min_select, max_select, sort_order
      ) VALUES (
        ${product_id || null}, 
        ${name.trim()}, 
        ${is_required}, 
        ${selection_type}, 
        ${min_select}, 
        ${max_select}, 
        ${sort_order}
      )
      RETURNING *
    `
    
    return NextResponse.json({ ...rows[0], options: [] }, { status: 201 })
    
  } catch (error) {
    console.error("Create option group error:", error)
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء المجموعة" },
      { status: 500 }
    )
  }
}

/** PATCH update group or manage options */
export async function PATCH(req: Request) {
  try {
    const isValid = await validateAdminSession()
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
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
      
      if (!name?.trim()) {
        return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 })
      }
      
      const rows = await sql<Option[]>`
        INSERT INTO product_options_v2 (
          group_id, name, price, replace_base_price, sort_order, is_active
        ) VALUES (
          ${group_id}, 
          ${name.trim()}, 
          ${Number(price)}, 
          ${replace_base_price}, 
          ${sort_order}, 
          true
        )
        RETURNING *
      `
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

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 })
    
  } catch (error) {
    console.error("Option groups patch error:", error)
    return NextResponse.json(
      { error: "حدث خطأ في تحديث البيانات" },
      { status: 500 }
    )
  }
}

/** DELETE an entire option group */
export async function DELETE(req: Request) {
  try {
    const isValid = await validateAdminSession()
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { id } = await req.json()
    
    // استخدام transaction للحذف المتتالي
    await sql.begin(async () => {
      // حذف الخيارات أولاً
      await sql`DELETE FROM product_options_v2 WHERE group_id = ${id}`
      // ثم حذف المجموعة
      await sql`DELETE FROM product_option_groups_v2 WHERE id = ${id}`
    })
    
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error("Delete option group error:", error)
    return NextResponse.json(
      { error: "حدث خطأ في حذف المجموعة" },
      { status: 500 }
    )
  }
}