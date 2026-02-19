import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

export const sql = postgres(connectionString || 'postgres://empty:empty@localhost:5432/empty', {
  ssl: false,
  max: 5,
  idle_timeout: 15,
  connect_timeout: 10,
  prepare: false
});

export default sql;