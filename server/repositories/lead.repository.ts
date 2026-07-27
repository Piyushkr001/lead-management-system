import { db } from "@/db";
import { leadsTable, statusEnum } from "@/db/schema/leads";
import { leadActivitiesTable } from "@/db/schema/lead-activities";
import { leadNotesTable } from "@/db/schema/lead-notes";
import { usersTable } from "@/db/schema/users";
import { eq, or, ilike, and, desc, sql, inArray } from "drizzle-orm";
import { UserSession } from "@/lib/auth";

type Status = typeof statusEnum.enumValues[number];

export class LeadRepository {
  static async createPublicLead(data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message: string;
  }) {
    return await db.transaction(async (tx) => {
      const [newLead] = await tx.insert(leadsTable).values({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        message: data.message,
        status: "NEW",
        source: "WEBSITE",
      }).returning();

      await tx.insert(leadActivitiesTable).values({
        leadId: newLead.id,
        actorId: null,
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
      conditions.push(eq(leadsTable.status, status as Status));
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

    const results = await db
      .select({
        lead: leadsTable,
        assignedUser: {
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
        }
      })
      .from(leadsTable)
      .leftJoin(usersTable, eq(leadsTable.assignedTo, usersTable.id))
      .where(whereClause)
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(leadsTable.createdAt));

    const leads = results.map(row => ({
      ...row.lead,
      assignedUser: row.assignedUser?.id ? row.assignedUser : null,
    }));

    return { leads, totalCount };
  }

  static async getLeadById(leadId: number) {
    const results = await db
      .select({
        lead: leadsTable,
        assignedUser: {
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
        }
      })
      .from(leadsTable)
      .leftJoin(usersTable, eq(leadsTable.assignedTo, usersTable.id))
      .where(eq(leadsTable.id, leadId))
      .limit(1);

    if (results.length === 0) return null;
    return {
      ...results[0].lead,
      assignedUser: results[0].assignedUser?.id ? results[0].assignedUser : null,
    };
  }

  static async assignLead(leadId: number, newAssigneeId: number, adminId: number) {
    return await db.transaction(async (tx) => {
      const [lead] = await tx.select().from(leadsTable).where(eq(leadsTable.id, leadId)).limit(1);
      if (!lead) throw new Error("Lead not found");

      const previousAssigneeId = lead.assignedTo;
      if (previousAssigneeId === newAssigneeId) return await this.getLeadById(leadId);

      await tx
        .update(leadsTable)
        .set({ assignedTo: newAssigneeId })
        .where(eq(leadsTable.id, leadId));
        
      // Fetch user details for richer activity log
      const userIds = [newAssigneeId];
      if (previousAssigneeId) userIds.push(previousAssigneeId);
      
      const users = await tx.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where(inArray(usersTable.id, userIds));
      const newAssignee = users.find(u => u.id === newAssigneeId);
      const prevAssignee = previousAssigneeId ? users.find(u => u.id === previousAssigneeId) : null;

      const type = previousAssigneeId ? "LEAD_REASSIGNED" : "LEAD_ASSIGNED";
      const metadata = previousAssigneeId 
        ? { previousAssigneeId, newAssigneeId, newAssigneeName: newAssignee?.name, previousAssigneeName: prevAssignee?.name }
        : { newAssigneeId, newAssigneeName: newAssignee?.name };

      await tx.insert(leadActivitiesTable).values({
        leadId,
        actorId: adminId,
        type,
        metadata,
      });

      return await this.getLeadById(leadId);
    });
  }

  static async updateLeadStatus(leadId: number, newStatus: Status, user: UserSession) {
    return await db.transaction(async (tx) => {
      const condition = user.role === "MEMBER" 
        ? and(eq(leadsTable.id, leadId), eq(leadsTable.assignedTo, user.id))
        : eq(leadsTable.id, leadId);
        
      const [lead] = await tx.select().from(leadsTable).where(condition).limit(1);
      if (!lead) throw new Error("Lead not found or access denied");
      
      const previousStatus = lead.status;
      if (previousStatus === newStatus) return await this.getLeadById(leadId);

      await tx
        .update(leadsTable)
        .set({ status: newStatus })
        .where(condition);

      await tx.insert(leadActivitiesTable).values({
        leadId,
        actorId: user.id,
        type: "STATUS_CHANGED",
        metadata: { from: previousStatus, to: newStatus },
      });

      return await this.getLeadById(leadId);
    });
  }

  static async addNote(leadId: number, body: string, user: UserSession) {
    return await db.transaction(async (tx) => {
      const condition = user.role === "MEMBER" 
        ? and(eq(leadsTable.id, leadId), eq(leadsTable.assignedTo, user.id))
        : eq(leadsTable.id, leadId);
        
      const [lead] = await tx.select().from(leadsTable).where(condition).limit(1);
      if (!lead) throw new Error("Lead not found or access denied");

      const [note] = await tx.insert(leadNotesTable).values({
        leadId,
        authorId: user.id,
        body,
      }).returning();

      await tx.insert(leadActivitiesTable).values({
        leadId,
        actorId: user.id,
        type: "NOTE_ADDED",
        metadata: { noteId: note.id },
      });

      // Hydrate Note
      const results = await tx
        .select({
          note: leadNotesTable,
          author: {
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
          }
        })
        .from(leadNotesTable)
        .leftJoin(usersTable, eq(leadNotesTable.authorId, usersTable.id))
        .where(eq(leadNotesTable.id, note.id))
        .limit(1);
        
      return {
        ...results[0].note,
        author: results[0].author?.id ? results[0].author : null,
      };
    });
  }

  static async getLeadNotes(leadId: number) {
    const results = await db
      .select({
        note: leadNotesTable,
        author: {
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
        }
      })
      .from(leadNotesTable)
      .leftJoin(usersTable, eq(leadNotesTable.authorId, usersTable.id))
      .where(eq(leadNotesTable.leadId, leadId))
      .orderBy(desc(leadNotesTable.createdAt));

    return results.map(row => ({
      ...row.note,
      author: row.author?.id ? row.author : null,
    }));
  }

  static async getLeadActivities(leadId: number) {
    const results = await db
      .select({
        activity: leadActivitiesTable,
        actor: {
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
        }
      })
      .from(leadActivitiesTable)
      .leftJoin(usersTable, eq(leadActivitiesTable.actorId, usersTable.id))
      .where(eq(leadActivitiesTable.leadId, leadId))
      .orderBy(desc(leadActivitiesTable.createdAt));

    return results.map(row => ({
      ...row.activity,
      actor: row.actor?.id ? row.actor : null,
    }));
  }
}
