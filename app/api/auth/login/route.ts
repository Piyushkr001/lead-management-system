import { NextResponse } from "next/server";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { createSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { loginSchema } from "@/lib/validations/auth.schema";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid request payload", details: parseResult.error.issues } },
        { status: 400 }
      );
    }

    const { provider, email, password, googleToken } = parseResult.data;

    let user;

    if (provider === "credentials") {
      const users = await db.select().from(usersTable).where(eq(usersTable.email, email!));
      user = users[0];

      if (!user || !user.passwordHash) {
        return NextResponse.json(
          { success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" } },
          { status: 401 }
        );
      }

      const isValidPassword = await bcrypt.compare(password!, user.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" } },
          { status: 401 }
        );
      }
    } else if (provider === "google") {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: googleToken!,
          audience: env.GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
          return NextResponse.json(
            { success: false, error: { code: "INVALID_TOKEN", message: "Invalid Google token" } },
            { status: 401 }
          );
        }

        const normalizedEmail = payload.email.trim().toLowerCase();
        const users = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
        user = users[0];

        if (!user) {
          // Strict Policy: Do NOT automatically create Google users.
          return NextResponse.json(
            { success: false, error: { code: "ACCOUNT_NOT_FOUND", message: "Account not found. Please contact administration." } },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, error: { code: "UNAUTHORIZED", message: "Invalid Google token" } },
          { status: 401 }
        );
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_PROVIDER", message: "Invalid provider" } },
        { status: 400 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: { code: "ACCOUNT_DISABLED", message: "Account is disabled." } },
        { status: 403 }
      );
    }

    // Set Session Cookie via the utility
    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({ 
      success: true,
      data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } }
    }, { status: 200 });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal Server Error" } },
      { status: 500 }
    );
  }
}
