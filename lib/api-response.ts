import { NextResponse } from "next/server";
import { AppError } from "./errors";

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details && { details: error.details }),
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error && (error.message === "Unauthorized" || error.message.includes("Forbidden"))) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.message === "Unauthorized" ? "UNAUTHORIZED" : "FORBIDDEN",
          message: error.message,
        },
      },
      { status: error.message === "Unauthorized" ? 401 : 403 }
    );
  }

  console.error("Unhandled API Error:", error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    },
    { status: 500 }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiSuccess<T>(data: T, status = 200, extra?: Record<string, any>) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...extra,
    },
    { status }
  );
}
