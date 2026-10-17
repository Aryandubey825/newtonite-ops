export class AppError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode = 500, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: any) {
    super(message, 404, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', details?: any) {
    super(message, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action', details?: any) {
    super(message, 403, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict detected with current resource state', details?: any) {
    super(message, 409, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid request parameters', details?: any) {
    super(message, 400, details);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = 'Semantic validation failed', details?: any) {
    super(message, 422, details);
  }
}
