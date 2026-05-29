// Lightweight error class so controllers can throw structured errors
// that the central error handler translates into HTTP responses.
//
// `body` lets a specific error pin its public JSON shape — used when the
// response contract is fixed by spec (e.g. the generic email-conflict
// response, which must never leak which role owns the email).
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational = true;
  public readonly body?: Readonly<Record<string, unknown>>;

  constructor(
    statusCode: number,
    message: string,
    body?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.body = body;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
