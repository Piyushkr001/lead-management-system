import { beforeAll } from "vitest";
import { execSync } from "child_process";

// Set test environment variables BEFORE any imports
(process.env as any).NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://testuser:testpassword@localhost:54325/leadnexa_test";
process.env.JWT_SECRET = "super_secret_test_jwt_key_that_is_32_chars";

beforeAll(() => {
  // Apply migrations to test DB
  execSync("bun run db:push", { stdio: "inherit" });
});
