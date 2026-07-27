export type ErrorCode = 
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR"
  | "BAD_REQUEST";

export class AppError extends Error {
  public code: ErrorCode;
  public statusCode: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public details?: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(code: ErrorCode, message: string, statusCode: number, details?: any) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = "AppError";
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError("UNAUTHORIZED", message, 401);
  }

  static forbidden(message = "Forbidden") {
    return new AppError("FORBIDDEN", message, 403);
  }

  static notFound(message = "Not Found") {
    return new AppError("NOT_FOUND", message, 404);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static validationError(message = "Validation Error", details?: any) {
    return new AppError("VALIDATION_ERROR", message, 422, details);
  }

  static badRequest(message = "Bad Request") {
    return new AppError("BAD_REQUEST", message, 400);
  }

  static conflict(message = "Conflict") {
    return new AppError("CONFLICT", message, 409);
  }

  static internal(message = "Internal Server Error") {
    return new AppError("INTERNAL_SERVER_ERROR", message, 500);
  }
}
