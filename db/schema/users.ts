import { pgTable, serial, varchar, text, timestamp, boolean, pgEnum, index } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["ADMIN", "MEMBER"]);
export const providerEnum = pgEnum("provider", ["CREDENTIALS", "GOOGLE"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"), // Nullable for Google OAuth users
  role: roleEnum("role").default("MEMBER").notNull(),
  provider: providerEnum("provider").default("CREDENTIALS").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  index("users_email_idx").on(table.email)
]);
