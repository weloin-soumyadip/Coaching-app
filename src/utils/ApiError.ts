// Lightweight error class so controllers can throw structured errors
// that the central error handler translates into HTTP responses.
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational = true;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
