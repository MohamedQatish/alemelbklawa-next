import { validateAdminSession } from "@/lib/auth"
import { put, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "لم يتم تحديد ملف" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "نوع الملف غير مدعوم. يرجى رفع صورة (JPG, PNG, WebP, GIF)" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت" }, { status: 400 })
    }

    const blob = await put(`products/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "خطأ في رفع الصورة" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const { url } = await request.json()
    if (!url) {
      return NextResponse.json({ error: "رابط الصورة مطلوب" }, { status: 400 })
    }

    await del(url)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete image error:", error)
    return NextResponse.json({ error: "خطأ في حذف الصورة" }, { status: 500 })
  }
}
