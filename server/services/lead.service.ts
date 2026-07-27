import { LeadRepository } from "../repositories/lead.repository";
import { Permissions } from "@/lib/permissions";
import { UserSession } from "@/lib/auth";
import { statusEnum } from "@/db/schema/leads";
import { AppError } from "@/lib/errors";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { eq } from "drizzle-orm";

type Status = typeof statusEnum.enumValues[number];

export class LeadService {
  static async createPublicLead(data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message: string;
  }) {
    return await LeadRepository.createPublicLead(data);
  }

  static async getLeadsForUser(
    user: UserSession,
    params: { page: number; pageSize: number; status?: string; assignedTo?: number; search?: string }
  ) {
    let effectiveAssignedTo = params.assignedTo;
    if (user.role === "MEMBER") {
      effectiveAssignedTo = user.id;
    }

    return await LeadRepository.getLeads({
      ...params,
      assignedTo: effectiveAssignedTo,
    });
  }

  static async getLeadByIdForUser(user: UserSession, leadId: number) {
    const lead = await LeadRepository.getLeadById(leadId);
    if (!lead) return null;

    if (!Permissions.canViewLead(user, lead)) {
      throw AppError.forbidden();
    }

    return lead;
  }

  static async assignLead(user: UserSession, leadId: number, newAssigneeId: number) {
    if (!Permissions.canAssignLead(user)) {
      throw AppError.forbidden();
    }
    
    const [targetUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, newAssigneeId))
      .limit(1);

    if (!targetUser) {
      throw AppError.validationError("Assignee does not exist");
    }

    if (!targetUser.isActive) {
      throw AppError.validationError("Assignee is not active");
    }

    if (targetUser.role !== "MEMBER") {
      throw AppError.validationError("Can only assign leads to members");
    }

    return await LeadRepository.assignLead(leadId, newAssigneeId, user.id);
  }

  static async updateLeadStatus(user: UserSession, leadId: number, newStatus: Status) {
    const lead = await LeadRepository.getLeadById(leadId);
    if (!lead) throw AppError.notFound("Lead not found");

    if (!Permissions.canUpdateLeadStatus(user, lead)) {
      throw AppError.forbidden();
    }

    return await LeadRepository.updateLeadStatus(leadId, newStatus, user);
  }

  static async addNote(user: UserSession, leadId: number, body: string) {
    const lead = await LeadRepository.getLeadById(leadId);
    if (!lead) throw AppError.notFound("Lead not found");

    if (!Permissions.canAddNote(user, lead)) {
      throw AppError.forbidden();
    }

    return await LeadRepository.addNote(leadId, body, user);
  }

  static async getLeadNotes(user: UserSession, leadId: number) {
    const lead = await LeadRepository.getLeadById(leadId);
    if (!lead) throw AppError.notFound("Lead not found");

    if (!Permissions.canViewLead(user, lead)) {
      throw AppError.forbidden();
    }

    return await LeadRepository.getLeadNotes(leadId);
  }

  static async getLeadActivities(user: UserSession, leadId: number) {
    const lead = await LeadRepository.getLeadById(leadId);
    if (!lead) throw AppError.notFound("Lead not found");

    if (!Permissions.canViewActivities(user, lead)) {
      throw AppError.forbidden();
    }

    return await LeadRepository.getLeadActivities(leadId);
  }
}
