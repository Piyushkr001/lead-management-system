import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { LeadService } from "@/server/services/lead.service";
import { z } from "zod";
import { statusEnum } from "@/db/schema/leads";

const updateLeadSchema = z.object({
  assignedTo: z.number().int().positive().optional(),
  status: z.enum(statusEnum.enumValues).optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    const leadId = parseInt(resolvedParams.leadId, 10);

    if (isNaN(leadId)) {
      return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid lead ID" } }, { status: 400 });
    }

    const lead = await LeadService.getLeadByIdForUser(user, leadId);
    if (!lead) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Lead not found" } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message.includes("Forbidden"))) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: error.message } },
        { status: error.message === "Unauthorized" ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    const leadId = parseInt(resolvedParams.leadId, 10);

    if (isNaN(leadId)) {
      return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid lead ID" } }, { status: 400 });
    }

    const body = await req.json();
    const parseResult = updateLeadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid payload", details: parseResult.error.issues } },
        { status: 422 }
      );
    }

    const { assignedTo, status } = parseResult.data;
    
    let updatedLead = null;

    if (assignedTo !== undefined) {
      updatedLead = await LeadService.assignLead(user, leadId, assignedTo);
    }

    if (status !== undefined) {
      updatedLead = await LeadService.updateLeadStatus(user, leadId, status);
    }

    if (!updatedLead) {
      return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "No update fields provided" } }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: updatedLead });
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
