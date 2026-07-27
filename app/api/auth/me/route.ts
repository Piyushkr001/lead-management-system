import { getCurrentUser } from "@/lib/auth";
import { handleApiError, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw AppError.unauthorized();
    }

    return apiSuccess({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
