import { handleApiError, apiSuccess } from "@/lib/api-response";
import { leadQuerySchema } from "@/lib/validations/lead.schema";
import { LeadService } from "@/server/services/lead.service";
import { requireAuth } from "@/lib/auth";
import { AppError } from "@/lib/errors";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());

    const parseResult = leadQuerySchema.safeParse(query);
    if (!parseResult.success) {
      throw AppError.validationError("Invalid query parameters", parseResult.error.issues);
    }

    const result = await LeadService.getLeadsForUser(user, parseResult.data);

    return apiSuccess(result.leads, 200, {
      pagination: {
        page: parseResult.data.page,
        pageSize: parseResult.data.pageSize,
        total: result.totalCount,
        totalPages: Math.ceil(result.totalCount / parseResult.data.pageSize),
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
