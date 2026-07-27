import { requireAuth } from "@/lib/auth";
import { LeadService } from "@/server/services/lead.service";
import { z } from "zod";
import { handleApiError, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

const leadIdSchema = z.coerce.number().int().positive("Invalid lead ID");

const createNoteSchema = z.object({
  body: z.string().trim().min(1, "Note cannot be empty").max(5000, "Note is too long"),
});

export async function GET(req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    
    const leadIdResult = leadIdSchema.safeParse(resolvedParams.leadId);
    if (!leadIdResult.success) {
      throw AppError.validationError("Invalid lead ID", leadIdResult.error.issues);
    }

    const leadId = leadIdResult.data;
    const notes = await LeadService.getLeadNotes(user, leadId);
    
    return apiSuccess(notes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    
    const leadIdResult = leadIdSchema.safeParse(resolvedParams.leadId);
    if (!leadIdResult.success) {
      throw AppError.validationError("Invalid lead ID", leadIdResult.error.issues);
    }

    const body = await req.json();
    const parseResult = createNoteSchema.safeParse(body);

    if (!parseResult.success) {
      throw AppError.validationError("Invalid payload", parseResult.error.issues);
    }

    const leadId = leadIdResult.data;
    const note = await LeadService.addNote(user, leadId, parseResult.data.body);

    return apiSuccess(note, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
