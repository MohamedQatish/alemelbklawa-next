import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword, createUserSession } from "@/lib/user-auth"
import { ensureTables } from "@/lib/ensure-tables"

export async function POST(request: Request) {
  try {
    await ensureTables()
    const body = await request.json()
    const { name, phone, password, location } = body

    // ==========================================
    // 🛡️ 1. حماية الطول الأقصى والتأكد من وجود البيانات
    // ==========================================
    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: "الاسم ورقم الهاتف وكلمة المرور مطلوبة" },
        { status: 400 },
      )
    }

    if (
      name.length > 100 ||
      password.length > 100 ||
      phone.length > 20 ||
      (location && location.length > 250)
    ) {
      return NextResponse.json(
        { error: "بعض الحقول تتجاوز الحد الأقصى للطول المسموح به" },
        { status: 400 },
      )
    }

    // ==========================================
    // 🛡️ 2. فلترة الاسم (حروف ومسافات فقط)
    // ==========================================
    const nameRegex = /^[a-zA-Z\u0621-\u064A\s]+$/;
    if (!nameRegex.test(name.trim())) {
      return NextResponse.json(
        { error: "الاسم يجب أن يحتوي على حروف فقط (بدون أرقام أو رموز)" },
        { status: 400 },
      )
    }

    // ==========================================
    // 🛡️ 3. فلترة رقم الهاتف (متوافق مع كود الدولة وطول الرقم)
    // ==========================================

    const phoneRegex = /^(\+218\d{9}|\+20\d{10}|\+216\d{8}|\+213\d{9}|\+212\d{9})$/;
    const cleanPhone = phone.replace(/\s+/g, ""); // تنظيف الرقم من أي مسافات زائدة
    
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: "رقم الهاتف غير صالح. يرجى التأكد من الرقم واختيار كود الدولة الصحيح." },
        { status: 400 },
      )
    }

    // ==========================================
    // 🛡️ 4. فلترة كلمة المرور (بيمنع الإيموجي والمسافات)
    // ==========================================

    if (/\s/.test(password)) {
      return NextResponse.json(
        { error: "كلمة المرور لا يجب أن تحتوي على مسافات" },
        { status: 400 },
      )
    }

    // منع الرموز التعبيرية (Emojis) باستخدام خصائص اليونيكود
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
    if (emojiRegex.test(password)) {
      return NextResponse.json(
        { error: "كلمة المرور لا يجب أن تحتوي على رموز تعبيرية (Emojis)" },
        { status: 400 },
      )
    }

    // التأكد من أن الطول الفعلي (كحروف وأرقام) لا يقل عن 6
    if (Array.from(password).length < 6) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 6 أحرف فعلية على الأقل" },
        { status: 400 },
      )
    }


    // ==========================================
    // 🛡️ 5. فلترة العنوان (لو العميل دخله: نصوص، أرقام، وعلامات ترقيم فقط)
    // ==========================================
    if (location && location.trim() !== "") {
      const addressRegex = /^[a-zA-Z\u0621-\u064A0-9\s\.,\-_/\\]+$/;
      if (!addressRegex.test(location.trim())) {
        return NextResponse.json(
          { error: "العنوان يحتوي على رموز غير مسموحة (الإيموجي والرموز المعقدة ممنوعة)" },
          { status: 400 },
        )
      }
    }

    // ==========================================
    // 💾 إدخال البيانات إلى قاعدة البيانات
    // ==========================================
    
    const existing = await sql`SELECT id FROM users WHERE phone = ${cleanPhone}`
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "رقم الهاتف مسجل مسبقاً" },
        { status: 409 },
      )
    }

    const passwordHash = await hashPassword(password)

    const result = await sql`
      INSERT INTO users (name, phone, password_hash, city)
      VALUES (${name.trim()}, ${cleanPhone}, ${passwordHash}, ${location?.trim() || null})
      RETURNING id, name, phone
    `

    const user = result[0]
    const sessionToken = await createUserSession(user.id as number)

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, phone: user.phone },
    })

    response.cookies.set("user_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "حدث خطأ أثناء التسجيل" },
      { status: 500 },
    )
  }
}