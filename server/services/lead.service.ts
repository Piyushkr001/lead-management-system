import { LeadRepository } from "../repositories/lead.repository";

export class LeadService {
  static async createPublicLead(data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message: string;
  }) {
    // We could add rate limiting or spam checks here in the future.
    return await LeadRepository.createPublicLead(data);
  }

  static async getLeadsForUser(
    user: { id: number; role: string },
    params: { page: number; pageSize: number; status?: string; assignedTo?: number; search?: string }
  ) {
    let effectiveAssignedTo = params.assignedTo;

    // RBAC: Members can ONLY see leads assigned to them.
    if (user.role === "MEMBER") {
      effectiveAssignedTo = user.id;
    }

    return await LeadRepository.getLeads({
      ...params,
      assignedTo: effectiveAssignedTo,
    });
  }
}
