// /app/api/admin/filters/cities/route.ts
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { validateAdminSession } from "@/lib/auth";

export async function GET() {
  try {
    const isAdmin = await validateAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const cities = await sql`
      SELECT DISTINCT city 
      FROM orders 
      WHERE city IS NOT NULL AND city != '' 
      ORDER BY city
    `;

    return NextResponse.json(cities.map(c => c.city));
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json({ error: "خطأ في جلب المدن" }, { status: 500 });
  }
}