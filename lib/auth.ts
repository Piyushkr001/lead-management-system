import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { env } from "./env";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AppError } from "./errors";

export type Role = "ADMIN" | "MEMBER";

export interface UserSession {
  id: number;
  name: string;
  email: string;
  role: Role;
}

const SECRET_KEY = new TextEncoder().encode(env.JWT_SECRET);

export async function createSession(user: UserSession) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) return null;

  let payload;
  try {
    const result = await jwtVerify(token, SECRET_KEY);
    payload = result.payload;
  } catch {
    return null; // Invalid or expired JWT
  }
  
  if (!payload.id) return null;

  // DB query OUTSIDE catch block to allow infrastructure errors to propagate
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, payload.id as number))
    .limit(1);

  if (!user || !user.isActive) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function requireAuth(): Promise<UserSession> {
  const user = await getCurrentUser();
  if (!user) {
    throw AppError.unauthorized();
  }
  return user;
}

export async function requireAdmin(): Promise<UserSession> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw AppError.forbidden("Admin access required");
  }
  return user;
}
