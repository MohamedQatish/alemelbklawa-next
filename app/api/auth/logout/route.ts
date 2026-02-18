import { NextResponse } from "next/server"
import { destroyUserSession } from "@/lib/user-auth"

export async function POST() {
  try {
    await destroyUserSession()

    const response = NextResponse.json({ success: true })
    response.cookies.set("user_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    return response
  } catch {
    return NextResponse.json({ error: "خطأ" }, { status: 500 })
  }
}
