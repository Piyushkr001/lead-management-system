import { neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import ws from 'ws';
import { env } from '@/lib/env';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;

if (process.env.NODE_ENV === "test") {
  process.env.PGPORT = "54325";
  process.env.PGHOST = "127.0.0.1";
  process.env.PGUSER = "testuser";
  process.env.PGPASSWORD = "testpassword";
  process.env.PGDATABASE = "leadnexa_test";
  console.log("INITIALIZING TEST DB POOL ON PORT 54325...");
  const pool = new Pool();
  console.log("POOL OPTIONS:", pool.options);
  db = drizzlePg(pool);
} else {
  console.log("INITIALIZING NEON DB POOL...");
  // Configure neon to use ws instead of native fetch for WebSocket support in Node.js
  neonConfig.webSocketConstructor = ws;
  db = drizzleNeon({ connection: env.DATABASE_URL, ws });
}

export { db };


