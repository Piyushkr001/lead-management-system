import { db } from "@/db";
import { leadsTable } from "@/db/schema/leads";

/**
 * MANUAL SMOKE TEST SCRIPT
 * This is not part of the automated test suite.
 * Run via `bun run scripts/test-transaction.ts` to verify DB connection locally.
 */

async function run() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.transaction(async (tx: any) => {
      await tx.select().from(leadsTable).limit(1);
    });
    console.log("Transaction SUCCESS");
  } catch (err) {
    console.error("Transaction ERROR:", err);
  }
}
run();
