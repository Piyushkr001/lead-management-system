import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema/index';

// @ts-expect-error - drizzle-orm@1.0.0-rc.4 typing issue
export const db = drizzle(process.env.DATABASE_URL!, { schema });
