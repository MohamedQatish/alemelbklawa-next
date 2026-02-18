import { validateAdminSession } from "@/lib/auth"
import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir, unlink } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"


const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "products")

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

    // التحقق من نوع الملف
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "نوع الملف غير مدعوم. يرجى رفع صورة (JPG, PNG, WebP, GIF)" 
      }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ 
        error: "حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت" 
      }, { status: 400 })
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    const timestamp = Date.now()
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\u0600-\u06FF]/g, '_')
    const fileName = `${timestamp}-${safeFileName}`
    const filePath = join(UPLOAD_DIR, fileName)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    const imageUrl = `/uploads/products/${fileName}`

    return NextResponse.json({ 
      url: imageUrl,
      message: "تم رفع الصورة بنجاح" 
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ 
      error: "خطأ في رفع الصورة: " + (error instanceof Error ? error.message : "غير معروف") 
    }, { status: 500 })
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

    const fileName = url.split('/').pop()
    if (!fileName) {
      return NextResponse.json({ error: "اسم ملف غير صالح" }, { status: 400 })
    }

    const filePath = join(UPLOAD_DIR, fileName)
    
    if (existsSync(filePath)) {
      await unlink(filePath)
      return NextResponse.json({ 
        success: true, 
        message: "تم حذف الصورة بنجاح" 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "الملف غير موجود" 
      }, { status: 404 })
    }
  } catch (error) {
    console.error("Delete image error:", error)
    return NextResponse.json({ 
      error: "خطأ في حذف الصورة: " + (error instanceof Error ? error.message : "غير معروف") 
    }, { status: 500 })
  }
}

// للتحقق من وجود ملف (اختياري)
export async function GET(request: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('file')

  if (!filename) {
    return NextResponse.json({ error: "اسم الملف مطلوب" }, { status: 400 })
  }

  const filePath = join(UPLOAD_DIR, filename)
  
  if (existsSync(filePath)) {
    return NextResponse.json({ exists: true })
  } else {
    return NextResponse.json({ exists: false }, { status: 404 })
  }
}