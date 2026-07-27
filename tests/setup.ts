// Setup environment variables

// Set test environment variables BEFORE any imports
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(process.env as any).NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://testuser:testpassword@localhost:54325/leadnexa_test";
process.env.JWT_SECRET = "super_secret_test_jwt_key_that_is_32_chars";

