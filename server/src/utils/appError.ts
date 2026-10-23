// An error with an HTTP status and a stable machine-readable code.
// The global error handler turns it into { success: false, message, code }.
export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, message: string, code = "APP_ERROR") {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}
