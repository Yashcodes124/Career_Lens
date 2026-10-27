export class AppError extends Error {
  public readonly status: number;
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    first: number | string,
    second: string | number = 500,
    code = "INTERNAL_ERROR",
    details?: unknown,
  ) {
    const isStatusFirst = typeof first === "number";
    const resolvedStatus = isStatusFirst
      ? first
      : typeof second === "number"
        ? second
        : 500;
    const resolvedMessage = isStatusFirst ? String(second) : String(first);

    super(resolvedMessage);
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = resolvedStatus;
    this.statusCode = resolvedStatus;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code = "BAD_REQUEST", details?: unknown) {
    return new AppError(400, message, code, details);
  }

  static unauthorized(
    message = "Authentication required",
    code = "UNAUTHORIZED",
  ) {
    return new AppError(401, message, code);
  }

  static forbidden(message = "Access denied", code = "FORBIDDEN") {
    return new AppError(403, message, code);
  }

  static notFound(message = "Resource not found", code = "NOT_FOUND") {
    return new AppError(404, message, code);
  }

  static conflict(message: string, code = "CONFLICT") {
    return new AppError(409, message, code);
  }
}
