import { requireAuth } from "@/lib/auth";
import { LeadService } from "@/server/services/lead.service";
import { z } from "zod";
import { handleApiError, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

const leadIdSchema = z.coerce.number().int().positive("Invalid lead ID");

export async function GET(req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    
    const leadIdResult = leadIdSchema.safeParse(resolvedParams.leadId);
    if (!leadIdResult.success) {
      throw AppError.validationError("Invalid lead ID", leadIdResult.error.issues);
    }

    const leadId = leadIdResult.data;
    const activities = await LeadService.getLeadActivities(user, leadId);
    
    return apiSuccess(activities);
  } catch (error) {
    return handleApiError(error);
  }
}
