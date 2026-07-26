import { pgTable, serial, varchar, text, timestamp, pgEnum, integer, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const statusEnum = pgEnum("status", ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"]);

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  message: text("message"),
  source: varchar("source", { length: 100 }).default("Website").notNull(),
  status: statusEnum("status").default("NEW").notNull(),
  assignedTo: integer("assigned_to").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  index("leads_status_idx").on(table.status),
  index("leads_assigned_to_idx").on(table.assignedTo),
  index("leads_created_at_idx").on(table.createdAt)
]);
