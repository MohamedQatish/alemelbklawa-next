import { NextResponse } from "next/server"
import { calculateProductPrice } from "@/lib/pricing"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { productId, selectedOptions } = body

    const result = await calculateProductPrice(
      productId,
      selectedOptions,
    )

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 },
    )
  }
}