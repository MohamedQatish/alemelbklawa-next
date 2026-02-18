import { sql } from "@/lib/neon"
import { NextResponse } from "next/server"
import { ensureTables } from "@/lib/ensure-tables"

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