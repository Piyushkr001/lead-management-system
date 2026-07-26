import { db } from "./db";
import { leadsTable } from "./db/schema/leads";

async function run() {
  try {
    await db.transaction(async (tx) => {
      await tx.select().from(leadsTable).limit(1);
    });
    console.log("Transaction SUCCESS");
  } catch (err) {
    console.error("Transaction ERROR:", err);
  }
}
run();
