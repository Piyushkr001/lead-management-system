import { NextResponse } from "next/server";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { createSession } from "@/lib/auth";
import { env } from "@/lib/env";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provider, email, password, googleToken } = body;

    let user;

    if (provider === "credentials") {
      if (!email || !password) {
        return NextResponse.json({ message: "Email and password required" }, { status: 400 });
      }

      const users = await db.select().from(usersTable).where(eq(usersTable.email, email.trim().toLowerCase()));
      user = users[0];

      if (!user || !user.passwordHash) {
        return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
      }

    } else if (provider === "google") {
      if (!googleToken) {
        return NextResponse.json({ message: "Google token required" }, { status: 400 });
      }

      const ticket = await googleClient.verifyIdToken({
        idToken: googleToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return NextResponse.json({ message: "Invalid Google token" }, { status: 401 });
      }

      const normalizedEmail = payload.email.trim().toLowerCase();
      const users = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
      user = users[0];

      if (!user) {
        // Strict Policy: Do NOT automatically create Google users.
        return NextResponse.json({ message: "Account not found. Please contact administration." }, { status: 403 });
      }
    } else {
      return NextResponse.json({ message: "Invalid provider" }, { status: 400 });
    }

    if (!user.isActive) {
      return NextResponse.json({ message: "Account is disabled." }, { status: 403 });
    }

    // Set Session Cookie via the utility
    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({ 
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    }, { status: 200 });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
