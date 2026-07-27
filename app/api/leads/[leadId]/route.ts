
import { requireAuth } from "@/lib/auth";
import { LeadService } from "@/server/services/lead.service";
import { z } from "zod";
import { statusEnum } from "@/db/schema/leads";
import { handleApiError, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

const leadIdSchema = z.coerce.number().int().positive("Invalid lead ID");

const updateLeadSchema = z.object({
  assignedTo: z.number().int().positive().optional(),
  status: z.enum(statusEnum.enumValues).optional(),
}).refine(data => {
  const hasAssignedTo = data.assignedTo !== undefined;
  const hasStatus = data.status !== undefined;
  return (hasAssignedTo && !hasStatus) || (!hasAssignedTo && hasStatus);
}, {
  message: "Provide exactly ONE mutation per request (either assignedTo OR status)",
});

export async function GET(req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    
    const leadIdResult = leadIdSchema.safeParse(resolvedParams.leadId);
    if (!leadIdResult.success) {
      throw AppError.validationError("Invalid lead ID", leadIdResult.error.issues);
    }

    const lead = await LeadService.getLeadByIdForUser(user, leadIdResult.data);
    if (!lead) {
      throw AppError.notFound("Lead not found");
    }

    return apiSuccess(lead);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    
    const leadIdResult = leadIdSchema.safeParse(resolvedParams.leadId);
    if (!leadIdResult.success) {
      throw AppError.validationError("Invalid lead ID", leadIdResult.error.issues);
    }

    const body = await req.json();
    const parseResult = updateLeadSchema.safeParse(body);

    if (!parseResult.success) {
      throw AppError.validationError("Invalid payload", parseResult.error.issues);
    }

    const leadId = leadIdResult.data;
    const { assignedTo, status } = parseResult.data;
    
    let updatedLead = null;

    if (assignedTo !== undefined) {
      updatedLead = await LeadService.assignLead(user, leadId, assignedTo);
    }

    if (status !== undefined) {
      updatedLead = await LeadService.updateLeadStatus(user, leadId, status);
    }

    if (!updatedLead) {
      throw AppError.badRequest("No update fields provided");
    }

    // Refetch fully hydrated lead
    const hydratedLead = await LeadService.getLeadByIdForUser(user, leadId);
    return apiSuccess(hydratedLead);
  } catch (error) {
    return handleApiError(error);
  }
}
