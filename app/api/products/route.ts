import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

// تعريف الأنواع
interface OptionGroup {
  id?: number;
  name: string;
  isRequired: boolean;
  selectionType: 'single' | 'multiple';
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  options: Option[];
}

interface Option {
  id?: number;
  name: string;
  price: number;
  replaceBasePrice: boolean;
  sortOrder: number;
}

export async function GET() {
  try {
    await ensureTables()
    
    const products = await sql`
      SELECT 
        p.id,
        p.name,
        p.name_ar,
        p.description,
        p.description_ar,
        p.price as base_price,
        p.category,
        p.category_id,
        p.image_url,
        p.is_featured,
        p.is_available,
        p.sort_order,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', g.id,
                'name', g.name,
                'isRequired', g.is_required,
                'selectionType', g.selection_type,
                'minSelect', g.min_select,
                'maxSelect', g.max_select,
                'sortOrder', g.sort_order,
                'options', (
                  SELECT json_agg(
                    json_build_object(
                      'id', o.id,
                      'name', o.name,
                      'price', o.price,
                      'replaceBasePrice', o.replace_base_price,
                      'sortOrder', o.sort_order
                    ) ORDER BY o.sort_order
                  )
                  FROM product_options_v2 o
                  WHERE o.group_id = g.id AND o.is_active = true
                )
              ) ORDER BY g.sort_order
            )
            FROM product_option_groups_v2 g
            WHERE g.product_id = p.id
          ),
          '[]'::json
        ) as option_groups
      FROM products p
      WHERE p.is_available = true
      ORDER BY p.category, p.sort_order, p.name
    `
    
    return NextResponse.json(products)
  } catch (error) {
    console.error("Products fetch error:", error)
    return NextResponse.json(
      { error: "خطأ في تحميل المنتجات" }, 
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { 
      id, 
      name, 
      name_ar, 
      description, 
      description_ar, 
      price, 
      category_id, 
      image_url,
      is_featured,
      is_available,
      sort_order,
      optionGroups 
    } = body

    if (!id || !name || !price) {
      return NextResponse.json(
        { error: "بيانات المنتج غير مكتملة" },
        { status: 400 }
      )
    }

    // استخدام sql.begin للمعاملة الكاملة
    const result = await sql.begin(async () => {
      // 1. تحديث المنتج
      const [updatedProduct] = await sql`
        UPDATE products 
        SET 
          name = ${name},
          name_ar = ${name_ar || null},
          description = ${description || null},
          description_ar = ${description_ar || null},
          price = ${price},
          category_id = ${category_id || null},
          image_url = ${image_url || null},
          is_featured = ${is_featured || false},
          is_available = ${is_available !== false},
          sort_order = ${sort_order || 0},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id
      `

      if (optionGroups && Array.isArray(optionGroups)) {
        // 2. حذف المجموعات القديمة (سيتم حذف الخيارات تلقائياً بسبب CASCADE)
        await sql`
          DELETE FROM product_option_groups_v2 
          WHERE product_id = ${id}
        `

        // 3. إضافة المجموعات الجديدة
        for (const group of optionGroups as OptionGroup[]) {
          const [newGroup] = await sql`
            INSERT INTO product_option_groups_v2 (
              product_id,
              name,
              is_required,
              selection_type,
              min_select,
              max_select,
              sort_order
            ) VALUES (
              ${id},
              ${group.name},
              ${group.isRequired || false},
              ${group.selectionType || 'single'},
              ${group.minSelect || 0},
              ${group.maxSelect || 1},
              ${group.sortOrder || 0}
            )
            RETURNING id
          `

          // 4. إضافة خيارات المجموعة
          if (group.options && Array.isArray(group.options)) {
            for (const option of group.options) {
              await sql`
                INSERT INTO product_options_v2 (
                  group_id,
                  name,
                  price,
                  replace_base_price,
                  sort_order,
                  is_active
                ) VALUES (
                  ${newGroup.id},
                  ${option.name},
                  ${option.price || 0},
                  ${option.replaceBasePrice || false},
                  ${option.sortOrder || 0},
                  true
                )
              `
            }
          }
        }
      }

      return updatedProduct
    })

    return NextResponse.json({ 
      success: true, 
      message: "تم تحديث المنتج بنجاح",
      productId: result.id 
    })

  } catch (error: any) {
    console.error("Update product error:", error)
    return NextResponse.json(
      { error: error?.message || "حدث خطأ في تحديث المنتج" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      name, 
      name_ar, 
      description, 
      description_ar, 
      price, 
      category_id, 
      image_url,
      is_featured,
      is_available,
      sort_order,
      optionGroups 
    } = body

    if (!name || !price) {
      return NextResponse.json(
        { error: "بيانات المنتج غير مكتملة" },
        { status: 400 }
      )
    }

    // استخدام sql.begin للمعاملة الكاملة
    const result = await sql.begin(async () => {
      // 1. إنشاء المنتج
      const [newProduct] = await sql`
        INSERT INTO products (
          name,
          name_ar,
          description,
          description_ar,
          price,
          category_id,
          image_url,
          is_featured,
          is_available,
          sort_order,
          created_at,
          updated_at
        ) VALUES (
          ${name},
          ${name_ar || null},
          ${description || null},
          ${description_ar || null},
          ${price},
          ${category_id || null},
          ${image_url || null},
          ${is_featured || false},
          ${is_available !== false},
          ${sort_order || 0},
          NOW(),
          NOW()
        )
        RETURNING id
      `

      // 2. إضافة مجموعات الخيارات إذا وجدت
      if (optionGroups && Array.isArray(optionGroups)) {
        for (const group of optionGroups as OptionGroup[]) {
          const [newGroup] = await sql`
            INSERT INTO product_option_groups_v2 (
              product_id,
              name,
              is_required,
              selection_type,
              min_select,
              max_select,
              sort_order
            ) VALUES (
              ${newProduct.id},
              ${group.name},
              ${group.isRequired || false},
              ${group.selectionType || 'single'},
              ${group.minSelect || 0},
              ${group.maxSelect || 1},
              ${group.sortOrder || 0}
            )
            RETURNING id
          `

          // 3. إضافة خيارات المجموعة
          if (group.options && Array.isArray(group.options)) {
            for (const option of group.options) {
              await sql`
                INSERT INTO product_options_v2 (
                  group_id,
                  name,
                  price,
                  replace_base_price,
                  sort_order,
                  is_active
                ) VALUES (
                  ${newGroup.id},
                  ${option.name},
                  ${option.price || 0},
                  ${option.replaceBasePrice || false},
                  ${option.sortOrder || 0},
                  true
                )
              `
            }
          }
        }
      }

      return newProduct
    })

    return NextResponse.json({ 
      success: true, 
      message: "تم إنشاء المنتج بنجاح",
      productId: result.id 
    })

  } catch (error: any) {
    console.error("Create product error:", error)
    return NextResponse.json(
      { error: error?.message || "حدث خطأ في إنشاء المنتج" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "معرف المنتج مطلوب" },
        { status: 400 }
      )
    }

    // استخدام sql.begin للمعاملة
    await sql.begin(async () => {
      // حذف المنتج (سيتم حذف المجموعات والخيارات تلقائياً بسبب CASCADE)
      await sql`
        DELETE FROM products 
        WHERE id = ${id}
      `
    })

    return NextResponse.json({ 
      success: true, 
      message: "تم حذف المنتج بنجاح" 
    })

  } catch (error: any) {
    console.error("Delete product error:", error)
    return NextResponse.json(
      { error: error?.message || "حدث خطأ في حذف المنتج" },
      { status: 500 }
    )
  }
}