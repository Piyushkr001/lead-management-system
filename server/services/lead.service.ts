import { LeadRepository } from "../repositories/lead.repository";
import { Permissions } from "@/lib/permissions";
import { UserSession } from "@/lib/auth";
import { statusEnum } from "@/db/schema/leads";

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
      throw new Error("Forbidden");
    }

    return lead;
  }

  static async assignLead(user: UserSession, leadId: number, newAssigneeId: number) {
    if (!Permissions.canAssignLead(user)) {
      throw new Error("Forbidden");
    }
    return await LeadRepository.assignLead(leadId, newAssigneeId, user.id);
  }

  static async updateLeadStatus(user: UserSession, leadId: number, newStatus: Status) {
    const lead = await LeadRepository.getLeadById(leadId);
    if (!lead) throw new Error("Not Found");

    if (!Permissions.canUpdateLeadStatus(user, lead)) {
      throw new Error("Forbidden");
    }

    return await LeadRepository.updateLeadStatus(leadId, newStatus, user.id);
  }

  static async addNote(user: UserSession, leadId: number, body: string) {
    const lead = await LeadRepository.getLeadById(leadId);
    if (!lead) throw new Error("Not Found");

    if (!Permissions.canAddNote(user, lead)) {
      throw new Error("Forbidden");
    }

    return await LeadRepository.addNote(leadId, body, user.id);
  }

  static async getLeadNotes(user: UserSession, leadId: number) {
    const lead = await LeadRepository.getLeadById(leadId);
    if (!lead) throw new Error("Not Found");

    if (!Permissions.canViewLead(user, lead)) {
      throw new Error("Forbidden");
    }

    return await LeadRepository.getLeadNotes(leadId);
  }

  static async getLeadActivities(user: UserSession, leadId: number) {
    const lead = await LeadRepository.getLeadById(leadId);
    if (!lead) throw new Error("Not Found");

    if (!Permissions.canViewActivities(user, lead)) {
      throw new Error("Forbidden");
    }

    return await LeadRepository.getLeadActivities(leadId);
  }
}
