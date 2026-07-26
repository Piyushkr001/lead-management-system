import { UserSession } from "./auth";

type LeadResource = {
  assignedTo: number | null;
};

export const Permissions = {
  canViewLead: (user: UserSession, lead: LeadResource): boolean => {
    if (user.role === "ADMIN") return true;
    return lead.assignedTo === user.id;
  },

  canUpdateLeadStatus: (user: UserSession, lead: LeadResource): boolean => {
    if (user.role === "ADMIN") return true;
    return lead.assignedTo === user.id;
  },

  canAddNote: (user: UserSession, lead: LeadResource): boolean => {
    if (user.role === "ADMIN") return true;
    return lead.assignedTo === user.id;
  },

  canAssignLead: (user: UserSession): boolean => {
    return user.role === "ADMIN";
  },
  
  canViewActivities: (user: UserSession, lead: LeadResource): boolean => {
    if (user.role === "ADMIN") return true;
    return lead.assignedTo === user.id;
  },
};
