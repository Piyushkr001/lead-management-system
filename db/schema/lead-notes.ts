import { pgTable, serial, integer, text, timestamp, index } from "drizzle-orm/pg-core";
import { leadsTable } from "./leads";
import { usersTable } from "./users";

export const leadNotesTable = pgTable("lead_notes", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leadsTable.id, { onDelete: "cascade" }).notNull(),
  authorId: integer("author_id").references(() => usersTable.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  index("lead_notes_lead_id_idx").on(table.leadId)
]);
