import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    const conditions = [eq(usersTable.isActive, true)];

    if (role) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conditions.push(eq(usersTable.role, role as any));
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

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message.includes("Forbidden"))) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: error.message } },
        { status: error.message === "Unauthorized" ? 401 : 403 }
      );
    }

    console.error("Users GET Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch users" } },
      { status: 500 }
    );
  }
}
