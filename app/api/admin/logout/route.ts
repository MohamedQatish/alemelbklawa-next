import { destroyAdminSession } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    await destroyAdminSession()

    const response = NextResponse.json({ success: true })
    response.cookies.set("admin_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "خطأ في تسجيل الخروج" },
      { status: 500 },
    )
  }
}
