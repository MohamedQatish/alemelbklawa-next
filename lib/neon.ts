import { neon } from "@neondatabase/serverless"

let _sql: ReturnType<typeof neon> | null = null

/**
 * Tagged-template SQL helper. Lazily creates the neon client.
 * Usage: sql`SELECT * FROM users WHERE id = ${id}`
 */
export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL environment variable is not set. Please add it to your project environment variables.",
      )
    }
    _sql = neon(process.env.DATABASE_URL)
  }
  return _sql(strings, ...values)
}
