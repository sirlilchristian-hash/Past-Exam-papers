import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

declare global {
  var _postgresPool: Pool | undefined;
}

export const isDatabaseConfigured = (): boolean => {
  const connectionString = process.env.DATABASE_URL;
  return Boolean(
    connectionString &&
    typeof connectionString === 'string' &&
    connectionString.trim().length > 0 &&
    (connectionString.startsWith('postgres://') || connectionString.startsWith('postgresql://'))
  );
};

export const createPool = (): Pool | null => {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!global._postgresPool) {
    const connectionString = process.env.DATABASE_URL!;

    global._postgresPool = new Pool({
      connectionString,
      ssl: connectionString.includes('supabase.co') || connectionString.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Handle pool errors gracefully to prevent uncaught exceptions
    global._postgresPool.on('error', (err) => {
      console.warn('Database Pool Warning:', err.message);
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = pool ? drizzle(pool, { schema }) : null;
