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
    const products = await sql`
      SELECT * FROM products ORDER BY category, sort_order, created_at DESC
    `
    return NextResponse.json(products)
  } catch (error) {
    console.error("Admin products error:", error)
    return NextResponse.json({ error: "خطأ في تحميل المنتجات" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, description, price, category, category_id, image_url, is_available, is_featured, sort_order, option_group_ids } = body

    if (!name || !price || !category) {
      return NextResponse.json({ error: "الاسم والسعر والتصنيف مطلوبة" }, { status: 400 })
    }

    // استخدام sql.begin للمعاملة
    const product = await sql.begin(async () => {
      // 1. إدراج المنتج
      const productResult = await sql`
        INSERT INTO products (name, description, price, category, category_id, image_url, is_available, is_featured, sort_order)
        VALUES (
          ${name.trim()},
          ${description?.trim() || null},
          ${Number(price)},
          ${category.trim()},
          ${category_id || null},
          ${image_url || null},
          ${is_available !== false},
          ${is_featured === true},
          ${sort_order || 0}
        )
        RETURNING id
      `
      
      const product = productResult[0]

      // 2. تحديث مجموعات الخيارات (النظام الجديد - product_option_groups_v2)
      if (Array.isArray(option_group_ids) && option_group_ids.length > 0) {
        for (const groupId of option_group_ids) {
          await sql`
            UPDATE product_option_groups_v2 
            SET product_id = ${product.id} 
            WHERE id = ${groupId}
          `
        }
      }

      return product
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Create product error:", error)
    return NextResponse.json({ error: "خطأ في إضافة المنتج" }, { status: 500 })
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
      return NextResponse.json({ error: "معرف المنتج مطلوب" }, { status: 400 })
    }

    // جلب المنتج الحالي
    const existingResult = await sql`SELECT * FROM products WHERE id = ${id}`
    if (existingResult.length === 0) {
      return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 })
    }
    const p = existingResult[0]

    const newName = ("name" in body) ? (body.name?.trim() || p.name) : p.name
    const newDesc = ("description" in body) ? (body.description?.trim() || null) : p.description
    const newPrice = ("price" in body && body.price != null) ? Number(body.price) : p.price
    const newCat = ("category" in body) ? (body.category?.trim() || p.category) : p.category
    const newCatId = ("category_id" in body) ? (body.category_id || null) : p.category_id
    const newImg = ("image_url" in body) ? (body.image_url || null) : p.image_url
    const newAvail = ("is_available" in body) ? body.is_available : p.is_available
    const newFeat = ("is_featured" in body) ? body.is_featured : p.is_featured
    const newSort = ("sort_order" in body) ? body.sort_order : p.sort_order

    // استخدام sql.begin للمعاملة
    const updated = await sql.begin(async () => {
      // 1. تحديث المنتج
      const updateResult = await sql`
        UPDATE products SET
          name = ${newName},
          description = ${newDesc},
          price = ${newPrice},
          category = ${newCat},
          category_id = ${newCatId},
          image_url = ${newImg},
          is_available = ${newAvail},
          is_featured = ${newFeat},
          sort_order = ${newSort},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id
      `

      if (updateResult.length === 0) {
        throw new Error("المنتج غير موجود")
      }

      // 2. تحديث مجموعات الخيارات إذا تم إرسالها
      if ("option_group_ids" in body && Array.isArray(body.option_group_ids)) {
        // إعادة تعيين product_id للمجموعات التي كانت مرتبطة بهذا المنتج سابقاً
        await sql`
          UPDATE product_option_groups_v2 
          SET product_id = NULL 
          WHERE product_id = ${id}
        `

        // تعيين product_id للمجموعات الجديدة
        if (body.option_group_ids.length > 0) {
          for (const groupId of body.option_group_ids) {
            await sql`
              UPDATE product_option_groups_v2 
              SET product_id = ${id} 
              WHERE id = ${groupId}
            `
          }
        }
      }

      return { id, ...body }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update product error:", error)
    return NextResponse.json({ error: "خطأ في تحديث المنتج" }, { status: 500 })
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
      return NextResponse.json({ error: "معرف المنتج مطلوب" }, { status: 400 })
    }

    // استخدام sql.begin للمعاملة
    await sql.begin(async () => {
      // 1. إلغاء ربط مجموعات الخيارات
      await sql`
        UPDATE product_option_groups_v2 
        SET product_id = NULL 
        WHERE product_id = ${id}
      `

      // 2. حذف المنتج
      const deleteResult = await sql`DELETE FROM products WHERE id = ${id} RETURNING id`
      
      if (deleteResult.length === 0) {
        throw new Error("المنتج غير موجود")
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete product error:", error)
    return NextResponse.json({ error: "خطأ في حذف المنتج" }, { status: 500 })
  }
}