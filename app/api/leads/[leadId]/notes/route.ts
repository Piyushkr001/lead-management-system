import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { LeadService } from "@/server/services/lead.service";
import { z } from "zod";

const createNoteSchema = z.object({
  body: z.string().trim().min(1, "Note cannot be empty").max(5000, "Note is too long"),
});

export async function GET(req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    const leadId = parseInt(resolvedParams.leadId, 10);

    if (isNaN(leadId)) {
      return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid lead ID" } }, { status: 400 });
    }

    const notes = await LeadService.getLeadNotes(user, leadId);
    return NextResponse.json({ success: true, data: notes });
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

export async function POST(req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    const leadId = parseInt(resolvedParams.leadId, 10);

    if (isNaN(leadId)) {
      return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid lead ID" } }, { status: 400 });
    }

    const body = await req.json();
    const parseResult = createNoteSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid payload", details: parseResult.error.issues } },
        { status: 422 }
      );
    }

    const note = await LeadService.addNote(user, leadId, parseResult.data.body);

    return NextResponse.json({ success: true, data: note }, { status: 201 });
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
