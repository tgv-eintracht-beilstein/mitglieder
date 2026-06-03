import type { ZodIssue } from 'zod';

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(issues: ZodIssue[]) {
    super('VALIDATION_ERROR', 400, 'Validation failed', {
      fields: issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super('UNAUTHORIZED', 401, 'Authentication required');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(code = 'INSUFFICIENT_PERMISSIONS') {
    super(code, 403, 'Access denied');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, _id: string) {
    super(`${resource.toUpperCase()}_NOT_FOUND`, 404, `${resource} not found`);
    this.name = 'NotFoundError';
  }
}
