import { validateAdminSession } from "@/lib/auth"
import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir, unlink } from "fs/promises"
import { join, basename } from "path"
import { existsSync } from "fs"

// المسار الفيزيائي: داخل public ليكون متاحاً عبر المتصفح
const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "products")

/**
 * دالة رفع الصور
 */
export async function POST(request: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "لم يتم تحديد أي ملف" }, { status: 400 })
    }

    // 1. التحقق من نوع الملف (Security Check)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "نوع الملف غير مدعوم. المسموح: JPG, PNG, WebP, GIF" 
      }, { status: 400 })
    }

    // 2. التحقق من حجم الملف (الحد الأقصى 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ 
        error: "حجم الصورة كبير جداً. الحد الأقصى هو 5 ميجابايت" 
      }, { status: 400 })
    }

    // 3. التأكد من وجود المجلدات (إن لم توجد سيتم إنشاؤها)
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // 4. توليد اسم آمن للملف لمنع التداخل أو الثغرات
    const timestamp = Date.now()
    // تنظيف اسم الملف من أي رموز غريبة مع دعم الحروف العربية
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\u0600-\u06FF]/g, '_')
    const fileName = `${timestamp}-${safeFileName}`
    const filePath = join(UPLOAD_DIR, fileName)

    // 5. حفظ الملف فعلياً على القرص الصلب للسيرفر
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // 6. الرابط العام الذي سيتم تخزينه في قاعدة البيانات واستخدامه في <img>
    const imageUrl = `uploads/products/${fileName}`

    return NextResponse.json({ 
      url: imageUrl,
      message: "تم رفع الصورة بنجاح" 
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ 
      error: "حدث خطأ أثناء حفظ الملف على السيرفر" 
    }, { status: 500 })
  }
}

/**
 * دالة حذف الصور
 */
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

    // أمان: استخراج اسم الملف فقط لضمان عدم حذف ملفات خارج المجلد (Path Traversal Protection)
    const fileName = basename(url) 
    const filePath = join(UPLOAD_DIR, fileName)
    
    if (existsSync(filePath)) {
      await unlink(filePath)
      return NextResponse.json({ success: true, message: "تم حذف الملف من السيرفر" })
    } else {
      return NextResponse.json({ error: "الملف غير موجود بالفعل" }, { status: 404 })
    }
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "فشل في حذف الملف" }, { status: 500 })
  }
}

/**
 * دالة التحقق من وجود ملف
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('file')

  if (!filename) {
    return NextResponse.json({ error: "اسم الملف مطلوب" }, { status: 400 })
  }

  // أمان: استخراج اسم الملف فقط
  const safeName = basename(filename)
  const filePath = join(UPLOAD_DIR, safeName)
  
  return NextResponse.json({ exists: existsSync(filePath) })
}