CREATE TYPE "provider" AS ENUM('CREDENTIALS', 'GOOGLE');--> statement-breakpoint
CREATE TYPE "role" AS ENUM('ADMIN', 'MEMBER');--> statement-breakpoint
CREATE TYPE "status" AS ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST');--> statement-breakpoint
CREATE TYPE "activity_type" AS ENUM('LEAD_CREATED', 'LEAD_UPDATED', 'LEAD_ASSIGNED', 'LEAD_REASSIGNED', 'STATUS_CHANGED', 'NOTE_ADDED');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE,
	"password_hash" text,
	"role" "role" DEFAULT 'MEMBER'::"role" NOT NULL,
	"provider" "provider" DEFAULT 'CREDENTIALS'::"provider" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"company" varchar(255),
	"message" text,
	"source" varchar(100) DEFAULT 'Website' NOT NULL,
	"status" "status" DEFAULT 'NEW'::"status" NOT NULL,
	"assigned_to" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_notes" (
	"id" serial PRIMARY KEY,
	"lead_id" integer NOT NULL,
	"author_id" integer,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" serial PRIMARY KEY,
	"lead_id" integer NOT NULL,
	"actor_id" integer,
	"type" "activity_type" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" ("email");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" ("status");--> statement-breakpoint
CREATE INDEX "leads_assigned_to_idx" ON "leads" ("assigned_to");--> statement-breakpoint
CREATE INDEX "leads_created_at_idx" ON "leads" ("created_at");--> statement-breakpoint
CREATE INDEX "lead_notes_lead_id_idx" ON "lead_notes" ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_activities_lead_id_idx" ON "lead_activities" ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_activities_created_at_idx" ON "lead_activities" ("created_at");--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_users_id_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_leads_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_actor_id_users_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL;