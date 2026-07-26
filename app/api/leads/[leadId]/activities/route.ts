import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { LeadService } from "@/server/services/lead.service";

export async function GET(req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    const leadId = parseInt(resolvedParams.leadId, 10);

    if (isNaN(leadId)) {
      return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid lead ID" } }, { status: 400 });
    }

    const activities = await LeadService.getLeadActivities(user, leadId);
    return NextResponse.json({ success: true, data: activities });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
        return NextResponse.json(
          { success: false, error: { code: "FORBIDDEN", message: error.message } },
          { status: error.message === "Unauthorized" ? 401 : 403 }
        );
      }
      if (error.message === "Not Found") {
        return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Lead not found" } }, { status: 404 });
      }
    }

    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
