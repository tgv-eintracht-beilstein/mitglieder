import { describe, it, expect, vi } from 'vitest';
import { withErrorHandler } from '../../lib/middleware/error-handler.js';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors.js';

describe('withErrorHandler middleware', () => {
  const mockEvent = { httpMethod: 'GET', path: '/test' };
  const mockContext = { functionName: 'test-fn' };

  describe('successful handler execution', () => {
    it('returns the handler response unchanged', async () => {
      const expected = {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { id: '123' } }),
      };
      const handler = vi.fn().mockResolvedValue(expected);
      const wrapped = withErrorHandler(handler);

      const result = await wrapped(mockEvent, mockContext);

      expect(result).toEqual(expected);
      expect(handler).toHaveBeenCalledWith(mockEvent, mockContext);
    });
  });

  describe('AppError handling', () => {
    it('returns structured error response for AppError', async () => {
      const handler = vi.fn().mockRejectedValue(
        new AppError('CUSTOM_ERROR', 422, 'Custom message', { field: 'value' })
      );
      const wrapped = withErrorHandler(handler);

      const result = await wrapped(mockEvent, mockContext);

      expect(result.statusCode).toBe(422);
      expect(result.headers).toEqual({ 'Content-Type': 'application/json' });
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('CUSTOM_ERROR');
      expect(body.error.message).toBe('Custom message');
      expect(body.error.details).toEqual({ field: 'value' });
    });

    it('handles ValidationError with field details', async () => {
      const issues = [
        { path: ['email'], message: 'Invalid email', code: 'invalid_type' as const, expected: 'string', received: 'undefined' },
      ];
      const handler = vi.fn().mockRejectedValue(new ValidationError(issues as any));
      const wrapped = withErrorHandler(handler);

      const result = await wrapped(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toBe('Validation failed');
      expect(body.error.details).toEqual({
        fields: [{ path: 'email', message: 'Invalid email' }],
      });
    });

    it('handles UnauthorizedError', async () => {
      const handler = vi.fn().mockRejectedValue(new UnauthorizedError());
      const wrapped = withErrorHandler(handler);

      const result = await wrapped(mockEvent, mockContext);

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('UNAUTHORIZED');
      expect(body.error.message).toBe('Authentication required');
    });

    it('handles ForbiddenError', async () => {
      const handler = vi.fn().mockRejectedValue(new ForbiddenError());
      const wrapped = withErrorHandler(handler);

      const result = await wrapped(mockEvent, mockContext);

      expect(result.statusCode).toBe(403);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(body.error.message).toBe('Access denied');
    });

    it('handles NotFoundError', async () => {
      const handler = vi.fn().mockRejectedValue(new NotFoundError('member', 'abc-123'));
      const wrapped = withErrorHandler(handler);

      const result = await wrapped(mockEvent, mockContext);

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('MEMBER_NOT_FOUND');
      expect(body.error.message).toBe('member not found');
    });

    it('omits details when not present on AppError', async () => {
      const handler = vi.fn().mockRejectedValue(new AppError('NO_DETAILS', 400, 'No details'));
      const wrapped = withErrorHandler(handler);

      const result = await wrapped(mockEvent, mockContext);

      const body = JSON.parse(result.body);
      expect(body.error.details).toBeUndefined();
    });
  });

  describe('unexpected error handling', () => {
    it('returns generic 500 for non-AppError exceptions', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Something broke'));
      const wrapped = withErrorHandler(handler);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await wrapped(mockEvent, mockContext);

      expect(result.statusCode).toBe(500);
      expect(result.headers).toEqual({ 'Content-Type': 'application/json' });
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(body.error.message).toBe('An unexpected error occurred');
      expect(body.error.details).toBeUndefined();

      consoleSpy.mockRestore();
    });

    it('logs the full error for unexpected exceptions', async () => {
      const originalError = new Error('Database connection failed');
      const handler = vi.fn().mockRejectedValue(originalError);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const wrapped = withErrorHandler(handler);

      await wrapped(mockEvent, mockContext);

      expect(consoleSpy).toHaveBeenCalledWith('Unhandled error:', originalError);
      consoleSpy.mockRestore();
    });

    it('does not expose internal error details in the response', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('secret DB password leaked'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const wrapped = withErrorHandler(handler);

      const result = await wrapped(mockEvent, mockContext);

      expect(result.body).not.toContain('secret');
      expect(result.body).not.toContain('leaked');
      consoleSpy.mockRestore();
    });

    it('handles thrown non-Error objects', async () => {
      const handler = vi.fn().mockRejectedValue('string error');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const wrapped = withErrorHandler(handler);

      const result = await wrapped(mockEvent, mockContext);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('INTERNAL_ERROR');
      consoleSpy.mockRestore();
    });
  });

  describe('Content-Type header', () => {
    it('includes Content-Type header on AppError responses', async () => {
      const handler = vi.fn().mockRejectedValue(new AppError('ERR', 400, 'msg'));
      const wrapped = withErrorHandler(handler);

      const result = await wrapped(mockEvent, mockContext);

      expect(result.headers['Content-Type']).toBe('application/json');
    });

    it('includes Content-Type header on unexpected error responses', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('oops'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const wrapped = withErrorHandler(handler);

      const result = await wrapped(mockEvent, mockContext);

      expect(result.headers['Content-Type']).toBe('application/json');
      consoleSpy.mockRestore();
    });
  });
});
