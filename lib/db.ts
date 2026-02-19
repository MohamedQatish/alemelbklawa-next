// lib/db.ts - هذا الملف مخصص فقط للاتصال بقاعدة البيانات
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

// تصدير sql للاستخدام في جميع أنحاء التطبيق
export const sql = postgres(connectionString, {
  ssl: false,
  max: 5,
  idle_timeout: 15,
  connect_timeout: 10,
  prepare: false
});

// تصدير افتراضي أيضاً
export default sql;