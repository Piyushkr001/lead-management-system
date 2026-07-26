import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { env } from "./env";

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

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as UserSession;
  } catch (error) {
    return null;
  }
}

export async function requireAuth(): Promise<UserSession> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdmin(): Promise<UserSession> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }
  return user;
}

export async function requireMember(): Promise<UserSession> {
  const user = await requireAuth();
  if (user.role !== "MEMBER") {
    throw new Error("Forbidden: Member access required");
  }
  return user;
}
