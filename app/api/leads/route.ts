import { NextResponse } from "next/server";
import { leadQuerySchema } from "@/lib/validations/lead.schema";
import { LeadService } from "@/server/services/lead.service";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());

    const parseResult = leadQuerySchema.safeParse(query);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid query parameters", details: parseResult.error.issues } },
        { status: 400 }
      );
    }

    const result = await LeadService.getLeadsForUser(user, parseResult.data);

    return NextResponse.json({
      success: true,
      data: result.leads,
      pagination: {
        page: parseResult.data.page,
        pageSize: parseResult.data.pageSize,
        total: result.totalCount,
        totalPages: Math.ceil(result.totalCount / parseResult.data.pageSize),
      }
    });
  } catch (error) {
    console.error("Get Leads Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch leads" } },
      { status: 500 }
    );
  }
}
