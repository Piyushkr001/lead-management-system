import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password"), // Nullable for Google OAuth users
  role: varchar("role", { length: 50 }).default("member").notNull(),
  provider: varchar("provider", { length: 50 }).default("credentials").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
