import { sql } from "@/lib/db"

export interface SelectedOptionInput {
  optionId: number
}

export interface PricingResult {
  productId: number
  productName: string
  basePrice: number
  finalPrice: number
  selectedOptions: {
    id: number
    name: string
    price: number
    replaceBasePrice: boolean
  }[]
}

interface ProductRow {
  id: number
  name: string
  price: string | number
}

interface GroupRow {
  id: number
  name: string
  is_required: boolean
  selection_type: string
  min_select: number
  max_select: number
}

interface OptionRow {
  id: number
  name: string
  price: string | number
  replace_base_price: boolean
  group_id: number
}

export async function calculateProductPrice(
  productId: number,
  selectedOptions: SelectedOptionInput[],
): Promise<PricingResult> {

  // 1️⃣ Fetch product
  const productResult = await sql`
    SELECT id, name, price
    FROM products
    WHERE id = ${productId}
    LIMIT 1
  ` as unknown as ProductRow[]

  if (!productResult || productResult.length === 0) {
    throw new Error("Product not found")
  }

  const product = productResult[0]
  const basePrice = Number(product.price)

  // 2️⃣ Fetch groups
  const groups = await sql`
    SELECT id, name, is_required, selection_type, min_select, max_select
    FROM product_option_groups_v2
    WHERE product_id = ${productId}
  ` as unknown as GroupRow[]

  // 3️⃣ Fetch selected options
  const optionIds = selectedOptions.map((o) => o.optionId)

  let options: OptionRow[] = []

  if (optionIds.length > 0) {
    options = await sql`
      SELECT o.id, o.name, o.price, o.replace_base_price, o.group_id
      FROM product_options_v2 o
      JOIN product_option_groups_v2 g
      ON o.group_id = g.id
      WHERE o.id = ANY(${optionIds})
      AND g.product_id = ${productId}
      AND o.is_active = true
    ` as unknown as OptionRow[]
  }

  // 4️⃣ Validation
  for (const group of groups) {
    const selectedInGroup = options.filter(
      (o) => o.group_id === group.id,
    )

    if (group.is_required && selectedInGroup.length === 0) {
      throw new Error(`Required option missing in group ${group.name}`)
    }

    if (group.selection_type === "single" && selectedInGroup.length > 1) {
      throw new Error(`Only one option allowed in group ${group.name}`)
    }

    if (selectedInGroup.length < group.min_select) {
      throw new Error(`Minimum selection not met in group ${group.name}`)
    }

    if (selectedInGroup.length > group.max_select) {
      throw new Error(`Maximum selection exceeded in group ${group.name}`)
    }
  }

  // 5️⃣ Calculate final price
  let finalPrice = basePrice
  let replaceTriggered = false

  const normalizedOptions = options.map((o) => {
    if (o.replace_base_price) {
      replaceTriggered = true
    }

    return {
      id: o.id,
      name: o.name,
      price: Number(o.price),
      replaceBasePrice: o.replace_base_price,
    }
  })

  if (replaceTriggered) {
    finalPrice = 0
  }

  for (const opt of normalizedOptions) {
    finalPrice += opt.price
  }

  return {
    productId: product.id,
    productName: product.name,
    basePrice,
    finalPrice,
    selectedOptions: normalizedOptions,
  }
}