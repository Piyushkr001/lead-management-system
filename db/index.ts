import { neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { env } from '@/lib/env';



// Configure neon to use ws instead of native fetch for WebSocket support in Node.js
neonConfig.webSocketConstructor = ws;

export const db = drizzle({ connection: env.DATABASE_URL, ws });


