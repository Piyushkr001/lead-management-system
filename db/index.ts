import { neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './schema/index';
import { env } from '@/lib/env';

import { defineRelations } from 'drizzle-orm';

// Configure neon to use ws instead of native fetch for WebSocket support in Node.js
neonConfig.webSocketConstructor = ws;

export const db = drizzle({ 
  connection: env.DATABASE_URL, 
  relations: defineRelations(schema), 
  ws: ws 
});


