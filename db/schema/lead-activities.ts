import { pgTable, serial, integer, timestamp, pgEnum, jsonb, index } from "drizzle-orm/pg-core";
import { leadsTable } from "./leads";
import { usersTable } from "./users";

export const activityTypeEnum = pgEnum("activity_type", [
  "LEAD_CREATED",
  "LEAD_UPDATED",
  "LEAD_ASSIGNED",
  "LEAD_REASSIGNED",
  "STATUS_CHANGED",
  "NOTE_ADDED"
]);

export const leadActivitiesTable = pgTable("lead_activities", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leadsTable.id, { onDelete: "cascade" }).notNull(),
  actorId: integer("actor_id").references(() => usersTable.id, { onDelete: "set null" }), // Can be null if system action
  type: activityTypeEnum("type").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("lead_activities_lead_id_idx").on(table.leadId),
  index("lead_activities_created_at_idx").on(table.createdAt)
]);
