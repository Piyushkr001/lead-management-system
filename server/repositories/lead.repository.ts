import { db } from "@/db";
import { leadsTable } from "@/db/schema/leads";
import { leadActivitiesTable } from "@/db/schema/lead-activities";
import { eq, or, ilike, and, desc, sql } from "drizzle-orm";

export class LeadRepository {
  static async createPublicLead(data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message: string;
  }) {
    // We use a transaction because we need to insert the lead and the activity atomically.
    return await db.transaction(async (tx) => {
      // 1. Insert the lead
      const [newLead] = await tx.insert(leadsTable).values({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        message: data.message,
        status: "NEW",
        source: "WEBSITE", // Assuming this corresponds to 'Website' as defined in schema default
      }).returning();

      // 2. Insert the activity
      await tx.insert(leadActivitiesTable).values({
        leadId: newLead.id,
        actorId: null, // Public system action
        type: "LEAD_CREATED",
        metadata: { source: "public_form" },
      });

      return newLead;
    });
  }

  static async getLeads(params: {
    page: number;
    pageSize: number;
    status?: string;
    assignedTo?: number;
    search?: string;
  }) {
    const { page, pageSize, status, assignedTo, search } = params;
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (status) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conditions.push(eq(leadsTable.status, status as any));
    }

    if (assignedTo) {
      conditions.push(eq(leadsTable.assignedTo, assignedTo));
    }

    if (search) {
      conditions.push(
        or(
          ilike(leadsTable.name, `%${search}%`),
          ilike(leadsTable.email, `%${search}%`),
          ilike(leadsTable.company, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalCountResult] = await db
      .select({ count: sql`count(*)` })
      .from(leadsTable)
      .where(whereClause);
      
    const totalCount = Number(totalCountResult.count);

    const leads = await db
      .select()
      .from(leadsTable)
      .where(whereClause)
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(leadsTable.createdAt));

    return {
      leads,
      totalCount,
    };
  }
}
