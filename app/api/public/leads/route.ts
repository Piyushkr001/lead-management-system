import { publicLeadSchema } from "@/lib/validations/lead.schema";
import { LeadService } from "@/server/services/lead.service";
import { handleApiError, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const parseResult = publicLeadSchema.safeParse(body);
    if (!parseResult.success) {
      throw AppError.validationError("Invalid lead data", parseResult.error.issues);
    }

    const newLead = await LeadService.createPublicLead(parseResult.data);

    return apiSuccess(newLead, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
