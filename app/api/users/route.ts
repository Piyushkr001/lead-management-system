import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { usersTable, roleEnum } from "@/db/schema/users";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { handleApiError, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

const roleQuerySchema = z.enum(roleEnum.enumValues).optional();

export async function GET(req: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role") || undefined;
    
    const roleResult = roleQuerySchema.safeParse(roleParam);
    if (!roleResult.success) {
      throw AppError.validationError("Invalid role parameter", roleResult.error.issues);
    }

    const conditions = [eq(usersTable.isActive, true)];

    if (roleResult.data) {
      conditions.push(eq(usersTable.role, roleResult.data));
    }

    const users = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
      })
      .from(usersTable)
      .where(and(...conditions));

    return apiSuccess(users);
  } catch (error) {
    return handleApiError(error);
  }
}
