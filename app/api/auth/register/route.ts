import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existingUser.length > 0) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    let role = "member";
    if (email.toLowerCase().includes("admin")) {
      // Check admin limit
      const admins = await db.select().from(usersTable).where(eq(usersTable.role, "admin"));
      if (admins.length >= 2) {
        return NextResponse.json({ message: "Admin registration limit reached (maximum 2 admins)." }, { status: 400 });
      }
      role = "admin";
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.insert(usersTable).values({
      name,
      email,
      password: hashedPassword,
      role,
      provider: "credentials"
    }).returning();

    return NextResponse.json({ 
      message: "User registered successfully", 
      user: { id: newUser[0].id, name: newUser[0].name, email: newUser[0].email, role: newUser[0].role } 
    }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
