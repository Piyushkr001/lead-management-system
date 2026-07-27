import { execSync } from "child_process";

export default function setup() {
  // Set test environment variables BEFORE any imports
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (process.env as any).NODE_ENV = "test";
  process.env.DATABASE_URL = "postgresql://testuser:testpassword@localhost:54325/leadnexa_test";
  
  console.log("Running DB push for test environment...");
  // Assuming test db is running, push the schema. Using migrate is better but push is easier if no migrations exist.
  // Actually, I'll stick to push if it works, or check if drizzle.config.ts is present.
  execSync("bun run db:push", { stdio: "inherit", env: { ...process.env, NODE_ENV: "test", DATABASE_URL: "postgresql://testuser:testpassword@localhost:54325/leadnexa_test" } });
}
