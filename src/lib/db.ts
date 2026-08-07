import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Provide a fallback for build time when env vars might not be injected yet
const connectionString = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost/dummy";
const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
