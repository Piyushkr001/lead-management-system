import "dotenv/config";
import { db } from "./index";
import { usersTable } from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Seeding database...");

  const adminEmail = "admin@leadnexa.demo";
  const memberEmail = "member@leadnexa.demo";
  const salesEmail = "sales@leadnexa.demo";
  
  const password = "password123"; // Demo password
  const passwordHash = await bcrypt.hash(password, 10);

  const usersToSeed = [
    {
      name: "Admin User",
      email: adminEmail,
      passwordHash,
      role: "ADMIN" as const,
      provider: "CREDENTIALS" as const,
      isActive: true,
    },
    {
      name: "Member User",
      email: memberEmail,
      passwordHash,
      role: "MEMBER" as const,
      provider: "CREDENTIALS" as const,
      isActive: true,
    },
    {
      name: "Sales Rep",
      email: salesEmail,
      passwordHash,
      role: "MEMBER" as const,
      provider: "CREDENTIALS" as const,
      isActive: true,
    }
  ];

  for (const user of usersToSeed) {
    const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, user.email));
    
    if (existingUser.length === 0) {
      await db.insert(usersTable).values(user);
      console.log(`✅ Created user: ${user.email} (${user.role})`);
    } else {
      console.log(`ℹ️ User already exists: ${user.email}`);
    }
  }

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
