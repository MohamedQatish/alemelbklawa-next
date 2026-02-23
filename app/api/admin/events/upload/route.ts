import { validateAdminSession } from "@/lib/auth"
import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir, unlink } from "fs/promises"
import { join, basename } from "path"
import { existsSync } from "fs"

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "events")

export async function POST(request: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "لم يتم تحديد أي ملف" }, { status: 400 })
    }

    // التحقق من نوع الملف
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "نوع الملف غير مدعوم" }, { status: 400 })
    }

    // التحقق من حجم الملف (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "حجم الصورة كبير جداً" }, { status: 400 })
    }

    // إنشاء المجلد إذا لم يكن موجوداً
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // حفظ الملف
    const timestamp = Date.now()
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\u0600-\u06FF]/g, '_')
    const fileName = `${timestamp}-${safeFileName}`
    const filePath = join(UPLOAD_DIR, fileName)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    const imageUrl = `uploads/events/${fileName}`

    return NextResponse.json({ url: imageUrl, message: "تم رفع الصورة بنجاح" })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء رفع الملف" }, { status: 500 })
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

    const fileName = basename(url)
    const filePath = join(UPLOAD_DIR, fileName)
    
    if (existsSync(filePath)) {
      await unlink(filePath)
      return NextResponse.json({ success: true, message: "تم حذف الملف" })
    } else {
      return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 })
    }
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "فشل في حذف الملف" }, { status: 500 })
  }
}