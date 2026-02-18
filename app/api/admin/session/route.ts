import { getSessionUser } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 })
  }
}
