
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth.schema";
import { handleApiError, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      throw AppError.validationError("Invalid request payload", parseResult.error.issues);
    }

    const { email, password } = parseResult.data;

    const users = await db.select().from(usersTable).where(eq(usersTable.email, email));
    const user = users[0];

    if (!user || !user.passwordHash) {
      throw AppError.unauthorized("Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw AppError.unauthorized("Invalid credentials");
    }

    if (!user.isActive) {
      throw AppError.forbidden("Account is disabled");
    }

    // Set Session Cookie via the utility
    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return apiSuccess({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    if (error instanceof AppError) {
        return handleApiError(error);
    }
    
    console.error("Login error:", error);
    return handleApiError(AppError.internal());
  }
}
