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
  sourceType?: 'product' | 'event'
}

interface ProductRow {
  id: number
  name: string
  price: string | number
}

interface EventRow {
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
  sourceType?: 'product' | 'event' // ✅ الآن يستقبل المعامل
): Promise<PricingResult> {

  // 1️⃣ تحديد المصدر بناءً على المعامل المُمرر أو الاكتشاف
  const finalSourceType = sourceType || await detectSourceType(productId);

  // 2️⃣ جلب البيانات حسب المصدر
  let productName = '';
  let basePrice = 0;
  let product: any;

  if (finalSourceType === 'product') {
    const productResult = await sql`
      SELECT id, name, price
      FROM products
      WHERE id = ${productId}
      LIMIT 1
    ` as unknown as ProductRow[];

    if (!productResult || productResult.length === 0) {
      throw new Error(`Product not found with ID: ${productId}`);
    }
    product = productResult[0];
    productName = product.name;
    basePrice = Number(product.price);
  } else {
    const eventResult = await sql`
      SELECT id, name, price
      FROM events
      WHERE id = ${productId}
      LIMIT 1
    ` as unknown as EventRow[];

    if (!eventResult || eventResult.length === 0) {
      throw new Error(`Event not found with ID: ${productId}`);
    }
    const event = eventResult[0];
    productName = event.name;
    basePrice = Number(event.price);
    product = event;
  }

  // 3️⃣ البحث عن الخيارات فقط إذا كان المصدر منتجاً
  let groups: GroupRow[] = [];
  let options: OptionRow[] = [];

  if (finalSourceType === 'product') {
    groups = await sql`
      SELECT id, name, is_required, selection_type, min_select, max_select
      FROM product_option_groups_v2
      WHERE product_id = ${productId}
    ` as unknown as GroupRow[];

    const optionIds = selectedOptions.map((o) => o.optionId);

    if (optionIds.length > 0) {
      options = await sql`
        SELECT o.id, o.name, o.price, o.replace_base_price, o.group_id
        FROM product_options_v2 o
        JOIN product_option_groups_v2 g ON o.group_id = g.id
        WHERE o.id = ANY(${optionIds})
        AND g.product_id = ${productId}
        AND o.is_active = true
      ` as unknown as OptionRow[];
    }

    // 4️⃣ التحقق من الخيارات الإجبارية (للمنتجات فقط)
    for (const group of groups) {
      const selectedInGroup = options.filter((o) => o.group_id === group.id);

      if (group.is_required && selectedInGroup.length === 0) {
        throw new Error(`Required option missing in group ${group.name}`);
      }

      if (group.selection_type === "single" && selectedInGroup.length > 1) {
        throw new Error(`Only one option allowed in group ${group.name}`);
      }

      if (selectedInGroup.length < group.min_select) {
        throw new Error(`Minimum selection not met in group ${group.name}`);
      }

      if (selectedInGroup.length > group.max_select) {
        throw new Error(`Maximum selection exceeded in group ${group.name}`);
      }
    }
  }

  // 5️⃣ حساب السعر النهائي
  let finalPrice = basePrice;
  let replaceTriggered = false;

  const normalizedOptions = options.map((o) => {
    if (o.replace_base_price) replaceTriggered = true;
    return {
      id: o.id,
      name: o.name,
      price: Number(o.price),
      replaceBasePrice: o.replace_base_price,
    };
  });

  if (replaceTriggered) finalPrice = 0;
  for (const opt of normalizedOptions) finalPrice += opt.price;

  return {
    productId: product.id,
    productName,
    basePrice,
    finalPrice,
    selectedOptions: normalizedOptions,
    sourceType: finalSourceType,
  };
}

// دالة مساعدة للكشف عن المصدر في حال لم يُمرر
async function detectSourceType(id: number): Promise<'product' | 'event'> {
  const productCheck = await sql`
    SELECT id FROM products WHERE id = ${id} LIMIT 1
  `;
  if (productCheck.length > 0) return 'product';

  const eventCheck = await sql`
    SELECT id FROM events WHERE id = ${id} LIMIT 1
  `;
  if (eventCheck.length > 0) return 'event';

  throw new Error(`Item not found with ID: ${id}`);
}