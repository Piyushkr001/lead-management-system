import { NextResponse } from "next/server";
import { publicLeadSchema } from "@/lib/validations/lead.schema";
import { LeadService } from "@/server/services/lead.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Zod Validation
    const parseResult = publicLeadSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: "VALIDATION_ERROR", 
            message: "Invalid lead data", 
            details: parseResult.error.issues 
          } 
        },
        { status: 422 }
      );
    }

    // Lead Service handles business logic and DB transactions
    const newLead = await LeadService.createPublicLead(parseResult.data);

    return NextResponse.json(
      { success: true, data: newLead },
      { status: 201 }
    );
  } catch (error) {
    console.error("Public Lead Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to submit lead" } },
      { status: 500 }
    );
  }
}
