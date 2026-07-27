import { LeadRepository } from "../repositories/lead.repository";
import { Permissions } from "@/lib/permissions";
import { UserSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";

import { LeadStatus } from "@/lib/types";

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
    params: { page: number; pageSize: number; status?: LeadStatus | "ALL"; assignedTo?: number; search?: string }
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

    await LeadRepository.assignLead(leadId, newAssigneeId, user.id);
    return await LeadRepository.getLeadById(leadId);
  }

  static async updateLeadStatus(user: UserSession, leadId: number, newStatus: LeadStatus) {
    const lead = await LeadRepository.getLeadById(leadId);
    if (!lead) throw AppError.notFound("Lead not found");

    if (!Permissions.canUpdateLeadStatus(user, lead)) {
      throw AppError.forbidden();
    }

    await LeadRepository.updateLeadStatus(leadId, newStatus, user);
    return await LeadRepository.getLeadById(leadId);
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
