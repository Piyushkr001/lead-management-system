import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const JWT_SECRET = process.env.JWT_SECRET!;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provider, email, password, googleToken } = body;

    let user;

    if (provider === "credentials") {
      if (!email || !password) {
        return NextResponse.json({ message: "Email and password required" }, { status: 400 });
      }

      const users = await db.select().from(usersTable).where(eq(usersTable.email, email));
      user = users[0];

      if (!user || !user.password) {
        return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
      }

    } else if (provider === "google") {
      if (!googleToken) {
        return NextResponse.json({ message: "Google token required" }, { status: 400 });
      }

      const ticket = await googleClient.verifyIdToken({
        idToken: googleToken,
        audience: GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return NextResponse.json({ message: "Invalid Google token" }, { status: 401 });
      }

      const users = await db.select().from(usersTable).where(eq(usersTable.email, payload.email));
      user = users[0];

      if (!user) {
        // Automatically register google users as members
        // Check if admin keyword is in email? The requirement says "Only for Members" for Google Login
        if (payload.email.toLowerCase().includes("admin")) {
           return NextResponse.json({ message: "Admins cannot register via Google" }, { status: 403 });
        }

        const newUser = await db.insert(usersTable).values({
          name: payload.name || "Google User",
          email: payload.email,
          role: "member",
          provider: "google"
        }).returning();
        
        user = newUser[0];
      }
      
      if (user.role === "admin") {
         return NextResponse.json({ message: "Admins must login via credentials" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ message: "Invalid provider" }, { status: 400 });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({ 
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    }, { status: 200 });

    // Set cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const users = await db.select().from(usersTable).where(eq(usersTable.id, decoded.userId));
    const user = users[0];

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    }, { status: 200 });

  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ message: "Invalid session" }, { status: 401 });
  }
}
